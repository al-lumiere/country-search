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
});
