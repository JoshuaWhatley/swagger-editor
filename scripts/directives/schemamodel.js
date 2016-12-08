'use strict';

var JSONFormatter = require('json-formatter-js');
var JSONSchemaView = require('json-schema-view-js');

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
      $scope.mode = 'schema';

      $scope.switchMode = function(mode) {
        if (mode) {
          $scope.mode = mode;
        } else {
          $scope.mode = $scope.mode === 'json' ? 'schema' : 'json';
        }
      };

      var render = function() {
        var formatter = new JSONFormatter($scope.schema, 1);
        $element.find('td.view.json').html(formatter.render());

        var schemaView = new JSONSchemaView($scope.schema, 1);
        $element.find('td.view.schema').html(schemaView.render());
      };

      $scope.$watch('schema', render);

      render();
    }
  };
});
