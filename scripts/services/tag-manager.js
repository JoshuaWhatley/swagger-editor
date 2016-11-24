'use strict';

var angular = require('angular');
var _ = require('lodash');

SwaggerEditor.service('TagManager', function TagManager($stateParams) {
  var tags = [];

  var Tag = function(name, description, paths) {
    this.name = name;
    this.description = description;
    this.id = name.replace(" ", "_");
    this.paths = paths ? paths : [];
  };

  this.resetTags = function resetTags() {
    tags = [];
  };

  this.tagIndexFor = function(tagName) {
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].name === tagName) {
        return i;
      }
    }
  };

  this.getAllTags = function() {
    return tags;
  };

  this.tagsHaveDescription = function() {
    return tags.some(function(tag) {
      return tag.description;
    });
  };

  this.registerTagsFromSpec = function(spec) {
    if (!angular.isObject(spec)) {
      return;
    }

    tags = [];

    if (Array.isArray(spec.tags)) {
      spec.tags.forEach(function(tag) {
        if (tag && angular.isString(tag.name)) {
          registerTag(tag.name, tag.description, tag.paths);
        }
      });
    }

    _.each(spec.paths, function(endpoint, path) {
      _.each(endpoint, function(operation) {
        if (_.isObject(operation)) {
          _.each(operation.tags, function(tag) {
            registerOperation(path, operation, tag);
          });
        }
      });
    });
  };

  this.getCurrentTags = function() {
    if ($stateParams.tags) {
      return $stateParams.tags.split(',');
    }
    return [];
  };

  /**
   * @param {string} tagName - tag name
   * @param {string} tagDescription - description
   * @param {array}  paths - paths
  */
  function registerTag(tagName, tagDescription, paths) {
    if (!tagName) {
      return;
    }
    var tagNames = tags.map(function(tag) {
      return tag.name;
    });
    if (!_.includes(tagNames, tagName)) {
      tags.push(new Tag(tagName, tagDescription, paths));
    }
  }

  /**
   * @param {string}    path - path
   * @param {Operation} operation - operation
   * @param {string}    tagName - tag name
   * @param {string}    tagDescription - description
  */
  function registerOperation(path, operation, tagName, tagDescription) {
    if (!path || !operation || !tagName) {
      return;
    }
    var tag = _.find(tags, function(entry) {
      return entry.name === tagName;
    });
    if (!tag) {
      tag = new Tag(tagName, tagDescription);
      tags.push(tag);
    }
    var existingPath = _.find(tags.paths, function(entry) {
      return entry === path;
    });
    if (!existingPath) {
      tag.paths[path] = [];
    }
    tag.paths[path].push(operation);
  }

  this.registerOperation = registerOperation;
  this.registerTag = registerTag;
});
