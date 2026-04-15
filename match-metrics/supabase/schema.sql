-- Tabele de Jogadores
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rk INTEGER,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  position TEXT NOT NULL,
  nationality TEXT NOT NULL,
  comp TEXT,
  age INTEGER,
  born INTEGER,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Estatísticas (Relacionada 1:1 cu Jogadores)
CREATE TABLE player_stats (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  matches_played INTEGER DEFAULT 0,
  total_minutes DECIMAL DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  goals_assists INTEGER DEFAULT 0,
  non_penalty_goals INTEGER DEFAULT 0,
  penalty_kicks_made INTEGER DEFAULT 0,
  xg DECIMAL DEFAULT 0,
  exp_npg DECIMAL DEFAULT 0,
  progressive_carries INTEGER DEFAULT 0,
  progressive_passes INTEGER DEFAULT 0,
  goals_per_90 DECIMAL DEFAULT 0,
  assists_per_90 DECIMAL DEFAULT 0,
  tackles_attempted INTEGER DEFAULT 0,
  tackles_won INTEGER DEFAULT 0,
  dribbles_tackled_pct DECIMAL DEFAULT 0,
  shots_blocked INTEGER DEFAULT 0,
  passes_blocked INTEGER DEFAULT 0,
  interceptions INTEGER DEFAULT 0,
  clearances INTEGER DEFAULT 0,
  errors_made INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goals_against_per_90 DECIMAL DEFAULT 0,
  saves INTEGER DEFAULT 0,
  saves_pct DECIMAL DEFAULT 0,
  clean_sheets INTEGER DEFAULT 0,
  clean_sheets_pct DECIMAL DEFAULT 0,
  penalty_saves_pct DECIMAL DEFAULT 0,
  passes_completed INTEGER DEFAULT 0,
  passes_attempted INTEGER DEFAULT 0,
  pass_completion_pct DECIMAL DEFAULT 0,
  prog_passes_dist DECIMAL DEFAULT 0,
  short_pass_pct DECIMAL DEFAULT 0,
  medium_pass_pct DECIMAL DEFAULT 0,
  long_pass_pct DECIMAL DEFAULT 0,
  key_passes INTEGER DEFAULT 0,
  passes_final_third INTEGER DEFAULT 0,
  passes_penalty_area INTEGER DEFAULT 0,
  touches_def_pen INTEGER DEFAULT 0,
  take_ons_attempted INTEGER DEFAULT 0,
  take_ons_success_pct DECIMAL DEFAULT 0,
  take_ons_tackled INTEGER DEFAULT 0,
  carries_prgc INTEGER DEFAULT 0,
  carries_final_third INTEGER DEFAULT 0,
  carries_penalty_area INTEGER DEFAULT 0,
  possessions_lost INTEGER DEFAULT 0,
  goals_scored INTEGER DEFAULT 0,
  total_shots INTEGER DEFAULT 0,
  shots_on_target_pct DECIMAL DEFAULT 0,
  shots_per_90 DECIMAL DEFAULT 0,
  goals_per_shot DECIMAL DEFAULT 0,
  goals_per_shot_on_target DECIMAL DEFAULT 0,
  aerial_duels_won_pct DECIMAL DEFAULT 0,
  sca_per_90 DECIMAL DEFAULT 0,
  gca_per_90 DECIMAL DEFAULT 0,
  crosses_stopped INTEGER DEFAULT 0,
  season TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Cache de Ligas (Maior performance de busca)
CREATE TABLE leagues_cache (
  comp TEXT PRIMARY KEY
);

-- Tabela de Cache de Temporadas
CREATE TABLE seasons_cache (
  season TEXT PRIMARY KEY
);

-- Migração dos dados caso já existam no banco
INSERT INTO leagues_cache (comp)
SELECT DISTINCT comp FROM players WHERE comp IS NOT NULL;

INSERT INTO seasons_cache (season)
SELECT DISTINCT season FROM player_stats WHERE season IS NOT NULL;

-- Gatilho para preencher automaticamente de novas Ligas na inserção
CREATE OR REPLACE FUNCTION update_leagues_cache()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.comp IS NOT NULL THEN
    INSERT INTO leagues_cache (comp) VALUES (NEW.comp) ON CONFLICT (comp) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_leagues_cache
AFTER INSERT OR UPDATE OF comp ON players
FOR EACH ROW EXECUTE FUNCTION update_leagues_cache();

-- Gatilho para preencher automaticamente de novas Temporadas
CREATE OR REPLACE FUNCTION update_seasons_cache()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.season IS NOT NULL THEN
    INSERT INTO seasons_cache (season) VALUES (NEW.season) ON CONFLICT (season) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_seasons_cache
AFTER INSERT OR UPDATE OF season ON player_stats
FOR EACH ROW EXECUTE FUNCTION update_seasons_cache();
