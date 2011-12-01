// Punchout JavaScript library v1.0
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function (po) {

    var gridHTML = "\
        <table id=\"poTable" + 1 + "\" class=\"es-grid\" cellspacing=\"0\">\
            <thead data-bind=\"if: headerEnabled()\">\
                <tr data-bind=\"foreach: headers\">\
                    <th data-bind=\"text: $data\">\
                    </th>\
                </tr>\
            </thead>\
            <tfoot data-bind=\"if: showFooterControl\">\
                <!-- ko if: footerEnabled -->\
                <tr data-bind=\"foreach: footers\">\
                    <td data-bind=\"text: $data\">\
                    </td>\
                </tr>\
                <!-- /ko -->\
                <tr data-bind=\"if: pager.enabled()\">\
                    <td data-bind=\"attr: { colspan: headers().length }\" nowrap=\"nowrap\">\
                        <button data-bind=\"click: pager.onFirstPage\"> << </button>\
                        <button data-bind=\"click: pager.onPrevPage\">  <  </button>\
                        <button data-bind=\"click: pager.onNextPage\">  >  </button>\
                        <button data-bind=\"click: pager.onLastPage\">  >> </button>\
                        Page <em data-bind=\"text: pager.currentPage()\"></em> of <em data-bind=\"text: pager.totalPageCount()\"></em>\
                    </td>\
                </tr>\
            </tfoot>\
            <tbody data-bind=\"foreach: collection.slice(pager.startingRow(), pager.endingRow())\">\
                <tr data-bind=\"foreach: $parent.columns, event: { mouseover: $parent.onMouseIn.bind($parent),  mouseout: $parent.onMouseOut.bind($parent), click: $parent.onClick.bind($parent) }\">\
                    <td data-bind=\"text: $parent[$data]\">\
                    </td>\
                </tr>\
            </tbody>\
        </table>";

    po.poGrid = {

        //-----------------------------------------------------------------------------
        // Default Built in Client Paging Control for when all data is on the client
        //-----------------------------------------------------------------------------
        dataPager: function (grid) {

            this.grid = grid;
            this.colSpan = ko.observable(1);
            this.enabled = ko.observable(true);
            this.currentPage = ko.observable(1);
            this.rowsPerPage = ko.observable(10);

            //-------------------------------------
            // The four Magic Functions
            //-------------------------------------
            this.firstPage = function (element) {
                this.currentPage(1);
            }

            this.nextPage = function (element) {
                var i = this.currentPage();
                this.currentPage(Math.min(i + 1, this.totalPageCount()));
            }

            this.lastPage = function (element) {
                var lastPage = this.totalPageCount();
                this.currentPage(lastPage);
            }

            this.prevPage = function (element) {
                var i = this.currentPage();
                this.currentPage(Math.max(i - 1, 1));
            }

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


        dataTable: function (data, columns, headers, footers) {
            this.collection = data;
            this.columns = columns;
            this.headers = headers;
            this.footers = footers;
            this.selectedRow = null;
            this.selectedIndex = ko.observable(0);
            this.id = 0;

            this.pager = null;

            this.name = "The Datatable";

            // Settings
            this.headerEnabled = ko.observable(true);
            this.footerEnabled = ko.observable(false);

            this.showFooterControl = ko.dependentObservable(function () {
                if (this.footerEnabled) return true;
                // if (this.pager.enabled) return true;
                return false;
            }, this);

            findParentRow = function (element) {
                if (element.tagName === "TR") {
                    return element;
                }
                return this.findParentRow(element.parentNode);
            }
        }
    };

    //-------------------------------------
    // DataTable Prototypes
    //-------------------------------------	
    po.poGrid.dataTable.prototype['onMouseIn'] = function (event) {
        var tableRow = findParentRow(event.target.parentNode);
        if (tableRow.style.backgroundColor == 'lightblue') {
            return;
        }
        tableRow.style.backgroundColor = '#dcfac9';
    };

    po.poGrid.dataTable.prototype['onMouseOut'] = function (event) {
        var tableRow = findParentRow(event.target.parentNode);
        if (tableRow.style.backgroundColor == 'lightblue') {
            return;
        }
        tableRow.style.backgroundColor = 'white';
    };

    po.poGrid.dataTable.prototype['onClick'] = function (event) {
        if (this.selectedRow != null) {
            this.selectedRow.style.backgroundColor = 'white';
        }
        var tableRow = findParentRow(event.target.parentNode);
        tableRow.style.backgroundColor = 'lightblue';

        this.selectedRow = tableRow;
    };

    //-------------------------------------
    // Paging Prototypes
    //-------------------------------------	
    po.poGrid.dataPager.prototype['onFirstPage'] = function (event) {
        this.pager.firstPage(event);
    };

    po.poGrid.dataPager.prototype['onNextPage'] = function (event) {
        this.pager.nextPage(event);
    };

    po.poGrid.dataPager.prototype['onLastPage'] = function (event) {
        this.pager.lastPage(event);
    };

    po.poGrid.dataPager.prototype['onPrevPage'] = function (event) {
        this.pager.prevPage(event);
    };

    //-------------------------------------
    // Create out actual binding
    //-------------------------------------	
    ko.bindingHandlers.poGrid = {

        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            // Add our Grid under the <div>
            element.innerHTML = gridHTML;

            return ko.bindingHandlers['with'].init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        },

        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return ko.bindingHandlers['with'].update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        }
    };

})(window.po = window.po || {});