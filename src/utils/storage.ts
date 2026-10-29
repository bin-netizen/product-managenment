import { useSyncExternalStore } from "react";

// Ghi dữ liệu vào localStorage và ghi nhận lỗi (thường là đầy bộ nhớ ~5MB)
// để giao diện cảnh báo thay vì mất dữ liệu trong im lặng.

const failedKeys = new Set<string>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));

    if (failedKeys.delete(key)) {
      notify();
    }
  } catch {
    if (!failedKeys.has(key)) {
      failedKeys.add(key);
      notify();
    }
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return failedKeys.size > 0;
}

export function useStorageError(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}