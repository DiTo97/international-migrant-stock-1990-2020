/**
 * Functions that handle the resizing of the lateral menu on different screens
 * @param {boolean} isMenuOpened
 */
function resizeMenuPanel(isMenuOpened) {
    if (!isMenuOpened) {
        document.getElementById("menu-container").classList.remove("width-25");
        document.getElementById("menu-container").classList.add("width-0");
    } else {
        document.getElementById("menu-container").classList.remove("width-0");
        document.getElementById("menu-container").classList.add("width-25");
    }
}

let parseDate = d3.timeParse("%Y");

/**
 * Functions that changes the number format in "k", "M" notation
 * example 1000 -> 1k
 * @param {number} number
 * @returns
 */
function transformNumberFormat(number, order = false, decimals = 2, selectedMetric = "") {
    if (selectedMetric === "immigration_vs_population" || selectedMetric === "refugees_vs_immigrants") {
        return number.toFixed(decimals) + "%";
    }
    if (selectedMetric === "immigrants_avg_age") {
        return number.toFixed(0) + "y";
    }
    if (!order) {
        let steps = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "G" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" },
        ];

        let regularExpression = /\.0+$|(\.[0-9]*[1-9])0+$/;

        let i;
        for (i = steps.length - 1; i > 0; i--) {
            if (Math.abs(number) >= steps[i].value) {
                break;
            }
        }
   
        return (number / steps[i].value).toFixed(decimals).replace(regularExpression, "$1") + " " + steps[i].symbol;
    } else {
        /*
          - st is used with numbers ending in 1 (e.g. 1st, pronounced first)
          - nd is used with numbers ending in 2 (e.g. 92nd, pronounced ninety-second)
          - rd is used with numbers ending in 3 (e.g. 33rd, pronounced thirty-third)
          - As an exception to the above rules, all the "teen" numbers ending with 11, 12 or 13 use -th
          (e.g. 11th, pronounced eleventh, 112th, pronounced one hundred [and] twelfth)
          - th is used for all other numbers (e.g. 9th, pronounced ninth).

        */
        let j = number % 10,
            k = number % 100;
        if (j == 1 && k != 11) {
            return number + "st";
        }
        if (j == 2 && k != 12) {
            return number + "nd";
        }
        if (j == 3 && k != 13) {
            return number + "rd";
        }
        return number + "th";
    }
}

/**
 * Function that changes the spaces with "-"
 * @param {string} text
 * @returns
 */
const slugify = (text) => {
    return text.trim().split(" ").join("-").toLowerCase();
};

/**
 * Function that capitalize the string passed as parameter
 * @param {string} text
 * @returns
 */
const capitalize = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
};

const map = (obj, callable) => {
    return Object.fromEntries(d3.map(obj, (r) => [r[0], callable(r[1])]));
};

/**
 * Wrapper of `d3.scaleLog` to produce a logarithmic scale from a (min, max) domain.
 *
 * @param {array} data   The original linear data.
 * @param {array} range  The range on which to project the logarithmic domain.
 */
let d3_scaleLogMinMax = (data, range) => {
    const data_minMax = [d3.min(data), d3.max(data)];

    return d3.scaleSymlog(data_minMax, range).nice();
};

/**
 * Function that returns a N. A. string if the parameter is NaN else returns the parameter
 * @param {data element} data
 * @returns
 */
let setNotAvailable = (data, rank) => {
    return isNaN(data) ? "N/A" : transformNumberFormat(data, rank, 0);
};

/**
 * Check whether two arrays are equal sets.
 *
 * @param {array} a    The first array.
 * @param {array} b    The second array.
 */
function equals(a, b, sortFunc = null, equalsFunc = null) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;

    if (sortFunc === null) {
        a.sort();
        b.sort();
    } else {
        a.sort(sortFunc);
        b.sort(sortFunc);
    }

    return a.every((v, i) => (equalsFunc === null ? v === b[i] : equalsFunc(v, b[i])));
}

/**
 * Filter out duplicates from an array.
 */
function unique(a) {
    return [...new Set(a)];
}

/**
 * Function that creates a scale according to the passed parameters
 * @param {array} domain
 * @param {array} range
 * @param {string} type
 * @returns
 */
let createScale = (domain, range, type, padding = 0) => {
    switch (type) {
        case "time":
            return d3.scaleTime().domain(domain).range(range);
        case "linear":
            return d3.scaleLinear().domain(domain).range(range);
        case "band":
            return d3.scaleBand().range(range).domain(domain).padding(padding);
        default:
            throw "Scale not valid";
    }
};

/**
 * Function that controls if the passed country is valid
 * @param {object} props
 * @returns
 */
let isBadCountry = (props) => {
    return !props || !(props instanceof Country);
};
