﻿// Punchout JavaScript library v1.0
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

/// <reference path="knockout-latest.debug.jss" />
(function () {
    po = {};

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

        viewModel: function (data, columns, headers, footers) {
            this.collection = data;
            this.columns = columns;
            this.headers = headers;
            this.footers = footers;
            this.selectedRow = null;
            this.selectedIndex = ko.observable(0);
            this.pager = new po.poGrid.pagingControl(this);

            // Settings
            this.headerEnabled = ko.observable(true);
            this.footerEnabled = ko.observable(false);

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

    <script type="text/html" id="poGrid"> 
        <table id="poGrid" class="es-grid" cellspacing="0">
            <thead data-bind="if: headerEnabled()">
                <tr data-bind="foreach: headers">
                    <th data-bind="text: $data" >
                    </th>
                </tr>
            </thead>

            <tbody data-bind="foreach: collection.slice(pager.startingRow(), pager.endingRow())">
                <tr data-bind="foreach: $root.columns, event: { mouseover: $root.OnMouseIn.bind($parent),  mouseout: $root.OnMouseOut.bind($parent), click: $root.OnClick.bind($root) }">
                    <td data-bind="text: $parent[$data]">
                    </td>
                </tr>
            </tbody>

            <tfoot data-bind="if: footerEnabled()">
                <tr data-bind="foreach: footers" >
                    <td data-bind="text: $data">
                    </td>
                </tr>

                <tr data-bind="if: pager.enabled()">
                    <td data-bind="attr: { colspan: headers().length }" nowrap="nowrap">
                        <button data-bind="click: $root.OnFirstPage.bind($root)"> << </button> 
                        <button data-bind="click: $root.OnPrevPage.bind($root)"> < </button>
                        <button data-bind="click: $root.OnNextPage.bind($root)"> > </button>
                        <button data-bind="click: $root.OnLastPage.bind($root)"> >> </button>
                        Page <em data-bind="text: $root.pager.currentPage()" ></em> of 
                        <em data-bind="text: $root.pager.totalPageCount()"></em>
                    </td>
                </tr>
            </tfoot>
        </table>
    </script>

    */

    var templateEngine = new ko.nativeTemplateEngine();

    templateEngine.addTemplate = function () {
        document.write("poGrid", "<script type=\"text/html\" id=\"poGrid\"> <table id=\"poGrid\" class=\"es-grid\" cellspacing=\"0\"> <thead data-bind=\"if: headerEnabled()\"> <tr data-bind=\"foreach: headers\"> <th data-bind=\"text: $data\" > </th> </tr> </thead> <tbody data-bind=\"foreach: collection.slice(pager.startingRow(), pager.endingRow())\"> <tr data-bind=\"foreach: $root.columns, event: { mouseover: $root.OnMouseIn.bind($parent), mouseout: $root.OnMouseOut.bind($parent), click: $root.OnClick.bind($root) }\"> <td data-bind=\"text: $parent[$data]\"> </td> </tr> </tbody> <tfoot data-bind=\"if: footerEnabled()\"> <tr data-bind=\"foreach: footers\" > <td data-bind=\"text: $data\"> </td> </tr> <tr data-bind=\"if: pager.enabled()\"> <td data-bind=\"attr: { colspan: headers().length }\" nowrap=\"nowrap\"> <button data-bind=\"click: $root.OnFirstPage.bind($root)\"> << </button> <button data-bind=\"click: $root.OnPrevPage.bind($root)\"> < </button> <button data-bind=\"click: $root.OnNextPage.bind($root)\"> > </button> <button data-bind=\"click: $root.OnLastPage.bind($root)\"> >> </button>Page <em data-bind=\"text: $root.pager.currentPage()\" ></em> of <em data-bind=\"text: $root.pager.totalPageCount()\"></em> </td> </tr> </tfoot> </table></script>");
    };

    templateEngine.addTemplate();

    //create out actual binding
    ko.bindingHandlers.poGrid = {
        init: function () {
            return { 'controlsDescendantBindings': true };
        },
        update: function (element, viewModelAccessor) {
            var viewModel = viewModelAccessor();
            // Empty the element
            while (element.firstChild) {
                ko.removeNode(element.firstChild);
            }

            // Render the main grid
            var gridContainer = element.appendChild(document.createElement("DIV"));
            ko.renderTemplate("poGrid", viewModel, { templateEngine: templateEngine }, gridContainer, "replaceNode");
        }
    };
})();
