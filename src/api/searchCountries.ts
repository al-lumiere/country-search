import type { CountryApiResponse } from '../countries/types.js';

type SearchCountries = (
  query: string,
  signal: AbortSignal,
) => Promise<CountryApiResponse[]>;

export const searchCountries: SearchCountries = async () => {
  throw new Error('Not implemented');
};
