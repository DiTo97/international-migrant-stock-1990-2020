(function () {
    "use strict";

    // reloading angula module
    let main = angular.module("main");

    // creating the service
    main.service("dataService", dataService);

    /** Function that handle the requests */

    dataService.$inject = ["$state"];
    function dataService($state) {
        // getting the service instance
        let data_service = this;
        data_service.secondaryMenuSelectedValue = "";
        data_service.selectedCountryController = "";

        /**
         * Function that loads the csv passed as parameter
         * @param {string} filePath
         * @returns
         */
        data_service.loadCsv = (filePath) => {
            return d3
                .csv(filePath, (data) => {
                    return data;
                })
                .catch((error) => {
                    console.log(error);
                });
        };

        /**
         * Function that loads the json file passed as parameter
         * @param {string} filePath
         * @returns
         */
        data_service.loadJson = (filePath) => {
            return d3
                .json(filePath, (data) => {
                    return data;
                })
                .catch((error) => {
                    // alert("Could not load file..." + "\nCheck the console for more details!");

                    console.log(error);
                });
        };

        /**
         * Function that loads the file passed as parameter using the delimiter passed as parameter also
         * @param {string} filePath
         * @param {string} delimiter
         * @returns
         */
        data_service.loadDsv = (filePath, delimiter = ";") => {
            return d3
                .dsv(delimiter, filePath, (data) => {
                    return data;
                })
                .catch((error) => {
                    // alert("Could not load file..." + "\nCheck the console for more details!");

                    console.log(error);
                });
        };

        // load data from all csv files
        data_service.countriesClassByRegion = data_service.loadCsv(countries_classes_by_region);
        data_service.estimatedRefugees = data_service.loadCsv(estimated_refugees);
        data_service.totMigrByAgeSex = data_service.loadCsv(total_migrants_by_age_and_sex);
        data_service.totPopulationByAgeSex = data_service.loadCsv(total_population_by_age_and_sex);
        data_service.migrAsPercOfPopulationAgeSex = data_service.loadCsv(
            migrants_as_percentage_of_total_population_by_age_and_sex
        );
        data_service.migrPercDistributionAgeSex = data_service.loadCsv(migrants_percentage_distribution_by_age_and_sex);
        data_service.totMigrRateOfChange = data_service.loadCsv(migrants_annual_rate_of_change);
        data_service.worldCountriesHierarchy = data_service.loadJson(world_countries_hierarchy);
        data_service.totMigrByOriginDest = data_service
            .loadCsv(total_migrants_by_origin_and_destination)
            .then((data_origDest) => {
                removeOtherSouth_OtherNorth(data_origDest);
                
                return data_origDest;
            });

        data_service.maleMigrByOriginDest = data_service
            .loadCsv(male_migrants_by_origin_and_destination)
            .then((data_origDest) => {
                removeOtherSouth_OtherNorth(data_origDest);

                return data_origDest;
            });

        data_service.femaleMigrByOriginDest = data_service
            .loadCsv(female_migrants_by_origin_and_destination)
            .then((data_origDest) => {
                removeOtherSouth_OtherNorth(data_origDest);

                return data_origDest;
            });

        // variable that defines the ticks of the slider
        data_service.sliderYears = [
            { value: 1990, legend: "1990" },
            { value: 1995, legend: "1995" },
            { value: 2000, legend: "2000" },
            { value: 2005, legend: "2005" },
            { value: 2010, legend: "2010" },
            { value: 2015, legend: "2015" },
            { value: 2019, legend: "2019" },
        ];

        // Variable that defines the gender buttons in the filter menu
        data_service.genderButtons = [
            { value: "menu-male", text: "Male" },
            { value: "menu-female", text: "Female" },
            { value: "menu-all", text: "All" },
        ];

        // Variable that defines the region buttons in the filter menu
        // future work
        data_service.regionButtons = [
            { value: "menu-continent", text: "Continent" },
            { value: "menu-region", text: "Region" },
            { value: "menu-country", text: "Country" },
        ];

        // variable that defines the menu buttons
        data_service.menuButtons = [
            { value: "world", text: "World" },
            { value: "country", text: "Country" },
            { value: "compare", text: "Compare" },
        ];

        // variable that holds the types of visualization in the statistics page
        data_service.visualizationTypes = [
            { value: "total_immigration", text: "Total immigration" },
            { value: "total_population", text: "Total population" },
            {
                value: "immigration_vs_population",
                text: "Immigration vs. Population",
            },
            { value: "immigrants_avg_age", text: "Immigrants average age" },
            {
                value: "refugees_vs_immigrants",
                text: "Refugees vs. Immigrants",
            },
        ];

        data_service.continents = [
            "Africa",
            "Asia",
            "Europe",
            "Latin America and the Caribbean",
            "Northern America",
            "Oceania",
        ];

        // variable that defines the country info types buttons
        data_service.countryInfoTypeButtons = [
            { value: "global_rank", text: "Global rank" },
            { value: "value", text: "Value" },
        ];

        /**
         * Function that load the data for the map
         * @returns
         */
        data_service.loadWorldMap = () => {
            return data_service.countries.then((countries) => {
                return data_service.loadJson(WORLD_MAP).then((map) => {
                    let countriesMap = addCountriesToMap(countries, map);
                    return topojson.feature(countriesMap, countriesMap.objects.countries).features;
                });
            });
        };

        /**
         * Remove Other South and Other North migrants from Total
         * as those countries are not better specified.
         * @param {array} data_origDest
         */
        let removeOtherSouth_OtherNorth = (data_origDest) => {
            data_origDest.forEach((row) => {
                let otherCountries = +row["Other South"] + +row["Other North"];
                row["Total"] = +row["Total"] - otherCountries;
            });
        };

        /**
         * Add Country instances to the TopoJSON map
         * @param {array} countries
         * @param {object} map
         * @returns
         */
        let addCountriesToMap = (countries, map) => {
            Object.values(map.objects.countries.geometries).forEach((geoElem) => {
                // Find corresponding geometry
                const country = countries.find((c) => c.props["isoAlpha3"] === geoElem.id);

                geoElem["properties"] = country ?? null;
            });

            return map;
        };

        /**
         * Function that returns the column postfix given the gender
         * @param {string} selectedGender
         * @param {string} columnPrefix
         * @returns {string}
         */
        data_service.getSelectedGenderColumn = (selectedGender, columnPrefix) => {
            let selectedGenderColumn = "";
            switch (selectedGender) {
                case "menu-all":
                    selectedGenderColumn = columnPrefix + "_(mf)";
                    break;
                case "menu-male":
                    selectedGenderColumn = columnPrefix + "_(m)";
                    break;
                case "menu-female":
                    selectedGenderColumn = columnPrefix + "_(f)";
                    break;
            }
            return selectedGenderColumn;
        };

        /**
         * Function that creates the countries data structure
         * @param {array} visNames
         * @returns
         */
        let getCountries = (visNames) => {
            let getVisName = (country) => {
                if (country in visNames) return visNames[country];
                else return country;
            };

            return data_service.loadDsv(COUNTRY_CODES_ALPHA_3).then((countryCodes) => {
                return data_service.worldCountriesHierarchy.then((data) => {
                    let countries = [];

                    const geoRegions = data["WORLD"]["Geographic regions"];
                    const geoRegions_lc = geoRegions.map((region) => region.toLowerCase());

                    for (const key in data) {
                        if (key === "WORLD") continue;

                        let regionId = geoRegions_lc.indexOf(key.toLowerCase());

                        if (regionId !== -1) {
                            const continent = geoRegions[regionId];

                            for (const region in data[key]) {
                                data[key][region].forEach((country) => {
                                    countries.push(new Country(country, continent, region, getVisName(country)));
                                });
                            }
                        } else {
                            if (key.startsWith("EUROPE")) {
                                for (const i in data[key]) {
                                    if (i === "EUROPE") {
                                        const continent = "Europe";

                                        for (const region in data[key][i]) {
                                            data[key][i][region].forEach((country) =>
                                                countries.push(
                                                    new Country(country, continent, continent, getVisName(country))
                                                )
                                            );
                                        }
                                    } else {
                                        const continent = "Northern America";

                                        data[key][i].forEach((country) =>
                                            countries.push(
                                                new Country(country, continent, continent, getVisName(country))
                                            )
                                        );
                                    }
                                }
                            } else {
                                for (const region in data[key]) {
                                    const continent = geoRegions.find((v) => region.includes(v));

                                    data[key][region].forEach((country) => {
                                        countries.push(new Country(country, continent, region, getVisName(country)));
                                    });
                                }
                            }
                        }
                    }

                    // Add ISO country codes to countries properties
                    // to later match them with TopoJSON
                    countries.forEach((c) => {
                        let row = countryCodes.find((cc) => c.name == cc.name);

                        if (row == undefined) {
                            console.log("Undefined ISO Alpha-3 code: ", c.name);
                        } else {
                            c.props["isoAlpha3"] = row.code;
                        }
                    });

                    // Remove the Channel Islands as
                    // they are not integrated in the TopoJSON
                    countries = countries.filter((c) => c.name !== "Channel Islands");

                    return countries.sort((a, b) => (a.visName > b.visName ? 1 : -1));
                });
            });
        };

        // loading the json with the countries
        data_service.countries = data_service.loadJson(world_countries_vis_name).then((data) => {
            return getCountries(data);
        });

        /**
         * Function that computes the relative percentage of an element in an array with respect to the other elements
         * @param {array} values
         * @returns
         */
        data_service.computePercentage = (values) => {
            let total = d3.sum(values);
            let percentages = [];
            values.forEach((val) => {
                percentages.push((val / total) * 100);
            });
            return percentages;
        };

        /**
         * Function that handles the routing for the secondary menu
         */
        data_service.changePage = () => {
            switch (data_service.secondaryMenuSelectedValue) {
                case "world":
                    $state.go("statistics");
                    break;
                case "country":
                    $state.go("country");
                    break;
                case "compare":
                    $state.go("compare");
                    break;
                default:
                    $state.go("home");
            }
        };

        /**
         * Function that filter the row of the country passed as parameter
         * @param {array} data
         * @param {string} selectedCountry
         * @returns {promise} - the row of the selectedCountry
         */
        let getSelectedCountryData = (data, selectedCountry) => {
            return data.filter((countryData) => countryData["Destination"] == selectedCountry);
        };

        /**
         * Function that returns the total migrants by origin and destination data
         * @param {string} selectedCountry
         * @returns {promise}
         */
        data_service.getTotalMigrantsByOriginAndDestination = (selectedCountry) => {
            return data_service.totMigrByOriginDest.then((data) => {
                return getSelectedCountryData(data, selectedCountry);
            });
        };

        /**
         * Function that filter the data passed as parameter using the elements passed as parameter also
         * @param {array} data
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @returns {promise}
         */
        data_service.filterData = (data, selectedCountry, yearMin, yearMax) => {
            return data.filter(
                (countryData) =>
                    countryData["Destination"] == selectedCountry &&
                    countryData["Year"] >= yearMin &&
                    countryData["Year"] <= yearMax
            );
        };

        /**
         * Function that filter the data passed as parameter using the elements passed as parameter also
         * @param {array} data
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @returns {promise}
         */
        data_service.filterDataMulti = (data, countries, yearMin, yearMax) => {
            return data.filter(
                (countryData) =>
                    countries.includes(countryData["Destination"]) &&
                    countryData["Year"] >= yearMin &&
                    countryData["Year"] <= yearMax
            );
        };

        function pick(o, fields) {
            let picked = {};

            for (const field of fields) {
                picked[field] = o[field];
            }

            return picked;
        }

        /**
         * Function that filter the data passed as parameter using the elements passed as parameter also
         * @param {array} data
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @returns {promise}
         */
        data_service.filterColumn = (data, columns) => {
            // console.log(selectedCountry);
            return data.map((row) => pick(row, columns));
        };

        /**
         *  Function that loads a csv file according to the passed parameter
         * @param {string} selectedGender
         * @returns
         */
        data_service.getOriginAndDestinationByGender = (selectedGender) => {
            switch (selectedGender) {
                case "menu-all":
                    return data_service.totMigrByOriginDest;
                case "menu-male":
                    return data_service.maleMigrByOriginDest;
                case "menu-female":
                    return data_service.femaleMigrByOriginDest;
            }
        };

        /**
         * Function that returns the total number of migrants by origin and destination
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @returns {promise}
         */
        data_service.getTotMigrantsByOriginAndDestination = (selectedCountry, yearMin, yearMax, selectedGender) => {
            return data_service.getOriginAndDestinationByGender(selectedGender).then((data) => {
                let filteredData = data_service.filterData(data, selectedCountry, yearMin, yearMax);
                return filteredData.reduce((sum, curr) => sum + +curr.Total, 0) / filteredData.length;
            });
        };

        /**
         * Function that returns the total population by age and sex
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @param {string} selectedGender
         * @returns {promise}
         */
        data_service.getTotPopulationByAgeAndSex = (selectedCountry, yearMin, yearMax, selectedGender) => {
            return data_service.totPopulationByAgeSex.then((data) => {
                let filteredData = data_service.filterData(data, selectedCountry, yearMin, yearMax);
                return (
                    (filteredData.reduce((sum, curr) => sum + +curr[selectedGender], 0) / filteredData.length) * 1000
                );
            });
        };

        /**
         * Function that return the migrants by age and sex, as a percentage of the total population
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @param {string} selectedGender
         * @returns {promise}
         */
        data_service.getMigrantsAsPercentageOfPopulationByAgeAndSex = (
            selectedCountry,
            yearMin,
            yearMax,
            selectedGender
        ) => {
            return data_service.migrAsPercOfPopulationAgeSex.then((data) => {
                let filteredData = data_service.filterData(data, selectedCountry, yearMin, yearMax);
                return filteredData.reduce((sum, curr) => sum + +curr[selectedGender], 0) / filteredData.length;
            });
        };

        /**
         * Function that gets the brain drain and child statistics
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @param {string} selectedGender
         * @returns
         */
        data_service.getChildBrainDrainStatistics = (selectedCountry, yearMin, yearMax, selectedGender) => {
            return data_service.totMigrByAgeSex.then((data) => {
                let filteredData = data_service.filterData(data, selectedCountry, yearMin, yearMax);
                const genderSuffix = data_service.getSelectedGenderColumn(selectedGender, "");
                let finalData = { "0-14": 0, "20-34": 0, "35+": 0, Total: 0 };
                const ageGroupsAggregation = {
                    "0-14": ["0-4", "5-9", "10-14"].map((d) => d + genderSuffix),
                    "20-34": ["20-24", "25-29", "30-34"].map((d) => d + genderSuffix),
                    "35+": ["35-39", "40-44", "45-49", "50-54", "55-59", "60-64", "65-69", "70-74", "75+"].map(
                        (d) => d + genderSuffix
                    ),
                    Total: ["Total" + genderSuffix],
                };

                const ageGroups = Object.keys(ageGroupsAggregation);

                let ageColumns = Object.keys(filteredData[0]).filter((k) => {
                    if (typeof k === "string") {
                        return k.includes(genderSuffix);
                    }
                });

                filteredData = data_service.filterColumn(filteredData, ageColumns);

                let filteredCategories = filteredData.map((d) => {
                    let aggregatedRow = {};

                    ageGroups.forEach((a) => {
                        const oldCols = ageGroupsAggregation[a];
                        const ageGroupData = Object.values(data_service.filterColumn([d], oldCols)[0]);
                        const aggregatedVal = ageGroupData.reduce((sum, curr) => sum + +curr, 0);

                        aggregatedRow[a] = +aggregatedVal.toFixed(1);
                    });

                    return aggregatedRow;
                });

                Object.values(filteredCategories).forEach((elem, i) => {
                    finalData[ageGroups[0]] += (+elem[ageGroups[0]]/filteredCategories.length);
                    finalData[ageGroups[1]] += (+elem[ageGroups[1]]/filteredCategories.length);
                    finalData[ageGroups[2]] += (+elem[ageGroups[2]]/filteredCategories.length);
                    finalData[ageGroups[3]] += (+elem[ageGroups[3]]/filteredCategories.length);
                });

                return finalData;
            });
        };

        /**
         * Extract the immigration by age groups for a given country, year range, and gender.
         *
         * The age groups are all 5-years apart and will be aggregated into:
         * 0-4, 5-18, 19-34, 35-54, 55-74, 75+
         *
         * @param {string} country The country of interest.
         * @param {number} yearMin The lower bound of the year range.
         * @param {number} yearMax The upper bound of the year range.
         * @param {string} gender  The gender of interest. 'mf' for both.
         *
         * @return {promise}       The loaded data waiting to be resolved.
         */
        data_service.getImmigrationByAgeGroups = (country, yearMin, yearMax, gender) => {
            return data_service.migrPercDistributionAgeSex.then((data) => {
                let filteredData = data_service.filterData(data, country, yearMin, yearMax);

                const genderSuffix = data_service.getSelectedGenderColumn(gender, "");

                let ageColumns = Object.keys(filteredData[0]).filter((k) => {
                    if (typeof k === "string") {
                        return k.includes(genderSuffix);
                    }
                });

                // Keep track of corresponding year
                ageColumns.push("Year");

                filteredData = data_service.filterColumn(filteredData, ageColumns);

                const ageGroupsAggregation = {
                    "0-4": ["0-4" + genderSuffix],
                    "5-18": ["5-9", "10-14", "15-19"].map((d) => d + genderSuffix),
                    "19-34": ["20-24", "25-29", "30-34"].map((d) => d + genderSuffix),
                    "35-54": ["35-39", "40-44", "45-49", "50-54"].map((d) => d + genderSuffix),
                    "55-74": ["55-59", "60-64", "65-69", "70-74"].map((d) => d + genderSuffix),
                    "75+": ["75+" + genderSuffix],
                };

                return filteredData.map((d) => {
                    let aggregatedRow = {};

                    const ageGroups = Object.keys(ageGroupsAggregation);
                    ageGroups.forEach((a) => {
                        const oldCols = ageGroupsAggregation[a];

                        const ageGroupData = Object.values(data_service.filterColumn([d], oldCols)[0]);

                        const aggregatedVal = ageGroupData.reduce((sum, curr) => sum + +curr, 0);

                        aggregatedRow[a] = +aggregatedVal.toFixed(1);
                    });

                    aggregatedRow["Total"] = 100.0;
                    aggregatedRow["Year"] = +d.Year;

                    return aggregatedRow;
                });
            });
        };

        /**
         * Function that return the average age of the migrants
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @param {string} selectedGender
         * @return {promise}
         */
        data_service.getImmigrationAverageAge = (selectedCountry, yearMin, yearMax, selectedGender) => {
            return data_service.totMigrByAgeSex.then((data) => {
                let filteredData = data_service.filterData(data, selectedCountry, yearMin, yearMax);

                let columns = Object.keys(filteredData[0]).filter((key) => {
                    if (typeof key === "string" && key !== "Total" + selectedGender) {
                        return key.includes(selectedGender);
                    }
                });

                columns = columns.map((col) => {
                    let colElem = col.split("_")[0];
                    let ages = colElem.split("-");
                    if (col == "75+" + selectedGender) return { key: col, value: 77 };
                    return { key: col, value: (+ages[0] + +ages[1]) / 2 };
                });

                let yearsSum = 0;
                Object.values(filteredData).forEach((row) => {
                    let yearAverage = 0;
                    columns.forEach((col) => {
                        yearAverage += col.value * row[col.key];
                    });
                    yearsSum += yearAverage / row["Total" + selectedGender];
                });

                return yearsSum / filteredData.length;
            });
        };

        /**
         * Function that returns the estimate refugees
         * @param {string} selectedCountry
         * @param {number} yearsColumns
         * @param {number} selectedGender
         * @returns {promise}
         */
        data_service.getEstimatedRefugees = (selectedCountry, yearsColumns, selectedGender) => {
            return data_service.estimatedRefugees.then((data) => {
                let selectedCountryData = getSelectedCountryData(data, selectedCountry);
                return (
                    yearsColumns.reduce((sum, elem) => +sum + +selectedCountryData[0]["" + elem + selectedGender], 0) /
                    yearsColumns.length
                );
            });
        };

        /**
         * Function that returns the estimate refugees by year
         * @param {string} selectedCountry
         * @param {number} yearsColumns
         * @param {number} selectedGender
         * @returns {promise}
         */
        data_service.getEstimatedRefugeesByYear = (selectedCountryLeft, selectedCountryRight) => {
            return data_service.estimatedRefugees.then((data) => {
                let selectedCountryDataLeft = getSelectedCountryData(data, selectedCountryLeft)[0];
                let selectedCountryDataRight = getSelectedCountryData(data, selectedCountryRight)[0];

                let countryLeftKeys = Object.keys(selectedCountryDataLeft).slice(1, 8);
                let countryRightKeys = Object.keys(selectedCountryDataRight).slice(1, 8);

                let result = { left: [], right: [] };

                result.left = countryLeftKeys.map((c) => ({
                    year: parseDate(c.split("_")[0]),
                    value: isNaN(+selectedCountryDataLeft[c]) ? 0 : +selectedCountryDataLeft[c],
                }));

                result.right = countryRightKeys.map((c) => ({
                    year: parseDate(c.split("_")[0]),
                    value: isNaN(+selectedCountryDataRight[c]) ? 0 : +selectedCountryDataRight[c],
                }));

                return result;
            });
        };

        /**
         * Function that returns the global rank statistics for each country
         * @param {number} yearMin
         * @param {number} yearMax
         * @param {string} selectedGender
         * @returns {promise}
         */
        data_service.getGlobalRankStatistics = (selectedCountry, yearMin, yearMax, selectedGender) => {
            return data_service.countries.then((data) => {
                let consideredYears = data_service.getActiveYears(yearMin, yearMax);
                let globalRankStatisticsArray = [];

                for (let country_idx in data) {
                    let avgTotalMigrantsCountry = data_service
                        .getTotMigrantsByOriginAndDestination(data[country_idx].name, yearMin, yearMax, selectedGender)
                        .then((avgTotalMigrantsCountry) => {
                            return avgTotalMigrantsCountry;
                        });
                    let avgTotPopulationCountry = data_service
                        .getTotPopulationByAgeAndSex(
                            data[country_idx].name,
                            yearMin,
                            yearMax,
                            data_service.getSelectedGenderColumn(selectedGender, "Total")
                        )
                        .then((avgTotPopulationCountry) => {
                            return avgTotPopulationCountry;
                        });
                    let avgMigrPercCountry = data_service
                        .getMigrantsAsPercentageOfPopulationByAgeAndSex(
                            data[country_idx].name,
                            yearMin,
                            yearMax,
                            data_service.getSelectedGenderColumn(selectedGender, "Total")
                        )
                        .then((avgMigrPercCountry) => {
                            return avgMigrPercCountry;
                        });
                    let avgAgeCountry = data_service
                        .getImmigrationAverageAge(
                            data[country_idx].name,
                            yearMin,
                            yearMax,
                            data_service.getSelectedGenderColumn(selectedGender, "")
                        )
                        .then((avgAgeCountry) => {
                            return avgAgeCountry;
                        });
                    let averageEstRefugees = data_service
                        .getEstimatedRefugees(
                            data[country_idx].name,
                            consideredYears,
                            data_service.getSelectedGenderColumn(selectedGender, "_est")
                        )
                        .then((averageEstRefugees) => {
                            return averageEstRefugees;
                        });

                    let promisedResultsList = [
                        avgTotalMigrantsCountry,
                        avgTotPopulationCountry,
                        avgMigrPercCountry,
                        avgAgeCountry,
                        averageEstRefugees,
                    ];

                    let computedStatistics = Promise.all(promisedResultsList).then((values) => {
                        return {
                            name: data[country_idx].name,
                            average_tot_migrants: values[0],
                            average_tot_population: values[1],
                            average_perc_immigration: values[2],
                            average_age_migrants: values[3],
                            average_est_refugees: values[4],
                        };
                    });
                    globalRankStatisticsArray.push(computedStatistics);
                }
                return Promise.all(globalRankStatisticsArray).then((globalRanks) => {
                    globalRanks.sort((a, b) => b.average_tot_migrants - a.average_tot_migrants);

                    globalRanks.forEach((destObj, destIdx) => {
                        destObj["average_tot_migrants_global_rank"] = destIdx + 1;
                    });

                    globalRanks.sort((a, b) => b.average_tot_population - a.average_tot_population);

                    globalRanks.forEach((destObj, destIdx) => {
                        destObj["average_tot_population_global_rank"] = destIdx + 1;
                    });

                    globalRanks.sort((a, b) => b.average_perc_immigration - a.average_perc_immigration);

                    globalRanks.forEach((destObj, destIdx) => {
                        destObj["average_perc_immigration_global_rank"] = destIdx + 1;
                    });

                    globalRanks.sort((a, b) => b.average_age_migrants - a.average_age_migrants);

                    globalRanks.forEach((destObj, destIdx) => {
                        destObj["average_age_migrants_global_rank"] = destIdx + 1;
                    });

                    if (selectedGender == "menu-all") {
                        globalRanks.sort((a, b) => b.average_est_refugees - a.average_est_refugees);

                        globalRanks.forEach((destObj, destIdx) => {
                            destObj["average_est_refugees_global_rank"] = destIdx + 1;
                        });
                    }

                    return globalRanks.filter((obj) => obj.name == selectedCountry)[0];
                });
            });
        };

        /**
         * Function that gets the development statistics for the selected country
         * @param {string} selectedCountry
         * @param {array} yearsColumns
         * @param {string} selectedGender
         * @returns
         */
        data_service.getCountryDevelopmentStatistic = (selectedCountry, yearsColumns, selectedGender) => {
            return data_service.getOriginAndDestinationByGender(selectedGender).then((data) => {
                let development = [
                    { type: "Less Developed", value: [] },
                    { type: "More Developed", value: [] },
                ];
                Object.values(data).forEach((elem) => {
                    if (elem["Destination"] === "More developed regions" && yearsColumns.indexOf(+elem["Year"]) > -1) {
                        development[0].value.push(elem[selectedCountry]);
                    } else if (
                        elem["Destination"] === "Less developed regions" &&
                        yearsColumns.indexOf(+elem["Year"]) > -1
                    )
                        development[1].value.push(elem[selectedCountry]);
                });

                development[0].value = d3.mean(development[0].value).toFixed(2);
                development[1].value = d3.mean(development[1].value).toFixed(2);

                let percentages = data_service.computePercentage([development[0].value, development[1].value]);

                development[0].percentage = percentages[0].toFixed(1);
                development[1].percentage = percentages[1].toFixed(1);

                return development;
            });
        };

        /**
         * Function that gest the income statistics for the selected country
         * @param {string} selectedCountry
         * @param {array} yearsColumns
         * @param {string} selectedGender
         * @returns
         */
        data_service.getCountryIncomeStatistic = (selectedCountry, yearsColumns, selectedGender) => {
            return data_service.getOriginAndDestinationByGender(selectedGender).then((data) => {
                let income = [
                    { type: "High Income", value: [] },
                    { type: "Upper Middle Income", value: [] },
                    { type: "Lower Middle Income", value: [] },
                    { type: "Low Income", value: [] },
                    { type: "Other Income", value: [] },
                ];

                Object.values(data).forEach((elem) => {
                    if (elem["Destination"] === "High-income countries" && yearsColumns.indexOf(+elem["Year"]) > -1)
                        income[0].value.push(elem[selectedCountry]);
                    else if (
                        elem["Destination"] === "Upper-middle-income countries" &&
                        yearsColumns.indexOf(+elem["Year"]) > -1
                    )
                        income[1].value.push(elem[selectedCountry]);
                    else if (
                        elem["Destination"] === "Lower-middle-income countries" &&
                        yearsColumns.indexOf(+elem["Year"]) > -1
                    )
                        income[2].value.push(elem[selectedCountry]);
                    else if (elem["Destination"] === "Low-income countries" && yearsColumns.indexOf(+elem["Year"]) > -1)
                        income[3].value.push(elem[selectedCountry]);
                    else if (
                        elem["Destination"] === "No income group available" &&
                        yearsColumns.indexOf(+elem["Year"]) > -1
                    )
                        income[4].value.push(elem[selectedCountry]);
                });

                Object.values(income).forEach((elem, index) => {
                    income[index].value = d3.mean(income[index].value).toFixed(2);
                });

                let incomeValues = [];
                income.forEach((elem) => {
                    incomeValues.push(elem.value);
                });

                let percentages = data_service.computePercentage(incomeValues);
                income.forEach((elem, index) => {
                    income[index].percentage = percentages[index].toFixed(1);
                });

                return income;
            });
        };

        /**
         * Function that gest the mutual migration of the countries passed as parameter
         * @param {string} country_one
         * @param {string} country_two
         * @returns
         */
        data_service.getMutualMigration = (country_one, country_two) => {
            return data_service.totMigrByOriginDest.then((data) => {
                let countryOne = getSelectedCountryData(data, country_one);
                let countryTwo = getSelectedCountryData(data, country_two);

                let countryTwoToCountryOne = countryOne.reduce((sum, val) => {
                    let value = val[country_two] !== "" ? +val[country_two] : 0;
                    return (sum += value);
                }, 0);
                let countryOneToCountryTwo = countryTwo.reduce((sum, val) => {
                    let value = val[country_one] !== "" ? +val[country_one] : 0;
                    return (sum += value);
                }, 0);

                return { countryOneSend: countryOneToCountryTwo, countryTwoSend: countryTwoToCountryOne };
            });
        };

        let groupBy = function (xs, key) {
            return xs.reduce(function (rv, x) {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        };

        /**
         * Function that gets the common migration destination statistics for the countries passed as parameter
         * @param {string} country_one
         * @param {string} country_two
         * @param {string} selectedGender
         * @returns
         */
        data_service.getMutualCommonMigrationDestinations = (country_one, country_two, selectedGender) => {
            let countryData = [];
            return data_service.getOriginAndDestinationByGender(selectedGender).then((data) => {
                return data_service.worldCountriesHierarchy.then((regionsData) => {
                    const geoRegions = regionsData["WORLD"]["Geographic regions"];
                    let regions = data.filter((row) => geoRegions.some((gr) => row.Destination === gr));
                    let groupedRegions = groupBy(regions, "Destination");

                    Object.values(groupedRegions).forEach((reg, i) => {
                        let label = "";

                        if (reg[0].Destination === "Northern America") label = "N. A.";
                        else if (reg[0].Destination === "Latin America and the Caribbean") label = "L. A. C.";
                        else label = reg[0].Destination;

                        countryData.push({
                            label: label,
                            value: { left: [reg.reduce((sum, val) => (sum += +val[country_one]), 0)] },
                        });

                        countryData[i].value["right"] = [reg.reduce((sum, val) => (sum += +val[country_two]), 0)];
                    });

                    let firstPercentages = data_service.computePercentage(countryData.map((d) => d.value.left[0]));
                    let secondPercentages = data_service.computePercentage(countryData.map((d) => d.value.right[0]));
                    countryData.forEach((elem, i) => {
                        countryData[i].value["left"].push(firstPercentages[i].toFixed(0));
                        countryData[i].value["right"].push(secondPercentages[i].toFixed(0));
                    });

                    return countryData;
                });
            });
        };

        /**
         * Function that gest the min and max of the total migration rate of change data
         * @returns
         */
        data_service.getGlobalMinMaxRateOfChange = () => {
            return data_service.totMigrRateOfChange.then((data) => {
                let allRatesOfChange = data.map((row) => Object.values(row).slice(1, Object.values(row).length));
                let joinedRows = [];
                allRatesOfChange.forEach((elem) => {
                    joinedRows = joinedRows.concat(elem);
                });
                joinedRows = joinedRows.map((val) => +val);
                return { MinRateOfChange: d3.min(joinedRows), MaxRateOfChange: d3.max(joinedRows) };
            });
        };

        /**
         * Function that computes the annual rate of change given a country, a gender and a year interval
         * @param {string} selectedCountry
         * @param {number} yearMin
         * @param {number} yearMax
         * @param {string} selectedGender
         * @returns
         */
        data_service.getRateOfChange = (selectedCountry, yearMin, yearMax, selectedGender) => {
            return data_service.totMigrRateOfChange.then((data) => {
                let filteredData = data.find((countryData) => countryData["Destination"] == selectedCountry);
                let filteredDataColumns = Object.keys(filteredData);
                let countryRateOfChange = {};

                filteredDataColumns = filteredDataColumns.slice(1).filter((columnName) => {
                    let limits = columnName.split("-");
                    let leftLimit = +limits[0];
                    let rightLimit = +limits[1].slice(0, 4);

                    if (
                        leftLimit >= +yearMin &&
                        rightLimit <= +yearMax &&
                        data_service.getSelectedGenderColumn(selectedGender, columnName.slice(0, 9)) === columnName
                    ) {
                        return true;
                    } else return false;
                });

                if (filteredDataColumns.length == 0) {
                    return filteredDataColumns;
                }

                for (let key in filteredData) {
                    if (filteredDataColumns.includes(key)) countryRateOfChange[key.slice(5, 9)] = +filteredData[key];
                }

                return countryRateOfChange;
            });
        };

        /**
         * Function that returns an array with all considered years between yearMin and yearMax
         * @param {number} yearMin
         * @param {number} yearMax
         * @returns
         */
        data_service.getActiveYears = (yearMin = 1990, yearMax = 2019) => {
            return [1990, 1995, 2000, 2005, 2010, 2015, 2019].filter((year) => year >= +yearMin && year <= +yearMax);
        };

        /**
         * Function that return total migration by origin and destination data according to the passed parameters
         * @param {array} countries
         * @param {array} columnsArray
         * @param {string} genderFilterValue
         * @returns
         */
        let getCountries_totMigrByOriginDest = (
            countries,
            columnsArray = ["Year", "Destination", "Total"],
            genderFilterValue = "menu-all"
        ) => {
            let dataRetrievalFunc = function (data) {
                return data_service.filterColumn(
                    data_service.filterDataMulti(
                        data,
                        countries.map((c) => c.name),
                        1990,
                        2019
                    ),
                    columnsArray
                );
            };

            switch (genderFilterValue) {
                case "menu-all":
                    return data_service.totMigrByOriginDest.then((data) => dataRetrievalFunc(data));
                case "menu-male":
                    return data_service.maleMigrByOriginDest.then((data) => dataRetrievalFunc(data));
                case "menu-female":
                    return data_service.femaleMigrByOriginDest.then((data) => dataRetrievalFunc(data));
            }

            return data_service.totMigrByOriginDest.then((data) => dataRetrievalFunc(data));
        };

        /**
         *Function that returns the total population by age and sex data
         * @param {array} countries
         * @returns
         */
        let getCountries_totPopulationByAgeSex = (countries) => {
            return data_service.totPopulationByAgeSex.then((data) => {
                return data_service
                    .filterColumn(
                        data_service.filterDataMulti(
                            data,
                            countries.map((c) => c.name),
                            1990,
                            2019
                        ),
                        ["Year", "Destination", "Total_(mf)"]
                    )
                    .map((d) => ({ Year: +d.Year, Destination: d.Destination, Total: +(d["Total_(mf)"] * 1000) }));
            });
        };

        /**
         * Function that returns the migration data as percentage of the total population
         * @param {array} countries
         * @returns
         */
        let getCountries_migrAsPercOfPopulationAgeSex = (countries) => {
            return data_service.migrAsPercOfPopulationAgeSex.then((data) =>
                data_service
                    .filterColumn(
                        data_service.filterDataMulti(
                            data,
                            countries.map((c) => c.name),
                            1990,
                            2019
                        ),
                        ["Year", "Destination", "Total_(mf)"]
                    )
                    .map((d) => ({ Year: +d.Year, Destination: d.Destination, Total: +d["Total_(mf)"] }))
            );
        };

        /**
         * Function thar return the total migration data by age and sex
         * @param {array} countries
         * @returns
         */
        let getCountries_totMigrByAgeSex = (countries) => {
            return data_service.totMigrByAgeSex.then((data) => {
                let filteredData = data_service.filterDataMulti(
                    data,
                    countries.map((c) => c.name),
                    1990,
                    2019
                );

                let columns = Object.keys(data[0]).filter((key) => {
                    if (typeof key === "string" && key !== "Total_(mf)") {
                        return key.includes("_(mf)");
                    }
                });

                columns = columns.map((col) => {
                    let colElem = col.split("_")[0];
                    let ages = colElem.split("-");
                    if (col == "75+_(mf)") return { key: col, value: 77 };
                    return { key: col, value: (+ages[0] + +ages[1]) / 2 };
                });

                let groupedByYear = filteredData.map((worldData) => {
                    let yearsSum = 0;
                    columns.forEach((col) => {
                        yearsSum += col.value * +worldData[col.key];
                    });
                    let yearsAverage = yearsSum / +worldData["Total_(mf)"];

                    return {
                        Year: +worldData.Year,
                        Destination: worldData.Destination,
                        Total: yearsAverage,
                    };
                });

                return groupedByYear;
            });
        };

        /**
         * Function that returns the estimated refugees data
         * @param {array} countries
         * @returns
         */
        let getCountries_estimatedRefugees = (countries) => {
            return data_service.estimatedRefugees.then((data) => {
                let filteredData = data.filter((d) => {
                    return countries.some((c) => c.name === d.Destination);
                });

                let columns = Object.keys(data[0]).filter((key) => {
                    if (typeof key === "string") {
                        return key.includes("pct_(mf)");
                    }
                });

                let groupedByYear = filteredData.map((worldData) => {
                    return columns.map((col) => {
                        return {
                            Year: +col.split("_")[0],
                            Destination: worldData.Destination,
                            Total: worldData[col],
                        };
                    });
                });

                return groupedByYear.flat();
            });
        };

        /**
         * Function that returns the countries statistics according to the metric passed as parameter
         * @param {string} metric
         * @returns
         */
        data_service.getCountriesStatistics = (metric) => {
            return data_service.countries.then((countries) => {
                switch (metric) {
                    case "total_immigration":
                        return getCountries_totMigrByOriginDest(countries);

                    case "total_population":
                        return getCountries_totPopulationByAgeSex(countries);

                    case "immigration_vs_population":
                        return getCountries_migrAsPercOfPopulationAgeSex(countries);

                    case "immigrants_avg_age":
                        return getCountries_totMigrByAgeSex(countries);

                    case "refugees_vs_immigrants":
                        return getCountries_estimatedRefugees(countries);

                    default:
                        throw `Invalid statistics metric: ${metric}`;
                }
            });
        };

        /**
         *
         * @param {string} genderFilterValue
         * @returns
         */
        data_service.getCountriesInwardOutwardMigrants = (genderFilterValue) => {
            return data_service.countries.then((countries) => {
                let filteredCountries = countries.filter((c) => c.props.C != undefined);
                let countryNames = filteredCountries.map((country) => country.name);

                let migrantsPreProcessing = function (data) {
                    return data.map((obj) => {
                        let result = {};
                        let centroid = countries.find((c) => c.name === obj.Destination);
                        result["centroid"] = centroid.props.C;

                        for (let key in obj) {
                            if (obj[key] === "" || obj[key] === "-") continue;
                            else if (key !== "Destination") {
                                result[key] = +obj[key];
                            } else {
                                result[key] = obj[key];
                            }
                        }

                        return result;
                    });
                };

                return getCountries_totMigrByOriginDest(
                    filteredCountries,
                    ["Year", "Destination", "Total"].concat(countryNames),
                    genderFilterValue
                ).then((data) => migrantsPreProcessing(data));
            });
        };

        /**
         * Function that returns the feeds data
         * @param {number} selectedYear
         * @returns
         */
        data_service.getFeedData = (selectedYear) => {
            return data_service.countries.then((countries) => {
                return data_service.totMigrByOriginDest.then((data) => {
                    let countryNames = countries.map((country) => country.name);
                    data = data
                        .filter(
                            (countryData) =>
                                countryNames.includes(countryData["Destination"]) &&
                                +countryData["Year"] === selectedYear
                        )
                        .map((countryData) => ({
                            title: countries[countryNames.indexOf(countryData.Destination)].visName,
                            value: +countryData["Total"],
                        }));

                    data.sort((a, b) => +b.value - +a.value);

                    return data;
                });
            });
        };

        /**
         * @returns
         */
        data_service.getWorldStatistics = () => {
            return data_service.countries.then((countries) => {
                let numCountries = countries.length;

                let totalMigrantsGroupByYear = data_service.totMigrByOriginDest.then((data) => {
                    data = data.filter((countryData) => countryData.Destination === "WORLD");

                    let groupedByYear = data.map((worldData) => ({
                        year: +worldData.Year,
                        total_immigration: +worldData.Total,
                    }));

                    return groupedByYear;
                });

                let totalPopulationGroupByYear = data_service.totPopulationByAgeSex.then((data) => {
                    data = data.filter((countryData) => countryData.Destination === "WORLD");

                    let groupedByYear = data.map((worldData) => ({
                        year: +worldData.Year,
                        total_population: +worldData["Total_(mf)"] * 1000,
                    }));

                    return groupedByYear;
                });

                let migrPercTotalPopulationGroupByYear = data_service.migrAsPercOfPopulationAgeSex.then((data) => {
                    data = data.filter((countryData) => countryData.Destination === "WORLD");

                    let groupedByYear = data.map((worldData) => ({
                        year: +worldData.Year,
                        immigration_vs_population: +worldData["Total_(mf)"],
                    }));

                    return groupedByYear;
                });

                let avgAgeMigrantsGroupByYear = data_service.totMigrByAgeSex.then((data) => {
                    data = data.filter((countryData) => countryData.Destination === "WORLD");

                    let selectedGender = "_(mf)";

                    let columns = Object.keys(data[0]).filter((key) => {
                        if (typeof key === "string" && key !== "Total" + selectedGender) {
                            return key.includes(selectedGender);
                        }
                    });

                    columns = columns.map((col) => {
                        let colElem = col.split("_")[0];
                        let ages = colElem.split("-");
                        if (col == "75+" + selectedGender) return { key: col, value: 77 };
                        return { key: col, value: (+ages[0] + +ages[1]) / 2 };
                    });

                    let groupedByYear = data.map((worldData) => {
                        let yearsSum = 0;
                        columns.forEach((col) => {
                            yearsSum += col.value * +worldData[col.key];
                        });
                        let yearsAverage = yearsSum / +worldData["Total" + selectedGender];

                        return {
                            year: +worldData.Year,
                            immigrants_avg_age: yearsAverage,
                        };
                    });

                    return groupedByYear;
                });

                let percEstimatedRefugeesGroupByYear = data_service.estimatedRefugees.then((data) => {
                    data = data.filter((countryData) => countryData.Destination === "WORLD");

                    let selectedGender = "pct_(mf)";

                    let groupedByYear = [];

                    let columns = Object.keys(data[0]).filter((key) => {
                        if (typeof key === "string") {
                            return key.includes(selectedGender);
                        }
                    });

                    columns.forEach((col) => {
                        let groupedObject = {};
                        groupedObject.refugees_vs_immigrants = +data[0][col];
                        groupedObject.year = +col.split("_")[0];
                        groupedByYear.push(groupedObject);
                    });
                    return groupedByYear;
                });

                let promisedResultsList = [
                    totalMigrantsGroupByYear,
                    totalPopulationGroupByYear,
                    migrPercTotalPopulationGroupByYear,
                    avgAgeMigrantsGroupByYear,
                    percEstimatedRefugeesGroupByYear,
                ];

                return Promise.all(promisedResultsList).then((values) => {
                    return values[0].map((yearData, idx) => {
                        return {
                            year: yearData.year,
                            statistics: {
                                total_immigration: values[0][idx].total_immigration,
                                total_population: values[1][idx].total_population,
                                immigration_vs_population: values[2][idx].immigration_vs_population,
                                immigrants_avg_age: values[3][idx].immigrants_avg_age,
                                refugees_vs_immigrants: values[4][idx].refugees_vs_immigrants,
                            },
                        };
                    });
                });
            });
        };
    }
})();
