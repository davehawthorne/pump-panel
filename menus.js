

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
    s.width = 280;
    s.height = 30;
    s.parent = menu.group();
    offset += 60;
    return new type(s);
};


function doHydrantMenu(x, y) {

    var menu = widgets.menus.collapsible({
        x: x,
        y: y,
        width: 300,
        height: 350,
        colour: "green",
        hh: 30,
        title: "Hydrant Line Menu",
        parent: svg.getRoot()
    });
    offset = 0;
    return {
        menu: menu,

        pressure: addSpin(menu, 'Hydrant Pressure', NumSpinner, {
            min: 50,
            max: 1000,
            initial: 300,
            step: 50,
            units: 'kPa'
        }),

        length: addSpin(menu, 'Lengths of Hose', NumSpinner, {
            min: 1,
            max: 15,
            initial: 3
        }),

        rise: addSpin(menu, 'Rise from Hydrant', NumSpinner, {
            min: -10,
            max: 10,
            initial: 0,
            units: 'm'
        }),

        hoseSize: addSpin(menu, 'Hose Size', ListSpinner, {
            values: ["65mm", "twinned 65mm", "90mm"]
        }),

        hoseState: addSpin(menu, 'Hose Lay State', ListSpinner, {
            values: ["straight", "flaked", "spaghetti"]
        })
    };
}


function doAttackMenu(x, y) {
    var menu = widgets.menus.collapsible({
        x: x,
        y: y,
        width: 300,
        height: 400,
        colour: "blue",
        hh: 30,
        title: "Attack Line Menu",
        parent: svg.getRoot()
    });
    offset = 0;
    return {
        menu: menu,

        branchOption: addSpin(menu, 'Hose and Branch', ListSpinner, {
            values: ["38mm & Protek 366", "65mm & Protek 368"]
        }),

        numAttackLines: addSpin(menu, 'Number of Lines', NumSpinner, {
            min: 1,
            max: 4,
            initial: 1
        }),

        nominalFlow: addSpin(menu, 'Flow Rate (l/m)', ListSpinner, {
            values: [115, 230, 360, 475]
        }),

        length: addSpin(menu, 'Lengths of Hose', NumSpinner, {
            min: 1,
            max: 15,
            initial: 3
        }),

        rise: addSpin(menu, 'Rise to Branch', NumSpinner, {
            min: -10,
            max: 10,
            initial: 0,
            units: 'm'
        }),

        hoseState: addSpin(menu, 'Hose Lay State', ListSpinner, {
            values: ["straight", "flaked", "spaghetti"]
        })
    };
}
