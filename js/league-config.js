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

   ── STILL UNCONFIRMED ─────────────────────
   • Saturday's official division name and format (3 teams so far).
   • Whether the Sunday 11v11 league is still running. It is not on any
     of the schedules provided, so it is NOT listed here. Add it back if
     it exists.
   ──────────────────────────────────────────
   ========================================= */

'use strict';

window.LVSL_CONFIG = {

  /* Set to false to close registration. The form is replaced by a notice. */
  registrationOpen: true,

  /* Online payment. Off until the coach decides the amount and opens Stripe.
     When he does: set enabled true and put the amount in each division's fee. */
  payment: {
    enabled: false,
    currency: 'usd',
  },

  /* Every division a player can sign up for.
       id      — NEVER change once players have registered; it is stored on the row
       es / en — what the player sees in the dropdown
       format  — shown under the dropdown, purely informational
       fee     — what Stripe charges, in whole dollars. Ignored while payment is off.
       teams   — alphabetical, so a player can find theirs in a long list */
  divisions: [
    {
      id: 'martes-over35',
      es: 'Martes — Over 35',
      en: 'Tuesday — Over 35 Men',
      format: '8v8',
      fee: 0,
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
      es: 'Martes — Open, Super-League',
      en: 'Tuesday — Open Men, Super-League',
      format: '8v8',
      fee: 0,
      teams: [
        'AC MILAN',
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
      es: 'Miércoles — Premier, Open/Libre',
      en: 'Wednesday — Premier, Men\'s Open',
      format: '8v8',
      fee: 0,
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
      en: 'Friday — Open Men',
      format: '8v8',
      fee: 0,
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
      format: '',          // TODO: confirm the format with the coach
      fee: 0,
      teams: [
        'EL COMBO DE DRAKE',
        'LUCKY 21',
        'REAL CENTENNIAL',
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
