// "use strict";

class Svg {

    static #namespace = "http://www.w3.org/2000/svg"

    #root;
    #document;
    #clientRect;

    constructor() {
        // this.#root = root;
        // console.log(this.#root);  //FIXME
        // this.#document = this.#root.ownerDocument; //FIXME what's this???
        this.setAttrs = this.change;  //FIXME remove
    }

    create(type, attributes) {
        const element = this.#document.createElementNS(Svg.#namespace, type),
        parent = attributes.parent || this.#root;

        for (let attrName in attributes) {
            if (attrName === 'parent') {        //FIXME
                continue;
            }
            element.setAttribute(attrName, attributes[attrName]);
        }

        parent.appendChild(element);
        return element;
    }

    useElement(href, attributes) {
        let item = this.create("use", attributes);
        item.setAttributeNS("http://www.w3.org/1999/xlink", "href", href);
        return item
    }

    change(item, attributes) {
        for (let name in attributes) {
            item.setAttribute(name, attributes[name]);
        }
    }

    makeThing(type, names, args) {
        const element = this.#document.createElementNS(Svg.#namespace, type);
        const parent = args[0];
        const attributes = args[names.length + 1];

        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            element.setAttribute(name, args[i + 1]);    //FIXME yuck
        }
        if (attributes) {
            for (let name in attributes) {
                element.setAttribute(name, attributes[name]);
            }
        }
        parent.appendChild(element);
        return element;
    };


    circle() {
        return this.makeThing('circle', ['cx', 'cy', 'r'], arguments);
    };


    rect() {
        return this.makeThing('rect', ['x', 'y', 'width', 'height'], arguments);
    };


    group() {
        return this.makeThing('g', [], arguments);
    };


    polygon(parent, path, attributes) {
        const element = this.#document.createElementNS(Svg.#namespace, 'polygon');
        const pathStr = this.path(path);

        element.setAttribute('points', pathStr);
        for (let name in attributes) {
            element.setAttribute(name, attributes[name]);
        }
        parent.appendChild(element);
        return element;
    }

    path(list) {
        let str = '';
        for (let i = 0; i < list.length; i += 1) {
            const l = list[i];
            switch (typeof list[i]) {
            case 'string':
            case 'number':
                str += `${l} `;
                break;
            case 'object':
                str += `${l[0]},${l[1]} `;
                break;
            default:
                throw new Error('bad list: ' + list);
            }
        }
        return str.trim();
    };


    radGrad({id, fx, fy, cx, cy, r, c1, c2}) {
        const grad = this.create('radialGradient', {
            id: id,
            fx: fx,
            fy: fy,
            cx: cx,
            cy: cy,
            r: r
        });

        this.create('stop', {parent: grad, style: `stop-color:${c1}`, offset: 0});
        this.create('stop', {parent: grad, style: `stop-color:${c2}`, offset: 1});
        return grad;
    };


    linGrad({id, x1, y1, x2, y2, c1, c2}) {
        const grad = this.create('linearGradient', {
            id: id,
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2
        });
        this.create('stop', {parent: grad, style: `stop-color:${c1}`, offset: 0});
        this.create('stop', {parent: grad, style: `stop-color:${c2}`, offset: 1});
        return grad;
    };


    rgb2str(rgb) {
        return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    };

    changeableText(initial, attributes) {
        const textNode = this.#document.createTextNode(initial);
        const text = this.create("text", attributes);

        text.appendChild(textNode);

        return {
            text : text,
            change : function (value) {
                textNode.nodeValue = value;
            }
        };
    };


    createText({align="middle", fontSize=20, yTop, x, color="white", parent, text }) {
        let line = [];
        let span = [];
        const textObj = this.create("text", {
            "text-anchor": align,
            "font-family": "arial",
            "font-size": fontSize,
            y: yTop,
            x: x,
            fill: color,
            parent: parent
        });

        const textArray = (typeof text === 'string') ? [text] : text;

        for (let i = 0; i < textArray.length; i += 1) {
            line[i] = this.#document.createTextNode(textArray[i]);
            span[i] = this.#document.createElementNS(Svg.#namespace, "tspan");
            span[i].appendChild(line[i]);
            this.setAttrs(span[i], {
                dy: i ? "1em" : "0em",
                x: x
            });
            textObj.appendChild(span[i]);
        }

        return {text: textObj, spans: span, lines: line};
    };

    setRoot(root) {
        this.#root = root;
        this.#document = this.#root.ownerDocument; //FIXME what's this???

        this.#clientRect = this.#root.getBoundingClientRect();

    };

    getRoot() {
        return this.#root;
    }

    eventCoord(event) {
        return {
            x: event.clientX - this.#clientRect.x,
            y: event.clientY - this.#clientRect.y
        };
    };



}

//FIXME hack
let svg = new Svg();
