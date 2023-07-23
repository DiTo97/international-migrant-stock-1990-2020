"use strict";

class Country {
    /**
     * @param {string}                  name      The official name of the country.
     * @param {string}                  continent The geographic continent of the country.
     * @param {string}                  region    The geographic region of the country.
     * @param {string}                  visName   A friendly name for visualization purposes.
     * @param {Object.<string, string>} props     Additional info on the country.
     */
    constructor(name, continent, region,
            visName = null, props = {}) {
        this.name        = name;
        this.continent   = continent;
        this.region      = region;
        this.visName     = visName ||= name;
        this.props       = props;

        this.flagPath    = IMAGE_COUNTIRES_FLAGS_FOLDER    + '/' + visName + '.svg';
        this.outlinePath = IMAGE_COUNTRIES_OUTLINES_FOLDER + '/' + visName + '.svg';
    }

    equals(other) {
        return (other instanceof Country)
            ? this.name === other.name : false;
    }

    static sort(c1, c2) {
        return c1.name.localeCompare(c2.name);
    }

    static equals(c1, c2) {
        return (c1 instanceof Country)
            ? c1.equals(c2) : false;
    }
}