import { create } from 'zustand';

interface RouteSearchState {
  origin: string;
  destination: string;
  date: Date | undefined;
  time: string | undefined;
  hasSearched: boolean;
  setOrigin: (origin: string) => void;
  setDestination: (destination: string) => void;
  setDate: (date: Date | undefined) => void;
  setTime: (time: string | undefined) => void;
  setRoute: (origin: string, destination: string) => void;
  clearRoute: () => void;
}

export const useRouteSearchStore = create<RouteSearchState>((set) => ({
  origin: '',
  destination: '',
  date: undefined,
  time: undefined,
  hasSearched: false,
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setDate: (date) => set({ date }),
  setTime: (time) => set({ time }),
  setRoute: (origin, destination) =>
    set({
      origin,
      destination,
      hasSearched: !!(origin && destination), // Only mark as searched if both are provided
    }),
  clearRoute: () =>
    set({
      origin: '',
      destination: '',
      date: undefined,
      time: undefined,
      hasSearched: false,
    }),
}));
