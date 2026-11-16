type Debounce = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
) => (...args: Args) => void;

export const debounce: Debounce = () => {
  throw new Error('Not implemented');
};
