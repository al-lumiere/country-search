import { describe, expect, it } from 'vitest';
import { getSearchErrorMessage } from './getSearchErrorMessage';
import { HttpError } from './HttpError.js';

describe('getSearchErrorMessage', () => {
  it('не показывает отмену запроса как ошибку', () => {
    const error = new DOMException('Request aborted', 'AbortError');

    expect(getSearchErrorMessage(error)).toBeNull();
  });

  it('возвращает отдельное сообщение для таймаута', () => {
    const error = new DOMException('Request timed out', 'TimeoutError');

    expect(getSearchErrorMessage(error)).toBe(
      'Сервер не ответил вовремя. Попробуйте ещё раз.',
    );
  });

  it('включает HTTP-статус в сообщение об ошибке сервера', () => {
    expect(getSearchErrorMessage(new HttpError(500))).toBe(
      'Сервер вернул ошибку 500. Попробуйте ещё раз.',
    );
  });

  it('не показывает статус 404 как ошибку', () => {
    expect(getSearchErrorMessage(new HttpError(404))).toBeNull();
  });

  it('возвращает понятное сообщение при ошибке сети', () => {
    const error = new TypeError('Failed to fetch');

    expect(getSearchErrorMessage(error)).toBe(
      'Не удалось загрузить страны. Попробуйте ещё раз.',
    );
  });

  it('обрабатывает неизвестное значение ошибки', () => {
    expect(getSearchErrorMessage(null)).toBe(
      'Не удалось загрузить страны. Попробуйте ещё раз.',
    );
  });
});
