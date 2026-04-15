const fs = require('fs');
const path = require('path');

// Resolve project root (one level up from scripts/)
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load env from .env.local
const envPath = path.join(PROJECT_ROOT, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) envVars[key.trim()] = vals.join('=').trim();
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DATASETS_DIR = path.join(PROJECT_ROOT, 'datasets');

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx]; });
    rows.push(row);
  }
  return rows;
}

function toNum(val, isInt = false) {
  if (val === undefined || val === null || val === '') return 0;
  const n = parseFloat(val);
  if (isNaN(n)) return 0;
  return isInt ? Math.round(n) : n;
}

async function importFile(filePath) {
  const filename = path.basename(filePath);
  console.log(`\n=== Processing: ${filename} ===`);
  const rows = parseCSV(filePath);
  console.log(`  Parsed ${rows.length} rows`);

  let inserted = 0;
  let errors = 0;

  // Process in batches of 50
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    const playersToInsert = batch.map(r => ({
      rk: toNum(r['rk'], true),
      name: r['player'] || 'Unknown',
      team: r['squad'] || 'Unknown',
      position: r['pos'] || 'Unknown',
      nationality: r['nation'] || 'Unknown',
      comp: r['comp'] || null,
      age: toNum(r['age'], true),
      born: toNum(r['born'], true),
      image_url: `https://placehold.co/400x400/0f172a/f1f5f9?text=${encodeURIComponent((r['player'] || 'Player').split(' ').pop())}`,
    }));

    const { data: insertedPlayers, error: pError } = await supabase
      .from('players')
      .insert(playersToInsert)
      .select('id');

    if (pError) {
      console.error(`  Error inserting players batch ${i}: ${pError.message}`);
      errors += batch.length;
      continue;
    }

    // Now insert stats for each player
    const statsToInsert = batch.map((r, idx) => ({
      player_id: insertedPlayers[idx].id,
      matches_played: toNum(r['Matches Played'], true),
      avg_mins_per_match: toNum(r['Avg Mins per Match']),
      goals: toNum(r['Goals'], true),
      assists: toNum(r['Assists'], true),
      goals_assists: toNum(r['Goals & Assists'], true),
      non_penalty_goals: toNum(r['Non Penalty Goals'], true),
      penalty_kicks_made: toNum(r['Penalty Kicks Made'], true),
      xg: toNum(r['Expected Goals']),
      exp_npg: toNum(r['Exp NPG']),
      progressive_carries: toNum(r['Progressive Carries'], true),
      progressive_passes: toNum(r['Progressive Passes'], true),
      goals_per_90: toNum(r['Goals p 90']),
      assists_per_90: toNum(r['Assists p 90']),
      tackles_attempted: toNum(r['Tackles attempted'], true),
      tackles_won: toNum(r['Tackles Won'], true),
      dribbles_tackled_pct: toNum(r['% Dribbles tackled']),
      shots_blocked: toNum(r['Shots blocked'], true),
      passes_blocked: toNum(r['Passes blocked'], true),
      interceptions: toNum(r['Interceptions'], true),
      clearances: toNum(r['Clearances'], true),
      errors_made: toNum(r['Errors made'], true),
      goals_against: toNum(r['Goals Against'], true),
      goals_against_per_90: toNum(r['Goals against p 90']),
      saves: toNum(r['Saves'], true),
      saves_pct: toNum(r['Saves %']),
      clean_sheets: toNum(r['Clean Sheets'], true),
      clean_sheets_pct: toNum(r['% Clean sheets']),
      penalty_saves_pct: toNum(r['% Penalty saves']),
      passes_completed: toNum(r['Passes Completed'], true),
      passes_attempted: toNum(r['Passes Attempted'], true),
      pass_completion_pct: toNum(r['Pass completion %']),
      prog_passes_dist: toNum(r['Progressive passes distance']),
      short_pass_pct: toNum(r['% Short pass completed']),
      medium_pass_pct: toNum(r['% Medium passes completed']),
      long_pass_pct: toNum(r['% Long passes completed']),
      key_passes: toNum(r['Key passes'], true),
      passes_final_third: toNum(r['1/3'], true),
      passes_penalty_area: toNum(r['Passes into penalty area'], true),
      touches_def_pen: toNum(r['touches_def_pen'], true),
      take_ons_attempted: toNum(r['Take ons attempted'], true),
      take_ons_success_pct: toNum(r['% Successful take-ons']),
      take_ons_tackled: toNum(r['Times tackled during take-on'], true),
      carries_prgc: toNum(r['carries_prgc'], true),
      carries_final_third: toNum(r['carries final 3rd'], true),
      carries_penalty_area: toNum(r['carries penalty area'], true),
      possessions_lost: toNum(r['Possessions lost'], true),
      goals_scored: toNum(r['Goals Scored'], true),
      total_shots: toNum(r['Total Shots'], true),
      shots_on_target_pct: toNum(r['% Shots on target']),
      shots_per_90: toNum(r['Shots p 90']),
      goals_per_shot: toNum(r['Goals per shot']),
      goals_per_shot_on_target: toNum(r['Goals per shot on target']),
      aerial_duels_won_pct: toNum(r['% Aerial Duels won']),
      sca_per_90: toNum(r['Shot creating actions p 90']),
      gca_per_90: toNum(r['Goal creating actions p 90']),
      crosses_stopped: toNum(r['Crosses Stopped'], true),
      season: r['season'] || null,
    }));

    const { error: sError } = await supabase
      .from('player_stats')
      .insert(statsToInsert);

    if (sError) {
      console.error(`  Error inserting stats batch ${i}: ${sError.message}`);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }

    // Progress
    if ((i + BATCH) % 500 === 0 || i + BATCH >= rows.length) {
      console.log(`  Progress: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    }
  }

  console.log(`  Done: ${inserted} inserted, ${errors} errors`);
  return { inserted, errors };
}

async function main() {
  console.log('Football Stats CSV Importer');
  console.log(`Supabase URL: ${SUPABASE_URL.substring(0, 15)}...`);
  console.log('---');

  const files = fs.readdirSync(DATASETS_DIR)
    .filter(f => f.startsWith('cleaned') && f.endsWith('.csv'))
    .sort();

  console.log(`Found ${files.length} CSV files to import:`);
  files.forEach(f => console.log(`  - ${f}`));

  let totalInserted = 0;
  let totalErrors = 0;

  for (const file of files) {
    const result = await importFile(path.join(DATASETS_DIR, file));
    totalInserted += result.inserted;
    totalErrors += result.errors;
  }

  console.log('\n=== IMPORT COMPLETE ===');
  console.log(`Total inserted: ${totalInserted}`);
  console.log(`Total errors: ${totalErrors}`);
}

main().catch(console.error);
