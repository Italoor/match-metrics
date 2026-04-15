/**
 * Integration tests for MatchMetricsDashboard: data loading, tabs, quick search.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MOCK_PLAYERS } from '@/lib/mock-data';

const dataServiceMocks = vi.hoisted(() => ({
  getPlayers: vi.fn(),
  getLeagues: vi.fn(),
  getSeasons: vi.fn(),
}));

vi.mock('@/lib/data-service', () => ({
  getPlayers: dataServiceMocks.getPlayers,
  getLeagues: dataServiceMocks.getLeagues,
  getSeasons: dataServiceMocks.getSeasons,
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }) => (
      <div {...(rest as object)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

import { MatchMetricsDashboard } from '@/components/match-metrics/match-metrics-dashboard';

describe('MatchMetricsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dataServiceMocks.getPlayers.mockResolvedValue(MOCK_PLAYERS);
    dataServiceMocks.getLeagues.mockResolvedValue(['La Liga', 'Premier League']);
    dataServiceMocks.getSeasons.mockResolvedValue(['2023-2024']);
  });

  it('loads players, leagues, and seasons on mount with current filter values', async () => {
    render(<MatchMetricsDashboard />);
    await waitFor(() => expect(dataServiceMocks.getPlayers).toHaveBeenCalled());
    expect(dataServiceMocks.getPlayers).toHaveBeenCalledWith(
      expect.objectContaining({ season: '2023-2024', comp: 'All', pos: 'All' }),
    );
    expect(dataServiceMocks.getLeagues).toHaveBeenCalled();
    expect(dataServiceMocks.getSeasons).toHaveBeenCalled();
  });

  it('refetches players when season, competition, or position filters change', async () => {
    const user = userEvent.setup();
    render(<MatchMetricsDashboard />);
    await waitFor(() => expect(dataServiceMocks.getPlayers).toHaveBeenCalledTimes(1));

    const seasonSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(seasonSelect, 'All');
    await waitFor(() => expect(dataServiceMocks.getPlayers).toHaveBeenCalledTimes(2));
    expect(dataServiceMocks.getPlayers).toHaveBeenLastCalledWith(
      expect.objectContaining({ season: 'All', comp: 'All', pos: 'All' }),
    );

    const compSelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(compSelect, 'La Liga');
    await waitFor(() => expect(dataServiceMocks.getPlayers).toHaveBeenCalledTimes(3));
    expect(dataServiceMocks.getPlayers).toHaveBeenLastCalledWith(
      expect.objectContaining({ comp: 'La Liga' }),
    );

    const posSelect = screen.getAllByRole('combobox')[2];
    await user.selectOptions(posSelect, 'FW');
    await waitFor(() => expect(dataServiceMocks.getPlayers).toHaveBeenCalledTimes(4));
    expect(dataServiceMocks.getPlayers).toHaveBeenLastCalledWith(
      expect.objectContaining({ pos: 'FW' }),
    );
  });

  it('switches visible tab content when navigation buttons are used', async () => {
    const user = userEvent.setup();
    render(<MatchMetricsDashboard />);
    expect(screen.getByRole('heading', { name: /Data Explorer/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Scatter Analysis/i }));
    expect(screen.getByRole('heading', { name: /Scatter Analysis/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Comparison/i }));
    expect(screen.getByText(/Primary Player/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Rankings/i }));
    expect(screen.getByText(/Goal Scoring Efficiency/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Data Explorer/i }));
    expect(screen.getByRole('heading', { name: /Data Explorer/i })).toBeInTheDocument();
  });

  it('filters explorer rows by the quick search box (name or squad)', async () => {
    const user = userEvent.setup();
    render(<MatchMetricsDashboard />);
    await waitFor(() => expect(screen.getByText(/Haaland/i)).toBeInTheDocument());

    const quickSearch = screen.getByPlaceholderText(/Quick search/i);
    await user.type(quickSearch, 'Mbapp');
    expect(screen.getByText(/Mbappé/i)).toBeInTheDocument();
    expect(screen.queryByText(/Haaland/i)).not.toBeInTheDocument();
  });
});
