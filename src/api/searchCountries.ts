import type { CountryApiResponse } from '../countries/types.js';
import { HttpError } from './HttpError.js';

const REQUEST_TIMEOUT_MS = 10_000;

type SearchCountries = (
  query: string,
  signal: AbortSignal,
) => Promise<CountryApiResponse[]>;

export const searchCountries: SearchCountries = async (query, signal) => {
  const timeoutController = new AbortController();

  const timeoutId = setTimeout(() => {
    timeoutController.abort(
      new DOMException('Request timed out', 'TimeoutError'),
    );
  }, REQUEST_TIMEOUT_MS);

  const combinedSignal = AbortSignal.any([signal, timeoutController.signal]);

  try {
    const response = await fetch(
      `https://countries.dev/name/${encodeURIComponent(query)}`,
      { signal: combinedSignal },
    );

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new HttpError(response.status);
    }

    const countries: CountryApiResponse[] = await response.json();

    return countries;
  } finally {
    clearTimeout(timeoutId);
  }
};
