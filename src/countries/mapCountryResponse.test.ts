import { describe, expect, it } from 'vitest';
import { mapCountryResponse } from './mapCountryResponse';
import type { CountryApiResponse } from './types.js';

function createCountryResponse(): CountryApiResponse {
  return {
    name: 'Spain',
    flag: 'https://countries.dev/flags/es.svg',
    capital: 'Madrid',
    region: 'Europe',
    population: 47000000,
    languages: [{ name: 'Spanish' }, { name: 'Catalan' }],
  };
}

describe('mapCountryResponse', () => {
  it('преобразует ответ API в данные страны', () => {
    const raw = createCountryResponse();

    const result = mapCountryResponse(raw);

    expect(result).toEqual({
      name: 'Spain',
      flag: 'https://countries.dev/flags/es.svg',
      capital: 'Madrid',
      region: 'Europe',
      population: 47000000,
      languages: ['Spanish', 'Catalan'],
    });
  });

  it('обрабатывает отсутствие столицы и языков', () => {
    const raw = createCountryResponse();
    delete raw.capital;
    delete raw.languages;

    const result = mapCountryResponse(raw);

    expect(result.capital).toBeNull();
    expect(result.languages).toEqual([]);
  });

  it('не изменяет исходные данные', () => {
    const raw = createCountryResponse();
    const original = structuredClone(raw);

    mapCountryResponse(raw);

    expect(raw).toEqual(original);
  });
});
