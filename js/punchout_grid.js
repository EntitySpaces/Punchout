// Punchout JavaScript library v1.0
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

/// <reference path="knockout-1.2.1.debug.js" />
(function () {
    po = {};

    po.poGrid = {
        viewModel: function (data, columns) {
            this.collection = data;
            this.columns = columns;
            this.selectedRow = null;
            this.selectedIndex = ko.observable(0);
            
            findParentRow = function (element) {
                if (element.tagName === "TR") {
                    return element;
                }
                return this.findParentRow(element.parentNode);
            }

            this.OnMouseIn = function (event) {
                var tableRow = findParentRow(event.target.parentNode);
                if (tableRow.style.backgroundColor == 'lightblue') {
                    return;
                }
                tableRow.style.backgroundColor = '#dcfac9';
            };

            this.OnMouseOut = function (event) {
                var tableRow = findParentRow(event.target.parentNode);
                if(tableRow.style.backgroundColor == 'lightblue') {
                    return;
                }
                tableRow.style.backgroundColor = 'white';
            };

            this.OnClick = function (event) {
                if (this.selectedRow != null) {
                    this.selectedRow.style.backgroundColor = 'white';
                }
                var tableRow = findParentRow(event.target.parentNode);
                tableRow.style.backgroundColor = 'lightblue';

                this.selectedRow = tableRow;
            }
        }
    };

    var templateEngine = new ko.jqueryTmplTemplateEngine(); //ensure that we are using a jQuery template engine

    /* 
    =================================
    PULL OUT FOR INLINE TESTING
    =================================

    <script type="text/html" id="po_gridTemplate">
        <table class="es-grid" cellspacing="0">
            <thead data-bind="template: { name: 'po_gridTH_template', foreach: columns, templateOptions: { vm: $data } }"></thead>
            <tbody data-bind="template: { name: 'po_gridTR_template', foreach: collection, templateOptions: { columns: columns, vm: $data } }"></tbody>
        </table>
    </script>

    <script type="text/html" id="po_gridTH_template">
        <th data-bind="text: header">
        </th>
    </script>	

    <script type="text/html" id="po_gridTR_template">
        <tr data-bind="click: $item.vm.OnClick.bind($item.vm), event: { mouseover: $item.vm.OnMouseIn.bind($item.vm), mouseout: $item.vm.OnMouseOut.bind($item.vm) }, 
        template: { name: 'po_gridTD_template', foreach: $item.columns, templateOptions: { rowData: $data } }"></tr>
    </script>	

    <script type="text/html" id="po_gridTD_template">
        <td data-bind="text: $item.rowData[property]"></td>
    </script>

    */

    //add our 4 templates as strings
    templateEngine.addTemplate("po_gridTemplate", "<table class=\"es-grid\" cellspacing=\"0\"><thead data-bind=\"template: { name: 'po_gridTH_template', foreach: columns, templateOptions: { vm: $data } }\"></thead><tbody data-bind=\"template: { name: 'po_gridTR_template', foreach: collection, templateOptions: { columns: columns, vm: $data } }\"></tbody></table>");
    templateEngine.addTemplate("po_gridTH_template", "<th data-bind=\"text: header\"></th>");
    templateEngine.addTemplate("po_gridTR_template", "<tr data-bind=\"click: $item.vm.OnClick.bind($item.vm), event: { mouseover: $item.vm.OnMouseIn.bind($item.vm), mouseout: $item.vm.OnMouseOut.bind($item.vm) }, template: { name: 'po_gridTD_template', foreach: $item.columns, templateOptions: { rowData: $data } }\"></tr>");
    templateEngine.addTemplate("po_gridTD_template", "<td data-bind=\"text: $item.rowData[property]\"></td>");

    //create out actual binding
    ko.bindingHandlers.poGrid = {
        update: function (element, viewModelAccessor) {
            var viewModel = viewModelAccessor();
            // Empty the element
            while (element.firstChild) {
                ko.removeNode(element.firstChild);
            }

            // Render the main grid
            var gridContainer = element.appendChild(document.createElement("DIV"));
            ko.renderTemplate("po_gridTemplate", viewModel, {
                templateEngine: templateEngine
            }, gridContainer, "replaceNode");
        }
    };
})();