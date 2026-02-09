import { useEffect, useState } from "react";

/**
 * Generic debounce hook.
 *
 * Returns a debounced version of `value` that only updates
 * after `delay` milliseconds of no changes.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handle);
    };
  }, [value, delay]);

  return debouncedValue;
}

