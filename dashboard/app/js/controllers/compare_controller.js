(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("compareController", compareController);

    /**
     * Function that handle the compare page logic
     */

    compareController.$inject = ["$scope", "dataService"];

    function compareController($scope, dataService) {
        $scope.secondaryMenuSelectedValue = "compare";
        $scope.secondaryMenuButtons = dataService.menuButtons;
        $scope.countryInfoTypeButtons = dataService.countryInfoTypeButtons;
        $scope.countryInfoValue = "global_rank";
        $scope.genderButtons = dataService.genderButtons;
        $scope.leftSendToRight;
        $scope.rightSendToLeft;
        $scope.searchSource = "";

        // plots variables
        let commonStructure;
        let lineRateOfChangeChartStructure;
        let lineRefugeesStructure;
        let firsCommonStructureCall = true;
        let firstRateOfChangeLineChartStructureCall = true;
        let firstRefugeesLineChartStructureCall = true;
        let countryColors = { left: "#1f78b4", right: "#a6cee3" };

        let sliderMin = 1990;
        let sliderMax = 2019;
        let consideredYears = dataService.getActiveYears(sliderMin, sliderMax);

        // object that contain the statistics values for the left countries
        $scope.countryLeftStatisticsValues = {
            totalImmigrations: "",
            totalPopulation: "",
            immigrationVsPopulation: "",
            immigrationAverageAge: "",
            refugeeVsImmigration: "",
        };

        // object that contain the global statistics for the left countries
        $scope.globalRankCountryLeftStatisticsValues = {
            totalImmigrationsGlobalRank: "",
            totalPopulationGlobalRank: "",
            immigrationVsPopulationGlobalRank: "",
            immigrationAverageAgeGlobalRank: "",
            refugeeVsImmigrationGlobalRank: "",
        };

        // object that contain the statistics values for the right countries
        $scope.countryRightStatisticsValues = {
            totalImmigrations: "",
            totalPopulation: "",
            immigrationVsPopulation: "",
            immigrationAverageAge: "",
            refugeeVsImmigration: "",
        };

        // object that contain the global statistics for the right countries
        $scope.globalRankCountryRightStatisticsValues = {
            totalImmigrationsGlobalRank: "",
            totalPopulationGlobalRank: "",
            immigrationVsPopulationGlobalRank: "",
            immigrationAverageAgeGlobalRank: "",
            refugeeVsImmigrationGlobalRank: "",
        };

        // getting the countries from the service
        dataService.countries.then((data) => {
            $scope.countries = data;

            // setting the predefined countries
            $scope.selectedCountry = {
                left: $scope.countries[101],
                right: $scope.countries[70],
            };

            $scope.genderFilterValue = "menu-all";
            $scope.updateStatisticsLeft();
            $scope.updateStatisticsRight();
            $scope.$apply();
        });

        /**
         * Function that updates the statistics for the left country
         * It is called when the left selector changes
         */
        $scope.updateStatisticsLeft = () => {
            dataService
                .getGlobalRankStatistics(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    $scope.globalRankCountryLeftStatisticsValues.totalImmigrationsGlobalRank = setNotAvailable(
                        data.average_tot_migrants_global_rank,
                        true
                    );
                    $scope.globalRankCountryLeftStatisticsValues.totalPopulationGlobalRank = setNotAvailable(
                        data.average_tot_population_global_rank,
                        true
                    );
                    $scope.globalRankCountryLeftStatisticsValues.immigrationVsPopulationGlobalRank = setNotAvailable(
                        data.average_perc_immigration_global_rank,
                        true
                    );
                    $scope.globalRankCountryLeftStatisticsValues.immigrationAverageAgeGlobalRank = setNotAvailable(
                        data.average_age_migrants_global_rank,
                        true
                    );
                    $scope.globalRankCountryLeftStatisticsValues.refugeeVsImmigrationGlobalRank = setNotAvailable(
                        data.average_est_refugees_global_rank,
                        true
                    );
                    $scope.$apply();
                });

            // getting the total migrants by origin and destination
            dataService
                .getTotMigrantsByOriginAndDestination(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.totalImmigrations = [setNotAvailable(data, false), data];
                    $scope.$apply();
                });

            // getting the total population by age and sex
            dataService
                .getTotPopulationByAgeAndSex(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.totalPopulation = [setNotAvailable(data, false), data];
                    $scope.$apply();
                });

            // getting the migrants as percentage of population
            dataService
                .getMigrantsAsPercentageOfPopulationByAgeAndSex(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.immigrationVsPopulation = [setNotAvailable(data, false), data];
                    $scope.$apply();
                });

            // getting the immigration average ag
            dataService
                .getImmigrationAverageAge(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "")
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.immigrationAverageAge = [setNotAvailable(data, false), data];
                });

            // getting the estimated refugees
            dataService
                .getEstimatedRefugees(
                    $scope.selectedCountry.left.name,
                    consideredYears,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "_pct")
                )
                .then((data) => {
                    $scope.countryLeftStatisticsValues.refugeeVsImmigration = [setNotAvailable(data, false), data];
                    $scope.$apply();
                });

            // getting the mutual migration statistics
            dataService
                .getMutualMigration($scope.selectedCountry.left.name, $scope.selectedCountry.right.name)
                .then((data) => {
                    $scope.leftSendToRight = transformNumberFormat(data.countryOneSend, false, 0);
                    $scope.rightSendToLeft = transformNumberFormat(data.countryTwoSend, false, 0);
                    $scope.$apply();
                });

            // getting the common regions destinations
            dataService
                .getMutualCommonMigrationDestinations(
                    $scope.selectedCountry.left.name,
                    $scope.selectedCountry.right.name,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    if (firsCommonStructureCall) {
                        commonStructure = initializeCommonMigrationStructure(data);
                        firsCommonStructureCall = false;
                    }
                    drawBarChart(data, commonStructure, [
                        $scope.selectedCountry.left.visName,
                        $scope.selectedCountry.right.visName,
                    ]);
                });

            // getting the rate of change for the left country
            dataService
                .getRateOfChange($scope.selectedCountry.left.name, sliderMin, sliderMax, $scope.genderFilterValue)
                .then((data) => {
                    data = Object.keys(data).map((k) => ({ label: parseDate(k), value: data[k] }));
                    dataService.getGlobalMinMaxRateOfChange().then((minMax) => {
                        if (firstRateOfChangeLineChartStructureCall) {
                            lineRateOfChangeChartStructure = initializeRateOfChangeLineChart(
                                data,
                                minMax,
                                "change-rate-container"
                            );
                            firstRateOfChangeLineChartStructureCall = false;
                        }
                        drawRateOfChangeLineChart(data, "left-line-chart", "left-line-chart-class", [
                            $scope.selectedCountry.left.visName,
                            $scope.selectedCountry.right.visName,
                        ]);
                    });
                });

            // getting the estimated refugees by year for both countries
            dataService
                .getEstimatedRefugeesByYear($scope.selectedCountry.left.name, $scope.selectedCountry.right.name)
                .then((data) => {
                    if (firstRefugeesLineChartStructureCall) {
                        lineRefugeesStructure = initializeRefugeesLineChart(data, "refugees-container");
                        firstRefugeesLineChartStructureCall = false;
                    }
                    drawRefugeesLineChart(data, "left-refugees", "left-line-chart-class", "left", [
                        $scope.selectedCountry.left.visName,
                        $scope.selectedCountry.right.visName,
                    ]);
                });

            // getting brain drain and child statistics for the left country
            dataService
                .getChildBrainDrainStatistics(
                    $scope.selectedCountry.left.name,
                    sliderMin,
                    sliderMax,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    $scope.childLeftStatistics = transformNumberFormat(data["0-14"], false, 0);
                    $scope.childrenLeftPercentage = transformNumberFormat(
                        (data["0-14"] / data["Total"]) * 100,
                        false,
                        0
                    );
                    $scope.totalLeftMigrants = transformNumberFormat(data["Total"], false, 0);
                    $scope.brainDrainLeftStatistics = transformNumberFormat(data["20-34"], false, 0);
                    $scope.drainBrainLeftPercentage = transformNumberFormat(
                        (data["20-34"] / data["Total"]) * 100,
                        false,
                        0
                    );
                });
        };

        /**
         * Function that updates the statistics for the right country
         * It is called when the right selector changes
         */
        $scope.updateStatisticsRight = () => {
            // getting the ranking statistics
            dataService
                .getGlobalRankStatistics(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    $scope.globalRankCountryRightStatisticsValues.totalImmigrationsGlobalRank = setNotAvailable(
                        data.average_tot_migrants_global_rank,
                        true
                    );
                    $scope.globalRankCountryRightStatisticsValues.totalPopulationGlobalRank = setNotAvailable(
                        data.average_tot_population_global_rank,
                        true
                    );
                    $scope.globalRankCountryRightStatisticsValues.immigrationVsPopulationGlobalRank = setNotAvailable(
                        data.average_perc_immigration_global_rank,
                        true
                    );
                    $scope.globalRankCountryRightStatisticsValues.immigrationAverageAgeGlobalRank = setNotAvailable(
                        data.average_age_migrants_global_rank,
                        true
                    );
                    $scope.globalRankCountryRightStatisticsValues.refugeeVsImmigrationGlobalRank = setNotAvailable(
                        data.average_est_refugees_global_rank,
                        true
                    );
                    $scope.$apply();
                });

            // getting total migration by origin and destination statistics
            dataService
                .getTotMigrantsByOriginAndDestination(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.totalImmigrations = [setNotAvailable(data, false), data];
                    $scope.$apply();
                });

            // getting the total population by age and sex
            dataService
                .getTotPopulationByAgeAndSex(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.totalPopulation = [setNotAvailable(data, false), data];
                    $scope.$apply();
                });

            // getting the migrants as percentage of population
            dataService
                .getMigrantsAsPercentageOfPopulationByAgeAndSex(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "Total")
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.immigrationVsPopulation = [setNotAvailable(data, false),data];
                    $scope.$apply();
                });

            // getting the immigration average ag
            dataService
                .getImmigrationAverageAge(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "")
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.immigrationAverageAge = [setNotAvailable(data, false), data];
                });

            // getting the estimated refugees
            dataService
                .getEstimatedRefugees(
                    $scope.selectedCountry.right.name,
                    consideredYears,
                    dataService.getSelectedGenderColumn($scope.genderFilterValue, "_pct")
                )
                .then((data) => {
                    $scope.countryRightStatisticsValues.refugeeVsImmigration = [setNotAvailable(data, false), data];
                    $scope.$apply();
                });

            // getting the mutual migration statistics
            dataService
                .getMutualMigration($scope.selectedCountry.left.name, $scope.selectedCountry.right.name)
                .then((data) => {
                    $scope.leftSendToRight = transformNumberFormat(data.countryOneSend, false, 0);
                    $scope.rightSendToLeft = transformNumberFormat(data.countryTwoSend, false, 0);
                    $scope.$apply();
                });

            // getting the statistics for the common regions migration
            dataService
                .getMutualCommonMigrationDestinations(
                    $scope.selectedCountry.left.name,
                    $scope.selectedCountry.right.name,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    if (firsCommonStructureCall) {
                        commonStructure = initializeCommonMigrationStructure(data);
                        firsCommonStructureCall = false;
                    }
                    drawBarChart(data, commonStructure, [
                        $scope.selectedCountry.left.visName,
                        $scope.selectedCountry.right.visName,
                    ]);
                });

            // getting the migration rate of change for the left country
            dataService
                .getRateOfChange($scope.selectedCountry.right.name, sliderMin, sliderMax, $scope.genderFilterValue)
                .then((data) => {
                    data = Object.keys(data).map((k) => ({ label: parseDate(k), value: data[k] }));

                    dataService.getGlobalMinMaxRateOfChange().then((minMax) => {
                        if (firstRateOfChangeLineChartStructureCall) {
                            lineRateOfChangeChartStructure = initializeRateOfChangeLineChart(
                                data,
                                minMax,
                                "change-rate-container"
                            );
                            firstRateOfChangeLineChartStructureCall = false;
                        }
                        drawRateOfChangeLineChart(data, "right-line-chart", "right-line-chart-class", [
                            $scope.selectedCountry.left.visName,
                            $scope.selectedCountry.right.visName,
                        ]);
                    });
                });

            // getting the estimated refugees for each year for both countries
            dataService
                .getEstimatedRefugeesByYear($scope.selectedCountry.left.name, $scope.selectedCountry.right.name)
                .then((data) => {
                    if (firstRefugeesLineChartStructureCall) {
                        lineRefugeesStructure = initializeRefugeesLineChart(data, "refugees-container");
                        firstRefugeesLineChartStructureCall = false;
                    }
                    drawRefugeesLineChart(data, "right-refugees", "right-line-chart-class", "right", [
                        $scope.selectedCountry.left.visName,
                        $scope.selectedCountry.right.visName,
                    ]);
                });

            // getting the brain drain and child statistics for the right country
            dataService
                .getChildBrainDrainStatistics(
                    $scope.selectedCountry.right.name,
                    sliderMin,
                    sliderMax,
                    $scope.genderFilterValue
                )
                .then((data) => {
                    $scope.childRightStatistics = transformNumberFormat(data["0-14"], false, 0);
                    $scope.childrenRightPercentage = transformNumberFormat(
                        (data["0-14"] / data["Total"]) * 100,
                        false,
                        0
                    );
                    $scope.brainDrainRightStatistics = transformNumberFormat(data["20-34"], false, 0);
                    $scope.drainBrainRightPercentage = transformNumberFormat(
                        (data["20-34"] / data["Total"]) * 100,
                        false,
                        0
                    );
                    $scope.totalRightMigrants = transformNumberFormat(data["Total"], false, 0);
                });
        };

        /**
         * Function that creates the svg structure for drawing the common regions grouped bar chart statistics
         * @param {array} data
         * @returns
         */
        let initializeCommonMigrationStructure = (data) => {
            let container = d3.select("#common-migration");

            // creating the svg container
            let svg = container
                .append("svg")
                .attr("width", SVG_WIDTH)
                .attr("height", SVG_HEIGHT)
                .attr("class", "background-gray-transparent border-1-gray border-radius-10px padding-10-px");

            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_MARGINS.top})`)
                .attr("class", "main-group");

            let subgroups = ["left", "right"];
            let groups = data.map((d) => d.label);

            // creating the x axis
            let x = createScale(groups, [SVG_MARGINS.left, SVG_WIDTH - SVG_MARGINS.right], "band");

            // creating the y axis
            let y = createScale(
                [0, d3.max(data, (d) => Math.max(d.value.left[0], d.value.right[0]))],
                [SVG_HEIGHT - SVG_MARGINS.top - SVG_MARGINS.bottom, 0],
                "linear"
            );

            // creating the subgroups
            let xSubGroup = createScale(subgroups, [SVG_MARGINS.left, x.bandwidth() + SVG_MARGINS.right], "band", 0.2);

            // creating the bars labels container
            svg.append("g")
                .attr("class", "axis-dark-cyan")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_HEIGHT - SVG_MARGINS.bottom})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "rotate(25)")
                .attr("text-anchor", "start");

            // inserting the x axis
            svg.append("g")
                .attr("class", "grid-lines y-axis")
                .attr("transform", `translate(${SVG_MARGINS.left + SVG_MARGINS.right}, ${SVG_MARGINS.top})`)
                .call(d3.axisLeft(y).tickSize(-SVG_WIDTH).tickSizeOuter(0).tickFormat(d3.format(".2s")));

            let svgGroups = svg
                .select(".main-group")
                .selectAll("g")
                .data(data)
                .enter()
                .append("g")
                .attr("transform", (d) => `translate(${x(d.label) - SVG_MARGINS.left}, 0)`)
                .attr("class", "groups");

            return {
                svgElement: svg,
                groups: svgGroups,
                x: x,
                y: y,
                subgroups: subgroups,
                xSubgroup: xSubGroup,
            };
        };

        /**
         * Function that handles the enter set for the common migration grouped bar chart
         * @param {array} enter
         * @param {object} svgElement
         */
        let handleCommonMigrationEnter = (enter, svgElement) => {
            enter
                .append("rect")
                .style("fill", (_, i) => getCountryColor(i))
                .attr("x", (d) => svgElement.xSubgroup(d.key))
                .attr("y", svgElement.y(0))
                .attr("width", svgElement.xSubgroup.bandwidth())
                .attr("height", 0);
        };

        /**
         * Function that handles the update set for the common migration grouped bar chart
         * @param {array} update
         * @param {number} yMax
         * @param {object} svgElement
         */
        let handleCommonMigrationUpdate = (update, yMax, svgElement) => {
            svgElement.y.domain([0, yMax]);
            // updating the y axis
            svgElement.svgElement
                .select("g.grid-lines.y-axis")
                .transition()
                .duration(TRANSITION_DURATION)
                .call(d3.axisLeft(svgElement.y).tickSize(-SVG_WIDTH).tickSizeOuter(0).tickFormat(d3.format(".2s")));

            // updating the bars
            update
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("y", (d) => svgElement.y(d.val))
                .attr("height", (d) => SVG_HEIGHT - SVG_MARGINS.bottom - SVG_MARGINS.top - svgElement.y(d.val));
        };

        /**
         * Function that handles the enter set for the labels of the common migration bar chart
         * @param {array} enter
         * @param {object} svgElement
         */
        let handleCommonMigrationLabelsEnter = (enter, svgElement) => {
            enter
                .append("text")
                .attr("stroke", "#FFFFFF")
                .attr("stroke-width", 1)
                .attr("font-size", "10px")
                .attr("x", (d) => svgElement.xSubgroup(d.key))
                .attr("y", svgElement.y(0))
                .text((d) => transformNumberFormat(d.val, false, 0));
        };

        /**
         * Function that handles the update set for the labels of the common migration bar chart
         * @param {array} update
         * @param {object} svgElement
         */
        let handleCommonMigrationLabelsUpdate = (update, svgElement) => {
            update
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("y", (d) => svgElement.y(d.val))
                .text((d) => transformNumberFormat(d.val, false, 0))
                .attr(
                    "transform",
                    (d) => `rotate(-25, ${svgElement.xSubgroup(d.key)},
                        ${svgElement.y(d.val) - svgElement.xSubgroup.bandwidth() / 2})`
                );
        };

        /**
         * Function that draws the common migration bar chart
         * @param {array} data
         * @param {object} svgElement
         */
        let drawBarChart = (data, svgElement, legendData) => {
            let yMax = d3.max(data, (d) => Math.max(d.value.left[0], d.value.right[0]));

            // drawing the bars
            svgElement.svgElement
                .selectAll(".groups")
                .data(data)
                .selectAll("rect")
                .data((d) =>
                    svgElement.subgroups.map((k) => ({ key: k, val: d.value[k][0], percentage: d.value[k][1] }))
                )
                .join(
                    (enter) => handleCommonMigrationEnter(enter, svgElement),
                    (update) => handleCommonMigrationUpdate(update, yMax, svgElement),
                    (exit) => exit.remove()
                );

            // setting the labels for the bars
            svgElement.svgElement
                .selectAll(".groups")
                .data(data)
                .selectAll("text")
                .data((d) =>
                    svgElement.subgroups.map((k) => ({ key: k, val: d.value[k][0], percentage: d.value[k][1] }))
                )
                .join(
                    (enter) => handleCommonMigrationLabelsEnter(enter, svgElement),
                    (update) => handleCommonMigrationLabelsUpdate(update, svgElement),
                    (exit) => exit.remove()
                );

            // inserting the legend
            svgElement.svgElement
                .selectAll(".legend")
                .data(legendData)
                .join(
                    (enter) => {
                        let group = enter
                            .append("g")
                            .attr("class", "legend")
                            .attr(
                                "transform",
                                (_, i) =>
                                    `translate(${-SVG_WIDTH + SVG_MARGINS.left + SVG_MARGINS.right + i * 200}, ${
                                        SVG_HEIGHT - 13
                                    } )`
                            );
                        group
                            .append("rect")
                            .attr("x", SVG_WIDTH + 10)
                            .attr("width", LEGEND_SQUARE_DIM)
                            .attr("height", LEGEND_SQUARE_DIM)
                            .style("fill", (_, i) => getCountryColor(i));

                        group
                            .append("text")
                            .attr("x", SVG_WIDTH + 40)
                            .attr("y", LEGEND_SQUARE_DIM)
                            .attr("font-size", "small")
                            .style("text-anchor", "start")
                            .text((d) => d);
                    },
                    (update) => {
                        update.each(function (d) {
                            let group = d3.select(this);
                            group.select("text").text(d);
                        });
                    }
                );
        };

        /**
         * Function that initialize the svg containing for the rate of change lineChart for the selected country
         * @param {string} container
         * @param {object} margin
         * @param {string} lineChartId
         * @returns
         */
        let initializeRateOfChangeLineChart = (data, minMax, container) => {
            let lineChartContainer = d3.select("#" + container);

            // creating the svg container
            let svg = lineChartContainer
                .append("svg")
                .attr("width", SVG_WIDTH)
                .attr("height", SVG_HEIGHT)
                .attr("class", "background-gray-transparent border-1-gray border-radius-10px padding-10-px");

            //creating the group for the left line chart
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_MARGINS.top})`)
                .attr("class", "left-line-chart");

            //creating the group for the right line chart
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_MARGINS.top})`)
                .attr("class", "right-line-chart");

            // creating the x-scale
            let xScale = createScale(
                [d3.timeYear.offset(data[0].label, -1), d3.timeYear.offset(data[5].label, +1)],
                [SVG_MARGINS.left, SVG_WIDTH - SVG_MARGINS.right - 15],
                "time"
            );

            // creating the y-scale
            let yScale = createScale(
                [minMax.MinRateOfChange, minMax.MaxRateOfChange],
                [SVG_HEIGHT - SVG_MARGINS.bottom - SVG_MARGINS.top, 0],
                "linear"
            );

            // inserting the x axis
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_HEIGHT - SVG_MARGINS.bottom})`)
                .style("font-size", "10px")
                .attr("class", "axis-dark-cyan")
                .call(d3.axisBottom(xScale).ticks(data.length))
                .selectAll("text")
                .attr("transform", "rotate(25)")
                .attr("text-anchor", "start");

            // inserting the y axis
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left + SVG_MARGINS.right}, ${SVG_MARGINS.top})`)
                .style("font-size", "10px")
                .attr("class", "grid-lines y-axis")
                .call(d3.axisLeft(yScale).tickSize(-SVG_WIDTH).tickSizeOuter(0).ticks(8));

            // inserting the circles
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_MARGINS.top})`)
                .attr("class", "year-circles");

            return { lineChartStructure: svg, xScale: xScale, yScale: yScale };
        };

        /**
         * Function that creates the svg structure for the line chart plot
         * @param {array} data
         * @param {object} structure
         * @param {string} lineClass
         */
        let drawRateOfChangeLineChart = (data, structure, lineClass, legendData) => {
            let lineGenerator = d3
                .line()
                .x((d) => lineRateOfChangeChartStructure.xScale(d.label))
                .y((d) => lineRateOfChangeChartStructure.yScale(d.value));

            // inserting the paths
            lineRateOfChangeChartStructure.lineChartStructure
                .select("." + structure)
                .selectAll("path")
                .data([data])
                .join(
                    (enter) => {
                        enter
                            .append("path")
                            .attr("class", lineClass)
                            .transition()
                            .duration(TRANSITION_DURATION)
                            .attr("d", (d) => lineGenerator(d));
                    },
                    (update) => {
                        update
                            .transition()
                            .duration(TRANSITION_DURATION)
                            .attr("d", (d) => lineGenerator(d));
                    },
                    (exit) => exit.remove()
                );

            // inserting the path circles
            lineRateOfChangeChartStructure.lineChartStructure
                .select(".year-circles")
                .selectAll("." + lineClass + "year-circle")
                .data(data)
                .join(
                    (enter) => {
                        enter
                            .append("circle")
                            .attr("class", lineClass + "year-circle " + lineClass)
                            .attr("fill", "none")
                            .attr("stroke", getCountryColor(structure.split("-")[0]))
                            .attr("cx", (d) => lineRateOfChangeChartStructure.xScale(d.label))
                            .attr("cy", (d) => lineRateOfChangeChartStructure.yScale(d.value))
                            .attr("r", 3);
                    },
                    (update) =>
                        update
                            .transition()
                            .duration(TRANSITION_DURATION)
                            .attr("cx", (d) => lineRateOfChangeChartStructure.xScale(d.label))
                            .attr("cy", (d) => lineRateOfChangeChartStructure.yScale(d.value)),
                    (exit) => exit.remove()
                );

            // inserting the legend
            lineRateOfChangeChartStructure.lineChartStructure
                .selectAll(".legend")
                .data(legendData)
                .join(
                    (enter) => {
                        let group = enter
                            .append("g")
                            .attr("class", "legend")
                            .attr(
                                "transform",
                                (_, i) =>
                                    `translate(${-SVG_WIDTH + SVG_MARGINS.left + SVG_MARGINS.right + i * 200}, ${
                                        SVG_HEIGHT - 13
                                    } )`
                            );
                        group
                            .append("rect")
                            .attr("x", SVG_WIDTH + 10)
                            .attr("width", LEGEND_SQUARE_DIM)
                            .attr("height", LEGEND_SQUARE_DIM)
                            .style("fill", (_, i) => getCountryColor(i));

                        group
                            .append("text")
                            .attr("x", SVG_WIDTH + 40)
                            .attr("y", LEGEND_SQUARE_DIM)
                            .attr("font-size", "small")
                            .style("text-anchor", "start")
                            .text((d) => d);
                    },
                    (update) => {
                        update.each(function (d) {
                            let group = d3.select(this);
                            group.select("text").text(d);
                        });
                    }
                );
        };

        /**
         * Function that initialize the svg containing for the refugees lineChart for the selected country
         * @param {string} container
         * @param {object} margin
         * @param {string} lineChartId
         * @returns
         */
        let initializeRefugeesLineChart = (data, container) => {
            let refugeesContainer = d3.select("#" + container);

            // crating the svg container
            let svg = refugeesContainer
                .append("svg")
                .attr("width", SVG_WIDTH)
                .attr("height", SVG_HEIGHT)
                .attr("class", "background-gray-transparent border-1-gray border-radius-10px padding-10-px");

            // creating the group for the left refugees
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_MARGINS.top})`)
                .attr("class", "left-refugees");

            // creating the group for the right refugees
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_MARGINS.top})`)
                .attr("class", "right-refugees");

            // crating the x scale
            let xScale = d3
                .scaleTime()
                .domain([d3.timeYear.offset(data.left[0].year, -1), d3.timeYear.offset(data.left[6].year, +1)])
                .range([SVG_MARGINS.left, SVG_WIDTH - SVG_MARGINS.right - 15]);

            // crating the y scale
            let yScale = d3.scaleLinear().range([SVG_HEIGHT - SVG_MARGINS.bottom - SVG_MARGINS.top, 0]);

            // inserting the y axis
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_HEIGHT - SVG_MARGINS.bottom})`)
                .style("font-size", "10px")
                .attr("class", "axis-dark-cyan")
                .call(d3.axisBottom(xScale).ticks(6))
                .selectAll("text")
                .attr("transform", "rotate(25)")
                .attr("text-anchor", "start");

            // inserting the group for the y axis
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left + SVG_MARGINS.right}, ${SVG_MARGINS.top})`)
                .style("font-size", "10px")
                .attr("class", "grid-lines y-axis");

            // inserting the circles for the left country
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_MARGINS.top})`)
                .attr("class", "year-circles-left");

            // for the right country
            svg.append("g")
                .attr("transform", `translate(${SVG_MARGINS.left}, ${SVG_MARGINS.top})`)
                .attr("class", "year-circles-right");

            return { lineChartStructure: svg, xScale: xScale, yScale: yScale };
        };

        /**
         * Function that creates the svg structure for the line chart plot
         * @param {array} data
         * @param {object} structure
         * @param {string} lineClass
         */
        let drawRefugeesLineChart = (data, structure, lineClass, country, legendData) => {
            let bothData = data.left.map((d) => d.value).concat(data.right.map((d) => d.value));
            let dataMinMax = [d3.min(bothData), d3.max(bothData)];

            // updating the y scale
            lineRefugeesStructure.yScale.domain([dataMinMax[0], dataMinMax[1]]);

            // inserting the y axiss
            lineRefugeesStructure.lineChartStructure
                .select("g.grid-lines.y-axis")
                .transition()
                .duration(TRANSITION_DURATION)
                .call(
                    d3
                        .axisLeft(lineRefugeesStructure.yScale)
                        .tickSize(-SVG_WIDTH)
                        .tickSizeOuter(0)
                        .tickFormat(d3.format(".2s"))
                );

            let lineGenerator = d3
                .line()
                .x((d) => lineRefugeesStructure.xScale(d.year))
                .y((d) => lineRefugeesStructure.yScale(d.value));

            // inserting the path
            lineRefugeesStructure.lineChartStructure
                .select("." + structure)
                .selectAll("path")
                .data([country === "left" ? data.left : data.right])
                .join(
                    (enter) => {
                        enter
                            .append("path")
                            .attr("class", lineClass)
                            .attr("d", (d) => lineGenerator(d));
                    },
                    (update) => {
                        update
                            .transition()
                            .duration(TRANSITION_DURATION)
                            .attr("d", (d) => lineGenerator(d));

                        lineRefugeesStructure.lineChartStructure
                            .select(structure === "left-refugees" ? ".right-refugees" : ".left-refugees")
                            .selectAll("path")
                            .data([country === "left" ? data.right : data.left])
                            .transition()
                            .duration(1000)
                            .attr("d", (d) => lineGenerator(d));
                    },
                    (exit) => exit.remove()
                );

            // inserting the circles
            lineRefugeesStructure.lineChartStructure
                .select(".year-circles-" + country)
                .selectAll("." + lineClass + "-year-circle")
                .data(country === "left" ? data.left : data.right)
                .join(
                    (enter) => {
                        enter
                            .append("circle")
                            .attr("class", lineClass + "-year-circle " + lineClass)
                            .attr("fill", "none")
                            .attr("stroke", getCountryColor(country))
                            .attr("cx", (d) => lineRefugeesStructure.xScale(d.year))
                            .attr("cy", (d) => lineRefugeesStructure.yScale(d.value))
                            .attr("r", 3);
                    },
                    (update) => {
                        update
                            .transition()
                            .duration(TRANSITION_DURATION)
                            .attr("cx", (d) => lineRefugeesStructure.xScale(d.year))
                            .attr("cy", (d) => lineRefugeesStructure.yScale(d.value));

                        lineRefugeesStructure.lineChartStructure
                            .select(country === "left" ? ".year-circles-right" : ".year-circles-left")
                            .selectAll("circle")
                            .data(country === "left" ? data.right : data.left)
                            .transition()
                            .duration(TRANSITION_DURATION)
                            .attr("cy", (d) => {
                                return lineRefugeesStructure.yScale(d.value);
                            });
                    },
                    (exit) => exit.remove()
                );

            // inserting the legend
            lineRefugeesStructure.lineChartStructure
                .selectAll(".legend")
                .data(legendData)
                .join(
                    (enter) => {
                        let group = enter
                            .append("g")
                            .attr("class", "legend")
                            .attr(
                                "transform",
                                (_, i) =>
                                    `translate(${-SVG_WIDTH + SVG_MARGINS.left + SVG_MARGINS.right + i * 200}, ${
                                        SVG_HEIGHT - 13
                                    } )`
                            );
                        group
                            .append("rect")
                            .attr("x", SVG_WIDTH + 10)
                            .attr("width", LEGEND_SQUARE_DIM)
                            .attr("height", LEGEND_SQUARE_DIM)
                            .style("fill", (_, i) => getCountryColor(i));

                        group
                            .append("text")
                            .attr("x", SVG_WIDTH + 40)
                            .attr("y", LEGEND_SQUARE_DIM)
                            .attr("font-size", "small")
                            .style("text-anchor", "start")
                            .text((d) => d);
                    },
                    (update) => {
                        update.each(function (d) {
                            let group = d3.select(this);
                            group.select("text").text(d);
                        });
                    }
                );
        };

        /**
         * Function that controls the winner country for what concern the statistics comparison
         * @param {string} field
         * @param {boolean} left
         * @param {string} type
         * @returns
         */
        $scope.comparisonWinner = (field, left, type) => {
            if (left) {
                if (type == "rank") {
                    return (
                        parseInt($scope.globalRankCountryLeftStatisticsValues[field], 10) <
                        parseInt($scope.globalRankCountryRightStatisticsValues[field], 10)
                    );
                } else {
                    return (
                        $scope.countryLeftStatisticsValues[field][1] >
                        $scope.countryRightStatisticsValues[field][1]
                    );
                }
            } else {
                if (type == "rank") {
                    return (
                        parseInt($scope.globalRankCountryRightStatisticsValues[field], 10) <
                        parseInt($scope.globalRankCountryLeftStatisticsValues[field], 10)
                    );
                } else
                    return (
                        $scope.countryRightStatisticsValues[field][1] >
                        $scope.countryLeftStatisticsValues[field][1]
                    );
            }
        };

        /**
         * Function that handles the click on the gender radio group filter in the menu
         * @param {string} value
         */
        $scope.handleGenderClick = function (value) {
            $scope.genderFilterValue = value;
            $scope.updateStatisticsLeft();
            $scope.updateStatisticsRight();
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
         * Function that clears the search box in the source select filter
         */
        $scope.clearSearch = () => {
            $scope.searchSource = "";
            $scope.searchDestination = "";
        };

        /**
         * Function that show the tooltip for the brain drain and children statistic
         * @param {string} source
         * @param {event} event
         */
        $scope.showLabelDescription = (source, event) => {
            let tooltip = document.querySelector("#compare-tooltip");
            tooltip.classList.remove("display-none");
            tooltip.classList.add("display-block");

            tooltip.style.top = event.clientY - 50 + "px";
            tooltip.style.left = event.clientX + "px";
            tooltip.style.zIndex = 100;

            if (source === "children") {
                tooltip.innerHTML = "Share of migrant stock with an age between 0 and 14 years.";
            } else {
                tooltip.innerHTML = "Share of migrant stock with an age between 20 and 35 years.";
            }
        };

        /**
         * Function that hide the tooltip for the brain drain and children statistic
         */
        $scope.hideLabelDescription = () => {
            let tooltip = document.querySelector("#compare-tooltip");
            tooltip.classList.remove("display-block");
            tooltip.classList.add("display-none");
        };

        /**
         * Function that stops the propagation of the event passed as parameter
         * @param {event} event
         */
        $scope.updateSearch = (event) => {
            event.stopPropagation();
        };

        /**
         * Function that returns o color according to the passed parameter
         * @param {string/int} country
         * @returns
         */
        let getCountryColor = (country) => {
            if (country === "left" || country == 0) return countryColors.left;
            else return countryColors.right;
        };
    }
})();
