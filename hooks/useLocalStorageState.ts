// hooks/useLocalStorageState.ts

import { useEffect, useState } from "react";

/**
 * localStorage ile senkron çalışan state hook'u
 * Backend yokken proje ayarlarını kalıcı tutmak için
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch (error) {
      console.warn(`localStorage parse error for key "${key}"`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`localStorage set error for key "${key}"`, error);
    }
  }, [key, state]);

  return [state, setState];
}
