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

    //---------------------------------------------------
    // Public functions
    //---------------------------------------------------
    (function () {
        es.mapping = {};

        es.mapping.fromJS = function (entity) {

            entity = ko.mapping.fromJS(entity);

            es.mapping.visitModel(entity, function (obj) {

                if (obj.hasOwnProperty("RowState") && ko.isObservable(obj.RowState)) {
                    injectProperties(obj);
                    setupExtendedColumns(obj);
                }

                return obj
            });

            return entity;
        };

        es.mapping.toJS = function (entity, reentry) {

            entity = ko.mapping.toJS(entity);

            es.mapping.visitModel(entity, function (obj) {
                
                if (obj.esExtendedData !== undefined) {
                    for (i = 0; i < obj.esExtendedData.length; i++) {
                        delete obj[obj.esExtendedData[i]];
                    }
                    delete obj.esExtendedData;
                }

                return obj
            });

            return entity;
        }

        es.mapping.visitModel = function (rootObject, callback, options) {
            options = options || {};
            options.visitedObjects = options.visitedObjects || new objectLookup();

            var mappedRootObject;
            var unwrappedRootObject = ko.utils.unwrapObservable(rootObject);
            if (!canHaveProperties(unwrappedRootObject)) {
                return callback(rootObject);
            } else {
                // Only do a callback, but ignore the results
                callback(rootObject);
                mappedRootObject = unwrappedRootObject instanceof Array ? [] : {};
            }

            visitPropertiesOrArrayEntries(unwrappedRootObject, function (indexer) {
                if (options.ignore && ko.utils.arrayIndexOf(options.ignore, indexer) != -1) return;

                if (options.include && ko.utils.arrayIndexOf(options.include, indexer) === -1) {
                    // The mapped properties object contains all the properties that were part of the original object.
                    // If a property does not exist, and it is not because it is part of an array (e.g. "myProp[3]"), then it should not be unmapped.
                    if (unwrappedRootObject[mappingProperty] && unwrappedRootObject[mappingProperty].mappedProperties && !unwrappedRootObject[mappingProperty].mappedProperties[indexer] && !(unwrappedRootObject instanceof Array)) {
                        return;
                    }
                }

                var propertyValue = unwrappedRootObject[indexer];
                switch (getType(ko.utils.unwrapObservable(propertyValue))) {
                    case "object":
                    case "undefined":
                        var previouslyMappedValue = options.visitedObjects.get(propertyValue);
                        mappedRootObject[indexer] = (getType(previouslyMappedValue) !== "undefined") ? previouslyMappedValue : es.mapping.visitModel(propertyValue, callback, options);
                        break;
                }
            });

            return mappedRootObject;
        }

        function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
            if (rootObject instanceof Array) {
                for (var i = 0; i < rootObject.length; i++)
                    visitorCallback(i);
            } else {
                for (var propertyName in rootObject)
                    visitorCallback(propertyName);
            }
        };

        function canHaveProperties(object) {
            var type = getType(object);
            return (type == "object") && (object !== null) && (type !== "undefined");
        }

        function objectLookup() {
            var keys = [];
            var values = [];
            this.save = function (key, value) {
                var existingIndex = ko.utils.arrayIndexOf(keys, key);
                if (existingIndex >= 0) values[existingIndex] = value;
                else {
                    keys.push(key);
                    values.push(value);
                }
            };
            this.get = function (key) {
                var existingIndex = ko.utils.arrayIndexOf(keys, key);
                return (existingIndex >= 0) ? values[existingIndex] : undefined;
            };
        };

        function getType(x) {
            if ((x) && (typeof (x) === "object") && (x.constructor == (new Date).constructor)) return "date";
            return typeof x;
        }

        function addPropertyChanged(obj, propertyName) {
            var property = obj[propertyName];
            if (ko.isObservable(property) && !(property instanceof Array)) {

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
                if (propertyName !== 'RowState' && propertyName !== "ModifiedColumns" && propertyName !== '__type' && propertyName !== 'esExtendedData') {
                    addPropertyChanged(entity, propertyName);
                }
            }
        }

        function setupExtendedColumns(entity) {

            var data = undefined;

            if (entity.esExtendedData !== undefined) {

                data = ko.isObservable(entity.esExtendedData) ? entity.esExtendedData() : entity.esExtendedData;

                for (i = 0; i < data.length; i++) {
                    entity[data[i].Key()] = ko.observable(data[i].Value());

                    if (entity.hasOwnProperty("__ko_mapping__")) {
                        entity.__ko_mapping__.mappedProperties[data[i].Key()] = true;
                    }
                }

                ext = entity.esExtendedData();
                delete entity.esExtendedData;
            }

            if (data !== undefined) {

                entity["esExtendedData"] = [];

                for (i = 0; i < data.length; i++) {
                    entity.esExtendedData.push(data[i].Key());
                }
            }
        }

        function teardownExtendedColumns(entity) {

            if (entity.esExtendedData !== undefined) {
                for (i = 0; i < entity.esExtendedData.length; i++) {
                    delete entity[entity.esExtendedData[i]];
                }
                delete entity.esExtendedData;
            }
        }

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