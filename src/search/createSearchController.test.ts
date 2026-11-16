import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSearchController } from './createSearchController';
import type { SearchController } from './createSearchController';

describe('createSearchController', () => {
  const fetchMock = vi.fn<typeof fetch>();
  let controller: SearchController | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    controller = undefined;
  });

  afterEach(() => {
    controller?.dispose();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('не отправляет запрос для пустого ввода', async () => {
    controller = createSearchController(vi.fn());

    controller.setQuery('   ');
    await vi.advanceTimersByTimeAsync(300);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(controller.getState()).toEqual({
      query: '',
      status: 'idle',
      countries: [],
      errorMessage: null,
    });
  });

  it('после паузы ищет только последний введённый запрос', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    controller = createSearchController(vi.fn());

    controller.setQuery('sp');
    await vi.advanceTimersByTimeAsync(200);

    controller.setQuery('spain');

    expect(controller.getState().status).toBe('waiting');

    await vi.advanceTimersByTimeAsync(299);

    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://countries.dev/name/spain',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
    expect(controller.getState()).toEqual({
      query: 'spain',
      status: 'empty',
      countries: [],
      errorMessage: null,
    });
  });

  function mockPendingFetch() {
    const onAbort = vi.fn();

    fetchMock.mockImplementation(
      (_input, options) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = options?.signal;

          if (!signal) {
            reject(new Error('AbortSignal is missing'));
            return;
          }

          const abort = () => {
            onAbort();
            reject(signal.reason);
          };

          if (signal.aborted) {
            abort();
            return;
          }

          signal.addEventListener('abort', abort, { once: true });
        }),
    );

    return onAbort;
  }

  it('отменяет активный запрос сразу при новом вводе', async () => {
    const onAbort = mockPendingFetch();
    controller = createSearchController(vi.fn());

    controller.setQuery('sp');
    await vi.advanceTimersByTimeAsync(300);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    controller.setQuery('spain');

    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(0);

    expect(controller.getState().status).toBe('waiting');
    expect(controller.getState().errorMessage).toBeNull();
  });

  it('при очистке поля отменяет запрос и очищает состояние', async () => {
    const onAbort = mockPendingFetch();
    controller = createSearchController(vi.fn());

    controller.setQuery('spain');
    await vi.advanceTimersByTimeAsync(300);

    controller.setQuery('');
    await vi.advanceTimersByTimeAsync(300);

    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(controller.getState()).toEqual({
      query: '',
      status: 'idle',
      countries: [],
      errorMessage: null,
    });
  });

  it('повтор сразу ищет последний ввод без дублирования запроса', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('Server error', { status: 500 }))
      .mockResolvedValueOnce(new Response('[]', { status: 200 }));

    controller = createSearchController(vi.fn());

    controller.setQuery('spain');
    await vi.advanceTimersByTimeAsync(300);

    expect(controller.getState().status).toBe('error');

    controller.setQuery('france');
    controller.retry();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://countries.dev/name/france',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );

    await vi.advanceTimersByTimeAsync(300);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(controller.getState().query).toBe('france');
    expect(controller.getState().status).toBe('empty');
  });

  it('сохраняет последний результат при обратном порядке ответов', async () => {
    const responseOrder: string[] = [];
    const onAbort = vi.fn();
    const onStateChange = vi.fn();

    fetchMock.mockImplementation(
      (input, options) =>
        new Promise<Response>((resolve, reject) => {
          const query = String(input).endsWith('/sp') ? 'sp' : 'spain';
          const signal = options?.signal;

          if (!signal) {
            reject(new Error('AbortSignal is missing'));
            return;
          }

          const abort = () => {
            onAbort(query);
            reject(signal.reason);
          };

          if (signal.aborted) {
            abort();
            return;
          }

          signal.addEventListener('abort', abort, { once: true });

          setTimeout(
            () => {
              signal.removeEventListener('abort', abort);
              responseOrder.push(query);

              const country = {
                name: query === 'sp' ? 'Old result' : 'Spain',
                flag: 'https://example.com/flag.svg',
                region: 'Test region',
                population: 100,
              };

              resolve(new Response(JSON.stringify([country]), { status: 200 }));
            },
            query === 'sp' ? 1000 : 100,
          );
        }),
    );

    controller = createSearchController(onStateChange);

    controller.setQuery('sp');
    await vi.advanceTimersByTimeAsync(300);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    controller.setQuery('spain');

    expect(onAbort).toHaveBeenCalledWith('sp');

    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(100);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(responseOrder).toEqual(['spain']);
    expect(controller.getState().countries[0]?.name).toBe('Spain');

    await vi.advanceTimersByTimeAsync(600);

    expect(responseOrder).toEqual(['spain', 'sp']);
    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(controller.getState()).toMatchObject({
      query: 'spain',
      status: 'success',
      countries: [
        expect.objectContaining({
          name: 'Spain',
        }),
      ],
      errorMessage: null,
    });

    expect(onStateChange).not.toHaveBeenCalledWith(
      expect.objectContaining({
        countries: [
          expect.objectContaining({
            name: 'Old result',
          }),
        ],
      }),
    );
  });
});
