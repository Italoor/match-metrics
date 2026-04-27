/**
 * Integration tests for ExplorerTab: filters, sorting, CSV export trigger.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExplorerTab } from '@/components/match-metrics/explorer-tab';
import type { UIPlayerStats } from '@/types/ui-player';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }) => (
      <div {...(rest as object)}>{children}</div>
    ),
  },
}));

const baseRow = (overrides: Partial<UIPlayerStats> = {}): UIPlayerStats =>
  ({
    player: 'Alpha',
    nation: 'N',
    pos: 'FW',
    squad: 'Squad A',
    comp: 'C1',
    age: 22,
    born: 2001,
    'Matches Played': 10,
    'Avg Mins per Match': 80,
    Goals: 5,
    Assists: 1,
    'Goals & Assists': 6,
    'Non Penalty Goals': 4,
    'Penalty Kicks Made': 1,
    'Expected Goals': 3,
    'Exp NPG': 2,
    'Progressive Carries': 1,
    'Progressive Passes': 2,
    'Goals p 90': 0.5,
    'Assists p 90': 0.1,
    'Tackles attempted': 1,
    'Tackles Won': 1,
    '% Dribbles tackled': 50,
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
    'Pass completion %': 80,
    'Progressive passes distance': 0,
    '% Short pass completed': 0,
    '% Medium passes completed': 0,
    '% Long passes completed': 0,
    'Key passes': 2,
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
    ...overrides,
  }) as UIPlayerStats;

describe('ExplorerTab', () => {
  it('invokes setSeasonFilter when the season dropdown changes', async () => {
    const user = userEvent.setup();
    const setSeasonFilter = vi.fn();
    render(
      <ExplorerTab
        seasonFilter="2023-2024"
        setSeasonFilter={setSeasonFilter}
        compFilter="All"
        setCompFilter={vi.fn()}
        posFilter="All"
        setPosFilter={vi.fn()}
        pageSize={50}
        setPageSize={vi.fn()}
        availableSeasons={['2023-2024']}
        availableComps={['C1']}
        filteredPlayers={[baseRow()]}
        sortColumn="Goals"
        sortDirection="desc"
        handleSort={vi.fn()}
        exportExplorerCsv={vi.fn()}
        searchTerm=""
        setSearchTerm={vi.fn()}
      />,
    );
    const seasonSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(seasonSelect, 'All');
    expect(setSeasonFilter).toHaveBeenCalledWith('All');
  });

  it('invokes handleSort when a sortable column header is clicked', async () => {
    const user = userEvent.setup();
    const handleSort = vi.fn();
    render(
      <ExplorerTab
        seasonFilter="All"
        setSeasonFilter={vi.fn()}
        compFilter="All"
        setCompFilter={vi.fn()}
        posFilter="All"
        setPosFilter={vi.fn()}
        pageSize={50}
        setPageSize={vi.fn()}
        availableSeasons={['2023-2024']}
        availableComps={['C1']}
        filteredPlayers={[baseRow(), baseRow({ player: 'Beta', Goals: 1 })]}
        sortColumn="Goals"
        sortDirection="desc"
        handleSort={handleSort}
        exportExplorerCsv={vi.fn()}
        searchTerm=""
        setSearchTerm={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('columnheader', { name: /Player/i }));
    expect(handleSort).toHaveBeenCalledWith('player');
  });

  it('calls exportExplorerCsv when Export is clicked', async () => {
    const user = userEvent.setup();
    const exportExplorerCsv = vi.fn();
    render(
      <ExplorerTab
        seasonFilter="All"
        setSeasonFilter={vi.fn()}
        compFilter="All"
        setCompFilter={vi.fn()}
        posFilter="All"
        setPosFilter={vi.fn()}
        pageSize={50}
        setPageSize={vi.fn()}
        availableSeasons={['2023-2024']}
        availableComps={['C1']}
        filteredPlayers={[baseRow()]}
        sortColumn="Goals"
        sortDirection="desc"
        handleSort={vi.fn()}
        exportExplorerCsv={exportExplorerCsv}
        searchTerm=""
        setSearchTerm={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Export/i }));
    expect(exportExplorerCsv).toHaveBeenCalledTimes(1);
  });

  it('renders player rows from filteredPlayers', () => {
    render(
      <ExplorerTab
        seasonFilter="All"
        setSeasonFilter={vi.fn()}
        compFilter="All"
        setCompFilter={vi.fn()}
        posFilter="All"
        setPosFilter={vi.fn()}
        pageSize={50}
        setPageSize={vi.fn()}
        availableSeasons={['2023-2024']}
        availableComps={['C1']}
        filteredPlayers={[baseRow({ player: 'Gamma', squad: 'Squad G' })]}
        sortColumn="Goals"
        sortDirection="desc"
        handleSort={vi.fn()}
        exportExplorerCsv={vi.fn()}
        searchTerm=""
        setSearchTerm={vi.fn()}
      />,
    );
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByText('Squad G')).toBeInTheDocument();
  });
});
