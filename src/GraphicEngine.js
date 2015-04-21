/**
 * Created by fdimonte on 20/04/2015.
 */

var GraphicEngine = (function($,GEPackage,Stage,Point){

    /**
     * GraphicEngine Class
     *
     * @constructor
     */
    function GraphicEngine() {
        this.$el = $('<div/>');
        this.layers = {};
        this.fpsInterval = null;
        this.fpsLogInterval = null;
        this.utils = {
            worldSizeWidth: 400,
            worldSizeHeight: 400
        };
    }

    /**
     * GraphicEngine prototype
     *
     * @type {{package: *, init: Function, setWorld: Function, worldSize: Function, render: Function, addLayer: Function, removeLayer: Function, showFPS: Function, hideFPS: Function, screenToWorld: Function, getObjectsAtScreenCoord: Function}}
     */
    GraphicEngine.prototype = {

        // var GEPackage is declared in target/GEPackage.js wrote by Grunt Task 'grunt create_package'
        packages: GEPackage,

        /**
         * This method initialize the graphic engine binding it to the given element and options calling this.setWorld
         *
         * @param elem {String}    query selector for the DOM element which will contain the graphic engine
         * @param options {Object} a set of options to override default values
         */
        init: function(elem,options){
            if(!elem) throw new Error('no "elem" param passed to new GraphicEngine instance');
            if(options) $.extend(this.utils,options);
            this.setWorld(elem);
        },

        /**
         * This method will append this.$el to the given element (selector) setting its width and height
         *
         * @param elem {String} query selector for the DOM element which will contain the graphic engine
         */
        setWorld: function(elem) {
            if(!this.$el) return;

            var ws = this.worldSize();
            this.$el
                .css('position','relative')
                .width(ws.w)
                .height(ws.h)
                .appendTo($(elem));
        },

        /**
         * Returns an object with w and h property, for world's width and height
         *
         * @returns {{w: number, h: number}}
         */
        worldSize: function() {
            return {w:this.utils.worldSizeWidth, h:this.utils.worldSizeHeight};
        },

        /**
         * The main render method. It will call the same method on every layer (Stage).
         */
        render: function() {
            for(var l in this.layers){
                if(this.layers.hasOwnProperty(l)){
                    this.layers[l].render();
                }
            }
        },

        /**
         * Adds a new layer (Stage instance) and returns it.
         *
         * @param name {String} new layer's name
         * @returns {Stage}     newly added layer
         */
        addLayer: function(name) {
            var layer = new Stage(name);
            layer.addTo(this);

            this.layers[name] = layer;
            return layer;
        },

        /**
         * Removes the layer with the given name.
         *
         * @param name {String} the desired layer's name
         * @returns {Boolean}   returns TRUE if layer existed before been removed
         */
        removeLayer: function(name) {
            var layer = this.layers[name];
            if(layer){
                layer.remove();
                delete this.layers[name];
                return true;
            }
            return false;
        },

        showFPS: function(callback) {
            callback || (callback=console.log);
            var c = 0;
            this.fpsInterval = setInterval(function(){
                c++;
            },1);
            this.fpsLogInterval = setInterval(function(){
                callback(c/10);
                c=0;
            },1000);
        },
        hideFPS: function() {
            clearInterval(this.fpsInterval);
            clearInterval(this.fpsLogInterval);
        },

        /**
         * Converts screen coordinates (mouseclick) to canvas drawing coordinates.
         * Note: override this method if Stage.setSize is overridden (and viceversa)
         *
         * @param mx {Number} mouse X coordinate
         * @param my {Number} mouse Y coordinate
         * @returns {{x: number, y: number}}
         */
        screenToWorld: function(mx,my) {
            var ws = this.worldSize();
            var worldPosition = this.$el.offset();
            return {
                x: mx - (worldPosition.left + ws.w/2),
                y: my - (worldPosition.top  + ws.h/2)
            };
        },

        /**
         * Returns an array of DisplayObjects whose positions correspond to the given coordinates
         *
         * @param coord {Point} the interested screen coordinates
         * @returns {Array}     the array of DisplayObjects that share the specified pixel position
         */
        getObjectsAtScreenCoord: function(coord) {
            var worldCoord = this.screenToWorld(coord.x,coord.y);
            var shapes=[];

            for(var l in this.layers){
                if(this.layers.hasOwnProperty(l)){
                    shapes = shapes.concat(this.layers[l].getShapesWithObjects());
                }
            }

            var objects=[];
            for(var s=0;s<shapes.length;s++)
                if(shapes[s].shape && isPointInPoly(shapes[s].shape,worldCoord))
                    objects.push(shapes[s]);

            objects.sort(function(a,b){return (b.zindex - a.zindex);});
            return objects;
        },

        draw: {

            grid: function(stage,size,unit,opt,isIso) {
                size || (size = [10,10]);
                unit || (unit = 10);
                opt  || (opt = {});

                opt.strokeSize  || (opt.strokeSize = 1);
                opt.strokeColor || (opt.strokeColor = 0);
                opt.alpha       || (opt.alpha =.8);

                var from,to;

                stage.draw.setup(opt);
                for (var w=0;w<=size[0];w++) {
                    from = new Point(w*unit,0);
                    to = new Point(w*unit,size[0]*unit);
                    stage.draw.line(from,to,isIso);
                }
                for (var h=0;h<=size[1];h++) {
                    from = new Point(0,h*unit);
                    to = new Point(size[1]*unit,h*unit);
                    stage.draw.line(from,to,isIso);
                }
                stage.draw.render();
            },

            line: function(stage,from,to,opt,isIso) {
                if(stage==null || from==null || to==null) return;

                opt && stage.draw.setup(opt);
                stage.draw.line(from,to,isIso);
                stage.draw.render();
            },

            axis: function(stage,length,isIso) {
                length || (length=100);

                var aX = [length,0,0];
                var aY = [0,length,0];
                var aZ = [0,0,length];

                stage.draw.setup({strokeColor:0x0});
                stage.draw.line([0, 0, 0], aX, isIso);
                stage.draw.line([0, 0, 0], aY, isIso);
                stage.draw.line([0, 0, 0], aZ, isIso);
                stage.draw.render();
            },

            get3DPolygonSquare: function(size) {
                return [
                    [0,    0,    0],
                    [size, 0,    0],
                    [size, size, 0],
                    [0,    size, 0]
                ];
            },
            get3DPolygonSquareRight: function(size) {
                return [
                    [0, 0,    0   ],
                    [0, size, 0   ],
                    [0, size, size],
                    [0, 0,    size]
                ];
            },
            get3DPolygonSquareLeft: function(size) {
                return [
                    [0,    0, 0   ],
                    [0,    0, size],
                    [size, 0, size],
                    [size, 0, 0   ]
                ];
            }

        }

    };

    /******************************
     * PRIVATE METHODS
     ******************************/

    function isPointInPoly(poly, pt){
        for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
            ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
            && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
            && (c = !c);
        return c;
    }

    return GraphicEngine;

}(jQuery,GEPackage,Stage,Point));