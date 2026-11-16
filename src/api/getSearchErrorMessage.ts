type GetSearchErrorMessage = (error: unknown) => string | null;

export const getSearchErrorMessage: GetSearchErrorMessage = () => {
  throw new Error('Not implemented');
};
