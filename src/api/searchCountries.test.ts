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

  describe('отмена и таймаут', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    function mockPendingFetch() {
      fetchMock.mockImplementation(
        (_input, options) =>
          new Promise<Response>((_resolve, reject) => {
            const signal = options?.signal;

            if (!signal) {
              reject(new Error('AbortSignal is missing'));
              return;
            }

            if (signal.aborted) {
              reject(signal.reason);
              return;
            }

            signal.addEventListener('abort', () => reject(signal.reason), {
              once: true,
            });
          }),
      );
    }

    it('отменяет запрос по внешнему сигналу с AbortError', async () => {
      mockPendingFetch();
      const controller = new AbortController();

      const request = searchCountries('spain', controller.signal);
      const assertion = expect(request).rejects.toMatchObject({
        name: 'AbortError',
      });

      controller.abort();

      await assertion;
    });

    it('прерывает запрос через 10 секунд с TimeoutError', async () => {
      mockPendingFetch();
      const controller = new AbortController();
      const onError = vi.fn();

      const request = searchCountries('spain', controller.signal).catch(
        onError,
      );

      try {
        await vi.advanceTimersByTimeAsync(9999);

        expect(onError).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'TimeoutError',
          }),
        );
        expect(controller.signal.aborted).toBe(false);
      } finally {
        controller.abort();
        await request;
      }
    });
  });
});
