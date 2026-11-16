import { HttpError } from './HttpError.js';

type GetSearchErrorMessage = (error: unknown) => string | null;

export const getSearchErrorMessage: GetSearchErrorMessage = (error) => {
  if (error instanceof Error && error.name === 'AbortError') {
    return null;
  }

  if (error instanceof Error && error.name === 'TimeoutError') {
    return 'Сервер не ответил вовремя. Попробуйте ещё раз.';
  }

  if (error instanceof HttpError) {
    if (error.status === 404) {
      return null;
    }

    return `Сервер вернул ошибку ${error.status}. Попробуйте ещё раз.`;
  }

  return 'Не удалось загрузить страны. Попробуйте ещё раз.';
};
