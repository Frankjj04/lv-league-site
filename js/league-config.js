/* =========================================
   LAS VEGAS SOCCER LEAGUE — League Configuration

   THIS IS THE FILE THE LEAGUE LIVES IN.
   Editing it changes the registration form and the roster page.
   Nothing else needs to change.

   Divisions and teams below were taken from the coach's own schedule
   sheets (2026 Summer-Fall season, rounds played Aug 25 – Sep 4 2026),
   plus the Saturday teams he gave directly. Team names are spelled and
   capitalised exactly as they appear on his schedules, so a player sees
   the same string on the form that he sees on the schedule.

   Every division is 8v8.

   Division names are just the day plus "Open" or "Over 35" — Frank asked
   for that on 2026-09-10 so the dropdown is quick to read.

   ── STILL UNCONFIRMED ─────────────────────
   • Saturday and Sunday: whether each is Open or Over 35. They show as
     plain "Sábado" / "Domingo" until the coach says.
   • Sunday's teams. Added 2026-09-10 with an empty list (players type the
     team name). Its 11v11 format comes from the Costos page, not a schedule.
   ──────────────────────────────────────────
   ========================================= */

'use strict';

window.LVSL_CONFIG = {

  /* Set to false to close registration. The form is replaced by a notice. */
  registrationOpen: true,

  /* Every division a player can sign up for.
       id      — NEVER change once players have registered; it is stored on the row
       es / en — what the player sees in the dropdown
       format  — shown under the dropdown, purely informational
       teams   — alphabetical, so a player can find theirs in a long list */
  divisions: [
    {
      id: 'martes-over35',
      es: 'Martes — Over 35',
      en: 'Tuesday — Over 35',
      format: '8v8',
      teams: [
        'BAYERN MUNICH',
        'CHELSEA',
        'CUERVOS DE NUEVO TOLEDO',
        'DEP. CHALCO',
        'DURANGO',
        'DVO MICHOACAN',
        'EPIQUE FC',
        'FRANJA PUEBLA',
        'GRANJENO',
        'GUADALAJARA',
        'LOS ÑOÑOS',
        'LVFC',
        'OLD BOYS',
        'PUMAS FC',
        'REAL MADRID',
        'SANTOS',
        'STYLE BARBERSHOP',
        'TEOCALTICHE',
        'UNION',
      ],
    },
    {
      id: 'martes-open',
      es: 'Martes — Open',
      en: 'Tuesday — Open',
      format: '8v8',
      teams: [
        'CHIVAHERMANOS',
        'GUERRERO',
        'JALISCO',
        'LA BANDA',
        'LA BOLA 8',
        'LEGACY',
        'LV GAMBLERS',
        'LV UNITED',
        'MARINEROS',
        'NATIONAL',
        'UNITED KINGS',
      ],
    },
    {
      id: 'miercoles-premier',
      es: 'Miércoles — Open',
      en: 'Wednesday — Open',
      format: '8v8',
      teams: [
        'AJAX',
        'ALTA VISTA FC',
        'AMERICA',
        'BAD COMPANY',
        'BORUSSIA DORTMUND',
        'DVO BETHANIA',
        'EL COMBO DE DRAKE',
        'ELITE',
        'FC BARCELONA',
        'FC PATRIA Y VIDA',
        'INTER FC',
        'LACKRA FC',
        'LOBOS',
        'MARQUENSE',
        'MINEROS',
        'PROS',
        'RESACA FC',
        'RIVALS FC',
        'SANTOS',
        'WINCHESTER',
      ],
    },
    {
      id: 'viernes-open',
      es: 'Viernes — Open',
      en: 'Friday — Open',
      format: '8v8',
      teams: [
        'ANTIGUA FC',
        'AVALANCHE',
        'BANDIDOS UNIDOS',
        'DEP. ZITACUARO',
        'DVO. MI RENDICION',
        'FC UNITED',
        'HOMIES',
        'HOOLIGANS',
        'LOS ANGELES',
        'PARAPENTOS',
        'PASAC FC',
        'PASTELITOS',
        'PGZ',
        'RISEN',
        'SIN CITY',
        'TIGRES DEL SUR',
        'TORO FC',
        'TOROS NEZA',
        'VERACRUZ',
      ],
    },
    {
      id: 'sabado',
      es: 'Sábado',
      en: 'Saturday',
      format: '8v8',
      teams: [
        'EL COMBO DE DRAKE',
        'LUCKY 21',
        'REAL CENTENNIAL',
      ],
    },
    {
      id: 'domingo',
      es: 'Domingo',
      en: 'Sunday',
      format: '11v11',
      // No team list yet. While it is empty, players (and the coach) type
      // their team's name instead of picking it. Fill it in when he sends it.
      teams: [],
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

  /* ID or passport photo — required on every online registration.
     Kept larger than the headshot so the name and birth date stay readable.
     Never printed on a credential; only the coach sees it, from the player's panel. */
  idPhoto: {
    maxPixels: 1600,
    quality: 0.85,
    maxBytes: 12 * 1024 * 1024,
  },
};
