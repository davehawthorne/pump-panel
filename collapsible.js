"use strict";
/*global svg */


// collapsible



/*

tab = Collapsible({
    x: 100,
    y: 100,
    width: 200,
    height: 300
})


tab.hide();
tab.show();
*/

var widgets = window.widgets || {};



widgets.menus = (function () {

    return {
        collapsible: function (s) {
            var
                pos = {
                    x: s.x,
                    y: s.y
                },
                menu = svg.group(s.parent, {
                    transform: "translate(" + s.x + "," + s.y + ")"
                }),
                myGroup = svg.create("g", {
                    parent: menu,
                    transform: "translate(" + 0 + "," + s.hh + ")",
                    visibility: 'hidden'
                }),

                bound = svg.rect(myGroup, 0, 0, s.width, s.height - s.hh, {
                    style: "stroke: " + s.colour + "; stroke-width: 3; fill: " + s.colour + "; fill-opacity: 0.5"
                }),

                header = svg.rect(menu, 0, 0, s.width, s.hh, {
                    style: "stroke: " + s.colour + "; stroke-width: 3; fill: " + s.colour + "; fill-opacity: 0.7"
                }),

                sizer = svg.group(menu),

                k = s.hh / 10,
                expand = svg.polygon(sizer, [[k, k], [9 * k, k], [5 * k, 9 * k]], {
                    fill: 'red'
                }),

                contract = svg.polygon(sizer, [[k, 9 * k], [9 * k, 9 * k], [5 * k, k]], {
                    fill: 'red',
                    visibility: 'hidden'
                }),


                title = svg.createText({
                    text: s.title,
                    x: s.width / 2,
                    yTop: s.hh * 0.9,
                    align: 'middle',
                    fill: 'white',
                    fontFamily: 'Verdana',
                    fontSize: s.hh * 0.8,
                    parent: menu
                }),

                visible = s.visible,

                hide = function () {
                    myGroup.setAttribute('visibility', 'hidden');
                    contract.setAttribute('visibility', 'hidden');
                    expand.setAttribute('visibility', 'visible');
                    visible = false;
                },

                show = function () {
                    myGroup.setAttribute('visibility', 'visible');
                    contract.setAttribute('visibility', 'visible');
                    expand.setAttribute('visibility', 'hidden');
                    visible = true;
                },

                toggleVis = function () {
                    if (visible) {
                        hide();
                    } else {
                        show();
                    }
                },
                moving = false,

                startMove = function (evt) {
                    moving = {
                        dx: evt.screenX - pos.x,
                        dy: evt.screenY - pos.y
                    };
                },

                doMove = function (evt) {
                    if (moving) {
                        pos.x = evt.screenX - moving.dx;
                        pos.y = evt.screenY - moving.dy;
                        menu.setAttribute('transform', "translate(" + pos.x + "," + pos.y + ")");
                    }
                },

                stopMove = function (evt) {
                    moving = false;
                };


            if (visible) {
                show();
            }

            sizer.addEventListener("click", toggleVis);

            header.addEventListener("mousedown", startMove);
            menu.addEventListener("mousemove", doMove);
            menu.addEventListener("mouseup", stopMove);
            menu.addEventListener("mouseout", stopMove);

            return {
                group: function () {
                    return myGroup;
                },

                xAbs: function (xRel) {
                    return xRel + s.x;
                },

                yAbs: function (yRel) {
                    return yRel + s.y + s.hh;
                },

                hide: hide,
                show: show
            };
        }
    };
})();




