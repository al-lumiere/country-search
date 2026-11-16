import type { Country } from '../countries/types.js';
import { debounce } from '../utils/debounce.js';
import { searchCountries } from '../api/searchCountries.js';
import { mapCountryResponse } from '../countries/mapCountryResponse.js';
import { getSearchErrorMessage } from '../api/getSearchErrorMessage.js';

export interface SearchState {
  query: string;
  status: 'idle' | 'waiting' | 'loading' | 'success' | 'empty' | 'error';
  countries: Country[];
  errorMessage: string | null;
}

export interface SearchController {
  setQuery: (query: string) => void;
  retry: () => void;
  getState: () => SearchState;
  dispose: () => void;
}

type CreateSearchController = (
  onStateChange: (state: SearchState) => void,
) => SearchController;

const SEARCH_DELAY_MS = 300;

export const createSearchController: CreateSearchController = (
  onStateChange,
) => {
  let state: SearchState = {
    query: '',
    status: 'idle',
    countries: [],
    errorMessage: null,
  };

  let activeController: AbortController | undefined;
  let disposed = false;

  function updateState(patch: Partial<SearchState>) {
    state = { ...state, ...patch };
    onStateChange(state);
  }

  async function runSearch(query: string, requestController: AbortController) {
    if (disposed || requestController.signal.aborted || query === '') {
      return;
    }

    updateState({
      status: 'loading',
      countries: [],
      errorMessage: null,
    });

    try {
      const rawCountries = await searchCountries(
        query,
        requestController.signal,
      );

      if (disposed || requestController.signal.aborted) {
        return;
      }

      const countries = rawCountries.map(mapCountryResponse);

      updateState({
        status: countries.length > 0 ? 'success' : 'empty',
        countries,
        errorMessage: null,
      });
    } catch (error) {
      if (disposed || requestController.signal.aborted) {
        return;
      }

      const errorMessage = getSearchErrorMessage(error);

      if (errorMessage === null) {
        return;
      }

      updateState({
        status: 'error',
        countries: [],
        errorMessage,
      });
    }
  }

  const debouncedSearch = debounce(runSearch, SEARCH_DELAY_MS);

  function setQuery(value: string) {
    if (disposed) {
      return;
    }

    activeController?.abort();

    const query = value.trim();
    activeController = new AbortController();

    updateState({
      query,
      status: query === '' ? 'idle' : 'waiting',
      countries: [],
      errorMessage: null,
    });

    debouncedSearch(query, activeController);
  }

  function retry() {
    if (disposed || state.query === '') {
      return;
    }

    activeController?.abort();
    activeController = new AbortController();

    void runSearch(state.query, activeController);
  }

  function dispose() {
    disposed = true;
    activeController?.abort();
  }

  return {
    setQuery,
    retry,
    getState: () => state,
    dispose,
  };
};
