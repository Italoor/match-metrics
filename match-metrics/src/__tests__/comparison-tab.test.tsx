/**
 * Integration tests for ComparisonTab: metric bars and radar when two players selected.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ComparisonTab } from '@/components/match-metrics/comparison-tab';
import type { UIPlayerStats } from '@/types/ui-player';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="recharts-container">{children}</div>,
  RadarChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  Radar: () => null,
  Legend: () => null,
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }) => (
      <div {...(rest as object)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const uiRow = (overrides: Partial<UIPlayerStats> = {}): UIPlayerStats =>
  ({
    player: 'P1',
    nation: 'N',
    pos: 'FW',
    squad: 'S1',
    comp: 'C',
    age: 22,
    born: 2001,
    'Matches Played': 10,
    'Avg Mins per Match': 80,
    Goals: 10,
    Assists: 2,
    'Goals & Assists': 12,
    'Non Penalty Goals': 9,
    'Penalty Kicks Made': 1,
    'Expected Goals': 6,
    'Exp NPG': 5,
    'Progressive Carries': 20,
    'Progressive Passes': 30,
    'Goals p 90': 1,
    'Assists p 90': 0.2,
    'Tackles attempted': 5,
    'Tackles Won': 4,
    '% Dribbles tackled': 50,
    'Shots blocked': 0,
    'Passes blocked': 0,
    Interceptions: 1,
    Clearances: 0,
    'Errors made': 0,
    'Goals Against': 0,
    'Goals against p 90': 0,
    Saves: 0,
    'Saves %': 0,
    'Clean Sheets': 0,
    '% Clean sheets': 0,
    '% Penalty saves': 0,
    'Passes Completed': 100,
    'Passes Attempted': 120,
    'Pass completion %': 80,
    'Progressive passes distance': 0,
    '% Short pass completed': 0,
    '% Medium passes completed': 0,
    '% Long passes completed': 0,
    'Key passes': 12,
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
    'Goals Scored': 10,
    'Total Shots': 40,
    '% Shots on target': 0,
    'Shots p 90': 0,
    'Goals per shot': 0,
    'Goals per shot on target': 0,
    '% Aerial Duels won': 0,
    'Shot creating actions p 90': 0,
    'Goal creating actions p 90': 0,
    'Crosses Stopped': 0,
    season: '2023-2024',
    ...overrides,
  }) as UIPlayerStats;

describe('ComparisonTab', () => {
  it('renders player search labels for both slots', () => {
    render(
      <ComparisonTab
        selectedPlayer1={null}
        selectedPlayer2={null}
        onSelectPlayer1={vi.fn()}
        onSelectPlayer2={vi.fn()}
      />,
    );
    expect(screen.getByText(/Primary Player/i)).toBeInTheDocument();
    expect(screen.getByText(/Comparison Player/i)).toBeInTheDocument();
  });

  it('shows metric comparison and radar when two players are selected', () => {
    const p1 = uiRow({ player: 'Alice', Goals: 10, 'Expected Goals': 5, 'Key passes': 8, 'Progressive Passes': 20 });
    const p2 = uiRow({ player: 'Bob', Goals: 4, 'Expected Goals': 3, 'Key passes': 12, 'Progressive Passes': 10 });
    render(
      <ComparisonTab
        selectedPlayer1={p1}
        selectedPlayer2={p2}
        onSelectPlayer1={vi.fn()}
        onSelectPlayer2={vi.fn()}
      />,
    );
    expect(screen.getByText(/Metric Comparison/i)).toBeInTheDocument();
    const goalsRow = screen.getByText('Goals').closest('.space-y-2');
    expect(goalsRow).toBeTruthy();
    expect(within(goalsRow as HTMLElement).getByText('10')).toBeInTheDocument();
    expect(within(goalsRow as HTMLElement).getByText('4')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-container')).toBeInTheDocument();
  });
});
