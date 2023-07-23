(function () {
    "use strict";

    // loading framework and dependencies
    let main = angular.module("main", [
        "ngMaterial",
        "ui.router",
        "radio-button",
        "rzSlider",
        "feed-chip",
        "top-countries",
    ]);

    // configurating the routing
    main.config(RoutesConfiguration);

    RoutesConfiguration.$inject = ["$stateProvider", "$urlRouterProvider"];

    function RoutesConfiguration($stateProvider, $urlRouterProvider) {
        // setting the default page for the routing
        $urlRouterProvider.otherwise("/map");

        // setting the routing pages
        $stateProvider
            // defining routing to the login page
            .state("map", {
                url: "/map",
                templateUrl: components_folder + "home.html",
                controller: "homeController as homeCtrl",
                resolve: {},
            })
            .state("statistics", {
                url: "/statistics",
                templateUrl: components_folder + "statistics.html",
                controller: "statisticsController as statCtrl",
                resolve: {},
            })
            .state("compare", {
                url: "/compare",
                templateUrl: components_folder + "compare.html",
                controller: "compareController as compCtrl",
                resolve: {},
            })
            .state("country", {
                url: "/country/:countryName",
                templateUrl: components_folder + "country.html",
                controller: "countryController as countCtrl",
                resolve: {},
                params: {
                    countryName: { squash: true, value: null, dynamic: true },
                },
            });
    }
})();
