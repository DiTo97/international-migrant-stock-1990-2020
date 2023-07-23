/**
 * Directive that creates the a menu
 */
angular.module("radio-button", []).directive("radioButtonGroup", function () {
    return {
        restrict: "E",
        require: "ngModel",
        replace: false,
        scope: {
            model: "=ngModel",
            buttons: "=",
            radioButtonsClass: "=",
            handleButton: "&",
            buttonValue: "=",
            value: "=selectedButton",
        },
        template:
            '<div><a class="radio-button-class {{radioButtonsClass}}" ' +
            '   ng-repeat="button in buttons" ' +
            '   ng-click="handleButton({buttonValue: button.value})" ' +
            "   ng-class=\"{'button-clicked': isActive(button.value), 'first-radius': $first, 'last-radius': $last }\"> " +
            "       {{button.text}} " +
            "</a></div>",
        controller: [
            "$scope",
            function ($scope) {
                $scope.isActive = function (value) {
                    return $scope.value === value;
                };
            },
        ],
        link: function (scope, element, attributes, ngModel) {
            element.on("click", (e) => {
                scope.$apply(() => {
                    ngModel.$setViewValue(scope.value);
                });
            });
        },
    };
});
