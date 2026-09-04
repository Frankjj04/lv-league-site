/* The database schema, as a static import so the serverless bundler always
   ships it. Every statement is IF NOT EXISTS, so applying it repeatedly is
   free — lib/db.js runs it once per warm instance.

   To set the database up by hand instead, paste this into any Postgres
   console (Neon and Supabase both have one in the browser). */

export const SCHEMA = `
-- Las Vegas Soccer League — registration schema
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
`;
