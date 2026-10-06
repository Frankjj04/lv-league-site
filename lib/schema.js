/* The database schema, as a static import so the serverless bundler always
   ships it. Every statement is IF NOT EXISTS, so applying it repeatedly is
   free — lib/db.js runs it once per warm instance.

   To set the database up by hand instead, paste this into any Postgres
   console (Neon and Supabase both have one in the browser). */

export const SCHEMA = `
-- Las Vegas Soccer League — registration and schedule schema
-- Applied automatically on the first API call (see lib/db.js), and safe
-- to run by hand in any Postgres console.

CREATE TABLE IF NOT EXISTS players (
  id                 BIGSERIAL PRIMARY KEY,

  -- Division id and team name exactly as they appear in js/league-config.js.
  -- Stored as text, not as a foreign key: the coach edits that file directly,
  -- and a player's record must survive a division being renamed or retired.
  division           TEXT NOT NULL,
  team               TEXT NOT NULL,

  name               TEXT NOT NULL,
  dob                DATE NOT NULL,
  phone              TEXT NOT NULL,
  email              TEXT NOT NULL,
  address            TEXT NOT NULL,

  guardian_name      TEXT NOT NULL DEFAULT '',
  guardian_phone     TEXT NOT NULL DEFAULT '',

  -- The credential headshot, already downscaled by the browser.
  photo              BYTEA,
  photo_type         TEXT NOT NULL DEFAULT 'image/jpeg',

  -- 'active'  — registration complete
  -- 'pending' — form submitted, payment never finished
  status             TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'pending')),

  -- The liability release. Kept as its own timestamp rather than a boolean:
  -- when it was accepted is the part that matters if it is ever questioned.
  waiver_accepted_at TIMESTAMPTZ NOT NULL,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Kept for abuse handling only.
  ip                 TEXT,

  stripe_session     TEXT
);

-- Added after the first version shipped: the coach signs players up in person,
-- takes the $15 in cash, and needs that to look different from a self-service
-- registration when he is reconciling money or chasing a missing photo.
ALTER TABLE players ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'online';
ALTER TABLE players ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT '';
ALTER TABLE players ADD COLUMN IF NOT EXISTS added_note TEXT NOT NULL DEFAULT '';

-- Deleting a player is never immediate. The row is stamped here and hidden
-- from the roster, the counts, the CSV and the credential run, but it can be
-- restored. Only a second, separate action removes it for good.
ALTER TABLE players ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE players ADD COLUMN IF NOT EXISTS deleted_reason TEXT NOT NULL DEFAULT '';

-- A photo of the player's ID or passport, required on every online sign-up
-- since September 2026. Kept apart from the headshot: it is never printed on a
-- credential and only opens from the player's panel on the roster.
ALTER TABLE players ADD COLUMN IF NOT EXISTS id_photo BYTEA;
ALTER TABLE players ADD COLUMN IF NOT EXISTS id_photo_type TEXT NOT NULL DEFAULT 'image/jpeg';

CREATE INDEX IF NOT EXISTS players_division_team_idx ON players (division, team);
CREATE INDEX IF NOT EXISTS players_created_idx       ON players (created_at DESC);
CREATE INDEX IF NOT EXISTS players_status_idx        ON players (status);

-- One registration per person per division. They may play in more than one
-- division, which is why the division is part of the key. Archived rows are
-- excluded: a player who was removed has to be able to register again.
DROP INDEX IF EXISTS players_email_division_idx;
CREATE UNIQUE INDEX IF NOT EXISTS players_email_division_active_idx
  ON players (division, lower(email)) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS players_deleted_idx ON players (deleted_at);

-- ---------------------------------------------------------------------------
-- The schedule (October 2026). Public: anyone can read it on /calendario.
-- The coach adds and edits games; referees may only put the score on one.

CREATE TABLE IF NOT EXISTS games (
  id          BIGSERIAL PRIMARY KEY,

  -- Same division ids and team names as js/league-config.js, stored as text
  -- for the same reason as on players: a game already played must survive a
  -- team being removed from the list.
  division    TEXT NOT NULL,
  home        TEXT NOT NULL,
  away        TEXT NOT NULL,

  -- Las Vegas local time, kept as a plain date and 'HH:MM' rather than a
  -- timestamp: a 7:00 PM kickoff has to read 7:00 PM to everybody, with no
  -- time zone arithmetic anywhere in between.
  game_date   DATE NOT NULL,
  game_time   TEXT NOT NULL DEFAULT '',

  -- Typed by the coach each time; there is no fixed list of fields.
  field       TEXT NOT NULL DEFAULT '',

  status      TEXT NOT NULL DEFAULT 'scheduled'
              CHECK (status IN ('scheduled', 'final', 'cancelled')),
  home_score  SMALLINT,
  away_score  SMALLINT,

  -- A short public line under the game, e.g. "No se presentó el visitante".
  note        TEXT NOT NULL DEFAULT '',

  -- Who put the score in. Never shown on the public schedule.
  score_by    TEXT NOT NULL DEFAULT '',
  score_name  TEXT NOT NULL DEFAULT '',
  score_at    TIMESTAMPTZ,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS games_division_date_idx ON games (division, game_date, game_time);
CREATE INDEX IF NOT EXISTS games_date_idx          ON games (game_date);
`;
