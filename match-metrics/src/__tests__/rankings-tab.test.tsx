/**
 * Integration tests for RankingsTab: top five ordering by metric.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import { RankingsTab } from '@/components/match-metrics/rankings-tab';
import type { UIPlayerStats } from '@/types/ui-player';

const dataServiceMocks = vi.hoisted(() => ({
  getPlayers: vi.fn(),
}));

vi.mock('@/lib/data-service', () => ({
  getPlayers: dataServiceMocks.getPlayers,
}));

vi.mock('@/components/match-metrics/player-adapters', () => ({
  adaptPlayer: (p: any) => p,
  aggregateUIStats: (seasons: any[]) => seasons[0],
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }) => (
      <div {...(rest as object)}>{children}</div>
    ),
  },
}));

const row = (player: string, goalsPer90: number, squad = 'S'): UIPlayerStats =>
  ({
    player,
    nation: 'N',
    pos: 'FW',
    position: 'FW',
    squad,
    comp: 'C',
    age: 20,
    born: 2004,
    minutes: 1500,
    minutes_90s: 1500 / 90,
    'Matches Played': 10,
    'Avg Mins per Match': 80,
    Minutes: 1500, // needs > 1040 mins to pass the threshold
    Goals: 5,
    Assists: 0,
    'Goals & Assists': 5,
    'Non Penalty Goals': 5,
    'Penalty Kicks Made': 0,
    'Expected Goals': 2,
    'Exp NPG': 2,
    'Progressive Carries': 10,
    'Progressive Passes': 5,
    'Progressive Passes p 90': 0,
    'Goals p 90': goalsPer90,
    'Assists p 90': 0,
    '90s': 1500 / 90,
    'Tackles attempted': 0,
    'Tackles Won': 0,
    '% Dribbles tackled': 0,
    'Shots blocked': 0,
    'Passes blocked': 0,
    Interceptions: 0,
    Clearances: 0,
    'Errors made': 0,
    'Goals Against': 0,
    'Goals against p 90': 0,
    Saves: 0,
    'Saves %': 0,
    'Clean Sheets': 0,
    '% Clean sheets': 0,
    '% Penalty saves': 0,
    'Passes Completed': 0,
    'Passes Attempted': 0,
    'Pass completion %': 0,
    'Progressive passes distance': 0,
    '% Short pass completed': 0,
    '% Medium passes completed': 0,
    '% Long passes completed': 0,
    'Key passes': 1,
    '1/3': 0,
    'Passes into penalty area': 0,
    touches_def_pen: 0,
    'Take ons attempted': 0,
    '% Successful take-ons': 0,
    'Times tackled during take-on': 0,
    carries_prgc: 0,
    'carries final 3rd': 0,
    'carries penalty area': 0,
    'Possessions lost': 0,
    'Goals Scored': 5,
    'Total Shots': 10,
    '% Shots on target': 0,
    'Shots p 90': 0,
    'Goals per shot': 0,
    'Goals per shot on target': 0,
    '% Aerial Duels won': 0,
    'Shot creating actions p 90': 0,
    'Goal creating actions p 90': 0,
    'Crosses Stopped': 0,
    season: '2023-2024',
  }) as UIPlayerStats;

describe('RankingsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows top five players by Goals per 90 in the rankings column', async () => {
    const players = [
      row('Low', 0.05),
      row('Mid', 0.15),
      row('High', 0.45),
      row('Top', 0.5),
      row('Second', 0.35),
      row('Third', 0.25),
    ];
    dataServiceMocks.getPlayers.mockResolvedValue(players);
    render(
      <RankingsTab
        availableSeasons={['2023-2024']}
        availableComps={['C']}
        fetchPlayersCached={dataServiceMocks.getPlayers}
      />,
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Goals per 90/i)).toBeInTheDocument();
    });

    const efficiencyCard = screen.getByText(/Goals per 90/i).closest('.rounded-3xl');
    expect(efficiencyCard).toBeTruthy();
    const names = within(efficiencyCard as HTMLElement)
      .getAllByText(/^Top$|^High$|^Second$|^Third$|^Mid$|^Low$/)
      .map((el) => el.textContent);
    expect(names).toEqual(['Top', 'High', 'Second', 'Third', 'Mid']);
  });

  it('displays rank indices 1 through 5 for the goals per 90 card', async () => {
    const players = Array.from({ length: 6 }, (_, i) => row(`P${i}`, 0.1 + i * 0.01));
    dataServiceMocks.getPlayers.mockResolvedValue(players);
    render(
      <RankingsTab
        availableSeasons={['2023-2024']}
        availableComps={['C']}
        fetchPlayersCached={dataServiceMocks.getPlayers}
      />,
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Goals per 90/i)).toBeInTheDocument();
    });

    const efficiencyCard = screen.getByText(/Goals per 90/i).closest('.rounded-3xl');
    expect(efficiencyCard).toBeTruthy();
    const ranks = within(efficiencyCard as HTMLElement).getAllByText(/^[1-5]$/);
    expect(ranks.map((e) => e.textContent)).toEqual(['1', '2', '3', '4', '5']);
  });
});
