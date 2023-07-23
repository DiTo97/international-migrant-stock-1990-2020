/**
 * This file will contain all the configurations and the constants
 */

// this is the path for the components folder
const components_folder = "app/components/";
const controllers_folder = "app/controllers/";

// Path to data folders
const data_folder = "app/data";

const data_csv_folder = data_folder + "/csv/";
const data_json_folder = data_folder + "/json";

// Path to JSON tables
const world_countries_hierarchy = data_json_folder + "/world_countries_hierarchy.json";
const world_countries_vis_name = data_json_folder + "/world_countries_vis_name.json";

// Path to TopoJSON world map
const WORLD_MAP = data_json_folder + "/world_map_1_5_simplification.json";

// Path to image folders
const image_folder = "app/img/";

const image_countries_folder = image_folder + "countries";
const image_home_folder = image_folder + "home";

const IC_PLAY = image_home_folder + "/play.svg";
const IC_PAUSE = image_home_folder + "/pause.svg";

const IMAGE_COUNTRIES_OUTLINES_FOLDER = image_countries_folder + "/outlines";
const IMAGE_COUNTIRES_FLAGS_FOLDER = image_countries_folder + "/flags";

// names of origin and destination tables
const total_migrants_by_origin_and_destination = "app/data/csv/migrants_by_origin_and_destination_total.csv";
const male_migrants_by_origin_and_destination = "app/data/csv/migrants_by_origin_and_destination_male.csv";
const female_migrants_by_origin_and_destination = "app/data/csv/migrants_by_origin_and_destination_female.csv";

// paths for age and sex tables
const total_population_by_age_and_sex = "app/data/csv/total_population_by_age_and_sex.csv";
const total_migrants_by_age_and_sex = "app/data/csv/migrants_by_age_and_sex_total.csv";
const migrants_percentage_distribution_by_age_and_sex = "app/data/csv/migrants_pct_distribution_by_age_and_sex.csv";
const migrants_as_percentage_of_total_population_by_age_and_sex =
    "app/data/csv/migrants_pct_total_population_by_age_and_sex.csv";

// path for countries classes table
const countries_classes_by_region = "app/data/csv/countries_class_by_region.csv";
const COUNTRY_CODES_ALPHA_3 = data_csv_folder + "country_codes_alpha_3.csv";

// path for estimated refugee stock table
const estimated_refugees = "app/data/csv/est_refugee_stock.csv";

// path for migrant stock rate of change table table
const migrants_annual_rate_of_change = "app/data/csv/migrants_annual_rate_of_change.csv";

// legend squares dimension
const LEGEND_SQUARE_DIM = 10;

// the duration of the transitions
const TRANSITION_DURATION = 1000;

const HOME_MAP_YEAR_REPS = 3;

const HOVERED_COLOR = "#3b4248";
const HOVERED_COLOR_STATISTICS = "#ff9316";

const HOME_COUNTRY_MAP_STROKE = "#272f35";
const HOME_COUNTRY_COLOR = "#191f24";

const SVG_MARGINS = { top: 20, bottom: 60, left: 20, right: 20 };
const SVG_WIDTH = 500 - SVG_MARGINS.left - SVG_MARGINS.right;
const SVG_HEIGHT = 350 - SVG_MARGINS.top - SVG_MARGINS.bottom;
