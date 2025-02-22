// "use strict";

class Svg {
    namespace = "http://www.w3.org/2000/svg"

    constructor() {
        // this.root = root;
        // console.log(this.root);  //FIXME
        // this.document = this.root.ownerDocument; //FIXME what's this???
        this.setAttrs = this.change;  //FIXME remove
    }

    create(type, attributes) {
        const element = this.document.createElementNS(this.namespace, type),
        parent = attributes.parent || this.root;

        for (let attrName in attributes) {
            if (attrName === 'parent') {        //FIXME
                continue;
            }
            element.setAttribute(attrName, attributes[attrName]);
        }

        parent.appendChild(element);
        return element;
    }

    change(item, attributes) {
        for (let name in attributes) {
            item.setAttribute(name, attributes[name]);
        }
    }

    makeThing(type, names, args) {
        const element = this.document.createElementNS(this.namespace, type);
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
        const element = this.document.createElementNS(this.namespace, 'polygon');
        const pathStr = this.path(path);

        element.setAttribute('points', pathStr);
        for (let name in attributes) {
            if (typeof attributes[name] !== 'function') {
                element.setAttribute(name, attributes[name]);
            }
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
                str += l + ' ';
                break;
            case 'object':
                str += l[0] + ',' + l[1] + ' ';
                break;
            default:
                throw new Error('bad list: ' + list);
            }
        }
        return str.trim();
    };


    radGrad(settings) {
        const attributes = utils.copyAttribs(settings, ["id", "fx", "fy", "cx", "cy", "r"]);
        const grad = this.create('radialGradient', attributes);
        this.create('stop', {parent: grad, style: 'stop-color:' + settings.c1, offset: 0});
        this.create('stop', {parent: grad, style: 'stop-color:' + settings.c2, offset: 1});
        return grad;
    };


    linGrad(settings) {
        const grad = this.create('linearGradient', {
            id: settings.id,
            x1: settings.x1,
            y1: settings.y1,
            x2: settings.x2,
            y2: settings.y2
        });
        this.create('stop', {parent: grad, style: 'stop-color:' + settings.c1, offset: 0});
        this.create('stop', {parent: grad, style: 'stop-color:' + settings.c2, offset: 1});
        return grad;
    };


    rgb2str(rgb) {
        return "rgb(" + rgb[0].toString() + ", " + rgb[1].toString() + ", " + rgb[2].toString() + ")";
    };



    createText(settings) {
        let line = [];
        let span = [];
        const text = this.create("text", {
            "text-anchor": settings.align || "middle",
            "font-family": "arial",
            "font-size": settings.fontSize || 20,
            y: settings.yTop,
            x: settings.x,
            fill: settings.color || "white",
            parent: settings.parent
        });

        const textArray = (typeof settings.text === 'string') ? [settings.text] : settings.text;

        for (let i = 0; i < textArray.length; i += 1) {
            line[i] = this.document.createTextNode(textArray[i]);
            span[i] = this.document.createElementNS(this.namespace, "tspan");
            span[i].appendChild(line[i]);
            this.setAttrs(span[i], {
                dy: i ? "1em" : "0em",
                x: settings.x
            });
            text.appendChild(span[i]);
        }

        return {text: text, spans: span, lines: line};
    };

    setRoot(root) {
        this.root = root;
        this.document = this.root.ownerDocument; //FIXME what's this???
    };

    getRoot() {
        return this.root;
    };

}

//FIXME hack
let svg = new Svg();
