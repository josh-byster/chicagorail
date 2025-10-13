import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

export const useRouteSearchStore = create<RouteSearchState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'route-search-storage',
      storage: createJSONStorage(() => sessionStorage),
      // Properly serialize/deserialize Date objects
      partialize: (state) => ({
        ...state,
        date: state.date ? state.date.toISOString() : undefined,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.date && typeof state.date === 'string') {
          state.date = new Date(state.date);
        }
      },
    }
  )
);
