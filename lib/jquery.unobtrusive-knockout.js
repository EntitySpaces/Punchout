/// <reference path="jquery-1.6.js" />


/** 
* @preserve Unobtrusive Knockout support library for jQuery
*
* @author Joel Thoms
* @version 1.1
*/

(function ($) {

    if (!$ || !$['fn']) throw new Error('jQuery library is required.');

    /**
    * Private method to recursively render key value pairs into a string
    * 
    * @param {Object} options Object to render into a string.
    * @return {string} The string value of the object passed in.
    */
    function render(options) {
        var rendered = [];
        for (var key in options) {
            var val = options[key];
            switch (typeof val) {
                case 'string': rendered.push(key + ':' + val); break;
                case 'object': rendered.push(key + ':{' + render(val) + '}'); break;
                case 'function': rendered.push(key + ':' + val.toString()); break;
            }
        }
        return rendered.join(',');
    }

    /**
    * jQuery extension to handle unobtrusive Knockout data binding.
    * 
    * @param {Object} options Object to render into a string.
    * @return {Object} A jQuery object.
    */
    $['fn']['dataBind'] = $['fn']['dataBind'] || function (options) {
        return this['each'](function () {
            var opts = $.extend({}, $['fn']['dataBind']['defaults'], options);
            var attr = render(opts);
            if (attr != null && attr != '') {
                $(this)['attr']('data-bind', attr);
            }
        });
    };

})(jQuery);