import type { Country } from '../countries/types.js';

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

export const createSearchController: CreateSearchController = () => {
  throw new Error('Not implemented');
};
