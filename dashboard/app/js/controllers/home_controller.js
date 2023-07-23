(function () {
    "use strict";

    // reloading the angular module
    angular.module("main").controller("homeController", homeController);

    /**
     * Function that handlle the user login
     */

    homeController.$inject = ["$scope", "dataService", "$timeout"];

    function homeController($scope, dataService, $timeout) {
        $scope.yearFeeds = [];
        $scope.playPauseBtn = null;
        $scope.isRunning = true;
        $scope.selectedSources = [];
        $scope.selectedDestinations = [];
        $scope.searchSource = "";
        $scope.searchDestination = "";
        $scope.genderFilterValue = "menu-all";
        $scope.selectedCountries = {
            source: [],
            destination: [],
        };

        dataService.countries.then((data) => {
            $scope.countries = data;
        });

        $scope.genderButtons = dataService.genderButtons;
        $scope.isSideMenuOpened = true;

        const ARCS_DURATION = 3 * TRANSITION_DURATION;
        let localDashArray = d3.local();
        let svgMapWidth;
        let svgMapHeight;
        let worldJson;
        let homeInfoBox;
        let zoomMap;
        let yearIdx = 0;
        let yearRep = 0;
        let isPaused = false;
        let selectionChanged = false;
        let revertedSelection = false;
        let textNoFilters = null;
        // let selectorSources = null;
        // let selectorDestinations = null;
        let yearsData = [];
        let yearsData_origDest = [];

        let tooltipSources = null;
        let tooltipDest = null;

        let areaChartObject = null;

        // TODO: Change last two magnitude colors
        let yearsInterval = ["1990-1995", "1995-2000", "2000-2005", "2005-2010", "2010-2015", "2015-2019"];
        let migrationMagnitudeColors = ["#ffffb2", "#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"];

        // Simplest solution: set the thresholds by hand (after having looked at the dataset's min/max values)
        // Min weight dataset: 1
        // Max weight dataset: 2763183
        let migrationThreshs = [100, 1000, 10000, 100000, 1000000];
        $scope.weightThresh = migrationThreshs[2];

        let weightScale = d3.scaleThreshold().domain(migrationThreshs).range(migrationMagnitudeColors);

        let validCountries = {
            source: [],
            destination: [],
        };

        // function that returns a color given the parameter
        let strokeColor = (d) => {
            return d === $scope.weightThresh ? "#0093c4" : "#ffffff";
        };

        /**
         * Check if there is at least 1 arc available to display
         * for each year of the requested selection.
         */
        let checkValidSelection = () => {
            let _yearData_oD = filterOrigDest(yearsData);

            let numArcs = d3.rollup(
                _yearData_oD,
                (v) => v.length,
                (d) => d.year
            );
            let leastNumArcs = d3.least(numArcs);

            return !(leastNumArcs === undefined
                        || numArcs.size != yearsInterval.length
                        || leastNumArcs[1] == 0);
        };

        let checkChanged = () => {
            let sourceChanged = !equals(
                $scope.selectedCountries.source,
                validCountries.source,
                Country.sort,
                Country.equals
            );

            let destinationChanged = !equals(
                $scope.selectedCountries.destination,
                validCountries.destination,
                Country.sort,
                Country.equals
            );

            return sourceChanged || destinationChanged;
        };

        let revertSelection = () => {
            revertedSelection = true;

            $scope.selectedCountries.source = [...validCountries.source];
            $scope.selectedCountries.destination = [...validCountries.destination];
        };

        let _handleOnSelectionChanged = () => {
            if (selectionChanged) {
                if (!checkValidSelection()) {
                    // TODO: Display error in UI
                    homeInfoBox.classList.add("color-orange");
                    homeInfoBox.classList.remove("color-lightgray");
                    homeInfoBox.innerHTML = "Invalid selection.\n" + "Reverting to previous state...";

                    setTimeout(function () {
                        homeInfoBox.innerHTML = "Information on hover will be shown here";
                        homeInfoBox.classList.remove("color-orange");
                        homeInfoBox.classList.add("color-lightgray");
                    }, 3000);

                    revertSelection();
                    return;
                }

                if (!checkChanged()) {
                    // TODO: Display message in UI
                    homeInfoBox.innerHTML = "Selection did not change.";

                    setTimeout(function () {
                        homeInfoBox.innerHTML = "Information on hover will be shown here";
                    }, 3000);

                    return;
                }

                validCountries.source = [...$scope.selectedCountries.source];
                validCountries.destination = [...$scope.selectedCountries.destination];

                resetArcs();
            }
        };

        // controlling the state of the sources variable
        $scope.$watch("selectedCountries.source", (newVal, oldVal) => {
            if (revertedSelection) {
                revertedSelection = false;
                return;
            }

            if (!equals(newVal, oldVal, Country.sort, Country.equals)) {
                selectionChanged = true;

                let selectedOrig = $scope.selectedCountries.source;
                let selectedDest = $scope.selectedCountries.destination;

                // if (newVal.length == 0) {
                //     selectorSources.classed("hide", true);
                // } else {
                //     selectedOrig.sort(Country.sort);
                //     selectorSources.classed("hide", false);
                // }

                if (newVal.length == 0) {
                    tooltipSources.classed("hide", true);

                    if (selectedDest.length == 0) {
                        textNoFilters.classed("hide", false);
                    }
                } else {
                    if (selectedDest.length == 0) textNoFilters.classed("hide", true);

                    selectedOrig.sort(Country.sort);
                    tooltipSources.classed("hide", false);
                }
            } else {
                selectionChanged = false;
            }
        });

        // controlling the state of the destinations variable
        $scope.$watch("selectedCountries.destination", (newVal, oldVal) => {
            if (revertedSelection) {
                revertedSelection = false;
                return;
            }

            if (!equals(newVal, oldVal, Country.sort, Country.equals)) {
                selectionChanged = true;

                let selectedOrig = $scope.selectedCountries.source;
                let selectedDest = $scope.selectedCountries.destination;

                if (newVal.length == 0) {
                    tooltipDest.classed("hide", true);

                    if (selectedOrig.length == 0) {
                        textNoFilters.classed("hide", false);
                    }
                } else {
                    if (selectedOrig.length == 0) textNoFilters.classed("hide", true);

                    selectedDest.sort(Country.sort);
                    tooltipDest.classed("hide", false);
                }
            } else {
                selectionChanged = false;
            }
        });

        let filterOrigDest = (_yearsData) => {
            let _yearsData_weighted = _yearsData.filter((d) => d.weight >= $scope.weightThresh);

            let countriesOrig = $scope.selectedCountries.source.map((c) => c.name);
            let countriesDest = $scope.selectedCountries.destination.map((c) => c.name);

            if (countriesOrig.length == 0 && countriesDest.length == 0) {
                return [..._yearsData_weighted];
            } else if (countriesOrig.length == 0) {
                return _yearsData_weighted.filter((d) => countriesDest.includes(d.destinationName));
            } else if (countriesDest.length == 0) {
                return _yearsData_weighted.filter((d) => countriesOrig.includes(d.sourceName));
            } else {
                return _yearsData_weighted.filter(
                    (d) => countriesOrig.includes(d.sourceName) && countriesDest.includes(d.destinationName)
                );
            }
        };

        /**
         * Function that interrupt the arcs transition
         */
        let pauseArcs = () => {
            $scope.geoObject.element.selectAll(".arch-path").interrupt();
            $scope.geoObject.element.selectAll("circle").interrupt();
        };

        /**
         * Function that computes the remaining duration of a paused transition
         * @param {object} currentElem
         * @returns
         */
        let resumedDuration = (currentElem) => {
            let dashArray = localDashArray.get(currentElem);
            let trajectoryEndpoints = dashArray.split(",").map(Number);

            let elapsedPct = trajectoryEndpoints[0] / trajectoryEndpoints[1];

            return ARCS_DURATION * (1 - elapsedPct);
        };

        /**
         * Function that handles the number of repetitions of the transitions for each year
         * @param {object} map
         * @param {array} arcElems
         */
        let _handleArcsRepetition = (map, arcElems) => {
            if (yearRep == HOME_MAP_YEAR_REPS) {
                yearRep = 0;
                yearIdx++;

                drawArcs(map);
            } else {
                yearRep++;

                updateArcs(map, arcElems, true);
            }
        };

        /**
         * Function that handles the mouse over for the paused arcs
         * @param {object} path
         * @param {object} d
         * @param {object} source
         * @param {object} destination
         * @param {object} homeInfoBox
         */
        let arcsMouseOver = (path, d, source, destination, homeInfoBox) => {
            // getting the source country
            d3.select("#" + source.id)
                .transition()
                .delay(400)
                .attr("fill", HOVERED_COLOR)
                .attr("stroke", "#63b3d4");

            // getting the destination country
            d3.select("#" + destination.id)
                .transition()
                .delay(400)
                .attr("fill", HOVERED_COLOR)
                .attr("stroke", "#63b3d4");

            // updating the path characteristics
            d3.select(path).attr("stroke", "#0093c4").style("stroke-linecap", "round").attr("stroke-width", 4);
            d3.select(path)
                .transition()
                .duration(500)
                .attr("stroke-dasharray", path.getTotalLength() + ", 0");

            // setting the opacity for the non selected paths
            $scope.geoObject.element
                .selectAll(".arch-path")
                .filter((c) => {
                    return !(c.sourceName === d.sourceName && c.destinationName === d.destinationName);
                })
                .transition()
                .duration(200)
                .style("opacity", 0.1);

            d3.select(path).style("opacity", 1);

            // filling the info box
            homeInfoBox.innerHTML = `
                        <div class="width-100 color-white font-size-medium">
                        <div class="display-flex padding-3-px"><div class="width-100-px color-darkcyan">Source:</div><div class="text-right width-100">${
                            source.properties.visName
                        }</div></div>
                        <div class="display-flex padding-3-px"><div class="width-100-px color-darkcyan">Destination:</div><div class="text-right width-100"> ${
                            destination.properties.visName
                        }</div></div>
                        <div class="display-flex padding-3-px"><div class="width-200-px color-darkcyan">Migration flow:</div><div class="text-right width-100"> ${transformNumberFormat(
                            d.weight
                        )}</div></div>
                        <div class="display-flex padding-3-px"><div class="width-100-px color-darkcyan">Years:</div><div class="text-right width-100"> ${
                            d.year
                        }</div></div>
                        </div>
                        `;
        };

        /**
         * Function that handles the mouse out for the paused arcs
         * @param {object} path
         * @param {object} source
         * @param {object} destination
         * @param {object} homeInfoBox
         */
        let arcsMouseOut = (path, source, destination, homeInfoBox) => {
            // getting the source country
            d3.select("#" + source.id)
                .interrupt()
                .attr("fill", HOME_COUNTRY_COLOR)
                .attr("stroke", HOME_COUNTRY_MAP_STROKE);

            // getting the destination country
            d3.select("#" + destination.id)
                .interrupt()
                .attr("fill", HOME_COUNTRY_COLOR)
                .attr("stroke", HOME_COUNTRY_MAP_STROKE);

            // changing the path characteristics
            d3.select(path)
                .attr("stroke", getMigrationColor(d3.select(path).data()[0].weight))
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", localDashArray.get(path));

            // resuming the path length
            d3.select(path).interrupt().attr("stroke-dashoffset", path.getTotalLength());
            $scope.geoObject.element.selectAll(".arch-path").interrupt().transition().duration(200).style("opacity", 1);

            // filling the info box
            homeInfoBox.innerHTML = "Information on hover will be shown here";
        };

        // FIXME: Handle split on undefined (dashArray)
        /**
         * Function that resume the animation for the paused arcs
         */
        let resumeArcs = () => {
            let map = $scope.geoObject.element;

            // removing event listeners for the arcs
            let arcElems = map
                .select(".arch-container")
                .selectAll(".arch-path")
                .on("mouseover", null)
                .on("mouseout", null);

            // resuming the path characteristics
            let arcElemsTrans = arcElems
                .transition()
                .duration(function () {
                    return resumedDuration(this);
                })
                .ease(d3.easeLinear)
                .attr("stroke", (d) => getMigrationColor(d.weight))
                .attr("stroke-dashoffset", function () {
                    return this.getTotalLength();
                })
                .attrTween("stroke-dasharray", function () {
                    let dashArray = localDashArray.get(this);
                    let startP = dashArray.split(",").map(Number)[0];

                    return tweenDash(this, startP);
                })
                .on("interrupt", function (d) {
                    let source = worldJson.find((c) => c.properties.name === d.sourceName);
                    let destination = worldJson.find((c) => c.properties.name === d.destinationName);

                    localDashArray.set(this, d3.select(this).attr("stroke-dasharray"));

                    d3.select(this).on("mouseover", function () {
                        arcsMouseOver(this, d, source, destination, homeInfoBox);
                    });

                    d3.select(this).on("mouseout", function () {
                        arcsMouseOut(this, source, destination, homeInfoBox);
                    });
                });

            arcElemsTrans.end().then(
                () => {
                    _handleArcsRepetition(map, arcElems);
                },
                (e) => {
                    // console.log(e);
                }
            );
        };

        /**
         * Drawing the map
         */
        dataService.loadWorldMap().then((_worldJson) => {
            textNoFilters = d3.select("#text-no-filters");

            // selectorSources = d3.select("#select-sources");
            // selectorDestinations = d3.select("#select-destinations");

            tooltipSources = d3.select("#sources-tooltip");
            tooltipDest    = d3.select("#destinations-tooltip");

            worldJson = _worldJson;

            let weightElems = initCirclesWeight();

            updateYearTitle(yearIdx);

            $scope.geoObject = initMap(worldJson);
            drawMap($scope.geoObject);

            areaChartObject = initAreaChart();

            let playPause_container = d3.select("#playpause-btn-container");
            playPause_container.classed("hide", false);

            $scope.playPauseBtn = IC_PAUSE;
            $scope.$apply();

            // handling the play/pause button for the arcs
            document.getElementById("playpause-btn").addEventListener("click", () => {
                isPaused = $scope.playPauseBtn === IC_PAUSE;

                $scope.playPauseBtn = isPaused ? IC_PLAY : IC_PAUSE;

                if (isPaused) {
                    pauseArcs();
                } else {
                    resumeArcs();
                }

                $scope.$apply();
            });

            homeInfoBox = document.querySelector("#home-info-box");

            // handling the removal of all the filters
            document.getElementById("clear-all").addEventListener("click", () => {
                $scope.selectedCountries.source = [];
                $scope.selectedCountries.destination = [];

                _handleOnSelectionChanged();

                $scope.$apply();
            });

            weightElems.on("click", function (_, d) {
                let _oldThresh = $scope.weightThresh.valueOf();

                $scope.weightThresh = d;

                if (!checkValidSelection()) {
                    homeInfoBox.classList.add("color-orange");
                    homeInfoBox.classList.remove("color-lightgray");

                    homeInfoBox.innerHTML = "Invalid selection.\n" + "Reverting to previous state...";

                    $scope.weightThresh = _oldThresh;

                    setTimeout(function () {
                        homeInfoBox.innerHTML = "Information on hover will be shown here";
                        homeInfoBox.classList.remove("color-orange");
                        homeInfoBox.classList.add("color-lightgray");
                    }, 5000);

                    return;
                }

                weightElems.select("text").attr("stroke", (d) => strokeColor(d));

                resetArcs();
            });

            homeInfoBox = document.querySelector("#home-info-div");
        });

        /**
         * Function that define the path for the arcs
         * @param {object} source
         * @param {object} target
         * @returns
         */
        const defineArc = (source, target) => {
            if (source && target) {
                const sourceX = source[0],
                    sourceY = source[1];

                const targetX = target[0],
                    targetY = target[1];
                const dx = targetX - sourceX,
                    dy = targetY - sourceY;

                let euclideanDistance = Math.sqrt(dx * dx + dy * dy);

                let sharpness = 0;
                if (euclideanDistance < 100) {
                    sharpness = 0.1;
                } else {
                    sharpness = 1.5;
                }

                const midXY = [(sourceX + targetX) / 2, (sourceY + targetY) / 2];

                return (
                    "M" +
                    sourceX +
                    "," +
                    sourceY +
                    "S" +
                    (midXY[0] + 50 * sharpness) +
                    "," +
                    (midXY[1] - 75 * sharpness) +
                    "," +
                    targetX +
                    "," +
                    targetY
                );
            } else {
                return "M0,0,l0,0z";
            }
        };

        /**
         * Function that inserts the arcs in the map
         * @param {object} map
         */
        let drawArcs = (map) => {
            if (yearIdx == yearsInterval.length - 1) yearIdx = 0;

            updateAreaChartTick(areaChartObject, yearIdx);

            let yearData = yearsData_origDest.filter((arc) => arc.year == yearsInterval[yearIdx]);

            let arcElems = map
                .select(".arch-container")
                .selectAll(".arch-path")
                .data(yearData)
                .join("path")
                .attr("class", "arch-path")
                .attr("stroke-width", 2)
                .attr("stroke", "none")
                .attr("fill", "none")
                .attr("d", (d) => defineArc(d.sourceCentroid, d.destinationCentroid))
                .attr("stroke-dashoffset", null)
                .attr("stroke-dasharray", null);                    

            arcElems
                .on("mouseover", null)
                .on("mouseout", null);

            updateArcs(map, arcElems);
        };

        /**
         * Function that handle the arc transition element
         * @param {object} node
         * @param {object} startP
         * @returns
         */
        function tweenDash(node, startP) {
            var l = node.getTotalLength();
            var i = d3.interpolateString(`${startP},` + l, l + "," + l);

            return function (t) {
                return i(t);
            };
        }

        /**
         * Function that draw the centroid circles for the destination countries
         * @param {object} geoObject
         * @param {object} destinations
         * @param {boolean} show
         */
        let drawCentroids = (geoObject, destinations, show) => {
            if (show) {
                // createGlows(geoObject.element);
                const geoCentroids = geoObject.element
                    .selectAll("circle")
                    .data(geoObject.data.filter((d) => destinations.some((dd) => dd === d.properties.name)));
                geoCentroids
                    .join("circle")
                    .attr("fill", "#63b3d4")
                    .style("fill-opacity", 0.5)
                    .attr("stroke", "#63b3d4")
                    .attr("cx", (d) => d.properties.props.C[0])
                    .attr("cy", (d) => d.properties.props.C[1])
                    .transition()
                    .duration(ARCS_DURATION / 2)
                    .attr("r", 3)
                    .transition()
                    .duration(ARCS_DURATION / 2)
                    .attr("r", 3);

                // geoCentroids.style("filter", "url(#glow)");
            }
        };

        /**
         *  Function that removes all the centroids
         * @param {object} geoObject
         */
        let removeCentroids = (geoObject) => {
            geoObject.element.selectAll("circle").remove();
        };

        /**
         * Function that updates the arcs transition
         * @param {object} map
         * @param {array} arcElems
         * @param {boolean} delayTrans
         */
        let updateArcs = (map, arcElems, delayTrans = false) => {
            let destinations = [];
            arcElems.each((d) => {
                if (!destinations.includes(d.destinationName)) destinations.push(d.destinationName);
            });

            removeCentroids($scope.geoObject);

            drawCentroids($scope.geoObject, destinations, delayTrans);

            let arcElemsTrans = arcElems
                .transition()
                .ease(d3.easeLinear)
                .duration(ARCS_DURATION)
                .delay(!delayTrans ? 0 : 500)
                .attr("stroke", (d) => {
                    return getMigrationColor(d.weight);
                })
                .attr("stroke-dashoffset", function () {
                    return this.getTotalLength();
                })
                .attrTween("stroke-dasharray", function (d) {
                    return tweenDash(this, 0);
                })
                .on("interrupt", function (d) {
                    let source = worldJson.find((c) => c.properties.name === d.sourceName);
                    let destination = worldJson.find((c) => c.properties.name === d.destinationName);
                    localDashArray.set(this, d3.select(this).attr("stroke-dasharray"));

                    d3.select(this).on("mouseover", function () {
                        arcsMouseOver(this, d, source, destination, homeInfoBox);
                    });

                    d3.select(this).on("mouseout", function () {
                        arcsMouseOut(this, source, destination, homeInfoBox);
                    });
                });

            arcElemsTrans.end().then(
                () => {
                    _handleArcsRepetition(map, arcElems);
                },
                (e) => {}
            );

            // arcElems.style("filter", "url(#glow)");
        };

        /**
         * Function that creates a glow effect
         * @param {object} map
         */
        const createGlows = (map) => {
            const defs = map.append("defs");
            const filter = defs.append("filter").attr("id", "glow");

            filter
                .append("feGaussianBlur")
                .attr("class", "blur")
                .attr("stdDeviation", "7")
                .attr("result", "coloredBlur");

            const feMerge = filter.append("feMerge");

            feMerge.append("feMergeNode").attr("in", "coloredBlur");
            feMerge.append("feMergeNode").attr("in", "SourceGraphic");
        };

        /**
         * Function that returns the migration color given the number passed as parameter
         * @param {number} weight
         * @returns
         */
        let getMigrationColor = (weight) => {
            return weightScale(weight);
        };

        /**
         * Function that creates the data structure for the arcs
         * @param {object} ioData
         * @returns
         */
        let extractYearsData = (ioData) => {
            let _yearsData = [];

            for (let c of ioData) {
                let prev = c;

                // All the countries need to be grabbed once,
                // so when c.Year moves to 1995 it means that
                // we have already visited all the countries
                if (c.Year == 1995) break;

                // c1   := All source countries
                // c    := All destination countries
                // prev := Source country at the previous year
                ioData.forEach((c1) => {
                    if (c.Destination == c1.Destination && c.Year != c1.Year) {
                        // Filter all source countries
                        // for the destination country c
                        let keys = Object.keys(c1).slice(4);

                        keys.forEach((k) => {
                            let weight = 0;
                            if (k !== c.Destination) {
                                weight = !(k in c) ? c1[k] : c1[k] - prev[k];

                                if (!isNaN(weight)) {
                                    let source = {
                                        prevTot: prev[k],
                                        nextTot: c1[k],
                                        sourceName: k,
                                        destinationName: c.Destination,
                                        fill: getMigrationColor(weight),
                                        year: prev.Year + "-" + c1.Year,
                                        sourceCentroid: ioData.find((e) => e.Destination === k).centroid,
                                        destinationCentroid: c.centroid,
                                        weight: weight,
                                    };

                                    _yearsData.push(source);
                                }
                            }
                        });
                        prev = c1;
                    }
                });
            }

            return _yearsData;
        };

        /**
         * Function that initialize the migration arcs
         * @param {object} map
         */
        let initArcs = (mapElem, loadData = true) => {
            dataService.getCountriesInwardOutwardMigrants($scope.genderFilterValue).then((ioData) => {
                if (loadData) {
                    yearsData = [];

                    yearsData = extractYearsData(ioData);
                }

                yearRep = 0;

                if (!mapElem.selectAll(".arch-container")._groups[0].length) {
                    mapElem.append("g").attr("class", "arch-container");
                }

                yearsData_origDest = [];
                yearsData_origDest = filterOrigDest(yearsData);

                updateArcsAmount(yearsData_origDest, yearIdx);

                drawAreaChart(areaChartObject, yearsData_origDest);

                // createGlows($scope.geoObject.element);
                drawArcs(mapElem);
            });
        };

        let updateArcsAmount = (_yearsData, _yearIdx) => {
            let _yearRange = yearsInterval[_yearIdx];
            let numArcs = _yearsData.filter((d) => d.year === _yearRange).length;

            d3.select("#arcs-amount").text(`Showing ${numArcs} migrations`);
        };

        /**
         * Function that initialize the world map
         * @param {object} worldData
         * @returns
         */
        let initMap = (worldData) => {
            let mapContainer = d3.select("#map");
            mapContainer.html("");

            svgMapWidth = mapContainer.node().getBoundingClientRect().width;
            svgMapHeight = mapContainer.node().getBoundingClientRect().height;

            let mapProjection = d3
                .geoMercator()
                .scale(170)
                .translate([svgMapWidth / 2, svgMapHeight / 2 + 128]);

            let geoPath = d3.geoPath().projection(mapProjection);

            let svgMapContainer = mapContainer.append("svg").attr("width", svgMapWidth).attr("height", svgMapHeight);

            let svgMap = svgMapContainer.append("g").attr("id", "map-group");

            zoomMap = d3
                .zoom()
                .scaleExtent([1, 10])
                .on("zoom", (e) => svgMap.attr("transform", e.transform));

            worldData.forEach((d) => {
                if (isBadCountry(d.properties)) return;

                d.properties.props["C"] = mapProjection(d3.geoCentroid(d));
            });

            svgMapContainer.call(zoomMap);
            svgMapContainer.call(zoomMap.transform, () => d3.zoomIdentity.scale(1));

            return {
                data: worldData,
                element: svgMap,
                path: geoPath,
                projection: mapProjection,
            };
        };

        /**
         * Function that handless the enter set of the map
         * @param {object} _enter
         * @param {object} _path
         */
        let _handleMapEnter = (_enter, _path) => {
            _enter
                .append("path")
                .attr("d", _path)
                .attr("class", "countries")
                .attr("id", (d) => d.id)
                .attr("fill", HOME_COUNTRY_COLOR)
                .attr("stroke", HOME_COUNTRY_MAP_STROKE)
                .on("mouseover", (e, d) => {
                    d3.select(e.target)
                        .transition()
                        .duration(100)
                        .attr("fill", HOVERED_COLOR)
                        .attr("stroke", "#63b3d4");

                    let countryImmigration = yearsData.filter((c) => c.destinationName === d.properties.name);

                    let distinctSources = [...new Set(countryImmigration.map((item) => item.sourceName))];
                    let totalCountryImmigrants = countryImmigration.reduce((sum, curr) => sum + +curr.weight, 0);

                    homeInfoBox.innerHTML = `
                    <div class="margin-left-20px">
                        <div class="display-flex">
                            <img width="40" height="30" src="${d.properties.flagPath}">
                            <div class="margin-left-20px color-white font-size-large margin-top-bottom-auto">${
                                d.properties.visName
                            }</div>
                        </div>
                        <div class="margin-top-20-px font-size-small float-left width-100">
                            <div class="margin-left-20-px float-left text-bold color-darkcyan">Total source countries</div><div class="margin-right-20-px float-right">${
                                distinctSources.length
                            } countries</div>
                        </div>
                        <div class="margin-top-10-px font-size-small float-left width-100">
                            <div class="margin-left-20-px float-left text-bold color-darkcyan">Immigration change 1990-2019</div><div class="margin-right-20-px float-right">${transformNumberFormat(
                                totalCountryImmigrants,
                                false,
                                0
                            )}</div>
                        </div>
                    </div>
                    `;
                })
                .on("mouseout", (e, d) => {
                    d3.select(e.target)
                        .transition()
                        .duration(100)
                        .attr("fill", HOME_COUNTRY_COLOR)
                        .attr("stroke", HOME_COUNTRY_MAP_STROKE);
                    homeInfoBox.innerHTML = "Information on hover will be shown here";
                });
        };

        /**
         * Function that draws the map
         * @param {object} geoObject
         */
        let drawMap = (geoObject) => {
            if (!geoObject.element.selectAll(".map-container")._groups[0].length) {
                geoObject.element.append("g").attr("class", "map-container");
            }
            geoObject.element
                .select(".map-container")
                .selectAll("path")
                .data(geoObject.data)
                .join(
                    (enter) => _handleMapEnter(enter, geoObject.path),
                    (exit) => exit.remove()
                );

            initArcs(geoObject.element);
        };

        /**
         * Function that initialize the area chart
         * @returns
         */
        let initAreaChart = () => {
            const svgMargins = { left: 75, right: 12, top: 18, bottom: 6 };

            let areaChartContainer = d3.select("#home-area-chart");

            let dateParser = d3.timeParse("%Y");

            let svgWidth = areaChartContainer.node().getBoundingClientRect().width - svgMargins.left - svgMargins.right;
            let svgHeight =
                areaChartContainer.node().getBoundingClientRect().height - svgMargins.top - svgMargins.bottom;

            // Create the SVG element
            let svgAreaChart = areaChartContainer
                .append("svg")
                .attr("width", svgWidth + svgMargins.left)
                .attr("height", svgHeight + svgMargins.bottom)
                .append("g")
                .attr("transform", "translate(" + svgMargins.left + ", " + svgMargins.top + ")");

            // Append the Y axis group
            svgAreaChart
                .append("g")
                .classed("axis-dark-cyan", true)
                .classed("group-y-axis", true)
                .classed("hide", true);

            // Append the X axis group
            svgAreaChart
                .append("g")
                .classed("axis-dark-cyan", true)
                .classed("group-x-axis", true)
                .classed("hide", true)
                .attr("transform", "translate(0, " + (svgHeight - svgMargins.top - svgMargins.bottom) + ")");

            // Append area chart group
            svgAreaChart.append("g").classed("group-area-chart", true).classed("hide", true);

            // Append the circles group
            svgAreaChart.append("g").classed("group-circles", true).classed("hide", true);

            // Append the years lines group
            svgAreaChart.append("g").classed("group-years-lines", true).classed("hide", true);

            // Append the Y axis legend
            svgAreaChart
                .append("g")
                .classed("group-label-y-axis", true)
                .append("text")
                .attr("id", "label-y-axis")
                .classed("text-bold", true)
                .classed("legend", true)
                .attr("transform", `rotate(-90) translate(10, ${-60})`)
                .text("Total immigration");

            return {
                dimens: { height: svgHeight, width: svgWidth },
                element: svgAreaChart,
                margins: svgMargins,
                parser: dateParser,
            };
        };

        /**
         * Extract data for individual years from year ranges between 1990 and 2019.
         * @param {boolean} l
         */
        let extractSingles = (_yearsData) => {
            let getDataObj = (year, l = false) => {
                let currYearData = _yearsData.filter((d) => d.year.split("-")[l ? 1 : 0] === year);

                let totVal = currYearData.reduce((acc, it) => {
                    let b = acc + (l ? it.nextTot : it.prevTot);

                    return isNaN(b) ? acc : b;
                }, 0);

                return {
                    totVal: totVal,
                    year: year,
                };
            };

            let _singleYearsData = [];

            let allYears = yearsInterval.map((d) => d.split("-")).flat();

            allYears = unique(allYears);

            let lastYear = allYears[allYears.length - 1];
            let oldYears = allYears.slice(0, -1);

            for (let y of oldYears) {
                _singleYearsData.push(getDataObj(y));
            }

            _singleYearsData.push(getDataObj(lastYear, true));

            return _singleYearsData;
        };

        /**
         * Function that draws the area chart
         * @param {object} acObject
         * @param {array} _yearsData
         */
        let drawAreaChart = (acObject, _yearsData) => {
            let singleYearsData = extractSingles(_yearsData);

            const maxTicks = 6;

            const _tickSize = 8;
            const _tickPadding = Math.round(_tickSize / 2);

            let dateParser = acObject.parser;

            let allYears = unique(yearsInterval.map((d) => d.split("-")).flat()).map((d) => dateParser(d));

            const y0Height = acObject.dimens.height - acObject.margins.top - acObject.margins.bottom;

            // Create the X scale
            let xScale = createScale(d3.extent(allYears), [0, acObject.dimens.width - acObject.margins.right], "time");

            // Create the X axis generator
            let xAxis = d3.axisBottom(xScale).tickValues(allYears).tickSize(0);

            // Create the Y scale
            let yScale = createScale([0, d3.max(singleYearsData, (d) => d.totVal)], [y0Height, 0], "linear").nice();

            let tickScale = createScale([0, maxTicks], [0, d3.max(singleYearsData, (d) => d.totVal)], "linear").nice();

            let _tickValues = [...Array(maxTicks + 1).keys()].map((t) => tickScale(t));

            // Create the Y axis generator
            let yAxis = d3
                .axisLeft(yScale)
                .tickValues(_tickValues)
                .tickFormat(d3.format(".2s"))
                .tickPadding(_tickPadding)
                .tickSize(_tickSize);

            // Show the Y axis
            acObject.element
                .select(".group-y-axis")
                .attr("transform", "translate(-" + _tickSize + ",0)")
                .classed("hide", false)
                .call(yAxis);

            // Show the X axis
            acObject.element.select(".group-x-axis").classed("hide", false).call(xAxis);

            // Create the area generator
            let areaGenerator = d3
                .area()
                .x((d) => xScale(dateParser(d.year)))
                .y1((d) => yScale(d.totVal))
                .y0(y0Height);

            let acElem = acObject.element
                .select(".group-area-chart")
                .classed("hide", false)
                .selectAll(".area-chart")
                .data([singleYearsData]);

            acElem.exit().remove();

            let acElemEnter = acElem.enter().append("path").attr("class", "area-chart");

            acElem = acElemEnter
                .merge(acElem)
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("d", areaGenerator(singleYearsData));

            // Create the circles
            let circleElems = acObject.element
                .select(".group-circles")
                .classed("hide", false)
                .selectAll(".year-circle")
                .data(singleYearsData);

            circleElems
                .enter()
                .append("circle")
                .classed("zindex-1000", true)
                .attr("class", "year-circle")
                .merge(circleElems)
                .transition()
                .duration(TRANSITION_DURATION)
                .attr("cx", (d) => xScale(dateParser(d.year)))
                .attr("cy", (d) => yScale(d.totVal))
                .attr("r", 4);

            // Create the years lines
            acObject.element
                .select(".group-years-lines")
                .classed("hide", false)
                .selectAll(".year-line")
                .data(singleYearsData)
                .enter()
                .append("line")
                .attr("class", "year-line")
                .classed("zindex-1000", true)
                .attr("y1", yScale.range()[0])
                .attr("y2", yScale.range()[1])
                .attr("x1", (d) => xScale(dateParser(d.year)))
                .attr("x2", (d) => xScale(dateParser(d.year)));

            updateAreaChartTick(acObject, yearIdx);
        };

        /**
         * Function that updates the interval year on the line chart
         * @param {object} acObject
         * @param {number} _yearIdx
         */
        let updateAreaChartTick = (acObject, _yearIdx) => {
            let _yearRange = yearsInterval[_yearIdx];
            let _actvRange = _yearRange.split("-");
            let dateParser = acObject.parser;

            let _parsedRange = _actvRange.map((y) => dateParser(y).getFullYear());

            let isActive = (d, parseDate = false) => {
                if (parseDate) {
                    return _parsedRange.includes(d.getFullYear());
                } else {
                    return _actvRange.includes(d.year);
                }
            };

            // Highlight active circles
            acObject.element.selectAll(".year-circle").classed("highlight-fill", (d) => isActive(d));

            acObject.element.selectAll(".year-line").classed("highlight-stroke", (d) => isActive(d));

            let xTicks = acObject.element.select(".group-x-axis").selectAll(".tick");

            xTicks
                .select("text")
                .classed("highlight-fill", (d) => isActive(d, true))
                .classed("highlight-stroke", (d) => isActive(d, true));

            updateYearTitle(_yearIdx);
            updateArcsAmount(yearsData_origDest, _yearIdx);
        };

        let updateYearTitle = (_yearIdx) => {
            let _yearRange = yearsInterval[_yearIdx];

            d3.select("#year-title").text(_yearRange);
        };

        /**
         * Function that initialize the migration magnitude filter
         * @returns
         */
        let initCirclesWeight = () => {
            let weightElems = d3
                .select("#container-weights")
                .selectAll(".group-weight")
                .data(migrationThreshs)
                .enter()
                .append("g")
                .classed(".group-weight", true)
                .classed("pointer", true)
                .attr("id", (d) => `label-${d}`);

            let pctFormat = d3.format("%");

            let radiusScale = d3.scaleOrdinal().domain(migrationThreshs).range(["2", "4", "6", "9", "12"]);

            let cxScale = d3.scaleOrdinal().domain(migrationThreshs).range([0.9, 0.7, 0.5, 0.3, 0.1]);

            let _xScale = d3.scaleOrdinal().domain(migrationThreshs).range([0.86, 0.675, 0.46, 0.245, 0.06]);

            let nospaceFormat = (d) => {
                return transformNumberFormat(d, false, 0).replace(" ", "");
            };

            weightElems
                .append("ellipse")
                .attr("cy", 15)
                .attr("cx", (d) => pctFormat(cxScale(d)))
                .attr("rx", (d) => radiusScale(d))
                .attr("ry", (d) => radiusScale(d))
                .attr("fill", (d) => weightScale(d));

            weightElems
                .append("text")
                .attr("stroke", (d) => strokeColor(d))
                .attr("font-size", 14)
                .attr("y", "46")
                .attr("x", (d) => pctFormat(_xScale(d)))
                .text((d) => nospaceFormat(d));

            return weightElems;
        };

        // handling the gender filter changes
        $scope.$watch("genderFilterValue", (newVal, oldVal) => {
            if (newVal !== oldVal) {
                resetArcs();
            }
        });

        let resetArcs = () => {
            if (!isPaused) pauseArcs();

            $scope.geoObject.element
                .select(".arch-container")
                .selectAll(".arch-path")
                    .on("mouseover", null)
                    .on("mouseout", null);

            initArcs($scope.geoObject.element);

            if (isPaused) {
                $scope.playPauseBtn = IC_PAUSE;

                $timeout(function() {
                    $scope.$apply();
                });

                // if (!$scope.$digest())
                //     $scope.$apply();
            }
        }

        // TODO: Get feed data for relevant year
        /**
         * Function that gets the feeds data
         */
        dataService.getFeedData(2019).then((data) => {
            let top5feeds = data.slice(0, 5);

            top5feeds.forEach((top5Feed) => {
                top5Feed.image = "app/img/home/up.png";
                top5Feed.value = transformNumberFormat(top5Feed.value, false, 0);
            });

            let flop5feeds = data.slice(data.length - 5, data.length).reverse();

            flop5feeds.forEach((flop5Feed) => {
                flop5Feed.image = "app/img/home/down.png";
                flop5Feed.value = transformNumberFormat(flop5Feed.value, false, 0);
            });

            $scope.yearFeeds = [...top5feeds, ...flop5feeds];
        });

        /**
         * Function that apply the filters when the selection popup is closed
         */
        $scope.selectionClosed = () => {
            _clearSearch();
            _handleOnSelectionChanged();
        };

        /**
         * Function that removes the filter chips when they are clicked
         * @param {object} chip
         * @param {object} source
         */
        $scope.removeChips = function (chip, source) {
            if (source) {
                $scope.selectedCountries.source = $scope.selectedCountries.source
                        .filter(c => c.name !== chip.name);

                if ($scope.selectedCountries.source.length == 0) {
                    tooltipSources.classed("hide", true);
                }
            } else {
                $scope.selectedCountries.destination = $scope.selectedCountries.destination
                        .filter(c => c.name !== chip.name);

                if ($scope.selectedCountries.destination.length == 0) {
                    tooltipDest.classed("hide", true);
                }
            }

            if ($scope.selectedCountries.source.length == 0
                    && $scope.selectedCountries.destination.length == 0) {
                textNoFilters.classed("hide", false);
            }

            _handleOnSelectionChanged();
        };

        /**
         * Function that clears the search box in the source select filter
         */
        let _clearSearch = () => {
            $scope.searchSource = "";
            $scope.searchDestination = "";
        };

        /**
         * Function that prevent the event propagation for the event passed as parameter
         * @param {event} event
         */
        $scope.updateSearch = (event) => {
            event.stopPropagation();
        };

        /**
         * Function that handles the click on the gender radio group filter in the menu
         * @param {string} genderVal
         */
        $scope.handleGenderClick = function (genderVal) {
            $scope.genderFilterValue = genderVal;
        };
    }
})();
