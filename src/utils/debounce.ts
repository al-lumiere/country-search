type Debounce = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
) => (...args: Args) => void;

export const debounce: Debounce = (fn, delay) => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args) => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, delay);
  };
};
