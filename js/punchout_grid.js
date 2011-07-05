// Punchout JavaScript library v1.0
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

/// <reference path="knockout-1.2.1.debug.js" />
(function () {
    po = {};

    po.poGrid = {

        pagingControl: function (grid) {

            this.enabled = ko.observable(true);
            this.grid = grid;
            this.totalPageCount = ko.observable(0);
            this.currentPage = ko.observable(1);
            this.rowsPerPage = ko.observable(10);

            this.startingRow = ko.dependentObservable(function () {
                return (this.currentPage() - 1) * this.rowsPerPage();
            }, this);

            this.endingRow = ko.dependentObservable(function () {
                return this.currentPage() * this.rowsPerPage();
            }, this);

            this.totalRowCount = ko.dependentObservable(function () {
                return this.grid.collection().length;
            }, this);

            this.totalPageCount = ko.dependentObservable(function () {
                var count = this.grid.collection().length;
                var lastPage = Math.round(count / this.rowsPerPage());
                if ((count % this.rowsPerPage()) > 0) {
                    lastPage += 1;
                }
                return lastPage;
            }, this);


        },

        viewModel: function (data, columns, headers) {
            this.collection = data;
            this.columns = columns;
            this.footerControl = false;
            this.headers = headers;
            this.selectedRow = null;
            this.selectedIndex = ko.observable(0);
            this.pager = new po.poGrid.pagingControl(this);

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
                if (tableRow.style.backgroundColor == 'lightblue') {
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

            this.OnFirstPage = function (event) {
                this.pager.currentPage(1);
            }

            this.OnNextPage = function (event) {
                var i = this.pager.currentPage();
                this.pager.currentPage(Math.min(i + 1, this.pager.totalPageCount()));
            }

            this.OnLastPage = function (event) {
                var lastPage = this.pager.totalPageCount();
                this.pager.currentPage(lastPage);
            }

            this.OnPrevPage = function (event) {
                var i = this.pager.currentPage();
                this.pager.currentPage(Math.max(i - 1, 1));
            }
        }
    };

    /* 
    =================================
    PULL OUT FOR INLINE TESTING
    =================================

    <script type="text/html" id="po_gridTemplate">
        <table id="poGrid" class="es-grid" cellspacing="0">

            {{if headers}}
            <thead>
                <tr data-bind="template: { name: 'po_gridTH_template', foreach: headers, templateOptions: { vm: $data } }" />
            </thead>
            {{/if}}

            <tbody data-bind="template: { name: 'po_gridTR_template', foreach: collection.slice(pager.startingRow(), pager.endingRow()), templateOptions: { columns: columns, vm: $data } }"></tbody>

            {{if footerControl }}
            <tfoot>
                <tr data-bind="template: { name: 'po_gridTF_template', foreach: headers, templateOptions: { vm: $data } }" />
            </tfoot>
            {{/if}}

            {{if pager.enabled() }}
            <tfoot>
                <tr>
                    <th align="left" colspan="${headers().length}" data-bind="template: { name: 'po_gridPager_template',  templateOptions: { vm: $data } }" />
                </tr>
            </tfoot>
            {{/if}}
        </table>
    </script>

    <script type="text/html" id="po_gridTH_template">
        <th data-bind="text: $data" >
        </th>
    </script>	

    <script type="text/html" id="po_gridTR_template">
        <tr data-bind="click: $item.vm.OnClick.bind($item.vm), event: { mouseover: $item.vm.OnMouseIn.bind($item.vm), mouseout: $item.vm.OnMouseOut.bind($item.vm) }, 
        template: { name: 'po_gridTD_template', foreach: $item.columns, templateOptions: { rowData: $data } }"></tr>
    </script>	

    <script type="text/html" id="po_gridTD_template">
        <td data-bind="text: $item.rowData[$data]"></td>
    </script>

    <script type="text/html" id="po_gridTF_template">
        <th data-bind="text: $data">
        </th>
    </script>
    
    <script type="text/html" id="po_gridPager_template">
        <button data-bind="click: $item.vm.OnFirstPage.bind($item.vm)"> << </button> <button data-bind="click: $item.vm.OnPrevPage.bind($item.vm)"><</button> <button data-bind="click: $item.vm.OnNextPage.bind($item.vm)">></button> <button data-bind="click: $item.vm.OnLastPage.bind($item.vm)">>></button> Page ${$item.vm.pager.currentPage()} of ${$item.vm.pager.totalPageCount()}
    </script>    

    */

    var templateEngine = new ko.jqueryTmplTemplateEngine(); //ensure that we are using a jQuery template engine

    // Add our templates as strings
    templateEngine.addTemplate("po_gridTemplate", "<table id=\"poGrid\" class=\"es-grid\" cellspacing=\"0\">{{if headers}}<thead><tr data-bind=\"template: { name: 'po_gridTH_template', foreach: headers, templateOptions: { vm: $data } }\" /></thead>{{/if}}<tbody data-bind=\"template: { name: 'po_gridTR_template', foreach: collection.slice(pager.startingRow(), pager.endingRow()), templateOptions: { columns: columns, vm: $data } }\"></tbody>{{if footerControl }}<tfoot><tr data-bind=\"template: { name: 'po_gridTF_template', foreach: headers, templateOptions: { vm: $data } }\" /></tfoot>{{/if}}{{if pager.enabled() }}<tfoot><tr><th align=\"left\" colspan=\"${headers().length}\" data-bind=\"template: { name: 'po_gridPager_template',  templateOptions: { vm: $data } }\" /></tr></tfoot>{{/if}}</table>");
    templateEngine.addTemplate("po_gridTH_template", "<th data-bind=\"text: $data\" ></th>");
    templateEngine.addTemplate("po_gridTR_template", "<tr data-bind=\"click: $item.vm.OnClick.bind($item.vm), event: { mouseover: $item.vm.OnMouseIn.bind($item.vm), mouseout: $item.vm.OnMouseOut.bind($item.vm) }, template: { name: 'po_gridTD_template', foreach: $item.columns, templateOptions: { rowData: $data } }\"></tr>");
    templateEngine.addTemplate("po_gridTD_template", "<td data-bind=\"text: $item.rowData[$data]\"></td>");
    templateEngine.addTemplate("po_gridPager_template", "<button data-bind=\"click: $item.vm.OnFirstPage.bind($item.vm)\"> << </button> <button data-bind=\"click: $item.vm.OnPrevPage.bind($item.vm)\"><</button> <button data-bind=\"click: $item.vm.OnNextPage.bind($item.vm)\">></button> <button data-bind=\"click: $item.vm.OnLastPage.bind($item.vm)\">>></button> Page ${$item.vm.pager.currentPage()} of ${$item.vm.pager.totalPageCount()}");

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