/*global svg utils*/

"use strict";


/// used to generate the graduations on a gauge dial, these are built as just
/// three paths, each of a different thickness.

class DialGraduationBuilder {

    #thinLine = '';
    #midLine = '';
    #thickLine = '';
    #cx;
    #cy;
    #radius;
    static #trim = utils.buildRounder(2);

    constructor(cx, cy, radius) {
        this.#cx = cx;
        this.#cy = cy;
        this.#radius = radius;
    }

    #getXY(angle) {
        const theta = (angle + 90) * Math.PI / 180;
        const xr = Math.cos(theta);
        const yr = Math.sin(theta);
        return [xr, yr];
    }

    #lineCoords(angle, r1, r2) {
        const [xr, yr] = this.#getXY(angle);
        const x1 = DialGraduationBuilder.#trim(this.#cx + this.#radius * r1 * xr);
        const y1 = DialGraduationBuilder.#trim(this.#cy + this.#radius * r1 * yr);
        const x2 = DialGraduationBuilder.#trim(this.#cx + this.#radius * r2 * xr);
        const y2 = DialGraduationBuilder.#trim(this.#cy + this.#radius * r2 * yr);

        return `M${x1} ${y1} L${x2} ${y2} `;
    }

    minor(angle) {
        this.#thinLine += this.#lineCoords(angle, 0.85, 0.75);
    }

    mid(angle) {
        this.#thinLine += this.#lineCoords(angle, 0.85, 0.70);
    }

    major(angle) {
        this.#thinLine += this.#lineCoords(angle, 0.85, 0.75);
        this.#midLine += this.#lineCoords(angle, 0.75, 0.65);
    }

    zero(angle) {
        this.#thinLine += this.#lineCoords(angle, 0.85, 0.75);
        this.#thickLine += this.#lineCoords(angle, 0.75, 0.70);
        this.#midLine += this.#lineCoords(angle, 0.70, 0.65);
    }

    #getPos(angle, r) {
        const [xr, yr] = this.#getXY(angle);
        const x = DialGraduationBuilder.#trim(this.#cx + this.#radius * r * xr);
        const y = DialGraduationBuilder.#trim(this.#cy + this.#radius * r * yr);
        return [x, y];
    }

    drawArc(start_angle, end_angle, radius, attrs) {

            const paintRad = radius * this.#radius;
            const [sx, sy] = this.#getPos(start_angle, radius);
            const [ex, ey] = this.#getPos(end_angle, radius);
            const path = `M ${sx} ${sy} A ${paintRad} ${paintRad} 0 0 1 ${ex} ${ey}`;
            const arc = svg.create(
                "path",
                {
                    d: path,
                    fill: 'none'
                }
            );
            svg.change(arc, attrs);

    }

    draw(color) {
        return [
            svg.create("path", {stroke: color, "stroke-width": 1, d: this.#thinLine}),
            svg.create("path", {stroke: color, "stroke-width": 2, d: this.#midLine}),
            svg.create("path", {stroke: color, "stroke-width": 4, d: this.#thickLine})
        ];
    }

};





// Creates the bevel, face and needle for a gauge.
// Private method
//
class BaseGauge {

    #convexBevel;
    #concaveBevel;
    #face;
    #needle;
    #cx;
    #cy;
    #radius;
    static #fills = {};
    static #needleSymbol;


    constructor(radius, cx, cy) {

        if (!("convexGaugeBevelFill" in BaseGauge.#fills)) {
            BaseGauge.#fills.convexGaugeBevelFill = svg.linGrad({
                x1: 0, y1: 0, x2: 1, y2: 1, c1: 'white', c2: 'grey', id: "convexGaugeBevelFill"
            });
            BaseGauge.#fills.concaveGaugeBevelFill = svg.linGrad({
                x1: 0, y1: 0, x2: 1, y2: 1, c1: 'grey', c2: 'white', id: "concaveGaugeBevelFill"
            });
        }

        if (!BaseGauge.#needleSymbol) {
            const needle = svg.create("symbol",
                {
                    id: "needle",
                    width: 20,
                    height: 20,
                    style: "fill:black",
                    viewBox: "-10 -10 20 20"
                }
            );

            svg.create("circle", {parent: needle, r: 1});
            svg.create("polyline", {parent: needle, points: "-0.3,0 0,8.5 0.3,0 1,-3 -1,-3 -0.3,0", style: "fill:black"});
            svg.create("circle", {parent: needle, r: 0.2, style: "fill:white"});
            BaseGauge.#needleSymbol = needle;
        }

        this.#convexBevel = svg.create("circle", {
            cx: cx,
            cy: cy,
            r: radius,
            stroke: "black",
            fill: "url(#convexGaugeBevelFill)"
        });

        this.#concaveBevel = svg.create("circle", {
            cx: cx,
            cy: cy,
            r: radius * 0.95,
            stroke: "none",
            fill: "url(#concaveGaugeBevelFill)"
        });

        this.#face = svg.create("circle", {
            cx: cx,
            cy: cy,
            r: radius * 0.9,
            stroke: "black",
            fill: "white"
        });

        this.#needle = svg.useElement("#needle", {x: cx - radius, y: cy - radius, width: 2 * radius, height: 2 * radius})
        this.#cx = cx;
        this.#cy = cy;
        this.#radius = radius;
    }

    setNeedle(angle) {
        this.#needle.setAttribute("transform", `rotate(${angle},${this.#cx},${this.#cy})`);
    }

    placeText(textArray) {

        for (let i = 0; i < textArray.length; i += 1) {
            const t = textArray[i];
            svg.createText(
                {
                    color: 'black',
                    fontSize: 12,
                    text: t[2],
                    yTop: this.#cy + t[1] * this.#radius,
                    x: this.#cx + t[0] * this.#radius,
                    align: t[3]
                }
            );
        }
    }
};


class HighPressureGauge extends BaseGauge {

/// Creates a high pressure outlet gauge: 0 to 4000kPa
    constructor({radius, cx, cy}) {

        super(radius, cx, cy);
        const grad = new DialGraduationBuilder(cx, cy, radius);

        grad.zero(45);
        for (let a = 45 + 6.75, i = 1; a <= 315; a += 6.75)
        {
            switch (i) {
            case 5:
                grad.mid(a);
                break;
            case 10:
                grad.major(a);
                i = 0;
                break;
            default:
                grad.minor(a);
            }
            i += 1;

        }
        grad.draw("black");

        this.placeText([
            [-0.4, 0.5, '0', 'start'],
            [-0.65, -0.1, '1000', 'start'],
            [0.0, -0.55, '2000', 'middle'],
            [0.65, -0.1, '3000', 'end'],
            [0.4, 0.5, '4000', 'end']
        ]);
    };

    showPressure(p) {
        let a;
        if (p < 0 || isNaN(p)) {
            a = -135; // bottom out
        } else if (p > 4000) {
            a = 135;  // 100kPa in 20deg
        } else {
            a = -135 + p / 4000 * 270;
        }
        this.setNeedle(a + 180);

    };
};


/// Creates a normal outlet gauge: 0 to 2500kPa
class OutletGauge extends BaseGauge {
    constructor({radius, cx, cy}) {
        super(radius, cx, cy);
        const grad = new DialGraduationBuilder(cx, cy, radius);

        grad.zero(45);
        for (let a = 45 + 5.4, i = 1; a <= 315; a += 5.4)
        {

            if (i === 10) {
                grad.major(a);
                i = 0;
            } else if (i % 2 === 1) {  // odd value
                grad.minor(a);
            } else {
                grad.mid(a);
            }

            i += 1;

        }
        grad.draw('black');

        this.placeText(
            [
                [-0.45, 0.45, '0', 'start'],
                [-0.60, -0.1, '500', 'start'],
                [-0.4, -0.45, '1000', 'start'],
                [0.4, -0.45, '1500', 'end'],
                [0.6, -0.1, '2000', 'end'],
                [0.45, 0.45, '2500', 'end'],
                [0.0, 0.6, 'kPa', 'middle']
            ]
        );
    };

    showPressure(p) {
        let a;
        if (p < 0 || isNaN(p)) {
            a = -135; // bottom out
        } else if (p > 2500) {
            a = 135;  // 100kPa in 20deg
        } else {
            a = -135 + p / 2500 * 270;
        }
        this.setNeedle(a + 180);

    };
};


class EngineRevsGauge extends BaseGauge {
    constructor({radius, cx, cy}) {
        super(radius, cx, cy);

        const grad = new DialGraduationBuilder(cx, cy, radius);

        grad.drawArc(
            45 + 6.75 * 10,
            45 + 6.75 * 20,
            0.8,
            {
                'stroke-width': radius / 10,
                stroke: 'green',
            }
        );

        grad.drawArc(
            45 + 6.75 * 25,
            45 + 6.75 * 40,
            0.8,
            {
                'stroke-width': radius / 10,
                stroke: 'red',
            }
        );
        //     const [ex, ey] = grad.getPos(, 0.8);
        //     const path = `M ${sx} ${sy} A ${paintRad} ${paintRad} 0 0 1 ${ex} ${ey}`;
        //     svg.create(
        //         "path",
        //         {
        //             d: path,
        //             fill: 'none'

        //         }
        //     );
        // }
        // {
        //     const [sx, sy] = grad.getPos(45 + 6.75 * 25, 0.8);
        //     const [ex, ey] = grad.getPos(45 + 6.75 * 40, 0.8);
        //     const path = `M ${sx} ${sy} A ${paintRad} ${paintRad} 0 0 1 ${ex} ${ey}`;
        //     svg.create(
        //         "path",
        //         {
        //             d: path,
        //             'stroke-width': radius / 10,
        //             stroke: 'red',
        //             fill: 'none'
        //         }
        //     );
        // }
        grad.zero(45);
        for (let a = 45 + 6.75, i = 1; a <= 315; a += 6.75)
        {

            if (i === 10) {
                grad.major(a);
                i = 0;
            } else if (i === 5) {
                grad.mid(a);
            } else {
                grad.minor(a);
            }

            i += 1;

        }
        grad.draw('black');

        this.placeText(
            [
                [-0.5, 0.4, '0', 'start'],
                [-0.65, -0.1, '1000', 'start'],
                [0.0, -0.4, '2000', 'middle'],
                [0.65, -0.1, '3000', 'end'],
                [0.5, 0.4, '4000', 'end'],
                [0.0, 0.6, 'RPM', 'middle']
            ]
        );
    }

    showPressure(rpm) {
        let a;
        if (rpm < 0 || isNaN(rpm)) {
            a = -135; // bottom out
        } else if (rpm > 4000) {
            a = 135;  // 100rpm in 20deg
        } else {
            a = -135 + rpm / 4000 * 270;
        }
        this.setNeedle(a + 180);

    }
};


/// Creates an inlet gauge -100 to 1600kPa
class CompoundGauge extends BaseGauge {
    constructor({radius, cx, cy}) {
        super(radius, cx, cy);
        const redGrad = new DialGraduationBuilder(cx, cy, radius);
        const blackGrad = new DialGraduationBuilder(cx, cy, radius);

        for (let a = 180 - 7, i = 1; a >= 40; a -= 7) {
            switch (i) {
            case 0:
                redGrad.major(a);
                i += 1;
                break;
            case 1:
                redGrad.minor(a);
                i += 1;
                break;
            case 2:
                redGrad.mid(a);
                i += 1;
                break;
            default:
                redGrad.minor(a);
                i = 0;
            }
        }

        blackGrad.zero(180);

        blackGrad.major(200);
        blackGrad.minor(206);
        blackGrad.minor(212);
        for (let a = 218, i = 0; a <= 315; a += 8) {
            if (i === 0) {
                blackGrad.major(a);
            } else {
                blackGrad.minor(a);
            }
            i = (i + 1) % 4;  // modulo 4 increment
        }

        redGrad.draw('red');
        blackGrad.draw('black');

        this.placeText([
            [-0.3, -0.5, "-20", 'start'],
            [-0.6, -0.25, "-40", 'start'],
            [-0.7, 0, "-60", 'start'],
            [-0.6, 0.25, "-80", 'start'],
            [-0.5, 0.4, "-100", 'start'],
            [0.0, -0.55, "0", 'center'],
            [0.3, -0.5, "100", 'end'],
            [0.4, -0.4, "400", 'end'],
            [0.6, -0.15, "800", 'end'],
            [0.6, 0.15, "1200", 'end'],
            [0.6, 0.4, "1600", 'end'],
            [0.0, 0.6, 'kPa', 'middle']
        ]);
    }

    showPressure(p) {
        let a;
        if (p < -100 || isNaN(p)) {
            a = -140;
        } else if (p < 0) {
            a = p * 1.4; // 100kPa in 140deg
        } else if (p < 100) {
            a = p * 0.2;  // 100kPa in 20deg
        } else if (p < 400) {
            a = 20 + (p - 100) * 0.06; // 6deg per 100kPa
        } else if (p < 1600) {
            a = 38 + (p - 400) * 0.08; // 8deg per 100kPa
        } else {
            a = 38 + 1200 * 0.08;
        }
        this.setNeedle(a + 180);

    };

};


// A digital flow gauge: 0 to 9999lpm
class FlowGauge {
    #textElem;
    #mount;

    constructor({radius, cx, cy}) {
        // textNode: svg.document.createTextNode(),
        this.#mount = svg.create("circle", {
            cx: cx,
            cy: cy,
            r: radius,
            fill: "#880000"
        }),
        this.#textElem = svg.changeableText("----", {
            x: cx,
            y: cy,
            "text-anchor": 'middle',
            "font-family": "arial",
            'font-size': radius / 2,
            fill: "#FF0000"
        })
    }

    set(flow) {
        if (flow < 0 || flow > 9999) {
            throw {name: 'badParam', message: `bad flow:${flow}`};
        }
        const text = Math.round(flow).toString().padStart(4, '0');
        this.#textElem.change(text);
    };
};
