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
});
