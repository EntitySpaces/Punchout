// Punchout JavaScript library v1.0
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

/// <reference path="knockout-latest.debug.js" />
(function (es) {

    es.dataPager = function (grid) {

        this.grid = grid;
        this.colSpan = ko.observable(1);
        this.enabled = ko.observable(true);
        this.currentPage = ko.observable(1);
        this.rowsPerPage = ko.observable(10);
        this.totalRowCount = ko.observable(0);

        this.service = "";
        this.method = "";

        this.initialized = false;

        this.pagerRequest = new es.pagerRequest();

        this.initPager = function () {

            var i;

            if (this.initialized === true) { return; }

            this.initialized = true;

            this.pagerRequest.initialRequest = 1;
            this.pagerRequest.totalRows = 0;
            this.pagerRequest.pageSize = 10;
            this.pagerRequest.pageNumber = 1;

            var resultSet = es.makeRequest(this.service, this.method, ko.toJSON(this.pagerRequest));

            // Let's make IsVisible a ko.observable() since it is used in the template to drive 
            // the display
            for (i = 0; i < resultSet.Columns.length; i += 1) {
                resultSet.Columns[i].IsVisible = ko.observable(resultSet.Columns[i].IsVisible);
            }

            this.colSpan(resultSet.Columns.length);

            this.pagerRequest = resultSet.pagerRequest;
            this.totalRowCount(resultSet.pagerRequest.totalRows);
            this.grid.columns = ko.observableArray(resultSet.Columns);

            // Let's make IsVisible a ko.observable() since it is used in the template to drive 
            // the display
            for (i = 0; i < grid.columns().length; i += 1) {
                grid.columns()[i].IsVisible = ko.observable(grid.columns()[i].IsVisible);
            }

            this.grid.collection(ko.observableArray(resultSet.Collection));
        };

        this.startingRow = ko.dependentObservable(function () {
            return (this.pagerRequest.pageNumber - 1) * this.rowsPerPage();
        }, this);

        this.endingRow = ko.dependentObservable(function () {
            return this.pagerRequest.pageNumber * this.rowsPerPage();
        }, this);

        this.totalPageCount = ko.dependentObservable(function () {
            var count = this.totalRowCount();

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
    };

    es.pagerRequest = function () {
        this.initialRequest = 1;
        this.totalRows = 0;
        this.pageSize = 10;
        this.pageNumber = 1;
    };

    // Google Closure Compiler helpers (used only to make the minified file smaller)
    es.exportSymbol = function (publicPath, object) {
        var tokens, target, i;

        tokens = publicPath.split(".");
        target = window;

        for (i = 0; i < tokens.length - 1; i += 1) {
            target = target[tokens[i]];
        }
        target[tokens[tokens.length - 1]] = object;
    };

    es.exportProperty = function (owner, publicName, object) {
        owner[publicName] = object;
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
            if (propertyName !== "RowState") {
                this.addPropertyChanged(entity, propertyName);
            }
        }
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

    //---------------------------------------------------
    // Public functions
    //---------------------------------------------------
    es.trackState = function (entity) {

        if (isArray(entity)) {
            var array;

            if (ko.isObservable(entity)) {
                array = ko.utils.unwrapObservable(entity);
            } else {
                array = entity;
            }

            ko.utils.arrayForEach(array, function (e) {
                es.trackState(e);
            });

        }

        injectProperties(entity);

        return entity;
    };

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
        var modifiedRecords = {};
        var index = 0;

        ko.utils.arrayFirst(collection(), function (entity) {
            if (entity.RowState() !== es.RowStateEnum.unchanged) {
                modifiedRecords[index++] = entity;
            }
        });

        if (modifiedRecords.length === 0) { return null; }

        return modifiedRecords;
    };

    es.trackStateMapping = {
        '': {
            create: function (options) {
                var obj = ko.mapping.fromJS(options.data);
                return es.trackState(obj);
            }
        }
    };

    es.makeRequstError = null;

    es.makeRequest = function (url, methodName, params) {
        var theData = null;
        var path = null;
        es.getDataError = null;

        // Create HTTP request
        var xmlHttp;
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
        var resultSet = es.makeRequest(this.service, this.method, ko.toJSON(this.pagerRequest));
        this.pagerRequest = resultSet.pagerRequest;
        this.grid.collection(ko.observableArray(resultSet.Collection));

        this.currentPage(1);
    };

    es.dataPager.prototype.onNextPage = function (event) {

        var i = Math.min(this.pagerRequest.pageNumber + 1, this.totalPageCount());

        this.pagerRequest.pageNumber = i;
        var resultSet = es.makeRequest(this.service, this.method, ko.toJSON(this.pagerRequest));
        this.pagerRequest = resultSet.pagerRequest;
        this.grid.collection(ko.observableArray(resultSet.Collection));

        this.currentPage(i);
    };

    es.dataPager.prototype.onLastPage = function (event) {

        this.pagerRequest.pageNumber = this.totalPageCount();
        var resultSet = es.makeRequest(this.service, this.method, ko.toJSON(this.pagerRequest));
        this.pagerRequest = resultSet.pagerRequest;
        this.grid.collection(ko.observableArray(resultSet.Collection));

        this.currentPage(this.pagerRequest.pageNumber);
    };

    es.dataPager.prototype.onPrevPage = function (event) {

        var i = this.currentPage();
        i = Math.max(this.pagerRequest.pageNumber - 1, 1);

        this.pagerRequest.pageNumber = i;
        var resultSet = es.makeRequest(this.service, this.method, ko.toJSON(this.pagerRequest));
        this.pagerRequest = resultSet.pagerRequest;
        this.grid.collection(ko.observableArray(resultSet.Collection));

        this.currentPage(i);
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

})(window.es = window.es || {});