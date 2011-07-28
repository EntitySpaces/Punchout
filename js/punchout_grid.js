// Punchout JavaScript library v1.0
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

/// <reference path="knockout-1.2.1.debug.js" />
(function () {
    po = {};

    po.PagingControl = function (viewModel) {
        var pgctrl = this;

        pgctrl.enabled = ko.observable(true);
        pgctrl.grid = viewModel; // references parent
        pgctrl.totalPageCount = ko.observable(0);
        pgctrl.currentPage = ko.observable(1);
        pgctrl.rowsPerPage = ko.observable(10);

        pgctrl.startingRow = ko.dependentObservable(function () {
            return (pgctrl.currentPage() - 1) * pgctrl.rowsPerPage();
        }, pgctrl);

        pgctrl.endingRow = ko.dependentObservable(function () {
            return pgctrl.currentPage() * pgctrl.rowsPerPage();
        }, pgctrl);

        pgctrl.totalRowCount = ko.dependentObservable(function () {
            return pgctrl.grid.collection().length;
        }, pgctrl);

        pgctrl.totalPageCount = ko.dependentObservable(function () {
            var count = pgctrl.grid.collection().length;
            var lastPage = Math.round(count / pgctrl.rowsPerPage());
            if ((count % pgctrl.rowsPerPage()) > 0) {
                lastPage += 1;
            }
            return lastPage;
        }, pgctrl);


    };

    po.PunchoutGrid = function () {
        //private variables        
        var self = this;
        
        //public properties
        self.collection = ko.observableArray([]);
        self.columns = [];
        self.footerControl = false;
        self.headers = [];
        self.selectedRow = null;
        self.selectedIndex = ko.observable(0);
        self.pager = new po.PagingControl(self);

        //private functions
        var findParentRow = function (element) {
            var val;
            val = $(element).closest('TR'); // a little jQuery love
            if (val[0]) {
                return val[0]; //return the first element in the matched set
            } else {
                return null;
            }
        }

        //public functions
        self.onMouseIn = function (event) {
            var tableRow = findParentRow(event.target.parentNode);
            if (tableRow.style.backgroundColor == 'lightblue') {
                return;
            }
            tableRow.style.backgroundColor = '#dcfac9';
        };

        self.onMouseOut = function (event) {
            var tableRow = findParentRow(event.target.parentNode);
            if (tableRow.style.backgroundColor == 'lightblue') {
                return;
            }
            tableRow.style.backgroundColor = 'white';
        };

        self.onClick = function (event) {
            if (self.selectedRow != null) {
                self.selectedRow.style.backgroundColor = 'white';
            }
            var tableRow = findParentRow(event.target.parentNode);
            tableRow.style.backgroundColor = 'lightblue';

            self.selectedRow = tableRow;
        }

        self.onFirstPage = function (event) {
            self.pager.currentPage(1);
        }

        self.onNextPage = function (event) {
            var i = self.pager.currentPage();
            self.pager.currentPage(Math.min(i + 1, self.pager.totalPageCount()));
        }

        self.onLastPage = function (event) {
            var lastPage = self.pager.totalPageCount();
            self.pager.currentPage(lastPage);
        }

        self.onPrevPage = function (event) {
            var i = self.pager.currentPage();
            self.pager.currentPage(Math.max(i - 1, 1));
        }

    };
})();
    /* 
    =================================
    PULL OUT FOR INLINE TESTING
    =================================
    */
    /*
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
    //templateEngine.addTemplate($("#po_gridTemplate").html);//, "<table id=\"poGrid\" class=\"es-grid\" cellspacing=\"0\">{{if headers}}<thead><tr data-bind=\"template: { name: 'po_gridTH_template', foreach: headers, templateOptions: { vm: $data } }\" /></thead>{{/if}}<tbody data-bind=\"template: { name: 'po_gridTR_template', foreach: collection.slice(pager.startingRow(), pager.endingRow()), templateOptions: { columns: columns, vm: $data } }\"></tbody>{{if footerControl }}<tfoot><tr data-bind=\"template: { name: 'po_gridTF_template', foreach: headers, templateOptions: { vm: $data } }\" /></tfoot>{{/if}}{{if pager.enabled() }}<tfoot><tr><th align=\"left\" colspan=\"${headers().length}\" data-bind=\"template: { name: 'po_gridPager_template',  templateOptions: { vm: $data } }\" /></tr></tfoot>{{/if}}</table>");
    //templateEngine.addTemplate("po_gridTH_template", "<th data-bind=\"text: $data\" ></th>");
    //templateEngine.addTemplate("po_gridTR_template", "<tr data-bind=\"click: $item.vm.OnClick.bind($item.vm), event: { mouseover: $item.vm.OnMouseIn.bind($item.vm), mouseout: $item.vm.OnMouseOut.bind($item.vm) }, template: { name: 'po_gridTD_template', foreach: $item.columns, templateOptions: { rowData: $data } }\"></tr>");
    //templateEngine.addTemplate("po_gridTD_template", "<td data-bind=\"text: $item.rowData[$data]\"></td>");
    //templateEngine.addTemplate("po_gridPager_template", "<button data-bind=\"click: $item.vm.OnFirstPage.bind($item.vm)\"> << </button> <button data-bind=\"click: $item.vm.OnPrevPage.bind($item.vm)\"><</button> <button data-bind=\"click: $item.vm.OnNextPage.bind($item.vm)\">></button> <button data-bind=\"click: $item.vm.OnLastPage.bind($item.vm)\">>></button> Page ${$item.vm.pager.currentPage()} of ${$item.vm.pager.totalPageCount()}");

    //create out actual binding
    ko.bindingHandlers.poGrid = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var theGrid,
                values;

            values = valueAccessor();

            //TODO: most of this could be cleaned up, but i'm proofing the concept
            theGrid = new po.PunchoutGrid();
            //theGrid.viewModel = new po.GridViewModel();

            theGrid.collection = values.items;
            theGrid.columns = values.columns;
            theGrid.headers = values.headers;
            theGrid.pager.enabled(values.pager);

            element['poGrid'] = theGrid;
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var theGrid

            if (element['poGrid']) {

                theGrid = element['poGrid'];
                // Empty the element
                while (element.firstChild) {
                    ko.removeNode(element.firstChild);
                }

                // Render the main grid
                var gridContainer = element.appendChild(document.createElement("DIV"));
                ko.renderTemplate("po_gridTemplate", theGrid, {
                    templateEngine: templateEngine
                }, gridContainer, "replaceNode");

            }
        }
    };
