/**
 * Access to the app-wide station search modal
 */

import { createContext, useContext } from 'react';

export type StationField = 'from' | 'to';

export interface OpenPickerOptions {
  /** Stay on the planner after choosing, instead of jumping to the results */
  keepPlanning?: boolean;
}

export type OpenPicker = (field: StationField, options?: OpenPickerOptions) => void;

export const StationPickerContext = createContext<OpenPicker | null>(null);

export function useStationPicker(): OpenPicker {
  const open = useContext(StationPickerContext);
  if (!open) {
    throw new Error('useStationPicker must be used inside <StationPickerProvider>');
  }
  return open;
}
