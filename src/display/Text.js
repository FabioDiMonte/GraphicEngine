/**
 * Created by fdimonte on 20/04/2015.
 */

var Text = (function(DisplayObject){

    /**
     * Text Class
     *
     * @param name
     * @constructor
     */
    function Text(name) {
        DisplayObject.call(this,name);

        this._options.font = this.getFont('Verdana',14);
        this._options.fillColor = 0x0;
        this._options.strokeColor = null;

        this._info.renderMethod = 'text';
    }

    /**
     * Text prototype
     *
     * @type {DisplayObject}
     */
    Text.prototype = Object.create( DisplayObject.prototype );

    return Text;

}(DisplayObject));
