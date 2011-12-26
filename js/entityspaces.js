// Punchout JavaScript library v1.0
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

/// <reference path="knockout-latest.debug.js" />
(function (window, undefined) {

    var es = window["es"] = {};

    //Google Closure Compiler helpers (used only to make the minified file smaller)
    es.exportSymbol = function (publicPath, object) {
        var tokens = publicPath.split(".");
        var target = window;
        var i;
        for (i = 0; i < tokens.length - 1; i++) {
            target = target[tokens[i]];
        }
        target[tokens[tokens.length - 1]] = object;
    };

    es.exportProperty = function (owner, publicName, object) {
        owner[publicName] = object;
    };

    function addPropertyChangedHandlers(obj, propertyName) {

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

    function unwrapObservable(value) {
        return ko.isObservable(value) ? value() : value;
    }

    // ===============================================================
    // BEGIN
    // ===============================================================
    // Copyright 2010 James Halliday (mail@substack.net)
    //
    // js-traverse
    //
    // https://github.com/substack/js-traverse/blob/master/LICENSE
    // ===============================================================

    function Traverse(obj) {
        if (!(this instanceof Traverse)) {
            return new Traverse(obj);
        }
        this.value = obj;
    }

    var Array_isArray = Array.isArray || function isArray(xs) {
        return Object.prototype.toString.call(xs) === '[object Array]';
    };

    var Object_keys = Object.keys || function keys(obj) {
        var res = [];
        for (var key in obj) {
            res.push(key);
        }
        return res;
    };

    function walk(root, cb, immutable) {
        var path = [];
        var parents = [];
        var alive = true;

        return (function walker(node_) {
            var node = immutable ? copy(node_) : node_;
            var modifiers = {};

            var keepGoing = true;

            var state = {
                node: node,
                node_: node_,
                path: [].concat(path),
                parent: parents[parents.length - 1],
                parents: parents,
                key: path.slice(-1)[0],
                isRoot: path.length === 0,
                level: path.length,
                circular: null,
                update: function (x, stopHere) {
                    if (!state.isRoot) {
                        state.parent.node[state.key] = x;
                    }
                    state.node = x;
                    if (stopHere) { keepGoing = false; }
                },
                'delete': function (stopHere) {
                    delete state.parent.node[state.key];
                    if (stopHere) { keepGoing = false; }
                },
                remove: function (stopHere) {
                    if (Array_isArray(state.parent.node)) {
                        state.parent.node.splice(state.key, 1);
                    } else {
                        delete state.parent.node[state.key];
                    }
                    if (stopHere) { keepGoing = false; }
                },
                keys: null,
                before: function (f) { modifiers.before = f; },
                after: function (f) { modifiers.after = f; },
                pre: function (f) { modifiers.pre = f; },
                post: function (f) { modifiers.post = f; },
                stop: function () { alive = false; },
                block: function () { keepGoing = false; }
            };

            if (!alive) { return state; }

            if (typeof node === 'object' && node !== null) {
                state.keys = Object_keys(node);

                state.isLeaf = state.keys.length === 0;

                for (var i = 0; i < parents.length; i++) {
                    if (parents[i].node_ === node_) {
                        state.circular = parents[i];
                        break;
                    }
                }
            }
            else {
                state.isLeaf = true;
            }

            state.notLeaf = !state.isLeaf;
            state.notRoot = !state.isRoot;

            // use return values to update if defined
            var ret = cb.call(state, state.node);
            if (ret !== undefined && state.update) state.update(ret);

            if (modifiers.before) modifiers.before.call(state, state.node);

            if (!keepGoing) return state;

            if (typeof state.node == 'object' && state.node !== null && !state.circular) {
                parents.push(state);

                forEach(state.keys, function (key, i) {
                    path.push(key);

                    if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);

                    var child = walker(state.node[key]);
                    if (immutable && Object.hasOwnProperty.call(state.node, key)) {
                        state.node[key] = child.node;
                    }

                    child.isLast = i == state.keys.length - 1;
                    child.isFirst = i == 0;

                    if (modifiers.post) modifiers.post.call(state, child);

                    path.pop();
                });
                parents.pop();
            }

            if (modifiers.after) modifiers.after.call(state, state.node);

            return state;
        })(root).node;
    };

    Traverse.prototype.forEach = function (cb) {
        this.value = walk(this.value, cb, false);
        return this.value;
    };

    var forEach = function (xs, fn) {
        if (xs.forEach) return xs.forEach(fn)
        else for (var i = 0; i < xs.length; i++) {
            fn(xs[i], i, xs);
        }
    };

    function shallowCopy(src) {
        if (typeof src === 'object' && src !== null) {
            var dst;

            if (Array_isArray(src)) {
                dst = [];
            }
            else if (src instanceof Date) {
                dst = new Date(src);
            }
            else if (src instanceof Boolean) {
                dst = new Boolean(src);
            }
            else if (src instanceof Number) {
                dst = new Number(src);
            }
            else if (src instanceof String) {
                dst = new String(src);
            }
            else if (Object.create && Object.getPrototypeOf) {
                dst = Object.create(Object.getPrototypeOf(src));
            }
            else if (src.__proto__ || src.constructor.prototype) {
                var proto = src.__proto__ || src.constructor.prototype || {};
                var T = function () { };
                T.prototype = proto;
                dst = new T;
                if (!dst.__proto__) dst.__proto__ = proto;
            }

            forEach(Object_keys(src), function (key) {
                if (!isEntitySpacesCollection(src[key])) {
                    dst[key] = src[key];
                }
            });
            return dst;
        }
        else return src;
    }

    // ===============================================================
    // END
    // ===============================================================
    // Copyright 2010 James Halliday (mail@substack.net)
    //
    // js-traverse
    //
    // https://github.com/substack/js-traverse/blob/master/LICENSE
    // ===============================================================

    function isEntitySpacesCollection(array) {

        var isEsArray = false;

        if (Array_isArray(array)) {
            if (array.length > 0) {
                if (array[0].hasOwnProperty("RowState")) {
                    isEsArray = true;
                }
            }
        }

        return isEsArray;
    }

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
            es.flattenColumnCollection(resultSet.columnCollection);

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

        this.startingRow = ko.computed(function () {
            return (this.pagerRequest.pageNumber - 1) * this.rowsPerPage();
        }, this);

        this.endingRow = ko.computed(function () {
            return this.pagerRequest.pageNumber * this.rowsPerPage();
        }, this);

        this.totalPageCount = ko.computed(function () {
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

            var data;

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
                    es.startTracking(obj);
                    es.expandExtraColumns(obj, true);
                }

                return obj;
            });

            return entity;
        };

        es.mapping.toJS = function (entity) {

            entity = ko.mapping.toJS(entity);

            es.mapping.visitModel(entity, function (obj) {
                es.removeExtraColumns(obj);
                return obj;
            });

            return entity;
        };

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
                if (options.ignore && ko.utils.arrayIndexOf(options.ignore, indexer) != -1) { return; }

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
        };

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

    })();

    es.startTracking = function (entity) {

        var propertyName;

        if (!entity.hasOwnProperty("RowState")) {
            entity.RowState = ko.observable(es.RowStateEnum.added);
            if (entity.hasOwnProperty("__ko_mapping__")) {
                entity.__ko_mapping__.mappedProperties["RowState"] = true;
            }
        } else {
            if (!ko.isObservable(entity.RowState)) {
                entity.RowState = ko.observable(entity.RowState);
            }
        }

        if (!entity.hasOwnProperty("ModifiedColumns")) {
            entity.ModifiedColumns = ko.observableArray();
            if (entity.hasOwnProperty("__ko_mapping__")) {
                entity.__ko_mapping__.mappedProperties["ModifiedColumns"] = true;
            }
        } else {
            if (!ko.isObservable(entity.ModifiedColumns)) {
                entity.ModifiedColumns = ko.observable(entity.ModifiedColumns);
            }
        }

        for (propertyName in entity) {
            if (propertyName !== 'RowState' && propertyName !== "ModifiedColumns" && propertyName !== '__type' && propertyName !== 'esExtendedData') {

                var property = entity[propertyName];

                if (property instanceof Array) { continue; }

                if (!ko.isObservable(property)) {
                    entity[propertyName] = ko.observable(entity[propertyName]);
                }
                addPropertyChangedHandlers(entity, propertyName);
            }
        }

        return entity;
    }

    es.expandExtraColumns = function (entity, makeObservable) {

        var data = undefined;
        if (makeObservable === undefined) {
            makeObservable = false;
        }

        if (entity.esExtendedData !== undefined) {

            data = unwrapObservable(entity.esExtendedData);

            for (i = 0; i < data.length; i++) {

                if (makeObservable) {
                    entity[unwrapObservable(data[i].Key)] = ko.observable(unwrapObservable(data[i].Value));
                } else {
                    entity[unwrapObservable(data[i].Key)] = unwrapObservable(data[i].Value);
                }

                if (entity.hasOwnProperty("__ko_mapping__")) {
                    if (entity.__ko_mapping__.hasOwnProperty("mappedProperties")) {
                        entity.__ko_mapping__.mappedProperties[unwrapObservable(data[i].Key)] = true;
                    }
                }
            }

            ext = unwrapObservable(entity.esExtendedData);
            delete entity.esExtendedData;
        }

        if (data !== undefined) {

            entity["esExtendedData"] = [];

            for (i = 0; i < data.length; i++) {
                entity.esExtendedData.push(unwrapObservable(data[i].Key));
            }
        }

        return entity;
    };

    es.removeExtraColumns = function (entity) {

        if (entity.esExtendedData !== undefined) {

            var data = unwrapObservable(entity.esExtendedData);

            for (i = 0; i < data.length; i++) {
                delete entity[data[i]];
            }
            delete entity.esExtendedData;
        }

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

    es.flattenColumnCollection = function (columnCollection) {

        if (columnCollection !== null) {
            for (i = 0; i < columnCollection.length; i++) {
                columnCollection[columnCollection[i].Key] = columnCollection[i].Value;
            }

            for (i = columnCollection.length - 1; i >= 0; i--) {
                delete columnCollection[i];
            }
        }
    };

    es.getDirtyEntities = function (obj) {

        var dirty, paths = [], root = null;

        Traverse(obj).forEach(function (theObj) {

            if (this.key === "esExtendedData") {
                this.block();
            } else {

                if (this.isLeaf === false) {

                    if (theObj instanceof Array) { return theObj; }

                    if (theObj.hasOwnProperty("RowState")) {

                        switch (theObj.RowState) {

                            case es.RowStateEnum.added:
                            case es.RowStateEnum.deleted:
                            case es.RowStateEnum.modified:

                                paths.push(this.path);
                                break;
                        }
                    }
                }
            }

            return theObj;
        });

        if (paths.length > 0) {

            if (Array_isArray(obj)) {
                dirty = [];
            } else {
                dirty = shallowCopy(obj);
            }

            root = dirty;

            for (i = 0; i < paths.length; i++) {

                var thePath = paths[i];
                var data = obj;
                dirty = root;

                for (k = 0; k < thePath.length; k++) {

                    if (!dirty.hasOwnProperty(thePath[k])) {

                        if (Array_isArray(data[thePath[k]])) {
                            dirty[thePath[k]] = [];
                            dirty = dirty[thePath[k]];
                        }
                    } else {
                        dirty = dirty[thePath[k]];
                    }

                    data = data[thePath[k]];
                }

                if (Array_isArray(dirty)) {
                    dirty.push(shallowCopy(data));
                } else {
                    dirty = shallowCopy(data);
                }
            }
        }

        return root;
    }

    es.makeRequest = function (url, methodName, params, successCallback, failureCallback) {

        var theData = null, path = null, async = false, xmlHttp, success, failure, noop = function () { };

        if (successCallback !== undefined || failureCallback !== undefined) {
            async = true;
            success = successCallback || noop;
            failure = failureCallback || noop;
        }

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
        xmlHttp.open("POST", path, async);
        xmlHttp.setRequestHeader("Content-type", "application/json; charset=utf-8");

        if (async === true) {
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {
                        success(JSON.parse(xmlHttp.responseText));
                    } else {
                        failure(xmlHttp.status, xmlHttp.statusText);
                    }
                }
            };
        }

        xmlHttp.send(params);

        if (async === false) {
            if (xmlHttp.status === 200) {
                if (xmlHttp.responseText !== '{}' && xmlHttp.responseText !== "") {
                    theData = JSON.parse(xmlHttp.responseText);
                }
            } else {
                es.makeRequstError = xmlHttp.statusText;
            }
        }

        return theData;
    };

    //-------------------------------------
    // Paging Prototypes
    //-------------------------------------	
    es.dataPager.prototype.onFirstPage = function (data, event) {

        this.pagerRequest.pageNumber = 1;
        this.fetchData();
    };

    es.dataPager.prototype.onNextPage = function (data, event) {

        this.pagerRequest.pageNumber = Math.min(this.pagerRequest.pageNumber + 1, this.totalPageCount());
        this.fetchData();
    };

    es.dataPager.prototype.onLastPage = function (data, event) {

        this.pagerRequest.pageNumber = this.totalPageCount();
        this.fetchData();
    };

    es.dataPager.prototype.onPrevPage = function (data, event) {

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