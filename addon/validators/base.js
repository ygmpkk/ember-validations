import Ember from 'ember';

export default Ember.Object.extend({
  init: function() {
    this.set('errors', Ember.makeArray());
    this.dependentValidationKeys = Ember.makeArray();
    this.conditionals = {
      'if': this.get('options.if'),
      unless: this.get('options.unless')
    };
    this.model.addObserver(this.property, this, this._validate);
  },
  addObserversForDependentValidationKeys: Ember.on('init', function() {
    this.dependentValidationKeys.forEach(function(key) {
      this.model.addObserver(key, this, this._validate);
    }, this);
  }),
  pushDependentValidationKeyToModel: Ember.on('init', function() {
    var model = this.get('model');
    if (model.dependentValidationKeys[this.property] === undefined) {
      model.dependentValidationKeys[this.property] = Ember.makeArray();
    }
    model.dependentValidationKeys[this.property].addObjects(this.dependentValidationKeys);
  }),
  call: function () {
    throw 'Not implemented!';
  },
  unknownProperty: function(key) {
    var model = this.get('model');
    if (model) {
      return model.get(key);
    }
  },
  isValid: Ember.computed.empty('errors.[]'),
  validate: function() {
    var self = this;
    return this._validate().then(function(success) {
      // Convert validation failures to rejects.
      var errors = self.get('model.errors');
      if (success) {
        return errors;
      } else {
        return Ember.RSVP.reject(errors);
      }
    });
  },
  _validate: Ember.on('init', function() {
    this.errors.clear();
    if (this.canValidate()) {
      this.call();
    }
    if (this.get('isValid')) {
      return Ember.RSVP.resolve(true);
    } else {
      return Ember.RSVP.resolve(false);
    }
  }),
  canValidate: function() {
    if (typeof(this.conditionals) === 'object') {
      if (this.conditionals['if']) {
        if (typeof(this.conditionals['if']) === 'function') {
          return this.conditionals['if'](this.model, this.property);
        } else if (typeof(this.conditionals['if']) === 'string') {
          if (typeof(this.model[this.conditionals['if']]) === 'function') {
            return this.model[this.conditionals['if']]();
          } else {
            return this.model.get(this.conditionals['if']);
          }
        }
      } else if (this.conditionals.unless) {
        if (typeof(this.conditionals.unless) === 'function') {
          return !this.conditionals.unless(this.model, this.property);
        } else if (typeof(this.conditionals.unless) === 'string') {
          if (typeof(this.model[this.conditionals.unless]) === 'function') {
            return !this.model[this.conditionals.unless]();
          } else {
            return !this.model.get(this.conditionals.unless);
          }
        }
      } else {
        return true;
      }
    } else {
      return true;
    }
  }
});
