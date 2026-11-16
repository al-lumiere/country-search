import type { CountryApiResponse } from '../countries/types.js';
import { HttpError } from './HttpError.js';

type SearchCountries = (
  query: string,
  signal: AbortSignal,
) => Promise<CountryApiResponse[]>;

export const searchCountries: SearchCountries = async (query, signal) => {
  const response = await fetch(
    `https://countries.dev/name/${encodeURIComponent(query)}`,
    { signal },
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new HttpError(response.status);
  }

  const countries: CountryApiResponse[] = await response.json();

  return countries;
};
