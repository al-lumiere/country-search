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
      area: null,
      borders: [],
      currencies: [],
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

  it('сохраняет данные для подробного просмотра страны', () => {
    const raw = createCountryResponse();
    raw.area = 505992;
    raw.borders = ['FRA', 'PRT'];
    raw.currencies = [{ name: 'Euro' }];

    const result = mapCountryResponse(raw);

    expect(result).toMatchObject({
      area: 505992,
      borders: ['FRA', 'PRT'],
      currencies: ['Euro'],
    });
  });
});
