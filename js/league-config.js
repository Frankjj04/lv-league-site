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

   Every division is 8v8 except Sunday, which is 11v11.

   Division names are just the day plus "Open" or "Over 35" — Frank asked
   for that on 2026-09-10 so the dropdown is quick to read.

   Sunday's teams came from the coach 2026-09-16.

   Confirmed by the coach 2026-09-10: Saturday is Open, 8v8; Sunday is
   Open, 11v11.
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
       teams   — alphabetical, so a player can find theirs in a long list
       standingsStart — optional: the coach's table from before the site's
                 schedule began, so the standings continue from it instead of
                 zero. One entry per team, names spelled as in `teams`:
                   'LV UNITED': { p: 5, w: 3, d: 1, l: 1, gf: 12, ga: 6 },
                 p played, w/d/l won/drawn/lost, gf/ga goals for/against,
                 adj (optional) points to add or take away beyond 3/1/0. */
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
      // The coach's table as of 2026-10-07; games on the site add on top.
      // Where his numbers didn't add up he said to use the correct ones, so
      // games played = W+D+L, and goal difference is always worked out.
      standingsStart: {
        'LOS ÑOÑOS': { p: 18, w: 14, d: 3, l: 1, gf: 55, ga: 19 },
        'BAYERN MUNICH': { p: 18, w: 13, d: 0, l: 5, gf: 45, ga: 29 },
        'UNION': { p: 18, w: 11, d: 5, l: 2, gf: 58, ga: 17 },
        'STYLE BARBERSHOP': { p: 18, w: 12, d: 1, l: 5, gf: 46, ga: 32 },
        'DURANGO': { p: 18, w: 11, d: 2, l: 5, gf: 35, ga: 21 },
        'CHELSEA': { p: 18, w: 10, d: 4, l: 4, gf: 37, ga: 21 },
        'SANTOS': { p: 18, w: 10, d: 2, l: 6, gf: 44, ga: 28 },
        'GRANJENO': { p: 18, w: 10, d: 2, l: 6, gf: 43, ga: 35 },
        'REAL MADRID': { p: 18, w: 8, d: 4, l: 6, gf: 37, ga: 24 },
        'FRANJA PUEBLA': { p: 18, w: 8, d: 4, l: 6, gf: 33, ga: 27 },
        'DEP. CHALCO': { p: 18, w: 7, d: 3, l: 8, gf: 34, ga: 40 },
        'LVFC': { p: 18, w: 7, d: 2, l: 9, gf: 20, ga: 28 },
        'TEOCALTICHE': { p: 18, w: 6, d: 2, l: 10, gf: 20, ga: 35 },
        'CUERVOS DE NUEVO TOLEDO': { p: 18, w: 5, d: 1, l: 12, gf: 23, ga: 44 },
        'EPIQUE FC': { p: 17, w: 2, d: 6, l: 9, gf: 14, ga: 34 },
        'DVO MICHOACAN': { p: 18, w: 3, d: 3, l: 12, gf: 18, ga: 52 },
        'OLD BOYS': { p: 17, w: 0, d: 9, l: 8, gf: 15, ga: 30 },
        'GUADALAJARA': { p: 18, w: 1, d: 4, l: 13, gf: 14, ga: 35 },
        'PUMAS FC': { p: 16, w: 0, d: 5, l: 11, gf: 5, ga: 34 },
      },
    },
    {
      id: 'martes-open',
      es: 'Martes — Open',
      en: 'Tuesday — Open',
      format: '8v8',
      teams: [
        'AC MILAN',
        'CHIVAHERMANOS',
        'FLAMING FC',
        'GAP',
        'GUERRERO',
        'JALISCO',
        'LA BANDA',
        'LA BOLA 8',
        'LEGACY',
        'LV GAMBLERS',
        'LV KINGS',
        'LV UNITED',
        'NATIONAL',
        'UNITED KINGS',
      ],
      // The coach's table as of 2026-10-07; games on the site add on top.
      // Where his numbers didn't add up he said to use the correct ones, so
      // games played = W+D+L, and goal difference is always worked out.
      standingsStart: {
        'JALISCO': { p: 17, w: 12, d: 2, l: 3, gf: 80, ga: 43 },
        'LEGACY': { p: 18, w: 12, d: 2, l: 4, gf: 67, ga: 41 },
        'UNITED KINGS': { p: 17, w: 11, d: 2, l: 4, gf: 67, ga: 33 },
        'LA BANDA': { p: 17, w: 11, d: 0, l: 6, gf: 58, ga: 23 },
        'NATIONAL': { p: 18, w: 7, d: 3, l: 8, gf: 46, ga: 52 },
        'LV GAMBLERS': { p: 14, w: 5, d: 6, l: 3, gf: 34, ga: 33 },
        'LA BOLA 8': { p: 14, w: 6, d: 2, l: 6, gf: 31, ga: 36 },
        'LV UNITED': { p: 16, w: 6, d: 1, l: 9, gf: 26, ga: 53 },
        'CHIVAHERMANOS': { p: 17, w: 4, d: 6, l: 7, gf: 43, ga: 63 },
        'GUERRERO': { p: 17, w: 3, d: 3, l: 11, gf: 39, ga: 56 },
        'LV KINGS': { p: 18, w: 5, d: 2, l: 11, gf: 42, ga: 54 },
        'FLAMING FC': { p: 13, w: 4, d: 2, l: 7, gf: 25, ga: 63 },
        'GAP': { p: 3, w: 0, d: 0, l: 3, gf: 0, ga: 3 },
        'AC MILAN': { p: 18, w: 5, d: 3, l: 10, gf: 43, ga: 47 },
      },
    },
    {
      id: 'miercoles-premier',
      es: 'Miércoles — Open',
      en: 'Wednesday — Open',
      format: '8v8',
      teams: [
        'AJAX',
        'AMERICA',
        'BAD COMPANY',
        'BORUSSIA DORTMUND',
        'CHIVAS NLV',
        'EL COMBO DE DRAKE',
        'ELITE',
        'FC BARCELONA',
        'INTER FC',
        'LACKRA FC',
        'LOBITOS FC',
        'MARQUENSE',
        'MINEROS',
        'PUMAS FC',
        'REAL CUBA FC',
        'RESACA FC',
        'RIVALS FC',
        'SANTOS',
      ],
      // The coach's table as of 2026-10-07; games on the site add on top.
      // Where his numbers didn't add up he said to use the correct ones, so
      // games played = W+D+L, and goal difference is always worked out.
      standingsStart: {
        'RESACA FC': { p: 2, w: 2, d: 0, l: 0, gf: 10, ga: 1 },
        'MINEROS': { p: 2, w: 2, d: 0, l: 0, gf: 13, ga: 4 },
        'AMERICA': { p: 2, w: 2, d: 0, l: 0, gf: 5, ga: 1 },
        'BORUSSIA DORTMUND': { p: 2, w: 2, d: 0, l: 0, gf: 3, ga: 0 },
        'INTER FC': { p: 2, w: 2, d: 0, l: 0, gf: 4, ga: 1 },
        'FC BARCELONA': { p: 2, w: 1, d: 0, l: 1, gf: 8, ga: 2 },
        'MARQUENSE': { p: 2, w: 1, d: 0, l: 1, gf: 5, ga: 4 },
        'BAD COMPANY': { p: 2, w: 1, d: 0, l: 1, gf: 1, ga: 1 },
        'EL COMBO DE DRAKE': { p: 2, w: 1, d: 0, l: 1, gf: 2, ga: 3 },
        'AJAX': { p: 2, w: 1, d: 0, l: 1, gf: 3, ga: 5 },
        'SANTOS': { p: 1, w: 0, d: 0, l: 1, gf: 0, ga: 2 },
        'RIVALS FC': { p: 1, w: 0, d: 0, l: 1, gf: 1, ga: 3 },
        'LACKRA FC': { p: 2, w: 0, d: 0, l: 2, gf: 1, ga: 3 },
        'ELITE': { p: 1, w: 0, d: 0, l: 1, gf: 4, ga: 12 },
        'PUMAS FC': { p: 2, w: 0, d: 0, l: 2, gf: 3, ga: 12 },
        'REAL CUBA FC': { p: 1, w: 0, d: 0, l: 1, gf: 1, ga: 2 },
        'CHIVAS NLV': { p: 2, w: 0, d: 0, l: 2, gf: 0, ga: 8 },
      },
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
      // The coach's table as of 2026-10-07; games on the site add on top.
      // Where his numbers didn't add up he said to use the correct ones, so
      // games played = W+D+L, and goal difference is always worked out.
      standingsStart: {
        'HOOLIGANS': { p: 19, w: 13, d: 2, l: 4, gf: 32, ga: 19 },
        'TORO FC': { p: 19, w: 12, d: 4, l: 3, gf: 49, ga: 16 },
        'PGZ': { p: 19, w: 11, d: 5, l: 3, gf: 33, ga: 21 },
        'HOMIES': { p: 19, w: 11, d: 3, l: 5, gf: 32, ga: 16 },
        'BANDIDOS UNIDOS': { p: 19, w: 9, d: 5, l: 5, gf: 37, ga: 23 },
        'VERACRUZ': { p: 18, w: 8, d: 3, l: 7, gf: 28, ga: 20 },
        'AVALANCHE': { p: 19, w: 6, d: 9, l: 4, gf: 28, ga: 20 },
        'DEP. ZITACUARO': { p: 19, w: 8, d: 3, l: 8, gf: 28, ga: 32 },
        'PASTELITOS': { p: 19, w: 8, d: 2, l: 9, gf: 33, ga: 26 },
        'SIN CITY': { p: 19, w: 7, d: 4, l: 8, gf: 29, ga: 27 },
        'FC UNITED': { p: 19, w: 6, d: 7, l: 6, gf: 25, ga: 24 },
        'TOROS NEZA': { p: 19, w: 8, d: 1, l: 10, gf: 28, ga: 27 },
        'TIGRES DEL SUR': { p: 20, w: 7, d: 3, l: 10, gf: 23, ga: 25 },
        'ANTIGUA FC': { p: 19, w: 6, d: 4, l: 9, gf: 24, ga: 31 },
        'LOS ANGELES': { p: 19, w: 4, d: 5, l: 10, gf: 18, ga: 52 },
        'DVO. MI RENDICION': { p: 18, w: 4, d: 4, l: 10, gf: 23, ga: 36 },
        'RISEN': { p: 19, w: 4, d: 3, l: 12, gf: 17, ga: 47 },
        'PASAC FC': { p: 19, w: 3, d: 3, l: 13, gf: 16, ga: 47 },
      },
    },
    {
      id: 'sabado',
      es: 'Sábado — Open',
      en: 'Saturday — Open',
      format: '8v8',
      teams: [
        'EL COMBO DE DRAKE',
        'LUCKY 21',
        'REAL CENTENNIAL',
      ],
    },
    {
      id: 'domingo',
      // The only 11v11 division, so it says so in the dropdown.
      es: 'Domingo — Open 11v11',
      en: 'Sunday — Open 11v11',
      format: '11v11',
      // Sent by the coach 2026-09-16.
      teams: [
        'BEPRO FC',
        'LUCKY 21',
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
    // Sized for the database, which is Neon's free plan (about 0.5 GB). At
    // these settings a player costs about 300 KB for both photos, so ~1,000
    // players fit with room to spare; at the first settings (900px / 1600px)
    // they cost ~850 KB and the league would not have fit. 500px is still
    // sharper than the ~1in photo printed on a credential.
    maxPixels: 500,   // longest edge after downscaling
    quality: 0.8,     // JPEG quality
    maxBytes: 12 * 1024 * 1024,  // reject anything larger before we even read it
  },

  /* ID or passport photo — required on every online registration.
     Kept larger than the headshot so the name and birth date stay readable.
     Never printed on a credential; only the coach sees it, from the player's panel. */
  idPhoto: {
    maxPixels: 1200,  // not lower: below this the address lines start to blur
    quality: 0.8,
    maxBytes: 12 * 1024 * 1024,
  },
};
