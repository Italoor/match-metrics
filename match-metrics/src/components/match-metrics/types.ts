import type { UIPlayerStats } from '@/types/ui-player';

export type TabType = 'explorer' | 'scatter' | 'comparison' | 'rankings';

export type GroupedPlayer = {
  playerName: string;
  squads: string[];
  seasons: UIPlayerStats[];
};
