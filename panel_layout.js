"use strict";
/*global svg widgets*/

var
    colour = {
        inlet: "green",
        outlet: "blue",
        pump: "red",
        control: "black",
        panel: "grey",
        redLamp: [255, 0, 0],
        greenLamp: [0, 255, 0],
        blueLamp: [0, 0, 255]
    },

    dim = {
        valvePaint: 50,
        valveWidth: 100,
        pipe: 20,
        gauge: 90,
        gaugePaint: 100,
        rpm: 70,
        rpmPaint: 80,
        knobWidth: 40,
        pump: 50,
        pumpOut: 30,
        control: 10,
        valveHeight: 250,
        rBevel: 25,
        rGlobe: 18,
        lampSpacing: 60
    },

    x = {
        iv: 100,
        ig: 300,
        pt: 350,
        p: 500,
        og: 700,
        ov: 900,
        lamps: 650,
        lampText: 700,
        right: 1200
    },

    y = {
        gc: 100,
        l: 300,
        vt: 250,
        vb: 350,
        ptt: 400,
        ptb: 500,
        rpm: 450,
        lamps: 400,
        bottom: 600
    },

    style = {
        pipe: function (colour) {
            return "stroke: " + colour + "; stroke-width: " + dim.pipe;
        },
        valve: function (colour) {
            return "stroke-linecap: round; stroke: " + colour + "; stroke-width: " + dim.valvePaint;
        },
        control: function () {
            return "stroke: " + colour.control + "; stroke-width: " + dim.control;
        }

    };


function paintPump() {
    svg.create("circle", {
        cx: x.p,
        cy: y.l,
        r: dim.pump,
        fill: colour.pump
    });
    svg.create("rect", {
        x: x.p,
        y: y.l - dim.pump,
        width: dim.pump * 1.2,
        height: dim.pump * 0.8,
        fill: colour.pump
    });
    svg.create("circle", {
        cx: x.p,
        cy: y.l,
        r: dim.pump * 0.5,
        style: "stroke: black; stroke-width: " + (dim.pump * 0.05) + "; fill: none"
    });
}


function paintPanel() {
    svg.create("rect", {
        x: 0,
        y: 0,
        width: x.right,
        height: y.bottom,
        fill: colour.panel
    });
    svg.create("line", {
        x1: x.iv,
        x2: x.iv,
        y1: y.vt,
        y2: y.vb,
        style: style.valve(colour.inlet)
    });
    svg.create("line", {
        x1: x.iv,
        x2: x.p,
        y1: y.l,
        y2: y.l,
        style: "stroke: " + colour.inlet + "; stroke-width: " + dim.pipe
    });
    svg.create("line", {
        x1: x.ig,
        x2: x.ig,
        y1: y.l,
        y2: y.gc,
        style: "stroke: " + colour.inlet + "; stroke-width: " + dim.pipe
    });
    svg.create("circle", {
        cx: x.ig,
        cy: y.gc,
        r: dim.gaugePaint,
        fill: colour.inlet
    });
    svg.create("path", {
        d: svg.path([
            'M', [x.p, y.l - dim.pumpOut],
            [x.p + dim.pump + dim.pumpOut, y.l - dim.pumpOut],
            [x.p + dim.pump + dim.pumpOut * 2, y.l],
            [x.ov, y.l]
        ]),
        style: "fill: none; stroke: " + colour.outlet + "; stroke-width: " + dim.pipe
    });
    svg.create("line", {
        x1: x.og,
        x2: x.og,
        y1: y.l,
        y2: y.gc,
        style: style.pipe(colour.outlet)
    });
    svg.create("circle", {
        cx: x.og,
        cy: y.gc,
        r: dim.gaugePaint,
        fill: colour.outlet
    });
    svg.create("line", {
        x1: x.ov,
        x2: x.ov,
        y1: y.vt,
        y2: y.vb,
        style: style.valve(colour.outlet)
    });
    svg.create("line", {
        x1: x.p,
        x2: x.p,
        y1: y.l,
        y2: y.rpm,
        style: style.control()
    });
    svg.create("line", {
        x1: x.pt,
        x2: x.p,
        y1: y.rpm,
        y2: y.rpm,
        style: style.control()
    });
    svg.create("circle", {
        cx: x.p,
        cy: y.rpm,
        r: dim.rpmPaint,
        fill: colour.pump
    });
    paintPump();
    svg.create("line", {
        x1: x.pt,
        x2: x.pt,
        y1: y.ptt,
        y2: y.ptb,
        style: style.valve(colour.pump)
    });

    svg.createText({
        x: x.lampText,
        yTop: y.lamps,
        color: colour.text,
        align: "start",
        text: 'Cavitation'
    });
    svg.createText({
        x: x.lampText,
        yTop: y.lamps + 1 * dim.lampSpacing,
        color: colour.text,
        align: "start",
        text: 'Hose Collapse'
    });
    svg.createText({
        x: x.lampText,
        yTop: y.lamps + 2 * dim.lampSpacing,
        color: colour.text,
        align: "start",
        text: 'Engine Red Lining'
    });

    svg.createText({
        x: x.p,
        yTop: y.gc + dim.rpm,
        color: colour.text,
        align: "middle",
        text: 'Flow l/min'
    });
}


function dummy() {
}

function sideways(xLoc) {
    return (xLoc - x.right / 2) / 20;
}


function addLamp(lampNum, colour) {
    return widgets.gauges.lamp({
        cx: x.lamps,
        cy: y.lamps + dim.lampSpacing * lampNum,
        rBevel: dim.rBevel,
        rGlobe: dim.rGlobe,
        interval: 500,
        colour: colour
    });
}


function attachWidgets(de) {
    return {
        inValve: widgets.controls.outletValve({
            yTop: y.vt,
            yBot: y.vb,
            knobWidth: dim.knobWidth,
            width: dim.valveWidth,
            height: dim.valveHeight,
            callback: dummy,
            cx: x.iv,
            sideways: sideways(x.iv)
        }),
        combGauge: widgets.gauges.compound({
            parent: de,
            cx: x.ig,
            cy: y.gc,
            radius: dim.gauge
        }),
        revGauge: widgets.gauges.engineRevs({
            parent: de,
            cx: x.p,
            cy: y.rpm,
            radius: dim.rpm
        }),
        throttle: widgets.controls.outletValve({
            yTop: y.ptt,
            yBot: y.ptb,
            knobWidth: dim.knobWidth,
            width: dim.valveWidth,
            height: dim.valveHeight,
            callback: dummy,
            cx: x.pt,
            sideways: sideways(x.pt)
        }),
        outGauge: widgets.gauges.outlet({
            parent: de,
            cx: x.og,
            cy: y.gc,
            radius: dim.gauge
        }),
        outValve: widgets.controls.outletValve({
            yTop: y.vt,
            yBot: y.vb,
            knobWidth: dim.knobWidth,
            width: dim.valveWidth,
            height: dim.valveHeight,
            callback: dummy,
            cx: x.ov,
            sideways: sideways(x.ov)
        }),
        outFlow: widgets.gauges.flow({
            cx: x.p,
            cy: y.gc,
            width: dim.rpm * 1.5
        }),
        cavitation: addLamp(0, colour.redLamp),
        hoseCollapse: addLamp(1, colour.blueLamp),
        modelFail: addLamp(2, colour.greenLamp)


    };
}


