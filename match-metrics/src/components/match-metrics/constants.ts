import type { PlayerStats as UIPlayerStats } from '@/types/ui-player';

export const NUMERIC_METRICS: (keyof UIPlayerStats)[] = [
  'Goals',
  'Assists',
  'Expected Goals',
  'Key passes',
  'Pass completion %',
  'Progressive Passes',
  'Progressive Carries',
  'Tackles Won',
  'Interceptions',
  'Goals p 90',
  'Assists p 90',
  'Shot creating actions p 90',
  '% Aerial Duels won',
  'Matches Played',
  'Avg Mins per Match',
  '90s',
];
