import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { render } from '@/test/utils/render';
import { api } from '@/lib/api';
import { StationPickerProvider } from './StationPicker';
import { TripPlanner } from './TripPlanner';
import { useTripParams } from '@/hooks/useTripParams';
import type { Stop } from '@chicagorail/shared';

const northbrook: Stop = { stop_id: 'NB', stop_name: 'Northbrook', stop_lat: 0, stop_lon: 0, stop_desc: '', wheelchair_boarding: 1 };
const union: Stop = { ...northbrook, stop_id: 'CUS', stop_name: 'Chicago Union Station' };
const aurora: Stop = { ...northbrook, stop_id: 'AURORA', stop_name: 'Aurora' };
function Planner() {
  const params = useTripParams();
  const location = useLocation();
  return <>
    <TripPlanner fromStop={params.fromId ? northbrook : null} toStop={params.toId ? union : null}
      fromRoutes={[]} selectedDate={params.selectedDate} isToday={false} isTomorrow={false}
      onDateChange={params.setDate} onClearFrom={() => params.setFrom(null)} onClearTo={() => params.setTo(null)} onSwap={params.swap} />
    <output data-testid="url">{location.search}</output>
  </>;
}
const show = (url: string) => render(<StationPickerProvider><Planner /></StationPickerProvider>, { initialEntries: [url] });
beforeAll(() => {
  const stored = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => { stored.set(key, value); },
    removeItem: (key: string) => { stored.delete(key); },
    clear: () => stored.clear(),
  });
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => vi.restoreAllMocks());
describe('station picker', () => {
  it.each([['Clear origin', 'to=CUS'], ['Clear destination', 'from=NB']])('can %s and retain the other stop and date', async (button, remaining) => {
    show('/?from=NB&to=CUS&date=2026-09-20&route=MD-N');
    await userEvent.click(screen.getByRole('button', { name: button }));
    expect(screen.getByTestId('url')).toHaveTextContent(`?${remaining}&date=2026-09-20`);
  });
  it('shows direct choices immediately, crosses out others, and skips them with the keyboard', async () => {
    vi.spyOn(api, 'getStopConnections').mockResolvedValue({ stop: northbrook, stops: [aurora, union, northbrook], eligibleStopIds: ['CUS'] });
    show('/?from=NB&date=2026-09-20');
    await userEvent.click(screen.getByRole('button', { name: /Anywhere/ }));
    expect(await screen.findByRole('option', { name: /Aurora/ })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Aurora')).toHaveClass('line-through');
    expect(screen.getByRole('option', { name: /Chicago Union/ })).toHaveAttribute('aria-disabled', 'false');
    await userEvent.type(screen.getByRole('combobox'), 'Chicago');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('to=CUS'));
  });
  it('checks origins against the destination when it was selected first', async () => {
    const check = vi.spyOn(api, 'getStopConnections').mockResolvedValue({ stop: union, stops: [northbrook, union], eligibleStopIds: ['NB'] });
    show('/?to=CUS&date=2026-09-20');
    await userEvent.click(screen.getByRole('button', { name: /Choose a station/ }));
    expect(await screen.findByRole('option', { name: 'Northbrook' })).toHaveAttribute('aria-disabled', 'false');
    expect(check).toHaveBeenCalledWith('CUS', 'from', '2026-09-20', expect.anything());
  });
});
