/// <reference path="../lib/knockout-1.2.1.debug.js" />
/// <reference path="../lib/json2.js" />
/// <reference path="punchout_grid.js" />

/*************************************
    Defines the Custom KnockoutJs 
    Bindings that Punchout leverages

*************************************/

(function (po, ko, $, undefined) {

    //create out actual binding
    ko.bindingHandlers.poGrid = {

        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var id = '';
            if (element.tagName == 'TABLE') {
                if (element.id !== '') {
                    id = element.id
                } else {
                    id = "table" + new Date().toDateString();
                    element.id = id;
                }

                var grid = new po.poGrid(valueAccessor());
                //save it for future reference
                if (!po.gridCollection[id]) {
                    po.gridCollection[id] = grid;
                }

            }
        },

        //re work this so it isn't ripping out all the element children
        update: function (element, viewModelAccessor) {
            var viewModel = viewModelAccessor();
            // Empty the element
            while (element.firstChild) {
                ko.removeNode(element.firstChild);
            }

            // Render the main grid
            var gridContainer = element.appendChild(document.createElement("DIV"));
            ko.renderTemplate("po_gridTemplate", viewModel, {
                templateEngine: po.templateEngine
            }, gridContainer, "replaceNode");
        }
    };

})(window.po = window.po || {}, window.ko, jQuery);