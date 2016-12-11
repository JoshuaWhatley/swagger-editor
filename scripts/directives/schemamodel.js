'use strict';

var JSONFormatter = require('json-formatter-js');
var JSONSchemaView = require('json-schema-view-js');
var _ = require('lodash');
var hljs = require('highlight.js');
var sanitizeHtml = require('sanitize-html');

SwaggerEditor.directive('schemaModel', function(defaults) {
  return {
    template: require('templates/preview/' + defaults.previewTemplate +
      '/schema-model.html'),
    restrict: 'E',
    replace: true,
    scope: {
      schema: '='
    },

    link: function postLink($scope, $element) {
      var sanitize = function(text) {
        if (text === undefined) {
          return '';
        }

        return sanitizeHtml(text, {
          allowedTags: ['div', 'span', 'b', 'i', 'em', 'strong',
            'a', 'br', 'table', 'tbody', 'tr', 'th', 'td'],
          allowedAttributes: {
            div: ['class'],
            span: ['class'],
            table: ['class'],
            td: ['class'],
            th: ['colspan'],
            a: ['href']
          }
        });
      };

      // copy-pasted from swagger-js
      var schemaToJSON = function(schema, models, modelsToIgnore,
        modelPropertyMacro) {
        if (typeof modelPropertyMacro !== 'function') {
          modelPropertyMacro = function(prop) {
            return (prop || {}).default;
          };
        }

        modelsToIgnore = modelsToIgnore || {};

        var type = schema.type || 'object';
        var format = schema.format;
        var output;

        if (!_.isUndefined(schema.example)) {
          output = schema.example;
        } else if (_.isUndefined(schema.items) && _.isArray(schema.enum)) {
          output = schema.enum[0];
        }

        if (_.isUndefined(output)) {
          if (!_.isUndefined(schema.default)) {
            output = schema.default;
          } else if (type === 'string') {
            if (format === 'date-time') {
              output = new Date().toISOString();
            } else if (format === 'date') {
              output = new Date().toISOString().split('T')[0];
            } else {
              output = 'string';
            }
          } else if (type === 'integer') {
            output = 0;
          } else if (type === 'number') {
            output = 0.0;
          } else if (type === 'boolean') {
            output = true;
          } else if (type === 'object') {
            output = {};

            _.forEach(schema.properties, function(property, name) {
              var cProperty = _.cloneDeep(property);

              // Allow macro to set the default value
              cProperty.default = modelPropertyMacro(property);

              output[name] = schemaToJSON(cProperty, models,
                modelsToIgnore, modelPropertyMacro);
            });
          } else if (type === 'array') {
            output = [];

            if (_.isArray(schema.items)) {
              _.forEach(schema.items, function(item) {
                output.push(schemaToJSON(item, models,
                  modelsToIgnore, modelPropertyMacro));
              });
            } else if (_.isPlainObject(schema.items)) {
              output.push(schemaToJSON(schema.items, models,
                modelsToIgnore, modelPropertyMacro));
            } else if (_.isUndefined(schema.items)) {
              output.push({});
            } else {
              console.log('Array type\'s \'items\' property is ' +
                'not an array or an object, cannot process');
            }
          }
        }

        return output;
      };

      var renderDefault = function() {
        var formatter = new JSONFormatter($scope.schema, 1);
        $element.find('td.view.json').html(formatter.render());

        var schemaView = new JSONSchemaView($scope.schema, 1);
        $element.find('td.view.schema').html(schemaView.render());
      };

      var renderSwaggerUi = function() {
        var signatureContainer = $element.closest('.model-signature');

        signatureContainer.find('.signature-container .snippet .description')
          .html();

        var jsonContent = JSON.stringify(schemaToJSON($scope.schema), null, 2);

        if (jsonContent) {
          var highlightedContent = hljs.highlightAuto(jsonContent).value;

          signatureContainer.find('.signature-container .snippet_json code')
            .html(sanitize(highlightedContent));
        }
      };

      $scope.getPrimitiveSignature = function() {
        var items = $scope.schema.items || {};
        var type = $scope.schema.type || '';

        switch (type) {
          case 'object':
            return 'Object is not a primitive';
          case 'array' :
            return 'Array[' + items.type + ']';
          default:
            return type;
        }
      };

      $scope.isPrimitive = function() {
        if ($scope.schema.type === 'array' &&
          $scope.schema.items.type === 'object') {
          return false;
        }

        return $scope.schema && $scope.schema.type !== 'object';
      };

      $scope.mode = 'schema';

      $scope.switchMode = function(mode) {
        if (mode) {
          $scope.mode = mode;
        } else {
          $scope.mode = $scope.mode === 'json' ? 'schema' : 'json';
        }
      };

      switch (defaults.previewTemplate) {
        case "swagger-ui" :
          renderSwaggerUi();
          $scope.$watch('schema', renderSwaggerUi);
          break;
        default:
          renderDefault();
          $scope.$watch('schema', renderDefault);
      }
    }
  };
});
