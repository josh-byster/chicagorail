/**
 * Access to the app-wide station search modal
 */

import { createContext, useContext } from 'react';

export type StationField = 'from' | 'to';

export type OpenPicker = (field: StationField) => void;

export const StationPickerContext = createContext<OpenPicker | null>(null);

export function useStationPicker(): OpenPicker {
  const open = useContext(StationPickerContext);
  if (!open) {
    throw new Error('useStationPicker must be used inside <StationPickerProvider>');
  }
  return open;
}
