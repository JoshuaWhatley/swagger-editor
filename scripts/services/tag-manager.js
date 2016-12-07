'use strict';

var angular = require('angular');
var _ = require('lodash');

SwaggerEditor.service('TagManager', function TagManager($stateParams) {
  var tags = [];

  var Tag = function(name, description, endpoints) {
    this.name = name;
    this.description = description;
    this.id = name.replace(" ", "_");
    this.endpoints = endpoints ? endpoints : [];
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
      _.each(endpoint, function(operation, verb) {
        if (_.isObject(operation)) {
          _.each(operation.tags, function(tag) {
            registerEndpoint(path, verb, endpoint, operation, tag);
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
   * @param {string}    path - path to endpoint
   * @param {string}    verb - http verb
   * @param {Endpoint}  endpoint - endpoint
   * @param {Operation} operation - operation
   * @param {string}    tagName - tag name
   * @param {string}    tagDescription - description
  */
  function registerEndpoint(path, verb, endpoint, operation,
    tagName, tagDescription) {
    if (!path || !tagName) {
      return;
    }
    var tag = _.find(tags, function(entry) {
      return entry.name === tagName;
    });
    if (!tag) {
      tag = new Tag(tagName, tagDescription);
      tags.push(tag);
    }
    var existingEndpoint = _.find(tag.endpoints, function(entry) {
      return entry.path === path && entry.verb === verb;
    });
    if (!existingEndpoint) {
      tag.endpoints.push({pathUri: path, verb, path: endpoint, operation});
    }
  }

  this.registerEndpoint = registerEndpoint;
  this.registerTag = registerTag;
});
