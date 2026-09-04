/* =========================================
   LAS VEGAS SOCCER LEAGUE — League Configuration

   THIS IS THE FILE THE COACH'S ANSWERS GO IN.
   Editing it changes the registration form. Nothing else needs to change.

   ─────────────────────────────────────────
   ⚠️  THE DIVISIONS AND TEAMS BELOW ARE PLACEHOLDERS.
   Only "Martes — Open Division" is confirmed real (it is the section
   header on the coach's Google Form). Everything else is invented so the
   form can be built and previewed. Replace all of it with his real list
   before this page goes live.
   ─────────────────────────────────────────
   ========================================= */

'use strict';

window.LVSL_CONFIG = {

  /* Set to false to close registration. The form is replaced by a notice. */
  registrationOpen: true,

  /* Online payment. Off until the coach decides the amount and opens Stripe.
     When he does: set enabled true and put the amount in each division below. */
  payment: {
    enabled: false,
    currency: 'usd',
  },

  /* Every division a player can sign up for.
       id      — never change once players have registered; it is stored on the row
       es / en — what the player sees in the dropdown
       format  — shown under the dropdown, purely informational
       fee     — what Stripe charges, in whole dollars. Ignored while payment is off.
       teams   — the teams in this division, exactly as the coach spells them */
  divisions: [
    {
      id: 'martes-open',
      es: 'Martes — Open Division',
      en: 'Tuesday — Open Division',
      format: '8v8',
      fee: 0,
      teams: [
        'EJEMPLO — Equipo 1',
        'EJEMPLO — Equipo 2',
        'EJEMPLO — Equipo 3',
      ],
    },
    {
      id: 'domingo-11v11',
      es: 'Domingo — 11v11',
      en: 'Sunday — 11v11',
      format: '11v11',
      fee: 0,
      teams: [
        'EJEMPLO — Equipo A',
        'EJEMPLO — Equipo B',
      ],
    },
  ],

  /* Let a player type a team that is not on the list.
     The coach has his teams already, so this is off — but if a brand-new
     team shows up mid-season, flip it to true instead of editing the list. */
  allowOtherTeam: false,

  /* A player under this age must give a parent or guardian.
     The guardian fields appear on their own once the birth date says so. */
  minorAge: 18,

  /* Credential headshot limits. Photos are downscaled in the browser
     before upload, so a phone photo of any size is fine. */
  photo: {
    maxPixels: 900,   // longest edge after downscaling
    quality: 0.86,    // JPEG quality
    maxBytes: 12 * 1024 * 1024,  // reject anything larger before we even read it
  },
};
