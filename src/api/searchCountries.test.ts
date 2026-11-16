import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchCountries } from './searchCountries.js';
import { HttpError } from './HttpError.js';
import type { CountryApiResponse } from '../countries/types.js';

describe('searchCountries', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('возвращает страны, кодирует запрос и передаёт сигнал', async () => {
    const countries: CountryApiResponse[] = [
      {
        name: 'Test country',
        flag: 'https://example.com/flag.svg',
        region: 'Test region',
        population: 100,
      },
    ];
    const controller = new AbortController();

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(countries), { status: 200 }),
    );

    const result = await searchCountries('test country', controller.signal);

    expect(result).toEqual(countries);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://countries.dev/name/test%20country',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('возвращает пустой массив при статусе 404', async () => {
    const controller = new AbortController();

    fetchMock.mockResolvedValue(
      new Response('Country not found', { status: 404 }),
    );

    await expect(
      searchCountries('unknown', controller.signal),
    ).resolves.toEqual([]);
  });

  it('бросает HttpError со статусом при ошибке сервера', async () => {
    const controller = new AbortController();

    fetchMock.mockResolvedValue(new Response('Server error', { status: 500 }));

    const request = searchCountries('spain', controller.signal);

    await expect(request).rejects.toBeInstanceOf(HttpError);
    await expect(request).rejects.toMatchObject({
      name: 'HttpError',
      status: 500,
    });
  });

  it('пробрасывает исходную ошибку сети', async () => {
    const controller = new AbortController();
    const networkError = new TypeError('Failed to fetch');

    fetchMock.mockRejectedValue(networkError);

    await expect(searchCountries('spain', controller.signal)).rejects.toBe(
      networkError,
    );
  });
});
