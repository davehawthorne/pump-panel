

"use strict";

/*global svg widgets*/

var offset = 0;

var addSpin = function (menu, text, type, s) {
    svg.createText({
        x: 10,
        yTop: offset + 20,
        color: "white", //TEMP!!! colour.text,
        align: "start",
        text: text,
        parent: menu.group()
    });
    s.x = 10;
    s.y = offset + 30;
    s.width = 230;
    s.height = 30;
    s.parent = menu.group();
    offset += 60;
    return widgets.general[type](s);
};


function doHydrantMenu(x, y) {

    var menu = widgets.menus.collapsible({
        x: x,
        y: y,
        width: 250,
        height: 350,
        colour: "green",
        hh: 30,
        title: "Hydrant Line",
        parent: svg.getRoot()
    });
    offset = 0;
    return {
        menu: menu,

        pressure: addSpin(menu, 'Hydrant Pressure', 'numSpinner', {
            min: 50,
            max: 1000,
            initial: 300,
            step: 50,
            units: 'kPa'
        }),

        length: addSpin(menu, 'Lengths of Hose', 'numSpinner', {
            min: 1,
            max: 15,
            initial: 3
        }),

        rise: addSpin(menu, 'Rise from Hydrant', 'numSpinner', {
            min: -10,
            max: 10,
            initial: 0,
            units: 'm'
        }),

        hoseSize: addSpin(menu, 'Hose Size', 'listSpinner', {
            values: ["65mm", "65 x 2", "90mm", "110mm"]
        }),

        hoseState: addSpin(menu, 'Hose Lay State', 'listSpinner', {
            values: ["straight", "flaked", "spaghetti"]
        })
    };
}


function doAttackMenu(x, y) {
    var menu = widgets.menus.collapsible({
        x: x,
        y: y,
        width: 250,
        height: 350,
        colour: "blue",
        hh: 30,
        title: "Attack Line",
        parent: svg.getRoot()
    });
    offset = 0;
    return {
        menu: menu,

        branchType: addSpin(menu, 'Branch Type', 'listSpinner', {
            values: ["Protek 38mm", "Protek 65mm"]
        }),

        length: addSpin(menu, 'Lengths of Hose', 'numSpinner', {
            min: 1,
            max: 15,
            initial: 3
        }),

        rise: addSpin(menu, 'Rise to Branch', 'numSpinner', {
            min: -10,
            max: 10,
            initial: 0,
            units: 'm'
        }),

        hoseSize: addSpin(menu, 'Hose Size', 'listSpinner', {
            values: ["38mm", "65mm"]
        }),

        hoseState: addSpin(menu, 'Hose Lay State', 'listSpinner', {
            values: ["straight", "flaked", "spaghetti"]
        })
    };
}

