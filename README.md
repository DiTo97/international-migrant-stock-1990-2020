# international migrant stock on UNIMS 2020

An infovis dashboard for international migrant stock from 1990 to the present on UNIMS 2020.

![dashboard](assets/dashboard.gif)

## introduction

The proposed infovis dashboard is a dynamic and interactive tool designed to assist data analysts and general users in monitoring the trends and changes in international migrant stock from 1990 to the present.

The dashboard, built using [angularjs](https://angularjs.org/) and [D3js](https://d3js.org/), offers intuitive visualizations, powerful filtering options, and distinct panels to help users understand global migration patterns over time, focus on country-specific or country-to-country aspects of interest and make informed decisions based on the observed trends.

## installation

```bash
cd dashboard/
npm ci
```

## usage

```bash
cd dashboard/
python -m http.server 8080
```

## dataset

The dashboard sources its data from [UNIMS 2020](https://www.un.org/development/desa/pd/content/international-migrant-stock), a comprehensive and regularly updated census dataset maintained by the United Nations for population statistics. The dataset provides detailed information on international migrant stock collecting data at five-year intervals up to the year 2020 (so far). By making use of an authoritative dataset, we are able to ensure accurate and reliable information for both analysis and research purposes.

## citation

```plaintext
@software{IMS-UNIMS-2020,
  author = {Minutoli, Federico and Surpanu, Daniel and Ghirardelli, Matteo},
  license = {MIT},
  title = {international-migrant-stock-UNIMS-2020},
  url = {https://github.com/DiTo97/international-migrant-stock-UNIMS-2020},
  version = {1.0.0},
  year = {2024},
  note = {An infovis dashboard for international migrant stock from 1990 to the present on UNIMS 2020}
}
```

## authors

- [@DiTo97](https://github.com/DiTo97)
- [@arcadeghira](https://github.com/arcadeghira)
- [@danigit](https://github.com/danigit)

