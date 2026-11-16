import type { Country, CountryApiResponse } from './types.js';

type MapCountryResponse = (raw: CountryApiResponse) => Country;

export const mapCountryResponse: MapCountryResponse = (raw) => {
  return {
    name: raw.name,
    flag: raw.flag,
    capital: raw.capital ?? null,
    region: raw.region,
    population: raw.population,
    languages: raw.languages?.map((language) => language.name) ?? [],
  };
};
