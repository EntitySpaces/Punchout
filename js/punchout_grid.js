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
				        <button data-bind=\"click: onFirstPage\"> << </button>\
				        <button data-bind=\"click: onPrevPage\">  <  </button>\
				        <button data-bind=\"click: onNextPage\">  >  </button>\
				        <button data-bind=\"click: onLastPage\">  >> </button>\
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

        pagingControl: function (grid) {

            this.colSpan = ko.observable(4);
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


        dataTable: function (data, columns, headers, footers) {
            this.collection = data;
            this.columns = columns;
            this.headers = headers;
            this.footers = footers;
            this.selectedRow = null;
            this.selectedIndex = ko.observable(0);
            this.pager = new po.poGrid.pagingControl(this);
            this.id = 0;

            // Settings
            this.headerEnabled = ko.observable(true);
            this.footerEnabled = ko.observable(false);

            this.showFooterControl = ko.dependentObservable(function () {
                if (this.footerEnabled) return true;
                if (this.pager.enabled) return true;
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

    po.poGrid.dataTable.prototype['onFirstPage'] = function (event) {
        this.pager.currentPage(1);
    };

    po.poGrid.dataTable.prototype['onNextPage'] = function (event) {
        var i = this.pager.currentPage();
        this.pager.currentPage(Math.min(i + 1, this.pager.totalPageCount()));
    };

    po.poGrid.dataTable.prototype['onLastPage'] = function (event) {
        var lastPage = this.pager.totalPageCount();
        this.pager.currentPage(lastPage);
    };

    po.poGrid.dataTable.prototype['onPrevPage'] = function (event) {
        var i = this.pager.currentPage();
        this.pager.currentPage(Math.max(i - 1, 1));
    };

    //create out actual binding
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