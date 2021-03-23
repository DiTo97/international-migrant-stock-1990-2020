(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("countryController", countryController);

    /**
     * Function that handle the country page logic
     */

    countryController.$inject = ["$scope", "$state", "dataService", "countryService"];

    function countryController($scope, $state, dataService, countryService) {
        $scope.countryInfoValue = "global_rank";
        $scope.selectedTopCountry = "";
        $scope.continents = dataService.continents;
        $scope.secondaryMenuSelectedValue =
            dataService.secondaryMenuSelectedValue != "" ? dataService.secondaryMenuSelectedValue : "country";
        $scope.secondaryMenuButtons = dataService.menuButtons;
        $scope.genreButtons = dataService.genreButtons;
        $scope.countryInfoTypeButtons = dataService.countryInfoTypeButtons;
        $scope.topFlags = dataService.topFlags;
        dataService.countries.then((data) => {
            $scope.countries = data;
            $scope.selectedCountryController =
                dataService.selectedCountryController == "" ? $scope.countries[0].visName : dataService.selectedCountryController;
            $scope.genreFilterValue = "menu-all";
            $scope.updateStatistics();
            developmentStructure = createPieStructure("development-piechart", "development");
            incomeStructure = createPieStructure("income-piechart", "income");
        });
        $scope.countryStatisticsValues = {
            totalImmigrations: "",
            totalPopulation: "",
            immigrationVsPopulation: "",
            immigrationAverageAge: "",
            refugeeVsImmigration: "",
        };

        // variable that holds the slider values
        $scope.sliderCountry = {
            minValue: 1990,
            maxValue: 2019,
            options: {
                floor: 4,
                ceil: 9,
                showTicksValues: true,
                stepsArray: dataService.sliderYears,
            },
        };

        let svgWidth;
        let svgHeight;
        let radius;
        let arc;
        let sliderMin = 1900;
        let sliderMax = 2019;
        let developmentStructure;
        let incomeStructure;
        let colors = d3.scaleOrdinal(d3.schemePaired);

        /**
         * Function that returns an array with the selected years in the slider
         * @returns selected years
         */
        let getSliderYears = () => {
            return [1990, 1995, 2000, 2005, 2010, 2015, 2019].filter((year) => year >= +sliderMin && year <= +sliderMax);
        };

        // getting the years selected in the slider
        let consideredYears = getSliderYears();

        // watcher that listens for the slider updates
        $scope.$on("slideEnded", () => {
            sliderMin = $scope.sliderCountry.minValue;
            sliderMax = $scope.sliderCountry.maxValue;
            consideredYears = getSliderYears();
            $scope.updateStatistics();
        });

        /**
         * Function that updates the statistics
         */
        $scope.updateStatistics = () => {
            // getting the total migrants by origin and destination
            dataService
                .getTotMigrantsByOriginAndDestination($scope.selectedCountryController, sliderMin, sliderMax, $scope.genreFilterValue)
                .then((data) => {
                    $scope.countryStatisticsValues.totalImmigrations = "" + transformNumberFormat(data);
                    $scope.$apply();
                });

            // getting the total population by age and sex
            dataService
                .getTotPopulationByAgeAndSex(
                    $scope.selectedCountryController,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryStatisticsValues.totalPopulation = "" + transformNumberFormat(data);
                    $scope.$apply();
                });

            // getting the migrants as percentage of population
            dataService
                .getMigrantsAsPercentageOfPopulationByAgeAndSex(
                    $scope.selectedCountryController,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryStatisticsValues.immigrationVsPopulation = "" + transformNumberFormat(data);
                    $scope.$apply();
                });

            // getting the immigration average ag
            dataService
                .getImmigrationAverageAge(
                    $scope.selectedCountryController,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "")
                )
                .then((data) => {
                    $scope.countryStatisticsValues.immigrationAverageAge = "" + transformNumberFormat(data);
                });

            // getting the estimated refugees
            dataService
                .getEstimatedRefugees(
                    $scope.selectedCountryController,
                    consideredYears,
                    dataService.getSelectedGenderColumn($scope.genreFilterValue, "_est")
                )
                .then((data) => {
                    if (isNaN(data)) {
                        $scope.countryStatisticsValues.refugeeVsImmigration = "Not available";
                    } else {
                        $scope.countryStatisticsValues.refugeeVsImmigration = "" + transformNumberFormat(data);
                    }
                    $scope.$apply();
                });

            dataService
                .getCountryDevelopmentStatistic($scope.selectedCountryController, consideredYears, $scope.genreFilterValue)
                .then((data) => {
                    drawPieChart(data, developmentStructure, "development");
                });

            dataService
                .getCountryIncomeStatistic($scope.selectedCountryController, consideredYears, $scope.genreFilterValue)
                .then((data) => {
                    drawPieChart(data, incomeStructure, "income");
                });
        };

        /**
         * Function that updates the pieChart values for the enter set
         * @param {array} data
         * @param {function} arc
         * @returns
         */
        let arcTweenEnter = (data) => {
            // let i = d3.interpolate(data.endAngle, data.startAngle);
            let i = d3.interpolate(this._current, data);

            this._current = i(0);
            return function (t) {
                // data.startAngle = i(t);
                // return arc(data);
                return arc(i(t));
            };
        };

        /**
         * Function that creates the base html structure for visualizing a pieChart
         * @param {string} container
         * @param {string} type
         * @returns
         */
        let createPieStructure = (container, type) => {
            let svgContainer = d3.select("#" + container);
            svgWidth = svgContainer.node().getBoundingClientRect().width;
            svgHeight = svgContainer.node().getBoundingClientRect().height;
            radius = Math.min(svgWidth, svgHeight) / 2;

            let svg = svgContainer.append("svg").attr("width", svgWidth).attr("height", svgHeight);
            // .attr("transform", `translate(${svgWidth / 2}, ${svgHeight / 2})`);
            svg.append("g")
                .attr("class", type + "-slices")
                .attr("transform", `translate(${svgWidth / 2}, ${svgHeight / 2})`);
            svg.append("g")
                .attr("class", type + "-labels")
                .attr("transform", `translate(${svgWidth / 2}, ${svgHeight / 2})`);
            arc = d3
                .arc()
                .outerRadius(radius - 70)
                .innerRadius(0);

            return svg;
        };

        /**
         * Function that handles the enter set of the pieChart
         * @param {array} enter
         * @param {string} type
         */
        let handleEnter = (enter, type) => {
            enter
                .append("path")
                .attr("class", type + "-arc")
                .style("stroke", "white")
                .style("fill", (d, i) => colors(i))
                .transition()
                .duration(1000)
                .attrTween("d", arcTweenEnter);
        };

        /**
         * Function that handles the update set of the pieChart
         * @param {array} update
         */
        let handleUpdate = (update) => {
            update
                .transition()
                .duration(1000)
                .attrTween("d", function (d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function (t) {
                        return arc(interpolate(t));
                    };
                });
        };

        /**
         * Function that handles the visualization of the labels
         * @param {array} enter
         * @param {number} dataLength
         * @param {string} type
         */
        let handleEnterLabels = (enter, dataLength, type) => {
            let legendIndex = 0;
            let enterLabel = enter.append("g").attr("class", type + "-label");

            // creating the inner circles for the labels
            enterLabel
                .append("circle")
                .attr("r", 2)
                .attr("fill", "#FFFFFF")
                .attr("class", type + "-label-inner-circle");

            // creating the line for the labels
            enterLabel
                .append("line")
                .attr("stroke-width", 1)
                .attr("stroke", "#FFFFFF")
                .attr("class", type + "-label-line");

            // creating the outer circles for the label
            enterLabel
                .append("circle")
                .attr("r", (d) => (d.value !== 0 ? 4 : 0))
                .attr("fill", (d, i) => colors(i))
                .attr("class", type + "-label-outer-circle");

            // creating the colored rectangles for the legend
            enterLabel
                .append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("rx", 0)
                .attr("ry", 0)
                .attr("width", 10)
                .attr("height", 10)
                .attr("stroke", "#FFFFFF")
                .attr("fill", (d, i) => colors(i))
                .attr("class", type + "-legend-rect")
                .attr("transform", (d, i) => {
                    if (i < dataLength / 2) return `translate(${-(svgWidth / 2 - 50)}, ${svgHeight / 2 - 15 * (i + 1)})`;
                    else {
                        return `translate(${svgWidth / 4 - 55}, ${svgHeight / 2 - 15 * (legendIndex++ + 1)})`;
                    }
                });

            legendIndex = 0;

            // creating the text of the labels
            enterLabel
                .append("text")
                .attr("stroke", (d, i) => colors(i))
                .attr("class", type + "-label-text")
                .attr("text-anchor", (d, i) => {
                    let centroid = arc.centroid(d);
                    let midAngle = Math.atan2(centroid[1], centroid[0]);
                    let x = Math.cos(midAngle) * (radius - 45);
                    return x > 0 ? "start" : "end";
                })
                .text((d) => {
                    return d.data.percentage !== "0.0" ? d.data.percentage + "%" : "";
                });

            // creating the text for the legend
            enterLabel
                .append("text")
                .attr("x", "0")
                .attr("y", "5")
                .attr("class", type + "-legend-text")
                .attr("class", "label-text")
                .attr("transform", (d, i) => {
                    if (i < dataLength / 2) {
                        return `translate(${-(svgWidth / 2 - 70)}, ${svgHeight / 2 - 15 * (i + 1)})`;
                    } else {
                        return `translate(${svgWidth / 4 - 35}, ${svgHeight / 2 - 15 * (legendIndex++ + 1)})`;
                    }
                })
                .text((d) => d.data.type);
        };

        /**
         * Function that handles the updating of the labels in the pieChart
         * @param {svg} svgElement
         * @param {array} piedData
         * @param {string} type
         */
        let handleUpdateLabels = (svgElement, piedData, type) => {
            svgElement
                .selectAll("." + type + "-label-inner-circle")
                .data(piedData)
                .transition()
                .duration(1000)
                .attrTween("transform", function (d, i, n) {
                    n[i]._current = n[i]._current || d;
                    let interpolate = d3.interpolate(n[i]._current, d);
                    n[i]._current = interpolate(0);
                    return function (t) {
                        let inter = interpolate(t);
                        let pos = arc.centroid(inter);
                        return "translate(" + pos + ")";
                    };
                });

            svgElement
                .selectAll("." + type + "-label-line")
                .data(piedData)
                .transition()
                .duration(1000)
                .attr("x1", (d, i) => arc.centroid(d)[0])
                .attr("y1", (d, i) => arc.centroid(d)[1])
                .attr("x2", (d, i) => computePieChartEndOfLabelLineXY(d, arc, "x"))
                .attr("y2", (d, i) => computePieChartEndOfLabelLineXY(d, arc, "y"));

            svgElement
                .selectAll("." + type + "-label-outer-circle")
                .data(piedData)
                .transition()
                .duration(1000)
                .attr("cx", (d, i) => computePieChartEndOfLabelLineXY(d, arc, "x"))
                .attr("cy", (d, i) => computePieChartEndOfLabelLineXY(d, arc, "y"));

            svgElement
                .selectAll("." + type + "-label-text")
                .data(piedData)
                .transition()
                .duration(1000)
                .attr("x", (d, i) => {
                    let x = computePieChartEndOfLabelLineXY(d, arc, "x");
                    if (x == undefined) x = 0;
                    let sign = x > 0 ? 1 : -1;
                    let xLabel = x + 5 * sign;
                    return xLabel;
                })
                .attr("y", (d, i) => computePieChartEndOfLabelLineXY(d, arc, "y"));
        };

        /**
         * Function that computes the position of the outer circle in the pieChart
         * @param {object} d
         * @param {function} arc
         * @param {string} coord
         * @returns
         */
        let computePieChartEndOfLabelLineXY = (d, arc, coord) => {
            if (d.value == 0) {
                if (coord === "x") return arc.centroid[0];
                if (coord === "y") return arc.centroid[1];
            }
            let centroid = arc.centroid(d);
            let midAngle = Math.atan2(centroid[1], centroid[0]);
            let x = Math.cos(midAngle) * (radius - 55);
            let y = Math.sin(midAngle) * (radius - 55);

            if (coord === "x") return x;
            if (coord === "y") return y;
        };

        /**
         * Function that draws the pie chart
         * @param {array} data
         */
        let drawPieChart = (data, svgElement, type) => {
            const pie = d3.pie().value((d) => d.value);
            const piedData = pie(data);

            // variable used to split the legend in two columns
            svgElement
                .select("." + type + "-slices")
                .selectAll("path")
                .data(piedData)
                .join(
                    (enter) => handleEnter(enter, type),
                    (update) => handleUpdate(update)
                );

            svgElement
                .select("." + type + "-labels")
                .selectAll("." + type + "-label")
                .data(piedData)
                .join(
                    (enter) => handleEnterLabels(enter, data.length, type),
                    (update) => handleUpdateLabels(svgElement, piedData, type)
                );
        };

        /**
         * Function that handles the click on the genre radio group filter in the menu
         * @param {string} value
         */
        $scope.handleGenreClick = function (value) {
            $scope.genreFilterValue = value;
            $scope.updateStatistics();
        };

        /**
         * Function that handles the click on the secondary menu buttons
         * @param {string} value
         */
        $scope.handleSecondaryMenuClick = function (value) {
            $scope.secondaryMenuSelectedValue = value;
            dataService.secondaryMenuSelectedValue = value;
            dataService.changePage();
        };

        /**
         * Function that handles the click on the secondary menu buttons
         * @param {string} value
         */
        $scope.handleCountryInfoClick = function (value) {
            $scope.countryInfoValue = value;
        };

        /**
         * Function that handles the click on the top countries flags
         * @param {string} value
         */
        $scope.handleTopCountryClick = function (value, type) {
            $scope.selectedTopCountry = value;
            $scope.selectedCountryController = value;
        };

        /**
         * Function that handles the mouse enter on the top countries flags
         * @param {string} value
         */
        $scope.showTopCountryHint = function (value, event, type) {
            $scope.selectedTopFlag = value.toUpperCase();
            let tooltip = document.getElementById("top-flags-tooltip");
            tooltip.classList.remove("hide");
            tooltip.style.top = event.clientY - 50 + "px";
            tooltip.style.left = event.clientX + "px";
            tooltip.style.zIndex = 100;
        };

        /**
         * Function that handles the mouse out on the top countries flags
         * @param {string} value
         */
        $scope.hideTopCountryHint = function (type) {
            let tooltip = document.getElementById("top-flags-tooltip");
            tooltip.style.zIndex = -100;
        };
    }
})();
