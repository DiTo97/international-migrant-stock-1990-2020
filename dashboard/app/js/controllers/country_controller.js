(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("countryController", countryController);

    /**
     * Function that handle the country page logic
     */

    countryController.$inject = ["$scope", "$state", "dataService", "countryService", "$stateParams"];

    function countryController($scope, $state, dataService, countryService, $stateParams) {
        $scope.countryInfoValue = "global_rank";
        $scope.searchSource = "";
        $scope.sendReceiveTopCountries = "";
        $scope.secondaryMenuSelectedValue = "country";
        $scope.secondaryMenuButtons = dataService.menuButtons;
        $scope.genderButtons = dataService.genderButtons;
        $scope.countryInfoTypeButtons = dataService.countryInfoTypeButtons;

        let titleYear = document.getElementById("title-year");
        let radius;
        let arc;
        let sliderMin = 1900;
        let sliderMax = 2019;

        let lineChartStructure;
        let developmentStructure;
        let stackedStructure;
        let stackedStructureCall = true;
        let incomeStructure;

        let colors = d3.scaleOrdinal(d3.schemePaired);

        // getting the years selected in the slider
        let consideredYears = dataService.getActiveYears(sliderMin, sliderMax);

        $scope.countryStatisticsValues = {
            totalImmigrations: "",
            totalPopulation: "",
            immigrationVsPopulation: "",
            immigrationAverageAge: "",
            refugeeVsImmigration: "",
        };

        $scope.globalRankCountryStatisticsValues = {
            totalImmigrationsGlobalRank: "",
            totalPopulationGlobalRank: "",
            immigrationVsPopulationGlobalRank: "",
            immigrationAverageAgeGlobalRank: "",
            refugeeVsImmigrationGlobalRank: "",
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

        // inserting the name of the country in the url
        this.uiOnParamsChanged = (newParams) => fetchData(newParams.countryName);

        /**
         * Function that fetch the country navigates to the country passed as parameter
         * @param {string} countryName
         */
        let fetchData = (countryName) => {
            if (countryName === null) {
                dataService.selectedCountryController = "";
            } else {
                let selectedCountry = $scope.countries.find((c) => slugify(countryName) === slugify(c.visName));

                if (selectedCountry) {
                    dataService.selectedCountryController = selectedCountry;
                } else {
                    console.log("Invalid country name:", capitalize(countryName));

                    $state.go($state.current, { countryName: null });
                }
            }

            // Update the statistics
            $scope.selectedCountryController =
                dataService.selectedCountryController == ""
                    ? $scope.countries[0]
                    : dataService.selectedCountryController;

            updateStatistics();
        };

        /**
         * Function that updates the view when a new country is selected
         */
        $scope.updateView = () => {
            const _countryName = $scope.selectedCountryController.visName;
            $state.go($state.current, { countryName: slugify(_countryName) });
        };

        // getting the countries data
        dataService.countries.then((data) => {
            $scope.countries = data;
            $scope.genderFilterValue = "menu-all";

            lineChartStructure = initializeLineChart("roc-linechart-container", "roc-linechart-country");
            developmentStructure = createPieStructure("development-piechart", "development");
            incomeStructure = createPieStructure("income-piechart", "income");

            fetchData($stateParams.countryName);
        });

        // watcher that listens for the slider updates
        $scope.$on("slideEnded", () => {
            sliderMin = $scope.sliderCountry.minValue;
            sliderMax = $scope.sliderCountry.maxValue;
            consideredYears = dataService.getActiveYears(sliderMin, sliderMax);
            updateStatistics();
            updateTitle();
        });

        /**
         * Function that updates the statistics
         */
        let updateStatistics = () => {
            dataService.selectedCountryController = $scope.selectedCountryController;

            // getting the total migrants by origin and destination
            dataService
                .getTotMigrantsByOriginAndDestination(
                    $scope.selectedCountryController.name,
                    sliderMin,
                    sliderMax,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    $scope.countryStatisticsValues.totalImmigrations = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the global rank statistics
            dataService
                .getGlobalRankStatistics(
                    $scope.selectedCountryController.name,
                    sliderMin,
                    sliderMax,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    $scope.globalRankCountryStatisticsValues.totalImmigrationsGlobalRank = setNotAvailable(
                        data.average_tot_migrants_global_rank,
                        true
                    );
                    $scope.globalRankCountryStatisticsValues.totalPopulationGlobalRank = setNotAvailable(
                        data.average_tot_population_global_rank,
                        true
                    );
                    $scope.globalRankCountryStatisticsValues.immigrationVsPopulationGlobalRank = setNotAvailable(
                        data.average_perc_immigration_global_rank,
                        true
                    );
                    $scope.globalRankCountryStatisticsValues.immigrationAverageAgeGlobalRank = setNotAvailable(
                        data.average_age_migrants_global_rank,
                        true
                    );
                    $scope.globalRankCountryStatisticsValues.refugeeVsImmigrationGlobalRank = setNotAvailable(
                        data.average_est_refugees_global_rank,
                        true
                    );

                    $scope.$apply();
                });

            // getting the total population by age and sex
            dataService
                .getTotPopulationByAgeAndSex(
                    $scope.selectedCountryController.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryStatisticsValues.totalPopulation = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the migrants as percentage of population
            dataService
                .getMigrantsAsPercentageOfPopulationByAgeAndSex(
                    $scope.selectedCountryController.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryStatisticsValues.immigrationVsPopulation = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the immigration average ag
            dataService
                .getImmigrationAverageAge(
                    $scope.selectedCountryController.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "")
                )
                .then((data) => {
                    $scope.countryStatisticsValues.immigrationAverageAge = setNotAvailable(data, false);
                });

            // getting the estimated refugees
            dataService
                .getEstimatedRefugees(
                    $scope.selectedCountryController.name,
                    consideredYears,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "_pct")
                )
                .then((data) => {
                    $scope.countryStatisticsValues.refugeeVsImmigration = setNotAvailable(data, false);
                    $scope.$apply();
                });

            // getting the country development statistics
            dataService
                .getCountryDevelopmentStatistic(
                    $scope.selectedCountryController.name,
                    consideredYears,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    drawPieChart(data, developmentStructure, "development");
                });

            // getting the country income statistics
            dataService
                .getCountryIncomeStatistic(
                    $scope.selectedCountryController.name,
                    consideredYears,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    drawPieChart(data, incomeStructure, "income");
                });

            // Extract the immigration by age groups:
            // 0-4, 5-18, 19-34, 35-54, 55-74, 75+
            dataService
                .getImmigrationByAgeGroups(
                    $scope.selectedCountryController.name,
                    sliderMin,
                    sliderMax,
                    $scope.genderFilterValue
                )
                .then((ageGroupsData) => {
                    if (stackedStructureCall) {
                        stackedStructure = initializeStackedBarChart(ageGroupsData, "age-stacked-barchart");
                        stackedStructureCall = false;
                    }
                    drawAgeStackedBarchart(ageGroupsData, ["Total", "Year"]);
                });

            // Extract Top 5 inward/outward migration countries
            countryService
                .getTopCountries($scope.selectedCountryController.name, sliderMin, sliderMax, $scope.genderFilterValue)
                .then((data) => {
                    $scope.top5InwardCountries = data["topInward"];
                    $scope.top5OutwardCountries = data["topOutward"];
                    $scope.$apply();
                });

            // getting the rate of change data
            dataService
                .getRateOfChange($scope.selectedCountryController.name, sliderMin, sliderMax, $scope.genderFilterValue)
                .then((data) => {
                    data = Object.keys(data).map((k) => ({ label: parseDate(k), value: data[k] }));

                    dataService.getGlobalMinMaxRateOfChange().then((minMax) => {
                        drawLineChart(data, "roc-linechart-country", minMax.MinRateOfChange, minMax.MaxRateOfChange);
                    });
                });
        };

        /**
         * Function that updates the pieChart values for the enter set
         * @param {array} data
         * @param {function} arc
         * @returns
         */
        let arcTweenEnter = (data) => {
            let i = d3.interpolate(this._current, data);

            this._current = i(0);
            return function (t) {
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
            radius = Math.min(SVG_WIDTH, SVG_HEIGHT) / 2;

            // creating the svg container
            let svg = svgContainer.append("svg").attr("width", SVG_WIDTH).attr("height", SVG_HEIGHT);

            // creating the pie chart group
            svg.append("g")
                .attr("class", type + "-slices")
                .attr("transform", `translate(${SVG_WIDTH / 2}, ${SVG_HEIGHT / 2 - 20})`);

            // creating the labels group
            svg.append("g")
                .attr("class", type + "-labels")
                .attr("transform", `translate(${SVG_WIDTH / 2}, ${SVG_HEIGHT / 2 - 20})`);

            arc = d3
                .arc()
                .outerRadius(radius - 50)
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
                .style("fill", (_, i) => colors(i))
                .transition()
                .duration(TRANSITION_DURATION)
                .attrTween("d", arcTweenEnter);
        };

        /**
         * Function that handles the update set of the pieChart
         * @param {array} update
         */
        let handleUpdate = (update) => {
            update
                .transition()
                .duration(TRANSITION_DURATION)
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
            enterLabel.append("circle").attr("class", type + "-label-outer-circle");

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
                .attr("transform", (_, i) => {
                    if (i < dataLength / 2) return `translate(${-(SVG_WIDTH / 2 - 50)}, ${SVG_HEIGHT / 2 - i * 20})`;
                    else {
                        return `translate(0, ${SVG_HEIGHT / 2 - legendIndex++ * 20})`;
                    }
                });

            // resetting the labels index
            legendIndex = 0;

            // creating the text of the labels
            enterLabel
                .append("text")
                .attr("stroke", (_, i) => colors(i))
                .attr("class", type + "-label-text");

            // creating the text for the legend
            enterLabel
                .append("text")
                .attr("x", "0")
                .attr("y", "5")
                .attr("class", type + "-legend-text")
                .attr("class", "label-text")
                .attr("transform", (_, i) => {
                    if (i < dataLength / 2) {
                        return `translate(${-(SVG_WIDTH / 2 - 70)}, ${SVG_HEIGHT / 2 - i * 20})`;
                    } else {
                        return `translate(15, ${SVG_HEIGHT / 2 - legendIndex++ * 20})`;
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
            // updating the inner circle label
            svgElement
                .selectAll("." + type + "-label-inner-circle")
                .data(piedData)
                .transition()
                .duration(TRANSITION_DURATION)
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

            // updating the label line
            svgElement
                .selectAll("." + type + "-label-line")
                .data(piedData)
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("x1", (d) => arc.centroid(d)[0])
                .attr("y1", (d) => arc.centroid(d)[1])
                .attr("x2", (d) => computePieChartEndOfLabelLineXY(d, arc, "x"))
                .attr("y2", (d) => computePieChartEndOfLabelLineXY(d, arc, "y"));

            // updating the label outer circle
            svgElement
                .selectAll("." + type + "-label-outer-circle")
                .data(piedData)
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("r", (d) => (d.value !== 0 ? 4 : 0))
                .attr("fill", (_, i) => colors(i))
                .attr("cx", (d) => computePieChartEndOfLabelLineXY(d, arc, "x"))
                .attr("cy", (d) => computePieChartEndOfLabelLineXY(d, arc, "y"));

            // updating the label text
            svgElement
                .selectAll("." + type + "-label-text")
                .data(piedData)
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("x", (d) => {
                    let x = computePieChartEndOfLabelLineXY(d, arc, "x");
                    if (x == undefined) x = 0;
                    let sign = x > 0 ? 1 : -1;
                    let xLabel = x + 10 * sign;
                    return xLabel;
                })
                .attr("y", (d) => {
                    let y = computePieChartEndOfLabelLineXY(d, arc, "y");
                    if (y == undefined) y = 0;
                    let sign = y > 0 ? 1 : -1;
                    let yLabel = y + 1 * sign;
                    return yLabel;
                })
                .attr("text-anchor", (d) => {
                    let centroid = arc.centroid(d);
                    let midAngle = Math.atan2(centroid[1], centroid[0]);
                    let x = Math.cos(midAngle) * (radius - 45);
                    return x > 0 ? "start" : "end";
                })
                .attr("font-size", "small")
                .text((d) => (d.data.percentage !== "0.0" ? d.data.percentage + "%" : ""));
        };

        /**
         * Function that computes the position of the outer circle in the pieChart
         * @param {object} d
         * @param {function} arc
         * @param {string} coord
         * @returns
         */
        let computePieChartEndOfLabelLineXY = (d, arc, pos) => {
            if (d.value == 0) {
                if (pos === "x") return arc.centroid[0];
                if (pos === "y") return arc.centroid[1];
            }

            let centroid = arc.centroid(d);
            let midAngle = Math.atan2(centroid[1], centroid[0]);
            let x = Math.cos(midAngle) * (radius - 35);
            let y = Math.sin(midAngle) * (radius - 35);

            if (pos === "x") return x;
            if (pos === "y") return y;
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
                    (update) => handleUpdate(update),
                    (exit) => exit.remove()
                );

            svgElement
                .select("." + type + "-labels")
                .selectAll("." + type + "-label")
                .data(piedData)
                .join(
                    (enter) => handleEnterLabels(enter, data.length, type),
                    (update) => handleUpdateLabels(svgElement, piedData, type),
                    (exit) => exit.remove()
                );
        };

        let initializeStackedBarChart = (data, containerId) => {
            let containerElem = d3.select("#" + containerId);

            // creating the svg container
            let svgElem = containerElem
                .append("svg")
                .attr("width", SVG_WIDTH)
                .attr("height", SVG_HEIGHT)
                .attr("class", "background-gray-transparent border-1-gray border-radius-10px padding-10-px")
                .append("g")
                .attr("transform", `translate(${SVG_MARGINS.left + SVG_MARGINS.right}, 10)`);

            // Y axis container
            svgElem.append("g").attr("font-size", "10px").attr("class", "grid-lines y-axis");

            // X axis container
            svgElem
                .append("g")
                .attr("transform", `translate(0, ${SVG_HEIGHT - SVG_MARGINS.bottom - SVG_MARGINS.top})`)
                .attr("class", "axis-dark-cyan x-axis");

            // Groups container
            svgElem.append("g").classed("groups", true);

            // Tooltip element
            let tooltipElem = svgElem.append("g").classed("age-stacked-barchart-tooltip", true).classed("hide", true);

            tooltipElem
                .append("rect")
                .attr("width", 40)
                .attr("height", 20)
                .attr("fill", "white")
                .style("padding", "1em")
                .style("opacity", 0.5);

            tooltipElem
                .append("text")
                .attr("x", 20)
                .attr("dy", "1.2em")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .style("text-anchor", "middle");

            // Color legend container
            svgElem
                .append("g")
                .classed("age-stacked-barchart-legend-container", true)
                .attr("transform", `translate(0, ${-SVG_MARGINS.bottom - SVG_MARGINS.top})`);

            return { svgElement: svgElem };
        };

        let drawAgeStackedBarchart = (data) => {
            const timeFormat = d3.timeFormat("%Y").parse;
            const barGroups = d3.map(data, (d) => +d.Year);
            const subgroups = Object.keys(data[0]).filter((i) => !["Total", "Year"].includes(i));
            const colorScale = d3.scaleOrdinal(d3.schemePaired.slice(0, subgroups.length));
            let stackedData = d3.stack().keys(subgroups)(data);

            let dataNaN = false;

            dataIsNaN: for (const yearSubgroup of stackedData) {
                for (const yearDatum of yearSubgroup) {
                    if (Object.values(yearDatum.data).includes(NaN)) {
                        console.log("Age groups not available");
                        dataNaN = true;
                        break dataIsNaN;
                    }
                }
            }

            if (dataNaN) {
                stackedData = [];

                const xPos = Math.round(SVG_WIDTH / 2) - 1.6 * (SVG_MARGINS.right + SVG_MARGINS.left);
                const yPos = Math.round(SVG_HEIGHT / 2) - SVG_MARGINS.top;

                stackedStructure.svgElement
                    .append("text")
                    .classed("data-not-available", true)
                    .classed("label-text", true)
                    .attr("x", xPos)
                    .attr("y", yPos)
                    .style("text-anchor", "start")
                    .style("opacity", "0")
                    .text("Age groups data not available!")
                    .transition()
                    .duration(TRANSITION_DURATION)
                    .style("opacity", "1");
            } else {
                stackedStructure.svgElement
                    .selectAll(".data-not-available")
                    .transition()
                    .duration(TRANSITION_DURATION)
                    .style("opacity", "0")
                    .remove();
            }

            // Set all the scales
            let xScale = createScale(barGroups, [0, SVG_WIDTH - SVG_MARGINS.left - SVG_MARGINS.right], "band", 0.16);

            let yScale = createScale(
                [0, d3.max(stackedData, (layerData) => d3.max(layerData, (d) => d[1]))],
                [SVG_HEIGHT - SVG_MARGINS.bottom - SVG_MARGINS.top, 0],
                "linear"
            );

            stackedStructure.svgElement.select(".y-axis").call(
                d3
                    .axisLeft()
                    .scale(yScale)
                    .tickSize(-SVG_WIDTH)
                    .tickSizeOuter(0)
                    .ticks(6)
                    .tickFormat((d) => d + "%")
            );

            stackedStructure.svgElement.select(".x-axis").call(d3.axisBottom().scale(xScale).tickFormat(timeFormat));

            let groupsContainer = stackedStructure.svgElement.select(".groups");

            let groupsElems = groupsContainer.selectAll(".group").data(stackedData, (d) => d.key);

            groupsElems
                .exit()
                .selectAll("rect")
                .transition()
                .duration(TRANSITION_DURATION)
                .style("opacity", "0")
                .remove();

            let groupsEnter = groupsElems
                .enter()
                .append("g")
                .classed("group", true)
                .attr("fill", (_, i) => colorScale(i));

            groupsElems = groupsEnter.merge(groupsElems);

            let groupRects = groupsElems.selectAll("rect").data((d) => d);

            groupRects
                .exit()
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("width", 0)
                .style("opacity", "0")
                .remove();

            let groupRectsEnter = groupRects
                .enter()
                .append("rect")
                .attr("x", (d) => xScale(d.data.Year))
                .attr("y", (d) => yScale(d[1]))
                .attr("width", 0)
                .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
                .style("opacity", "0");

            groupRectsEnter
                .on("mouseover", () => tooltipElem.classed("hide", false))
                .on("mouseout", () => tooltipElem.classed("hide", true))
                .on("mousemove", (e, d) => {
                    let xPos = d3.pointer(e)[0] - 15;
                    let yPos = d3.pointer(e)[1] - 25;

                    tooltipElem.attr("transform", "translate(" + xPos + "," + yPos + ")");

                    tooltipElem.select("text").text((d[1] - d[0]).toFixed(1) + "%");
                });

            groupRectsEnter
                .transition()
                .duration(TRANSITION_DURATION)
                .delay(300)
                .attr("width", xScale.bandwidth())
                .style("opacity", "1");

            groupRects
                .transition()
                .duration(TRANSITION_DURATION)
                .delay(150)
                .attr("x", (d) => xScale(d.data.Year))
                .attr("y", (d) => yScale(d[1]))
                .attr("width", xScale.bandwidth())
                .attr("height", (d) => yScale(d[0]) - yScale(d[1]));

            const tooltipElem = stackedStructure.svgElement.select(".age-stacked-barchart-tooltip");

            const getLegendTranslation = (datumId) => {
                const vertDelta = 16;

                // Get legend row/col Id
                const r = Math.floor(datumId / 3);
                const c = datumId % 3;

                switch (c) {
                    case 0:
                        return `translate(${-SVG_WIDTH},
                            ${SVG_HEIGHT + vertDelta + 15 * (r + 1)})`;
                    case 1:
                        return `translate(${-SVG_WIDTH + 150},
                                ${SVG_HEIGHT + vertDelta + 15 * (r + 1)})`;
                    case 2:
                        return `translate(${-SVG_WIDTH + 300},
                        ${SVG_HEIGHT + vertDelta + 15 * (r + 1)})`;
                }
            };

            // Draw layers legend
            const legendContainer = stackedStructure.svgElement.select(".age-stacked-barchart-legend-container");

            const legendElem = legendContainer
                .selectAll(".age-stacked-barchart-legend")
                .data(colorScale.range())
                .enter()
                .append("g")
                .classed("age-stacked-barchart-legend", true)
                .attr("width", 50)
                .attr("height", 12)
                .attr("transform", (_, i) => "translate(" + i * 15 + ",30)")
                .attr("transform", (_, i) => getLegendTranslation(i));

            legendElem
                .append("rect")
                .attr("x", SVG_WIDTH - 12)
                .attr("width", 12)
                .attr("height", 12)
                .attr("stroke", "white")
                .style("fill", (_, i) => colorScale(i));

            legendElem
                .append("text")
                .classed("label-text", true)
                .attr("x", SVG_WIDTH + 5)
                .attr("y", 7)
                .attr("dy", "-0em")
                .style("text-anchor", "start")
                .text((_, i) => subgroups[i] + " years");
        };

        /**
         * Function that initialize the svg containing the rate of change lineChart for the selected country
         * @param {string} container
         * @param {string} lineChartId
         * @returns
         */

        let initializeLineChart = (container, lineChartId) => {
            let rateOfChangeLineChartContainer = d3.select("#" + container);

            // creating the svg container
            let svg = rateOfChangeLineChartContainer
                .append("svg")
                .attr("width", SVG_WIDTH)
                .attr("height", SVG_HEIGHT)
                .attr("class", "background-gray-transparent border-radius-10px border-1-gray padding-10-px")
                .attr("id", lineChartId + "-svg");

            // creating the path group
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, 10)`)
                .attr("id", lineChartId)
                .attr("class", "country-linechart");

            // creating the path circles group
            svg.append("g").attr("transform", `translate(${SVG_MARGINS.left}, 10)`).attr("class", "year-circles");

            // creating the x-axis group
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_HEIGHT - SVG_MARGINS.bottom})`)
                .attr("color", "white")
                .style("font-size", "10px")
                .attr("id", lineChartId + "-xaxis")
                .attr("class", "axis-dark-cyan");

            // creating the text label group
            svg.append("g")
                .append("text")
                .classed("font-size-12px", true)
                .classed("legend", true)
                .attr("transform", `translate(${SVG_WIDTH - SVG_MARGINS.right}, ${SVG_HEIGHT - 5})`)
                .style("text-anchor", "end")
                .text("Time span");

            // creating the y-axis group
            svg.append("g")
                .attr("color", "white")
                .attr("transform", `translate(${SVG_MARGINS.left + SVG_MARGINS.right}, 10)`)
                .style("font-size", "10px")
                .attr("id", lineChartId + "-yaxis")
                .attr("class", "grid-lines y-axis");

            // creating the text label group
            svg.append("g")
                .append("text")
                .classed("font-size-12px", true)
                .classed("legend", true)
                .attr("transform", `rotate(-90) translate(-10, ${SVG_MARGINS.left - 10})`)
                .style("text-anchor", "end")
                .attr("stroke", "#FFFFFF!important")
                .text("Rate of Change");

            return { lineChartStructure: svg };
        };

        let drawLineChart = (data, lineChartId, globalMinY, globalMaxY) => {
            // inserting a info label if no data is available
            if (data.length == 0) {
                d3.select("#" + lineChartId)
                    .selectAll("*")
                    .remove();
                lineChartStructure.lineChartStructure.select(".year-circles").selectAll(".year-circle").remove();
                d3.select("#" + lineChartId)
                    .append("text")
                    .attr("id", "data-not-available-label")
                    .attr("stroke", "gray")
                    .attr("stroke-width", 0.5)
                    .attr("font-size", "13px")
                    .attr("y", 85)
                    .attr("x", 30)
                    .attr("transform", `translate(${SVG_MARGINS.left + SVG_MARGINS.right}, 10)`)
                    .text("Data not available! Please select a valid time span.");
                return;
            } else {
                d3.select("#data-not-available-label").remove();
            }

            let xScale = createScale(
                [d3.timeYear.offset(data[0].label, -1), d3.timeYear.offset(data[data.length - 1].label, +1)],
                [SVG_MARGINS.left, SVG_WIDTH - SVG_MARGINS.right - SVG_MARGINS.left],
                "time"
            );
            let yScale = createScale([globalMinY, globalMaxY], [SVG_HEIGHT - SVG_MARGINS.bottom - 10, 0], "linear");

            d3.select("#" + lineChartId + "-xaxis")
                .transition()
                .duration(TRANSITION_DURATION)
                .call(d3.axisBottom(xScale).ticks(data.length));

            d3.select("#" + lineChartId + "-yaxis")
                .transition()
                .duration(TRANSITION_DURATION)
                .call(d3.axisLeft(yScale).tickSize(-SVG_WIDTH).tickSizeOuter(0).ticks(8));

            lineChartStructure.lineChartStructure
                .select(".year-circles")
                .selectAll(".year-circle")
                .data(data)
                .join(
                    (enter) => {
                        enter
                            .append("circle")
                            .attr("class", "year-circle")
                            .attr("fill", "none")
                            .attr("cx", (d) => xScale(d.label))
                            .attr("cy", (d) => yScale(d.value))
                            .attr("r", 3);
                    },
                    (update) =>
                        update
                            .transition()
                            .duration(TRANSITION_DURATION)
                            .attr("cx", (d) => xScale(d.label))
                            .attr("cy", (d) => yScale(d.value)),
                    (exit) => exit.remove()
                );

            let lineGenerator = d3
                .line()
                .x(function (d) {
                    return xScale(d.label);
                })
                .y(function (d) {
                    return yScale(d.value);
                });

            if (data.length == 1) {
                let pointValue = data[0].value;
                d3.select("#" + lineChartId)
                    .append("line")
                    .attr("class", "country-linechart-path")
                    .attr("id", "single-point-line")
                    .attr("x1", SVG_MARGINS.left)
                    .attr("y1", yScale(pointValue))
                    .attr("x2", SVG_WIDTH - SVG_MARGINS.right - SVG_MARGINS.left)
                    .attr("y2", yScale(pointValue));
            } else {
                d3.select("#single-point-line").remove();
            }

            d3.select("#" + lineChartId)
                .selectAll("path")
                .data([data])
                .join(
                    (enter) =>
                        enter
                            .append("path")
                            .attr("class", "country-linechart-path")
                            .call((enter) =>
                                enter
                                    .transition()
                                    .duration(TRANSITION_DURATION)
                                    .attr("d", (d) => lineGenerator(d))
                            ),
                    (update) =>
                        update.call((update) =>
                            update
                                .transition()
                                .duration(TRANSITION_DURATION)
                                .attr("d", (d) => lineGenerator(d))
                        ),
                    (exit) => exit.transition().duration(TRANSITION_DURATION).remove()
                );
        };

        /**
         * Function that handles the click on the gender radio group filter in the menu
         * @param {string} value
         */
        $scope.handleGenderClick = function (value) {
            $scope.genderFilterValue = value;
            updateStatistics();
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
            $scope.selectedCountryController = value;
            $scope.updateView();
        };

        /**
         * Function that handles the mouse enter on the top countries flags
         * @param {string} value
         */
        $scope.showTopCountryHint = function (value, event, type) {
            $scope.selectedTopFlag = value;
            $scope.sendReceiveTopCountries = type;

            let tooltip = document.getElementById("top-flags-tooltip");
            let tooltipText = document.getElementById("tooltip-text");

            if (type == "Sent") {
                tooltipText.classList.remove("color-red");
                tooltipText.classList.add("color-green");
            } else {
                tooltipText.classList.remove("color-green");
                tooltipText.classList.add("color-red");
            }

            tooltip.classList.remove("display-none");
            tooltip.classList.add("display-block");
            tooltip.style.top = event.clientY - 50 + "px";
            tooltip.style.left = event.clientX + "px";
            tooltip.style.zIndex = 100;
        };

        /**
         * Function that handles the mouse out on the top countries flags
         * @param {string} value
         */
        $scope.hideTopCountryHint = function (event, type) {
            let tooltip = document.getElementById("top-flags-tooltip");
            tooltip.classList.remove("display-block");
            tooltip.classList.add("display-none");
        };

        /**
         * Function that clears the search box in the source select filter
         */
        $scope.clearSearch = () => {
            $scope.searchSource = "";
            $scope.searchDestination = "";
        };

        $scope.updateSearch = (event) => {
            event.stopPropagation();
        };

        /**
         * Function that updates the selected years in the title section
         */
        let updateTitle = () => {
            let yearText = null;

            let _activeYears = dataService.getActiveYears(sliderMin, sliderMax);
            let activeLength = _activeYears.length;

            if (activeLength == 1) {
                yearText = sliderMin;
            } else {
                yearText = `${sliderMin} - ${sliderMax}`;
            }

            titleYear.innerHTML = yearText;
        };
    }
})();
