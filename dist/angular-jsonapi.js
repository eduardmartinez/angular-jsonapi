(function() {
  'use strict';

  angular.module('angular-jsonapi', ['uuid4'])
  /* global pluralize: false */
  .constant('pluralize', pluralize);
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .service('AngularJsonAPIModelValidatorService', AngularJsonAPIModelValidatorService);

  function AngularJsonAPIModelValidatorService() {
    var _this = this;
    _this.validateForm = validateForm;
    _this.validateField = validateField;

    return this;

    /**
     * Validates form
     * @param  {object} data Form data
     * @return {object} Errors object indexed by keys
     */
    function validateForm(schema, data) {
      var _this = this;

      return {};
    }

    /**
     * Validates single field
     * @param  {string} key Field key
     * @return {array}     Errors array
     */
    function validateField(schema, key) {
      var _this = this;

      return [];
    }

    // function __validate(validator, attributeValue, attributeName) {
    //   var errors = [];
    //   if (angular.isArray(validator)) {
    //     angular.forEach(validator, function(element) {
    //       errors = errors.concat(__validate(element, attributeValue, attributeName));
    //     });
    //   } else if (angular.isFunction(validator)) {
    //     var err = validator(attributeValue);
    //     if (angular.isArray(err)) {
    //       errors.concat(err);
    //     } else {
    //       $log.error(
    //         'Wrong validator type it should return array of errors instead of: ' +
    //           err.toString()
    //       );
    //     }
    //   } else if (angular.isString(validator)) {
    //     if (validator === 'text' || validator === 'string') {
    //       if (!angular.isString(attributeValue)) {
    //         errors.push(attributeName + ' is not a string ');
    //       }
    //     } else if (validator === 'number' || validator === 'integer') {
    //       if (parseInt(attributeValue).toString() !== attributeValue.toString()) {
    //         errors.push(attributeName + ' is not a number');
    //       }
    //     } else if (validator === 'uuid4') {
    //       if (!uuid4.validate(attributeValue)) {
    //         errors.push(attributeName + ' is not a uuid4');
    //       }
    //     } else if (validator === 'required') {
    //       if (attributeValue.toString().length === 0) {
    //         errors.push(attributeName + ' is empty');
    //       }
    //     } else {
    //       $log.error('Wrong validator type: ' + validator.toString());
    //     }
    //   } else if (angular.isObject(validator)) {
    //     if (validator.maxlength !== undefined && attributeValue.length > validator.maxlength) {
    //       errors.push(attributeName + ' is too long max ' + validator.maxlength);
    //     }

    //     if (validator.minlength !== undefined && attributeValue.length < validator.minlength) {
    //       errors.push(attributeName + ' is too short min ' + validator.minlength);
    //     }

    //     if (validator.maxvalue !== undefined && parseInt(attributeValue) > validator.maxvalue) {
    //       errors.push(attributeName + ' is too big max ' + validator.maxvalue);
    //     }

    //     if (validator.minvalue !== undefined && parseInt(attributeValue) < validator.minvalue) {
    //       errors.push(attributeName + ' is too small min ' + validator.minvalue);
    //     }
    //   } else {
    //     $log.error('Wrong validator type: ' + validator.toString());
    //   }

    //   return errors;
    // }
  }
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .service('AngularJsonAPIModelLinkerService', AngularJsonAPIModelLinkerService);

  function AngularJsonAPIModelLinkerService($log) {
    var _this = this;

    _this.toLinkData = toLinkData;

    _this.link = link;
    _this.unlink = unlink;

    return this;

    /**
     * Extracts data needed for relationship linking from object
     * @param  {AngularJsonAPIModel} object Object
     * @return {json}        Link data
     */
    function toLinkData(object) {
      return {type: object.data.type, id: object.data.id};
    }

    /**
     * Add target to object relationships and data.relationships
     * @param {AngularJsonAPIModel} object     Object to be modified
     * @param {string} key        Relationship name
     * @param {AngularJsonAPIModel} target     Object to be linked
     * @param {AngularJsonAPISchema} schema     Relationship schema
     */
    function link(object, key, target, schema) {
      if (target === undefined) {
        $log.error('Can\'t link non existing object', object, key, target, schema);
        return false;
      }

      if (object === undefined) {
        $log.error('Can\'t add link to non existing object', object, key, target, schema);
        return false;
      }

      if (schema === undefined) {
        $log.error('Can\'t add link not present in schema: ', object, key, target, schema);
        return false;
      }

      if (schema.polymorphic === false && schema.model !== target.data.type) {
        $log.error('This relation is not polymorphic, expected: ' + schema.model + ' instead of ' + target.data.type);
        return false;
      }

      if (schema.type === 'hasMany') {
        return __addHasMany(_this, key, object, schema);
      } else if (schema.type === 'hasOne') {
        return __addHasOne(_this, key, object, schema);
      }
    }

    /**
     * Remove target from object relationships and data.relationships
     * @param {AngularJsonAPIModel} object     Object to be modified
     * @param {string} key        Relationship name
     * @param {AngularJsonAPIModel} target     Object to be unlinked
     * @param {AngularJsonAPISchema} schema     Relationship schema
     */
    function unlink(object, key, target, schema) {
      if (schema === undefined) {
        $log.error('Can\'t remove link not present in schema: ' + key);
        return;
      }

      if (schema.type === 'hasMany') {
        return __removeHasMany(_this, key, object, schema);
      } else if (schema.type === 'hasOne') {
        return __removeHasOne(_this, key, object, schema);
      }
    }

    /////////////
    // Private //
    /////////////

    function __addHasOne(object, key, target, schema) {
      $log.log('addHasOne', object, key, target, schema);

      if (object.relationships[key] === target) {
        $log.warn(object, 'is already linked to', target);
        return false;
      } else {
        object.relationships[key] = target;
        object.data.relationships[key].data = toLinkData(target);
      }

      return true;
    }

    function __addHasMany(object, key, target, schema) {
      $log.log('addHasMany', object, key, target, schema);

      if (object.relationships[key].indexOf(target) > -1) {
        $log.warn(object, 'is already linked to', target);
        return false;
      } else {
        object.relationships[key].push(target);
        object.data.relationships[key].data.push(toLinkData(target));
      }

      return true;
    }

    function __removeHasOne(object, key, target, schema) {
      $log.log('removeHasOne', object, key, target, schema);

      if (target !== undefined && object.relationships[key] !== target) {
        $log.warn(object, 'is not linked to', target);
        return false;
      } else {
        object.relationships[key] = null;
        object.data.relationships[key].data = undefined;
      }

      return true;
    }

    function __removeHasMany(object, key, target, schema) {
      $log.log('removeHasMany', object, key, target, schema);

      if (target === undefined) {
        object.relationships[key] = [];
        object.data.relationships[key].data = [];
      } else {
        var index = object.relationships[key].indexOf(target);

        if (index === -1) {
          $log.warn(object, 'is not linked to', target);
          return false;
        } else {
          object.relationships[key].splice(index, 1);
          object.data.relationships[key].data.splice(index, 1);
        }
      }

      return true;
    }

  }
  AngularJsonAPIModelLinkerService.$inject = ["$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModelForm', AngularJsonAPIModelFormWrapper);

  function AngularJsonAPIModelFormWrapper(
    AngularJsonAPIModelValidatorService,
    AngularJsonAPIModelLinkerService
  ) {

    AngularJsonAPIModelForm.prototype.save = save;
    AngularJsonAPIModelForm.prototype.reset = reset;
    AngularJsonAPIModelForm.prototype.validate = validate;
    AngularJsonAPIModelForm.prototype.validateField = validateField;

    AngularJsonAPIModelForm.prototype.link = link;
    AngularJsonAPIModelForm.prototype.unlink = unlink;

    AngularJsonAPIModelForm.prototype.toJson = toJson;

    return AngularJsonAPIModelForm;

    function AngularJsonAPIModelForm(parent) {
      var _this = this;

      _this.data = {
        attributes: {},
        relationships: {}
      };

      _this.relationships = {};
      _this.parent = parent;
      _this.schema = parent.schema;
      _this.reset();
    }

    /**
     * Encodes object into json
     * @return {json} Json object
     */
    function toJson() {
      var _this = this;
      var data = angular.copy(_this.data);
      var relationships = {};

      angular.forEach(data.relationships, function(value, key) {
        if (value.data !== undefined) {
          relationships[key] = value;
        }
      });

      data.relationships = relationships;

      return {
        data: data
      };
    }

    /**
     * Saves form, shortcut to parent.save()
     * @return {promise} Promise associated with synchronization
     */
    function save() {
      var _this = this;

      return _this.parent.save();
    }

    /**
     * Resets form to state of a parent
     * @return {undefined}
     */
    function reset() {
      var _this = this;

      angular.forEach(_this.schema.attributes, function(data, key) {
        _this.data.attributes[key] = _this.parent.data.attributes[key] || '';
      });

      angular.forEach(_this.schema.relationships, function(data, key) {
        _this.data.relationships[key] = _this.parent.data.relationships[key] || {};
        _this.relationships[key] = _this.parent.relationships[key];
      });

      _this.errors = {
        validation: {}
      };
    }

    /**
     * Validates form
     * @return {objec} Errors object indexed by keys
     */
    function validate() {
      var _this = this;
      var errors;

      errors = AngularJsonAPIModelValidatorService.validateForm(_this.data);

      _this.errors.validation = errors;

      return errors;
    }

    /**
     * Validates single field
     * @param  {string} key Field key
     * @return {array}     Errors array
     */
    function validateField(key) {
      var _this = this;
      var errors;
      errors = AngularJsonAPIModelValidatorService.validateField(
        _this.data[key],
        key
      );

      _this.errors.validation[key] = errors;

      return errors;
    }

    /**
     * Adds link to a form without synchronization
     * @param {string} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function link(key, target) {
      var _this = this;
      var schema = _this.schema.relationships[key];

      return AngularJsonAPIModelLinkerService.link(_this, key, target, schema);
    }

    /**
     * Removes link from form without synchronization
     * @param  {[type]} key    Relationship name
     * @param {AngularJsonAPIModel} target Object to be linked
     * @return {Boolean}        Status
     */
    function unlink(key, target) {
      var _this = this;
      var schema = _this.schema.relationships[key];

      return AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema);
    }
  }
  AngularJsonAPIModelFormWrapper.$inject = ["AngularJsonAPIModelValidatorService", "AngularJsonAPIModelLinkerService"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIAbstractModel', AngularJsonAPIAbstractModelWrapper);

  function AngularJsonAPIAbstractModelWrapper(
    AngularJsonAPIModelForm,
    AngularJsonAPIModelLinkerService,
    uuid4,
    $injector,
    $log,
    $q
  ) {
    AngularJsonAPIAbstractModel.prototype.refresh = refresh;
    AngularJsonAPIAbstractModel.prototype.remove = remove;
    AngularJsonAPIAbstractModel.prototype.reset = reset;
    AngularJsonAPIAbstractModel.prototype.save = save;

    AngularJsonAPIAbstractModel.prototype.link = link;
    AngularJsonAPIAbstractModel.prototype.unlink = unlink;

    AngularJsonAPIAbstractModel.prototype.unlinkAll = unlinkAll;

    AngularJsonAPIAbstractModel.prototype.toJson = toJson;

    return AngularJsonAPIAbstractModel;

    /**
     * Constructor
     * @param {json}  data      Validated data used to create an object
     * @param {Boolean} isNew   Is object new (for form)
     */
    function AngularJsonAPIAbstractModel(data, isNew) {
      var _this = this;

      data.relationships = data.relationships || {};

      _this.isNew = isNew || false;
      _this.form = new AngularJsonAPIModelForm(_this);
      _this.removed = false;
      _this.loadingCount = 0;

      _this.data = {
        relationships: {},
        attributes: {}
      };
      _this.relationships = {};

      _this.errors = {
        validation: {}
      };

      _this.promises = {};

      __setData(_this, data, true);
    }

    /**
     * Saves model's form
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function save() {
      var _this = this;
      var deferred = $q.defer();
      var hasErrors = false;
      var config = {
        action: 'update',
        object: _this
      };

      if (_this.isNew === true) {
        config.action = 'add';
      }

      var errors = _this.form.validate();

      for (var error in errors) {
        if (errors.hasOwnProperty(error)) {
          hasErrors = true;
        }
      }

      if (hasErrors === true) {
        deferred.reject(errors);
        return deferred.promise;
      } else {
        _this.synchronize(config).then(resolved, rejected);
      }

      return deferred.promise;

      function resolved(data, finish) {
        __setData(_this, _this.form.data);
        finish();

        return _this;
      }

      function rejected(errors, finish) {
        finish();

        return errors;
      }
    }

    /**
     * Reset object form
     * @return {undefined}
     */
    function reset() {
      var _this = this;

      return _this.form.reset();
    }

    /**
     * Synchronize object with remote
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function refresh() {
      var deferred = $q.defer();
      var _this = this;
      var config = {
        action: 'refresh',
        object: _this,
        params: _this.schema.params.get
      };

      if (_this.isNew === true) {
        $log.error('Can\'t refresh new object');
        deferred.reject('Can\'t refresh new object');
      } else {
        _this.synchronize(config).then(resolved, rejected);
      }

      function resolved(data, finish) {
        _this.update(data);
        finish();

        return _this;
      }

      function rejected(errors, finish) {
        finish();

        return errors;
      }

      return deferred.promise;
    }

    /**
     * Encodes object into json
     * @return {json} Json object
     */
    function toJson() {
      var _this = this;
      var data = angular.copy(_this.data);
      var relationships = {};

      angular.forEach(data.relationships, function(value, key) {
        if (value.data !== undefined) {
          relationships[key] = value;
        }
      });

      data.relationships = relationships;

      return {
        data: data
      };
    }

    /**
     * Remove object
     * @return {promise} Promise associated with synchronization that resolves to nothing
     */
    function remove() {
      var _this = this;

      return _this.parentFactory.remove(_this.data.id);
    }

    /**
     * Unlink all relationships of the object **without synchronization**
     * @return {boolean} result
     */
    function unlinkAll() {
      var _this = this;

      angular.forEach(_this.relationships, function(link, key) {
        AngularJsonAPIModelLinkerService.unlink(_this, key, undefined, _this.schema.relationships[key]);
      });
    }

    /**
     * Links object to relationship with the key
     * @param  {string} key    Relationship name
     * @param  {AngularJsonAPIModel} target Object to be linked
     * @return {promise}        Promise associated with synchronizations
     */
    function link(key, target) {
      var deferred = $q.defer();
      var _this = this;
      var schema = _this.schema.relationships[key];
      var reflectionKey = schema.reflection;
      var reflectionSchema = target.schema.relationships[reflectionKey];
      var promise;

      if (!AngularJsonAPIModelLinkerService.link(_this, key, target, schema) ||
          !AngularJsonAPIModelLinkerService.link(target, reflectionKey, _this, reflectionSchema)) {

        deferred.reject();
        return deferred.promise;
      }

      promise = $q.all(_this.synchronize({
        action: 'link',
        object: _this,
        target: target,
        key: key
      }),

      _this.synchronize({
        action: 'linkReflection',
        object: _this,
        target: target,
        key: key
      }));

      promise.then(resolved, rejected);

      function resolved(data, finish) {
        deferred.resolve(_this);

        finish();
        return data;
      }

      function rejected(errors, finish) {
        AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema);
        AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema);

        deferred.reject(errors);
        finish();
        return errors;
      }

      return deferred.promise;
    }

    /**
     * Unlinks object from relationship with the key
     * @param  {string} key    Relationship name
     * @param  {AngularJsonAPIModel} target Object to be unlinked
     * @return {promise}        Promise associated with synchronizations
     */
    function unlink(key, target) {
      var deferred = $q.defer();
      var _this = this;
      var schema = _this.schema.relationships[key];
      var reflectionKey = schema.reflection;
      var reflectionSchema = target.schema.relationships[reflectionKey];
      var promise;

      if (!AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema) ||
          !AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema)) {

        deferred.reject();
        return deferred.promise;
      }

      promise = $q.all(_this.synchronize({
        action: 'unlink',
        object: _this,
        target: target,
        key: key
      }),

      _this.synchronize({
        action: 'unlinkReflection',
        object: _this,
        target: target,
        key: key
      }));

      promise.then(resolved, rejected);

      function resolved(data, finish) {
        deferred.resolve(_this);

        finish();
        return data;
      }

      function rejected(errors, finish) {
        AngularJsonAPIModelLinkerService.unlink(_this, key, target, schema);
        AngularJsonAPIModelLinkerService.unlink(target, reflectionKey, _this, reflectionSchema);

        deferred.reject(errors);
        finish();
        return errors;
      }

      return deferred.promise;
    }

    /////////////
    // PRIVATE //
    /////////////

    /**
     * Low level set data function, use only with validated data
     * @param  {AngularJsonAPIModel} object        object to be modified
     * @param  {object} validatedData Validated data
     * @return {boolean}               Status
     */
    function __setData(object, validatedData, initialize) {
      var $jsonapi = $injector.get('$jsonapi');
      var schema = object.schema;

      object.id = validatedData.id;
      object.type = validatedData.type;

      if (object.parentFactory.schema.type !== validatedData.type) {
        $log.error('Different type then factory');
        return false;
      }

      if (!uuid4.validate(object.id)) {
        $log.error('Invalid id');
        return false;
      }

      validatedData.attributes = validatedData.attributes || {};
      validatedData.relationships = validatedData.relationships || {};

      angular.forEach(schema.attributes, setAttributes);
      angular.forEach(schema.relationships, setRelationships);

      function setAttributes(validators, key) {
        object.data.attributes[key] = validatedData.attributes[key];
      }

      function setRelationships(schema, key) {
        if (validatedData.relationships[key] === undefined) {
          if (schema.type === 'hasOne') {
            object.data.relationships[key] = {data: undefined};
          } else if (schema.type === 'hasMany') {
            object.data.relationships[key] = {data: []};
          }
        } else {
          object.data.relationships[key] = validatedData.relationships[key];
          if (schema.type === 'hasOne') {
            linkOne(object, key, schema, object.data.relationships[key].data);
          } else if (schema.type === 'hasMany') {
            angular.forEach(
              object.data.relationships[key].data,
              linkOne.bind(undefined, object, key, schema)
            );
          }
        }
      }

      function linkOne(object, key, schema, data) {
        var factory = $jsonapi.getModel(data.type);
        var target = factory.get(data.id);
        var reflectionKey = schema.reflection;
        var reflectionSchema = target.schema.relationships[reflectionKey];

        AngularJsonAPIModelLinkerService.link(object, key, target, schema);

        if (initialize !== true) {
          AngularJsonAPIModelLinkerService.link(object, reflectionKey, target, reflectionSchema);
        }
      }
    }
  }
  AngularJsonAPIAbstractModelWrapper.$inject = ["AngularJsonAPIModelForm", "AngularJsonAPIModelLinkerService", "uuid4", "$injector", "$log", "$q"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICache', AngularJsonAPICacheWrapper);

  function AngularJsonAPICacheWrapper(
    $log
  ) {

    AngularJsonAPICache.prototype.get = get;
    AngularJsonAPICache.prototype.addOrUpdate = addOrUpdate;

    AngularJsonAPICache.prototype.fromJson = fromJson;
    AngularJsonAPICache.prototype.toJson = toJson;
    AngularJsonAPICache.prototype.clear = clear;

    AngularJsonAPICache.prototype.remove = remove;
    AngularJsonAPICache.prototype.revertRemove = revertRemove;
    AngularJsonAPICache.prototype.clearRemoved = clearRemoved;

    return AngularJsonAPICache;

    /**
     * Constructor
     */
    function AngularJsonAPICache(factory) {
      var _this = this;

      _this.factory = factory;
      _this.data = {};
      _this.removed = {};
      _this.size = 0;
    }

    /**
     * Add new model or update existing with data
     * @param {object} validatedData Data that are used to update or create an object, has to be valid
     * @return {AngularJsonAPIModel} Created model
     */
    function addOrUpdate(validatedData) {
      var _this = this;
      var id = validatedData.id;

      if (id === undefined) {
        $log.error('Can\'t add data without id!', validatedData);
        return;
      }

      if (_this.data[id] === undefined) {
        _this.data[id] = new _this.factory.Model(validatedData);
        _this.size += 1;
      } else {
        _this.data[id].__update(validatedData);
      }

      return _this.data[id];
    }


    /**
     * Recreate object structure from json data
     * @param  {json} json Json data
     * @return {undefined}
     */
    function fromJson(json) {
      var _this = this;
      var collection = angular.fromJson(json);

      if (collection !== null && collection.data !== undefined) {
        _this.updatedAt = collection.updatedAt;

        angular.forEach(collection.data, function(objectData) {
          var data = objectData.data;
          _this.addOrUpdate(data, objectData.updatedAt);
        });
      }
    }

    /**
     * Encodes memory into json format
     * @return {json} Json encoded memory
     */
    function toJson() {
      var _this = this;
      var json = {
        data: {},
        updatedAt: _this.updatedAt
      };

      angular.forEach(_this.data, function(object, key) {
        json.data[key] = object.toJson();
      });

      return angular.toJson(json);
    }

    /**
     * Clear memory
     * @return {undefined}
     */
    function clear() {
      var _this = this;

      _this.data = {};
      _this.removed = {};
    }

    /**
     * Low level get used internally, does not run any synchronization
     * @param  {uuid} id
     * @return {AngularJsonAPIModel} Model associated with id
     */
    function get(id) {
      var _this = this;

      if (_this.data[id] === undefined) {
        _this.data[id] = new _this.factory.Model({id: id, type: _this.Model.prototype.schema.type});
      }

      return _this.data[id];
    }

    /**
     * Remove object with given id from cache
     * @param  {uuid} id
     * @return {AngularJsonAPIModel / undefined}    Removed object, undefined if
     * object does not exist
     */
    function remove(id) {
      var _this = this;

      if (_this.data[id] !== undefined) {
        _this.removed[id] = _this.data[id];
        delete _this.data[id];
        _this.size -= 1;
      }

      return _this.removed[id];
    }

    /**
     * Revert removal of an object with given id from cache
     * @param  {uuid} id
     * @return {AngularJsonAPIModel / undefined}    Removed object, undefined if
     * object does not exist
     */
    function revertRemove(id) {
      var _this = this;

      if (_this.removed[id] !== undefined) {
        _this.data[id] = _this.removed[id];
        delete _this.removed[id];
        _this.size += 1;
      }

      return _this.data[id];
    }

    /**
     * Clear removed object from memory
     * @param  {uuid} id
     * @return {undefined}
     */
    function clearRemoved(id) {
      var _this = this;

      delete _this.removed[id];
    }
  }
  AngularJsonAPICacheWrapper.$inject = ["$log"];
})();

// from https://www.sitepen.com/blog/2012/10/19/lazy-property-access/
(function() {
  'use strict';

  angular.module('angular-jsonapi')
    .constant('lazyProperty', function(target, propertyName, callback) {
      var result;
      var done;
      Object.defineProperty(target, propertyName, {
        get: function() { // Define the getter
          if (!done) {
            // We cache the result and only compute once.
            done = true;
            result = callback.call(target);
          }

          return result;
        },

        // Keep it enumerable and configurable, certainly not necessary.
        enumerable: true,
        configurable: true
      });
    });

})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
    .constant('toKebabCase', function(str) {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });

})();

(function() {
  'use strict';

  angular.module('angular-jsonapi').config(['$provide', function($provide) {
    $provide.decorator('$q', ['$delegate', function($delegate) {
      var $q = $delegate;

      $q.allSettled = $q.allSettled || function allSettled(promises, resolvedCallback, rejectedCallback) {
        // Implementation of allSettled function from Kris Kowal's Q:
        // https://github.com/kriskowal/q/wiki/API-Reference#promiseallsettled
        // by Michael Kropat from http://stackoverflow.com/a/27114615/1400432 slightly modified

        var wrapped = angular.isArray(promises) ? [] : {};

        angular.forEach(promises, function(promise, key) {
          if (!wrapped.hasOwnProperty(key)) {
            wrapped[key] = wrap(promise);
          }
        });

        return $q.all(wrapped);

        function wrap(promise) {
          return $q.when(promise)
            .then(function(value) {
              if (angular.isFunction(resolvedCallback)) {
                resolvedCallback(value);
              }

              return { success: true, value: value };
            },

            function(reason) {
              if (angular.isFunction(rejectedCallback)) {
                rejectedCallback(reason);
              }

              return { success: false, reason: reason };
            });
        }
      };

      return $q;
    }]);
  }]);

})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-local', ['angular-jsonapi'])
  .factory('AngularJsonAPISynchronizerSimple', AngularJsonAPISynchronizerSimpleWrapper);

  function AngularJsonAPISynchronizerSimpleWrapper(AngularJsonAPISynchronizerPrototype, $q, $log) {

    AngularJsonAPISynchronizerSimple.prototype = Object.create(AngularJsonAPISynchronizerPrototype.prototype);
    AngularJsonAPISynchronizerSimple.prototype.constructor = AngularJsonAPISynchronizerSimple;

    AngularJsonAPISynchronizerSimple.prototype.synchronize = synchronize;

    return AngularJsonAPISynchronizerSimple;

    function AngularJsonAPISynchronizerSimple(synchronizations) {
      var _this = this;

      AngularJsonAPISynchronizerPrototype.call(_this, synchronizations);

      angular.forEach(synchronizations, function(synchronization) {
        synchronization.synchronizer = _this;
      });
    }

    function synchronize(config) {
      var _this = this;
      var promises = [];
      var deferred = $q.defer();
      var action = config.action;

      AngularJsonAPISynchronizerPrototype.synchronize.call(_this, config);

      angular.forEach(_this.synchronizations, function(synchronization) {
        angular.forEach(synchronization.beginHooks[action], function(hook) {
          deferred.notify('begin', hook.call(_this, config));
        });
      });

      angular.forEach(_this.synchronizations, function(synchronization) {
        angular.forEach(synchronization.beforeHooks[action], function(hook) {
          deferred.notify('before', hook.call(_this, config));
        });
      });

      angular.forEach(_this.synchronizations, function(synchronization) {
        angular.forEach(synchronization.synchronizationHooks[action], function(hook) {
          promises.push(hook.call(_this, config));
        });
      });

      $q.allSettled(promises, resolvedCallback, rejectedCallback).then(resolved, rejected);

      function resolvedCallback(value) {
        deferred.notify('synchronization', value);
      }

      function rejectedCallback(reason) {
        deferred.notify('synchronization', reason);
      }

      function resolved(results) {
        _this.state[action].success = true;

        angular.forEach(results, function(result) {
          if (result.success === false) {
            _this.state[action].success = false;
          }
        });

        angular.forEach(_this.synchronizations, function(synchronization) {
          angular.forEach(synchronization.afterHooks[action], function(hook) {
            deferred.notify('after', hook.call(_this, config, results));
          });
        });

        var data;
        var errors = [];

        angular.forEach(results, function(result) {
          if (result.success === true) {
            data = result.value;
          } else {
            errors.push(result.reason);
          }
        });

        if (data === undefined) {
          deferred.reject(data, finish, errors);
        } else {
          deferred.resolve(errors, finish);
        }
      }

      function finish() {
        angular.forEach(_this.synchronizations, function(synchronization) {
          angular.forEach(synchronization.finishHooks[action], function(hook) {
            deferred.notify('finish', hook.call(_this, config));
          });
        });
      }

      function rejected(results) {
        $log.error('All settled rejected! Something went wrong');

        deferred.reject(results);
      }

      return deferred.promise;
    }
  }
  AngularJsonAPISynchronizerSimpleWrapper.$inject = ["AngularJsonAPISynchronizerPrototype", "$q", "$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-local', ['angular-jsonapi'])
  .factory('AngularJsonAPISynchronizerPrototype', AngularJsonAPISynchronizerPrototypeWrapper);

  function AngularJsonAPISynchronizerPrototypeWrapper($log) {

    AngularJsonAPISynchronizerPrototype.prototype.synchronize = synchronize;

    return AngularJsonAPISynchronizerPrototype;

    function AngularJsonAPISynchronizerPrototype(synchronizations) {
      var _this = this;

      _this.synchronizations = synchronizations;
    }

    function synchronize(config) {
      $log.debug('Synchro Collection', this.Model.prototype.schema.type, config);

      if (config.action === undefined) {
        $log.error('Can\'t synchronize undefined action', config);
      }
    }
  }
  AngularJsonAPISynchronizerPrototypeWrapper.$inject = ["$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-rest', ['angular-jsonapi'])
  .factory('AngularJsonAPISynchronizationRest', AngularJsonAPISynchronizationRestWrapper);

  function AngularJsonAPISynchronizationRestWrapper(
    AngularJsonAPISynchronizationPrototype,
    AngularJsonAPIModelLinkerService,
    toKebabCase,
    $q,
    $http
  ) {

    AngularJsonAPISynchronizationRest.prototype = Object.create(AngularJsonAPISynchronizationPrototype.prototype);
    AngularJsonAPISynchronizationRest.prototype.constructor = AngularJsonAPISynchronizationRest;

    return AngularJsonAPISynchronizationRest;

    function AngularJsonAPISynchronizationRest(url) {
      var _this = this;
      var headers = { // jscs:disable disallowQuotedKeysInObjects
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }; // jscs:enable disallowQuotedKeysInObjects

      AngularJsonAPISynchronizationPrototype.call(_this);

      _this.synchronization('remove', remove);
      _this.synchronization('unlink', unlink);
      _this.synchronization('link', link);
      _this.synchronization('update', update);
      _this.synchronization('add', add);
      _this.synchronization('all', all);
      _this.synchronization('get', get);
      _this.synchronization('refresh', get);

      function all(config) {
        return $http({
          method: 'GET',
          headers: headers,
          url: url,
          params: config.params || {}
        });
      }

      function get(config) {
        return $http({
          method: 'GET',
          headers: headers,
          url: url + '/' + config.object.data.id,
          params: config.params || {}
        });
      }

      function remove(config) {
        return $http({
          method: 'DELETE',
          headers: headers,
          url: url + '/' + config.object.data.id
        });
      }

      function unlink(config) {
        var deferred = $q.defer();

        if (config.object.removed === true || config.target === undefined) {
          deferred.reject();
        } else {
          $http({
            method: 'DELETE',
            headers: headers,
            url: url + '/' + config.object.data.id + '/relationships/' + toKebabCase(config.key) + '/' + config.target.data.id
          }).then(deferred.resolve, deferred.reject);
        }

        return deferred.promise;
      }

      function link(config) {
        var deferred = $q.defer();

        if (config.object.removed === true || config.target === undefined) {
          deferred.reject();
        } else {
          $http({
            method: 'POST',
            headers: headers,
            url: url + '/' + config.object.data.id + '/relationships/' + toKebabCase(config.key),
            data: {data: [AngularJsonAPIModelLinkerService.toLinkData(config.target)]}
          }).then(deferred.resolve, deferred.reject);
        }

        return deferred.promise;
      }

      function update(config) {
        return $http({
          method: 'PUT',
          headers: headers,
          url: url + '/' + config.object.data.id,
          data: config.object.form.toJson()
        });
      }

      function add(config) {
        return $http({
          method: 'POST',
          headers: headers,
          url: url + '/',
          data: config.object.form.toJson()
        });
      }
    }
  }
  AngularJsonAPISynchronizationRestWrapper.$inject = ["AngularJsonAPISynchronizationPrototype", "AngularJsonAPIModelLinkerService", "toKebabCase", "$q", "$http"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISynchronizationPrototype', AngularJsonAPISynchronizationPrototypeWrapper);

  function AngularJsonAPISynchronizationPrototypeWrapper() {
    AngularJsonAPISynchronizationPrototype.prototype.before = beforeSynchro;
    AngularJsonAPISynchronizationPrototype.prototype.after = afterSynchro;
    AngularJsonAPISynchronizationPrototype.prototype.begin = begin;
    AngularJsonAPISynchronizationPrototype.prototype.finish = finish;
    AngularJsonAPISynchronizationPrototype.prototype.synchronization = synchronization;

    return AngularJsonAPISynchronizationPrototype;

    function AngularJsonAPISynchronizationPrototype() {
      var _this = this;
      var allHooks = [
        'add',
        'init',
        'get',
        'all',
        'clear',
        'remove',
        'unlink',
        'unlinkReflection',
        'link',
        'linkReflection',
        'update',
        'refresh'
      ];

      _this.state = {};

      _this.beginHooks = {};
      _this.beforeHooks = {};
      _this.synchronizationHooks = {};
      _this.afterHooks = {};
      _this.finishHooks = {};

      _this.options = {};

      angular.forEach(allHooks, function(hookName) {
        _this.beginHooks[hookName] = [];
        _this.beforeHooks[hookName] = [];
        _this.synchronizationHooks[hookName] = [];
        _this.afterHooks[hookName] = [];
        _this.finishHooks[hookName] = [];
        _this.state[hookName] = {
          loading: false,
          success: true
        };
      });
    }

    function begin(action, callback) {
      var _this = this;

      _this.beginHooks[action].push(callback);
    }

    function finish(action, callback) {
      var _this = this;

      _this.finishHooks[action].push(callback);
    }

    function beforeSynchro(action, callback) {
      var _this = this;

      _this.beforeHooks[action].push(callback);
    }

    function afterSynchro(action, callback) {
      var _this = this;

      _this.afterHooks[action].push(callback);
    }

    function synchronization(action, callback) {
      var _this = this;

      _this.synchronizationHooks[action].push(callback);
    }

  }
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi-local', ['angular-jsonapi'])
  .factory('AngularJsonAPISynchronizationLocal', AngularJsonAPISynchronizationLocalWrapper);

  function AngularJsonAPISynchronizationLocalWrapper(AngularJsonAPISynchronizationPrototype, $window) {

    AngularJsonAPISynchronizationLocal.prototype = Object.create(AngularJsonAPISynchronizationPrototype.prototype);
    AngularJsonAPISynchronizationLocal.prototype.constructor = AngularJsonAPISynchronizationLocal;

    return AngularJsonAPISynchronizationLocal;

    function AngularJsonAPISynchronizationLocal(prefix) {
      var _this = this;
      var type = _this.synchronizer.factory.schema.type;
      var cache = _this.synchronizer.factory.cache;

      _this.__updateStorage = updateStorage;

      AngularJsonAPISynchronizationPrototype.call(_this);

      _this.begin('init', init);
      _this.begin('clear', clear);
      _this.begin('remove', updateStorage);
      _this.begin('unlink', updateStorage);
      _this.begin('unlinkReflection', updateStorage);
      _this.begin('link', updateStorage);
      _this.begin('linkReflection', updateStorage);
      _this.begin('update', updateStorage);
      _this.begin('add', updateStorage);
      _this.finish('get', updateStorage);
      _this.finish('all', updateStorage);

      _this.finish('init', updateStorage);
      _this.finish('clear', updateStorage);
      _this.finish('remove', updateStorage);
      _this.finish('unlink', updateStorage);
      _this.finish('unlinkReflection', updateStorage);
      _this.finish('link', updateStorage);
      _this.finish('linkReflection', updateStorage);
      _this.finish('update', updateStorage);
      _this.finish('add', updateStorage);
      _this.finish('get', updateStorage);
      _this.finish('all', updateStorage);

      function init() {
        return $window.localStorage.getItem(prefix + '.' + type);
      }

      function clear() {
        $window.localStorage.removeItem(prefix + '.' + type);
      }

      function updateStorage() {
        $window.localStorage.setItem(prefix + '.' + type, cache.toJson());
      }
    }
  }
  AngularJsonAPISynchronizationLocalWrapper.$inject = ["AngularJsonAPISynchronizationPrototype", "$window"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPISchema', AngularJsonAPISchemaWrapper);

  function AngularJsonAPISchemaWrapper($log, pluralize) {

    return AngularJsonAPISchema;

    function AngularJsonAPISchema(schema) {
      var _this = this;
      var include = schema.include || {};
      schema.include = include;
      include.get = schema.include.get || [];
      include.all = schema.include.all || [];

      _this.params = {
        get: {},
        all: {}
      };

      angular.forEach(schema.relationships, function(linkSchema, linkName) {
        var linkSchemaObj = new AngularJsonAPILinkSchema(linkSchema, linkName, schema.type);
        schema.relationships[linkName] = linkSchemaObj;
        if (linkSchemaObj.included === true) {
          include.get.push(linkName);
          if (linkSchemaObj.type === 'hasOne') {
            include.all.push(linkName);
          }
        }
      });

      angular.extend(_this, schema);

      if (include.get.length > 0) {
        _this.params.get.include = include.get.join(',');
      }

      if (include.all.length > 0) {
        _this.params.all.include = include.all.join(',');
      }
    }

    function AngularJsonAPILinkSchema(linkSchema, linkName, type) {
      var _this = this;

      if (angular.isString(linkSchema)) {
        _this.model = pluralize.plural(linkName);
        _this.type = linkSchema;
        _this.polymorphic = false;
        _this.reflection = type;
      } else {
        if (linkSchema.type === undefined) {
          $log.error('Schema of link without a type: ', linkSchema, linkName);
        }

        _this.model = linkSchema.model || pluralize.plural(linkName);
        _this.type = linkSchema.type;
        _this.polymorphic = linkSchema.polymorphic || false;
        _this.reflection = linkSchema.reflection || type;
        _this.included = linkSchema.included || false;
      }
    }

  }
  AngularJsonAPISchemaWrapper.$inject = ["$log", "pluralize"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIModel', AngularJsonAPIModel);

  function AngularJsonAPIModel(AngularJsonAPIAbstractModel, AngularJsonAPISchema, $log) {

    return {
      model: modelFactory
    };

    function modelFactory(schemaObj, parentFactory) {
      var Model = function(data, updatedAt, isNew) {
        var _this = this;

        if (data.type !== _this.schema.type) {
          $log.error('Data type other then declared in schema: ', data.type, ' instead of ', _this.schema.type);
        }

        AngularJsonAPIAbstractModel.call(_this, data, updatedAt, isNew);

        _this.form.parent = _this;
      };

      Model.prototype = Object.create(AngularJsonAPIAbstractModel.prototype);
      Model.prototype.constructor = Model;

      Model.prototype.schema = schemaObj;
      Model.prototype.parentFactory = parentFactory;
      Model.prototype.synchronize = parentFactory.synchronizer.synchronize;

      angular.forEach(schemaObj.functions, function(metaFunction, metaFunctionName) {
        Model.prototype[metaFunctionName] = function() {
          return metaFunction.apply(this, arguments);
        };
      });

      return Model;
    }

  }
  AngularJsonAPIModel.$inject = ["AngularJsonAPIAbstractModel", "AngularJsonAPISchema", "$log"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPIFactory', AngularJsonAPIFactoryWrapper);

  function AngularJsonAPIFactoryWrapper(
    AngularJsonAPIModel,
    AngularJsonAPISchema,
    AngularJsonAPICache,
    AngularJsonAPICollection,
    uuid4,
    $log,
    $q
  ) {
    AngularJsonAPIFactory.prototype.get = get;
    AngularJsonAPIFactory.prototype.all = all;
    AngularJsonAPIFactory.prototype.remove = remove;
    AngularJsonAPIFactory.prototype.initialize = initialize;

    AngularJsonAPIFactory.prototype.clear = clear;

    return AngularJsonAPIFactory;

    /**
     * AngularJsonAPIFactory constructor
     * @param {json} schema       Schema object
     * @param {AngularJsonAPISynchronizer} synchronizer Synchronizer for the factory
     */
    function AngularJsonAPIFactory(schema, synchronizer) {
      var _this = this;
      var config = {
        action: 'init'
      };

      _this.schema = new AngularJsonAPISchema(schema);
      _this.cache = new AngularJsonAPICache(_this);

      _this.synchronizer = synchronizer;
      _this.synchronizer.factory = _this;

      _this.Model = AngularJsonAPIModel.model(
        _this.schema,
        _this
      );

      _this.synchronizer.synchronize(config).then(resolved, rejected);

      function resolved(data, finish) {
        _this.cache.fromJson(data);

        finish();
        return data;
      }

      function rejected(errors, finish) {
        finish();

        return errors;
      }
    }

    /**
     * Get request
     * @param  {uuid} id
     * @return {AngularJsonAPIModel} Model associated with id, synchronized
     */
    function get(id) {
      var _this = this;
      var object = _this.__get(id);

      object.fetch();

      return object;
    }

    /**
     * All request
     * @param  {object} params Object associated with params (for filters/pagination etc.)
     * @return {AngularJsonAPICollection} Collection of AngularJsonAPIModel, synchronized
     */
    function all(params) {
      var _this = this;

      var collection = new AngularJsonAPICollection(
        _this,
        angular.extend(params, _this.schema.params.all)
      );

      collection.fetch();

      return collection;
    }

    /**
     * Remove request
     * @param  {uuid} id
     * @return {promise} Promise associated with the synchronization, in case of
     * fail object is reverted to previous state
     */
    function remove(id) {
      var _this = this;
      var object = _this.cache.remove(id);
      var config = {
        action: 'remove',
        object: object
      };

      if (object !== undefined) {
        object.removed = true;

        if (object.isNew) {
          return $q.when(undefined);
        }
      } else {
        $log.error('Object with this id does not exist');
      }

      return _this.synchronizer.synchronize(config).then(resolved, rejected);

      function resolved(data, finish) {
        object.unlinkAll();
        _this.cache.clearRemoved(id);
        finish();

        return data;
      }

      function rejected(errors, finish) {
        if (object !== undefined) {
          object.removed = false;
          _this.cache.revertRemove(id);
        }

        finish();
        return errors;
      }
    }

    /**
     * Initialize new AngularJsonAPIModel
     * @return {AngularJsonAPIModel} New model
     */
    function initialize() {
      var _this = this;

      var model = new _this.Model({
        type: _this.schema.type,
        id: uuid4.generate(),
        attributes: {},
        relationships: {}
      }, true);

      return model;
    }

    /**
     * Clears localy saved data
     * @return {promise} Promise associated with the synchronization resolves to nothing
     */
    function clear() {
      var _this = this;
      _this.cache.clear();
      var config = {
        action: 'clear'
      };

      return _this.synchronizer.synchronize(config).then(resolved, rejected);

      function resolved(data, finish) {
        finish();
      }

      function rejected(errors, finish) {
        finish();

        return errors;
      }
    }
  }
  AngularJsonAPIFactoryWrapper.$inject = ["AngularJsonAPIModel", "AngularJsonAPISchema", "AngularJsonAPICache", "AngularJsonAPICollection", "uuid4", "$log", "$q"];
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .factory('AngularJsonAPICollection', AngularJsonAPICollectionWrapper);

  function AngularJsonAPICollectionWrapper(

  ) {

    AngularJsonAPICollection.prototype.fetch = fetch;
    AngularJsonAPICollection.prototype.refresh = fetch;

    return AngularJsonAPICollection;

    /**
     * Constructor
     * @param {AngularJsonAPIFactory} factory Factory associated with the collection
     * @param {object} params  Params associated with this factory (such as filters)
     */
    function AngularJsonAPICollection(factory, params) {
      var _this = this;

      _this.factory = factory;
      _this.params = params;

      _this.errors = {
        synchronization: []
      };
      _this.data = [];
      _this.step = 'initialized';
    }

    /**
     * Synchronizes collection with the server
     * @return {promise} Promise associated with synchronization that resolves to this
     */
    function fetch() {
      var _this = this;
      var config = {
        method: 'all',
        params: _this.params
      };

      return _this.factory.__synchronize(config).then(resolved, rejected, notify);

      function resolved(data) {
        _this.errors.synchronization = [];
        _this.data = data;

        return _this;
      }

      function rejected(errors) {
        _this.errors.synchronization = errors;

        return _this;
      }

      function notify(data, step) {
        if (data !== undefined) {
          _this.data = data;
        }

        _this.step = step;

        return _this;
      }
    }
  }
})();

(function() {
  'use strict';

  angular.module('angular-jsonapi')
  .provider('$jsonapi', jsonapiProvider);

  function jsonapiProvider() {
    var memory = {};
    this.$get = jsonapiFactory;

    function jsonapiFactory($log, AngularJsonAPIFactory) {
      return {
        form: form,
        get: get,
        remove: remove,
        all: all,
        addModel: addModel,
        getModel: getModel,
        clearAll: clearAll
      };

      function addModel(schema, synchronization) {
        var collection = new AngularJsonAPIFactory(schema, synchronization);

        memory[schema.type] = collection;
      }

      function getModel(type) {
        return memory[type];
      }

      function form(type) {
        if (memory[type] === undefined) {
          $log.error('Can\t add not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].isNew.form;
      }

      function get(type, id) {
        if (memory[type] === undefined) {
          $log.error('Can\t get not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].get(id);
      }

      function remove(type, id) {
        if (memory[type] === undefined) {
          $log.error('Can\t remove not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].remove(id);
      }

      function all(type) {
        if (memory[type] === undefined) {
          $log.error('Can\t get all of not existing object type: ' + type + '. Use initialize(Model, datas).');
        }

        return memory[type].all();
      }

      function clearAll() {
        angular.forEach(memory, function(collection) {
          collection.clear();
        });
      }
    }
    jsonapiFactory.$inject = ["$log", "AngularJsonAPIFactory"];
  }

})();


//# sourceMappingURL=angular-jsonapi.js.map