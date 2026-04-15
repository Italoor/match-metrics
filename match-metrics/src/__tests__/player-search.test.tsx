/**
 * Integration tests for PlayerSearch: debounced query, results, click-outside.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const searchAllSeasonsByQuery = vi.hoisted(() => vi.fn());

vi.mock('@/lib/data-service', () => ({
  searchAllSeasonsByQuery: (...args: unknown[]) => searchAllSeasonsByQuery(...args),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: { children?: React.ReactNode; [k: string]: unknown }) => (
      <div {...(rest as object)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

import { PlayerSearch } from '@/components/match-metrics/player-search';

const minimalBackendPlayer = {
  id: '1',
  name: 'Zed Player',
  team: 'Zed FC',
  position: 'Forward',
  nationality: 'Z',
  image_url: '',
  created_at: 't',
  comp: 'C',
  stats: {
    player_id: '1',
    season: '2023/24',
    updated_at: 't',
    matches_played: 10,
    total_minutes: 900,
    goals: 3,
    assists: 0,
    goals_assists: 3,
    non_penalty_goals: 3,
    penalty_kicks_made: 0,
    xg: 2,
    exp_npg: 2,
    progressive_carries: 0,
    progressive_passes: 0,
    goals_per_90: 0.3,
    assists_per_90: 0,
    tackles_attempted: 0,
    tackles_won: 0,
    dribbles_tackled_pct: 0,
    shots_blocked: 0,
    passes_blocked: 0,
    interceptions: 0,
    clearances: 0,
    errors_made: 0,
    goals_against: 0,
    goals_against_per_90: 0,
    saves: 0,
    saves_pct: 0,
    clean_sheets: 0,
    clean_sheets_pct: 0,
    penalty_saves_pct: 0,
    passes_completed: 0,
    passes_attempted: 0,
    pass_completion_pct: 0,
    prog_passes_dist: 0,
    short_pass_pct: 0,
    medium_pass_pct: 0,
    long_pass_pct: 0,
    key_passes: 0,
    passes_final_third: 0,
    passes_penalty_area: 0,
    touches_def_pen: 0,
    take_ons_attempted: 0,
    take_ons_success_pct: 0,
    take_ons_tackled: 0,
    carries_prgc: 0,
    carries_final_third: 0,
    carries_penalty_area: 0,
    possessions_lost: 0,
    goals_scored: 3,
    total_shots: 10,
    shots_on_target_pct: 0,
    shots_per_90: 1,
    goals_per_shot: 0.3,
    goals_per_shot_on_target: 0,
    aerial_duels_won_pct: 0,
    sca_per_90: 0,
    gca_per_90: 0,
    crosses_stopped: 0,
  },
};

describe('PlayerSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchAllSeasonsByQuery.mockResolvedValue([minimalBackendPlayer]);
  });

  it('does not call the backend until the query is at least 2 characters after debounce', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PlayerSearch label="Find" selectedPlayer={null} onSelect={onSelect} />);
    const input = screen.getByPlaceholderText(/Search player/i);
    await user.type(input, 'z');
    await new Promise<void>(r => {
      setTimeout(r, 450);
    });
    expect(searchAllSeasonsByQuery).not.toHaveBeenCalled();
  });

  it('debounces search and shows grouped results after 400ms', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PlayerSearch label="Find" selectedPlayer={null} onSelect={onSelect} />);
    const input = screen.getByPlaceholderText(/Search player/i);
    await user.type(input, 'ze');
    await waitFor(() => expect(searchAllSeasonsByQuery).toHaveBeenCalledWith('ze'), { timeout: 3000 });
    expect(await screen.findByText(/Zed Player/i)).toBeInTheDocument();
  });

  it('closes the dropdown when clicking outside the component', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <PlayerSearch label="Find" selectedPlayer={null} onSelect={vi.fn()} />
        <button type="button">
          outside
        </button>
      </div>,
    );
    const input = screen.getByPlaceholderText(/Search player/i);
    await user.click(input);
    await user.type(input, 'ze');
    await waitFor(() => expect(searchAllSeasonsByQuery).toHaveBeenCalled(), { timeout: 3000 });
    expect(await screen.findByText(/Zed Player/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByText(/Zed Player/i)).not.toBeInTheDocument();
  });
});
