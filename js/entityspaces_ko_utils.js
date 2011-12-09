// Punchout JavaScript library v1.0
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

/// <reference path="knockout-latest.debug.js" />
(function (window, undefined) {

    var es = window["es"] = {};

    // Google Closure Compiler helpers (used only to make the minified file smaller)
    es.exportSymbol = function (publicPath, object) {
        var tokens = publicPath.split(".");
        var target = window;
        for (var i = 0; i < tokens.length - 1; i++)
            target = target[tokens[i]];
        target[tokens[tokens.length - 1]] = object;
    };

    es.exportProperty = function (owner, publicName, object) {
        owner[publicName] = object;
    };

    es.dataPager = function (grid, service, method) {

        this.grid = grid;
        this.colSpan = ko.observable(1);
        this.enabled = ko.observable(true);
        this.currentPage = ko.observable(1);
        this.rowsPerPage = ko.observable(10);
        this.totalRowCount = ko.observable(0);

        this.service = service;
        this.method = method;

        this.initialized = false;

        this.pagerRequest = new es.pagerRequest();

        this.init = function () {

            var i, resultSet, data;

            if (this.initialized === true) { return; }

            this.initialized = true;

            resultSet = es.makeRequest(this.service, this.method, ko.toJSON(this.pagerRequest));

            data = es.mapping.fromJS(resultSet.collection);

            this.colSpan(resultSet.columns.length);

            this.pagerRequest = resultSet.pagerRequest;
            this.totalRowCount(resultSet.pagerRequest.totalRows);
            this.grid.columns = ko.observableArray(resultSet.columns);

            // Let's make IsVisible a ko.observable() since it is used in the template to drive
            // the display
            for (i = 0; i < this.grid.columns().length; i += 1) {
                this.grid.columns()[i].isVisible = ko.observable(this.grid.columns()[i].isVisible);
            }

            this.grid.collection(data);
        };

        this.adjustIndex = function (index) {
            return index;
        };

        this.startingRow = ko.dependentObservable(function () {
            return (this.pagerRequest.pageNumber - 1) * this.rowsPerPage();
        }, this);

        this.endingRow = ko.dependentObservable(function () {
            return this.pagerRequest.pageNumber * this.rowsPerPage();
        }, this);

        this.totalPageCount = ko.dependentObservable(function () {
            var lastPage, mod, count = this.totalRowCount();

            if (count > 0) {
                lastPage = Math.round(count / this.rowsPerPage());
                mod = count % this.rowsPerPage();

                if (mod === 0) { return lastPage; }

                if (mod < 5) {
                    lastPage += 1;
                }
                return lastPage;
            }

            return 1;
        }, this);

        this.init();
    };

    es.dataSorter = function (grid) {

        this.grid = grid;

        this.sort = function (column, dir) {

            this.grid.pager.pagerRequest.pageNumber = 1;
            this.grid.pager.pagerRequest.sortCriteria = [];
            this.grid.pager.pagerRequest.sortCriteria[0] = column;
            this.grid.pager.pagerRequest.sortCriteria[1] = dir;

            var resultSet = es.makeRequest(this.grid.pager.service, this.grid.pager.method, ko.toJSON(this.grid.pager.pagerRequest));
            this.grid.pagerRequest = resultSet.pagerRequest;

            data = es.mapping.fromJS(resultSet.collection);

            this.grid.collection(data);

            this.grid.pager.currentPage(1);
        };
    };

    es.pagerRequest = function () {
        this.initialRequest = 1;
        this.totalRows = 0;
        this.pageSize = 10;
        this.pageNumber = 1;
        this.sortCriteria = new Array();
    };

    //---------------------------------------------------
    // Private helper functions
    //---------------------------------------------------
    es.RowStateEnum = {
        invalid: 0,
        unchanged: 2,
        added: 4,
        deleted: 8,
        modified: 16
    };

    function isArray(o) {
        return o.push && o.pop;
    }

    function addPropertyChanged(obj, propertyName) {
        var property = obj[propertyName];
        if (ko.isObservable(property) && !isArray(property)) {

            // This is the actual PropertyChanged event
            property.subscribe(function () {
                if (ko.utils.arrayIndexOf(obj.ModifiedColumns(), propertyName) === -1) {

                    if (propertyName !== "RowState") {
                        obj.ModifiedColumns.push(propertyName);

                        if (obj.RowState() !== es.RowStateEnum.modified && obj.RowState() !== es.RowStateEnum.added) {
                            obj.RowState(es.RowStateEnum.modified);
                        }
                    }
                }
            });
        }
    }

    function injectProperties(entity) {

        var propertyName;

        if (!entity.hasOwnProperty("RowState")) {
            entity.RowState = ko.observable(es.RowStateEnum.added);
            if (entity.hasOwnProperty("__ko_mapping__")) {
                entity.__ko_mapping__.mappedProperties["RowState"] = true;
            }
        }

        if (!entity.hasOwnProperty("ModifiedColumns")) {
            entity.ModifiedColumns = ko.observableArray();
            if (entity.hasOwnProperty("__ko_mapping__")) {
                entity.__ko_mapping__.mappedProperties["ModifiedColumns"] = true;
            }
        }

        for (propertyName in entity) {
            if (propertyName !== 'RowState' && propertyName !== '__type' && propertyName !== 'esExtendedData') {
                addPropertyChanged(entity, propertyName);
            }
        }
    }

    es.toJSON = function (rootObject) {
        var plainJavaScriptObject = es.mapping.toJS(rootObject);
        return ko.utils.stringifyJson(plainJavaScriptObject);
    };

    //---------------------------------------------------
    // Public functions
    //---------------------------------------------------
    (function () {
        es.mapping = {};

        es.mapping.fromJS = function (entity, reentry) {

            var i, ent;
            var ext = undefined;

            if (isArray(entity)) {
                var array;

                if (ko.isObservable(entity)) {
                    array = ko.utils.unwrapObservable(entity);
                } else {
                    array = entity;
                }

                ko.utils.arrayForEach(array, function (e) {
                    es.mapping.fromJS(e, true);
                });
            }

            if (entity.esExtendedData !== undefined) {
                for (i = 0; i < entity.esExtendedData.length; i++) {
                    entity[entity.esExtendedData[i].Key] = entity.esExtendedData[i].Value;
                }

                ext = entity.esExtendedData;
                delete entity.esExtendedData;
            }

            if (ext !== undefined) {

                entity["esExtendedData"] = [];

                for (i = 0; i < ext.length; i++) {
                    entity.esExtendedData.push(ext[i].Key);
                }
            }

            entity = ko.mapping.fromJS(entity);

            if (isArray(entity)) {
                var array;

                if (ko.isObservable(entity)) {
                    array = ko.utils.unwrapObservable(entity);
                } else {
                    array = entity;
                }

                ko.utils.arrayForEach(array, function (e) {
                    injectProperties(e);
                });
            }
            else {
                if (!isArray(entity) && reentry === undefined) {
                    injectProperties(entity);
                }
            }

            return entity;
        };

        es.mapping.toJS = function (entity, reentry) {

            var i;

            if (isArray(entity)) {
                var array;

                if (ko.isObservable(entity)) {
                    array = ko.utils.unwrapObservable(entity);
                } else {
                    array = entity;
                }

                ko.utils.arrayForEach(array, function (e) {
                    es.mapping.toJS(e, true);
                });
            }

            entity = ko.mapping.toJS(entity);

            if (isArray(entity)) {
                var array;

                if (ko.isObservable(entity)) {
                    array = ko.utils.unwrapObservable(entity);
                } else {
                    array = entity;
                }

                ko.utils.arrayForEach(array, function (e) {
                    if (e.esExtendedData !== undefined) {
                        for (i = 0; i < e.esExtendedData.length; i++) {
                            delete e[e.esExtendedData[i]];
                        }
                        delete e.esExtendedData;
                    }
                });
            }
            else {
                if (!isArray(entity) && reentry === undefined) {
                    if (entity.esExtendedData !== undefined) {
                        for (i = 0; i < entity.esExtendedData.length; i++) {
                            delete entity[entity.esExtendedData[i]];
                        }
                        delete entity.esExtendedData;
                    }
                }
            }

            return entity;
        };

    })();

    es.markAsDeleted = function (entity) {

        if (!entity.hasOwnProperty("RowState")) {
            entity.RowState = ko.observable(es.RowStateEnum.deleted);
        } else if (entity.RowState() !== es.RowStateEnum.deleted) {
            entity.RowState(es.RowStateEnum.deleted);
        }

        if (entity.hasOwnProperty("ModifiedColumns")) {
            entity.ModifiedColumns.removeAll();
        }
    };

    es.markAllAsDeleted = function (collection) {

        var i, entity;

        for (i = 0; i < collection().length; i += 1) {
            entity = collection()[i];
            es.markAsDeleted(entity);
        }
    };

    es.getDirtyEntities = function (collection) {
        var index = 0, modifiedRecords = [];

        ko.utils.arrayFirst(collection(), function (entity) {
            if (entity.RowState() !== es.RowStateEnum.unchanged) {
                modifiedRecords.push(entity);
            }
        });

        if (modifiedRecords.length === 0) { return null; }

        return modifiedRecords;
    };

    es.makeRequstError = null;

    es.makeRequest = function (url, methodName, params) {
        var theData = null, path = null, xmlHttp;

        es.getDataError = null;

        // Create HTTP request
        try {
            xmlHttp = new XMLHttpRequest();
        } catch (e1) {
            try {
                xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e2) {
                try {
                    xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e3) {
                    alert("This sample only works in browsers with AJAX support");
                    return false;
                }
            }
        }

        // Build the operation URL
        path = url + methodName;

        // Make the HTTP request
        xmlHttp.open("POST", path, false);
        xmlHttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
        xmlHttp.send(params);

        if (xmlHttp.status === 200) {
            if (xmlHttp.responseText !== '{}' && xmlHttp.responseText !== "") {
                theData = JSON.parse(xmlHttp.responseText);
            }
        } else {
            es.makeRequstError = xmlHttp.responseText;
        }

        return theData;
    };

    //-------------------------------------
    // Paging Prototypes
    //-------------------------------------	
    es.dataPager.prototype.onFirstPage = function (event) {

        this.pagerRequest.pageNumber = 1;
        this.fetchData();
    };

    es.dataPager.prototype.onNextPage = function (event) {

        this.pagerRequest.pageNumber = Math.min(this.pagerRequest.pageNumber + 1, this.totalPageCount());
        this.fetchData();
    };

    es.dataPager.prototype.onLastPage = function (event) {

        this.pagerRequest.pageNumber = this.totalPageCount();
        this.fetchData();
    };

    es.dataPager.prototype.onPrevPage = function (event) {

        this.pagerRequest.pageNumber = Math.max(this.pagerRequest.pageNumber - 1, 1);
        this.fetchData();
    };

    es.dataPager.prototype.fetchData = function () {

        var resultSet, data;

        this.pagerRequest.pageSize = this.rowsPerPage();
        resultSet = es.makeRequest(this.service, this.method, ko.toJSON(this.pagerRequest));
        this.pagerRequest = resultSet.pagerRequest;

        this.totalRowCount(resultSet.pagerRequest.totalRows);
        this.currentPage(this.pagerRequest.pageNumber);

        // This checks to see if a delete means we have less pages
        if (this.currentPage() > this.totalPageCount()) {
            this.pagerRequest.pageNumber = this.totalPageCount();
            this.fetchData();
            return;
        }

        data = es.mapping.fromJS(resultSet.collection);
        this.grid.collection(data);

        this.grid.selectedIndex(0);
    };

    //---------------------------------------------------
    // Exported functions
    //---------------------------------------------------
    es.exportSymbol('es.makeRequest', es.makeRequest);
    es.exportSymbol('es.makeRequstError', es.makeRequstError);
    es.exportSymbol('es.trackStateMapping', es.trackStateMapping);
    es.exportSymbol('es.trackState', es.trackState);
    es.exportSymbol('es.markAsDeleted', es.markAsDeleted);
    es.exportSymbol('es.markAllAsDeleted', es.markAllAsDeleted);
    es.exportSymbol('es.RowStateEnum', es.RowStateEnum);

})(window);