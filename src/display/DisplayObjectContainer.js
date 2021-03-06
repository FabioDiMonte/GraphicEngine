/**
 * Created by fdimonte on 20/04/2015.
 */

var DisplayObjectContainer = (function(DisplayObject){

    /**
     * DisplayObjectContainer Class
     *
     * @param name
     * @constructor
     */
    function DisplayObjectContainer(name){
        DisplayObject.call(this,name);

        this._children = {};

        this._childrenLength = function(){
            var tot=0;
            objMap(this,function(){tot++;});
            return tot;
        }.bind(this._children);

        this._childrenArray = function(){
            var arr = [];
            objMap(this,function(c){arr.push(c);});
            return arr.sort(function(a,b){return a._zIndex - b._zIndex;});
        }.bind(this._children);

    }

    /**
     * DisplayObjectContainer prototype
     *
     * @type {DisplayObject}
     */
    DisplayObjectContainer.prototype = Object.create( DisplayObject.prototype );

    /******************************
     * OVERRIDE METHODS
     ******************************/

    DisplayObjectContainer.prototype._render = function(stage,isIso) {
        this._childrenArray().forEach(function(v){
            v._render(stage,isIso);
        });
    };

    DisplayObjectContainer.prototype._step = function(time) {
        this._childrenArray().forEach(function(v){
            v._step(time);
        });
        DisplayObject.prototype._step.call(this,time);
        return true;
    };

    /******************************
     * PUBLIC METHODS
     ******************************/

    // ADD CHILD
    DisplayObjectContainer.prototype.addChild = function(child,index) {
        if(!(child instanceof DisplayObject))
            throw new Error('adding child with unsupported type:',typeof(child));
        if(this[child._name])
            throw new Error('property "',child._name,'" already exists on',this);

        index || (index = this._childrenLength());

        this._children[child._name] = child;
        this[child._name] = child;

        child._addTo(this,index);

        this._reorderChildren();

        return child;
    };

    // REMOVE CHILD
    DisplayObjectContainer.prototype.removeChild = function(child) {
        if(child instanceof String) child = this[child];
        if(child && this[child._name] && this[child._name] instanceof DisplayObject){
            delete this._children[child._name];
            delete this[child._name];
            child._remove();
        }
    };

    /******************************
     * INTERNAL METHODS
     ******************************/

    // REORDER CHILDREN
    DisplayObjectContainer.prototype._reorderChildren = function() {
        this._childrenArray().forEach(function(v,i){
            v._info.index = i;
        });
    };

    // GET SHAPES
    DisplayObjectContainer.prototype._getShapes = function() {
        var child,shapes = [];
        for(var c=0;c<this._children.length;c++){
            child = this._children[c];
            if(child._shape)
                shapes.push(child._shape);
            if(child instanceof DisplayObjectContainer)
                shapes = shapes.concat(child._getShapes());
        }
        return shapes;
    };

    DisplayObjectContainer.prototype._getShapesWithObjects = function() {
        var child,cArr=this._childrenArray(),children = [];
        for(var c=0;c<cArr.length;c++){
            child=cArr[c];
            if(child._shape)
                children.push(child);
            if(child instanceof DisplayObjectContainer)
                children = children.concat(child._getShapesWithObjects());
        }
        return children;
    };

    /******************************
     * PRIVATE METHODS
     ******************************/

    function objMap(obj,cb) {
        if(!obj || !cb) return;
        for(var c in obj) if(obj.hasOwnProperty(c)) cb(obj[c]);
    }

    return DisplayObjectContainer;

}(DisplayObject));
