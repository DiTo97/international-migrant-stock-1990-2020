/**
 * Directive that creates the feed elements
 */
angular.module("feed-chip", []).directive("feedChip", function () {
    return {
        require: "ngModel",
        replace: true,
        scope: {
            model: "=ngModel",
            feed: "=",
            index: "=",
        },
        template:
            '<div layout="row" class="move-feed" style="animation-delay: {{index*3}}s">' +
            '<div class="feed-container">' +
            '<div class="margin-lr-auto">' +
            '<span class="margin-right-10-px">{{feed.title}}</span>' +
            '<img class="vertical-align-middle margin-right-10-px" width="15px" src="{{feed.image}}">' +
            "<span>{{feed.value}}</span>" +
            "</div>" +
            "</div>" +
            "</div>",
    };
});
