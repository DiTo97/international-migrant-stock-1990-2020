/**
 * Directive that creates the top countries elements
 */
angular.module("top-countries", []).directive("topCountries", function () {
    return {
        require: "ngModel",
        replace: true,
        scope: {
            model: "=ngModel",
            countries: "=",
            topCountriesIconPath: "=",
            handleButton: "&",
            showHint: "&",
            hideHint: "&",
            buttonValue: "=",
        },
        template:
            '<div layout="row" class="top-countries-container">' +
            '<div class="padding-10-px">' +
            '<img class="vertical-align-middle margin-right-10-px" width="15px" src="{{topCountriesIconPath}}">' +
            "</div>" +
            '<div ng-repeat="country in countries" class="padding-10-px" ng-click="handleButton({flagValue: country[0]})">' +
            '<img class="vertical-align-middle margin-right-5-px" width="25px" height="20px"  ng-mouseover="showHint({flagValue: country, event: $event})" ng-mouseout="hideHint({event: $event, flagValue: country})"  width="30px" src="{{ country[0].flagPath }}">' +
            "</div>" +
            "</div>",
    };
});
