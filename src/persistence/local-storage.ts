import type { Trip } from "../domain/types";

const STORE_KEY = "split-bill:v1:trips";

export type TripStore = {
  activeTripId: string;
  trips: Trip[];
};

export function loadTripStore(): TripStore | null {
  const raw = window.localStorage.getItem(STORE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as TripStore;
    if (!Array.isArray(parsed.trips) || typeof parsed.activeTripId !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveTripStore(store: TripStore) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

