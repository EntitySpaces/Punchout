// Punchout JavaScript library v1.0
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function (po) {

    var gridHTML = "\
        <table id=\"poTable\" class=\"es-grid\" cellspacing=\"0\">\
            <thead data-bind=\"if: headerEnabled()\">\
                <tr data-bind=\"foreach: columns\">\
                    <!-- ko if: $data.IsVisible -->\
                    <th data-bind=\"text: $data.DisplayName, event: {click: $parent.onSort.bind($parent)}\">\
                    </th>\
                    <!-- /ko -->\
                </tr>\
            </thead>\
            <tfoot data-bind=\"if: showFooterControl\">\
                <!-- ko if: footerEnabled -->\
                <tr data-bind=\"foreach: columns\">\
                    <!-- ko if: $data.IsVisible -->\
                    <td data-bind=\"text: $data.FooterValue\">\
                    </td>\
                    <!-- /ko -->\
                </tr>\
                <!-- /ko -->\
                <tr data-bind=\"if: pager.enabled()\">\
                    <td data-bind=\"attr: { colspan: pager.colSpan }\" nowrap=\"nowrap\">\
                        <button data-bind=\"click: pager.onFirstPage.bind(pager)\"> << </button>\
                        <button data-bind=\"click: pager.onPrevPage.bind(pager)\">  <  </button>\
                        <button data-bind=\"click: pager.onNextPage.bind(pager)\">  >  </button>\
                        <button data-bind=\"click: pager.onLastPage.bind(pager)\">  >> </button>\
                        Page <em data-bind=\"text: pager.currentPage()\"></em> of <em data-bind=\"text: pager.totalPageCount()\"></em>\
                    </td>\
                </tr>\
            </tfoot>\
            <tbody data-bind=\"foreach: collection.slice(pager.startingRow(), pager.endingRow())\">\
                <tr data-bind=\"foreach: $parent.columns, event: { mouseover: $parent.onMouseIn.bind($parent),  mouseout: $parent.onMouseOut.bind($parent), click: $parent.onClick.bind($parent) }\">\
                    <!-- ko if: $data.IsVisible -->\
                    <td data-bind=\"text: $parent[$data.PropertyName]\">\
                    </td>\
                    <!-- /ko -->\
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

            this.initPager = function () {
                this.colSpan(this.grid.columns().length);
            };

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

                if (count > 0) {
                    var lastPage = Math.round(count / this.rowsPerPage());
                    var mod = count % this.rowsPerPage();

                    if (mod === 0) { return lastPage; }

                    if (mod < 5) {
                        lastPage += 1;
                    }
                    return lastPage;
                }

                return 1;
            }, this);
        },


        dataTable: function (data, columns) {
            var i;

            this.collection = data;
            this.columns = columns;
            this.selectedRow = null;
            this.selectedIndex = ko.observable(0);
            this.id = 0;

            this.pager = null;

            // Let's make IsVisible a ko.observable() since it is used in the template to drive 
            // the display
            for (i = 0; i < this.columns().length; i += 1) {
                this.columns()[i].IsVisible = ko.observable(this.columns()[i].IsVisible);
            }

            // Settings
            this.headerEnabled = ko.observable(true);
            this.footerEnabled = ko.observable(false);

            this.showFooterControl = ko.dependentObservable(function () {
                if (this.footerEnabled) { return true; }
                if (this.pager.enabled) { return true; }
                return false;
            }, this);

            this.findParentRow = function (element) {
                if (element.tagName === "TR") {
                    return element;
                }
                return this.findParentRow(element.parentNode);
            };
        }
    };

    //-------------------------------------
    // DataTable Prototypes
    //-------------------------------------	
    po.poGrid.dataTable.prototype.onMouseIn = function (event) {
        var tableRow = this.findParentRow(event.target.parentNode);
        if (tableRow.style.backgroundColor === 'lightblue') {
            return;
        }
        tableRow.style.backgroundColor = '#dcfac9';
    };

    po.poGrid.dataTable.prototype.onMouseOut = function (event) {
        var tableRow = this.findParentRow(event.target.parentNode);
        if (tableRow.style.backgroundColor === 'lightblue') {
            return;
        }
        tableRow.style.backgroundColor = 'white';
    };

    po.poGrid.dataTable.prototype.onClick = function (event) {
        if (this.selectedRow !== null) {
            this.selectedRow.style.backgroundColor = 'white';
        }
        var tableRow = this.findParentRow(event.target.parentNode);
        tableRow.style.backgroundColor = 'lightblue';

        this.selectedRow = tableRow;
    };

    po.poGrid.dataTable.prototype.onSort = function (event) {
        var current, i, th, tds;

        if (event.target.poOrig === undefined) {
            event.target.poOrig = event.target.textContent;
            event.target.poDir = 'd';
        }

        current = event.target.poDir;

        tds = event.target.parentNode.getElementsByTagName('th');
        for (i = 0; i < tds.length; i += 1) {
            th = tds[i];
            if (th.poOrig !== undefined) {
                th.innerHTML = th.poOrig;
            }
        }

        if (event.target.poDir === 'u') {
            event.target.poDir = 'd';
            event.target.innerHTML = event.target.poOrig + '&nbsp;&#x25B4';
        } else {
            event.target.poDir = 'u';
            event.target.innerHTML = event.target.poOrig + '&nbsp;&#x25BE';
        }
    };

    //-------------------------------------
    // Paging Prototypes
    //-------------------------------------	
    po.poGrid.dataPager.prototype.onFirstPage = function (event) {
        this.currentPage(1);
    };

    po.poGrid.dataPager.prototype.onNextPage = function (event) {
        var i = this.currentPage();
        this.currentPage(Math.min(i + 1, this.totalPageCount()));
    };

    po.poGrid.dataPager.prototype.onLastPage = function (event) {
        var lastPage = this.totalPageCount();
        this.currentPage(lastPage);
    };

    po.poGrid.dataPager.prototype.onPrevPage = function (event) {
        var i = this.currentPage();
        this.currentPage(Math.max(i - 1, 1));
    };

    //-------------------------------------
    // Create out actual binding
    //-------------------------------------	
    ko.bindingHandlers.poGrid = {

        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            // Add our Grid under the <div>
            element.innerHTML = gridHTML;

            viewModel.myView1.pager.initPager();
            viewModel.myView2.pager.initPager();

            return ko.bindingHandlers['with'].init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        },

        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            return ko.bindingHandlers['with'].update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        }
    };

})(window.po = window.po || {});