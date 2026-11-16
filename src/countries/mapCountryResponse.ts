import type { Country, CountryApiResponse } from './types.js';

type MapCountryResponse = (raw: CountryApiResponse) => Country;

export const mapCountryResponse: MapCountryResponse = () => {
  throw new Error('Not implemented');
};
