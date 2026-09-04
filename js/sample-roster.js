/* =========================================
   LAS VEGAS SOCCER LEAGUE — Sample roster

   ⚠️  NOT REAL PLAYERS. Invented people placed on the league's real
   teams so the roster page can be reviewed before a database exists.
   admin.js loads this only when /api/players is unavailable, and the
   page shows a red banner saying so. Delete this file once the real
   endpoint is live.
   ========================================= */

'use strict';

(function () {
  /* Initials on a colored ground — a stand-in for the credential headshots,
     so no invented face is ever shown as if it were a real player. */
  function avatar(name, hue) {
    const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('');
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="225" viewBox="0 0 180 225">' +
      '<rect width="180" height="225" fill="hsl(' + hue + ',34%,82%)"/>' +
      '<circle cx="90" cy="86" r="38" fill="hsl(' + hue + ',30%,68%)"/>' +
      '<path d="M22 225c0-40 30-66 68-66s68 26 68 66z" fill="hsl(' + hue + ',30%,68%)"/>' +
      '<text x="90" y="99" text-anchor="middle" font-family="DM Sans,sans-serif" ' +
      'font-size="42" font-weight="700" fill="hsl(' + hue + ',42%,32%)">' + initials + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /* status: 'active'  — registration complete
     status: 'pending' — filled the form, never finished paying
     Birth dates in the Over 35 division are all pre-1991, as they have to be. */
  const rows = [
    ['martes-over35',     'STYLE BARBERSHOP',   'Andrés Molina',    '1984-03-12', '7025550118', 'andres.m@example.com',  '412 E Charleston Blvd, Las Vegas, NV 89104',  'active',  ''],
    ['martes-over35',     'STYLE BARBERSHOP',   'Bryan Castellanos','1979-11-02', '7025550143', 'bryanc@example.com',    '2210 S Eastern Ave, Las Vegas, NV 89104',     'active',  ''],
    ['martes-over35',     'STYLE BARBERSHOP',   'Emilio Vargas',    '1988-01-30', '7025550122', 'evargas@example.com',   '1750 Karen Ave, Las Vegas, NV 89169',         'active',  ''],
    ['martes-over35',     'OLD BOYS',           'Gerardo Peña',     '1976-12-14', '7025550154', 'gpena@example.com',     '820 S Decatur Blvd, Las Vegas, NV 89107',     'active',  ''],
    ['martes-over35',     'OLD BOYS',           'Iván Rosales',     '1983-07-21', '7025550129', 'ivanr@example.com',     '1201 N Rancho Dr, Las Vegas, NV 89106',       'active',  ''],

    ['martes-open',       'LV GAMBLERS',        'Carlos Iriarte',   '2001-06-25', '7025550177', 'c.iriarte@example.com', '905 N Nellis Blvd, Las Vegas, NV 89110',      'active',  ''],
    ['martes-open',       'LV GAMBLERS',        'Diego Ferrer',     '2009-08-19', '7025550190', 'd.ferrer@example.com',  '3300 W Sahara Ave, Las Vegas, NV 89102',      'active',  'Marta Ferrer|7025550191'],
    ['martes-open',       'CHIVAHERMANOS',      'Fernando Quiroz',  '1997-09-08', '7025550136', 'fq@example.com',        '6400 W Flamingo Rd, Las Vegas, NV 89103',     'active',  ''],
    ['martes-open',       'CHIVAHERMANOS',      'Hugo Delgado',     '2003-04-03', '7025550168', 'hdelgado@example.com',  '4455 Boulder Hwy, Las Vegas, NV 89121',       'active',  ''],

    ['miercoles-premier', 'EL COMBO DE DRAKE',  'Joaquín Beltrán',  '2000-02-17', '7025550183', 'jbeltran@example.com',  '3720 S Maryland Pkwy, Las Vegas, NV 89169',   'active',  ''],
    ['miercoles-premier', 'EL COMBO DE DRAKE',  'Luis Maldonado',   '1993-10-11', '7025550107', 'lmaldo@example.com',    '5100 W Charleston Blvd, Las Vegas, NV 89146', 'active',  ''],
    ['miercoles-premier', 'FC BARCELONA',       'Mario Zepeda',     '1990-06-29', '7025550112', 'mzepeda@example.com',   '1600 E Bonanza Rd, Las Vegas, NV 89101',      'active',  ''],

    ['viernes-open',      'HOOLIGANS',          'Néstor Cabrera',   '2002-01-09', '7025550149', 'ncabrera@example.com',  '7250 W Lake Mead Blvd, Las Vegas, NV 89128',  'active',  ''],
    ['viernes-open',      'HOOLIGANS',          'Kevin Alarcón',    '2010-05-06', '7025550195', 'kalarcon@example.com',  '2900 E Desert Inn Rd, Las Vegas, NV 89121',   'active',  'Rosa Alarcón|7025550196'],
    ['viernes-open',      'SIN CITY',           'Óscar Trejo',      '1998-03-27', '7025550161', 'otrejo@example.com',    '3355 S Valley View Blvd, Las Vegas, NV 89102','active',  ''],

    ['sabado',            'REAL CENTENNIAL',    'Pablo Guerrero',   '1995-11-15', '7025550174', 'pguerrero@example.com', '2075 E Tropicana Ave, Las Vegas, NV 89119',   'active',  ''],

    ['martes-open',       'LV GAMBLERS',        'Rubén Espinoza',   '1992-05-04', '7025550138', 'respinoza@example.com', '4120 S Jones Blvd, Las Vegas, NV 89103',      'pending', ''],
    ['viernes-open',      'SIN CITY',           'Samuel Ordóñez',   '2004-09-23', '7025550152', 'sordonez@example.com',  '1515 E Flamingo Rd, Las Vegas, NV 89119',     'pending', ''],
    ['miercoles-premier', 'FC BARCELONA',       'Tomás Aguilar',    '1999-12-01', '7025550166', 'taguilar@example.com',  '3801 W Craig Rd, North Las Vegas, NV 89032',  'pending', ''],
  ];

  const base = Date.parse('2026-08-24T17:10:00Z');

  window.LVSL_SAMPLE_ROSTER = rows.map((r, i) => {
    const [division, team, name, dob, phone, email, address, status, guardian] = r;
    const [gName, gPhone] = guardian ? guardian.split('|') : ['', ''];
    return {
      id: 1000 + i,
      division: division,
      team: team,
      name: name,
      dob: dob,
      phone: phone,
      email: email,
      address: address,
      guardianName: gName,
      guardianPhone: gPhone,
      status: status,
      photo: avatar(name, (i * 47) % 360),
      waiverAcceptedAt: new Date(base + i * 5.4e6).toISOString(),
      createdAt: new Date(base + i * 5.4e6).toISOString(),
    };
  });
})();
