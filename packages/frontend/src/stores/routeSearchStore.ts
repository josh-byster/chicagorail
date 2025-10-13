import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface RouteSearchState {
  origin: string;
  destination: string;
  hasSearched: boolean;
  setOrigin: (origin: string) => void;
  setDestination: (destination: string) => void;
  setRoute: (origin: string, destination: string) => void;
  clearRoute: () => void;
}

export const useRouteSearchStore = create<RouteSearchState>()(
  persist(
    (set) => ({
      origin: '',
      destination: '',
      hasSearched: false,
      setOrigin: (origin) => set({ origin }),
      setDestination: (destination) => set({ destination }),
      setRoute: (origin, destination) =>
        set({
          origin,
          destination,
          hasSearched: !!(origin && destination), // Only mark as searched if both are provided
        }),
      clearRoute: () =>
        set({ origin: '', destination: '', hasSearched: false }),
    }),
    {
      name: 'route-search-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
