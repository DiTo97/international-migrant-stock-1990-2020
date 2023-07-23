(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("navbarController", navbarController);

    /**
     * Function that handle the user login
     */

    navbarController.$inject = ["$scope", "$state", "dataService"];

    function navbarController($scope, $state, dataService) {
        $scope.loadStatistics = () => {
            $state.go("statistics");
            dataService.secondaryMenuSelectedValue = "world";
            dataService.changePage();
        };

        $scope.loadMap = () => {
            $state.go("map");
        };
    }
})();
