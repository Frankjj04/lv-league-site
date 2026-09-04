# Las Vegas Soccer League — player registration site

Static site (plain HTML/CSS/JS, no build step). Bilingual **Spanish / English**, Spanish by default.
Players register themselves at `registro.html` and join a team the league already has.

> Separate from `~/lv-soccer-league`, which is the existing Next.js + Supabase game-schedule/admin
> app. If the two should become one project, the schedule page here is the natural place to link
> or merge into it.

Four pages. The league, schedule, and contact pages were removed on 2026-09-01 (see below) and
get added back one at a time as the coach supplies real information.

```
index.html      Home — hero only (headline, buttons, Vegas skyline)
rules.html      Rules — the coach's ten official rules, poster-style (REAL content)
registro.html   Register — the player registration form
css/style.css   All styling
js/i18n.js      All ES/EN copy
js/main.js      Nav, language toggle, scroll reveal
js/registro.js  Registration form: teams, guardian fields, photo, validation
js/league-config.js  Divisions, teams, fees — THE file to edit for the league
vercel.json     Redirects for the removed and renamed URLs
```

## Pages removed on 2026-09-01

`league.html`, `schedule.html` and `contact.html` were deleted along with their translation
entries. All of their content was invented placeholder copy. They live on in git at commit
`7ab192c`:

```bash
git show 7ab192c:contact.html > contact.html   # bring a page back
git show 7ab192c:js/i18n.js | less             # lift its old ES/EN copy back out
```

`vercel.json` redirects `/league.html`, `/schedule.html` and `/contact.html` to `/` so
previously shared links don't 404. The home page's second hero button, which pointed at the
league page, now points at the rules.

When a page comes back: restore its file, restore its keys in `js/i18n.js`, add it to the nav
and mobile nav in **all three** HTML files, drop the `footer-grid--slim` class from the footer,
and delete its line from `vercel.json`.

## Run it locally

```bash
cd ~/lv-league-site
python3 -m http.server 8000
# open http://localhost:8000
```

---

## Registration

`registro.html` is the league's own player registration form. Players register one at a time
and pick the team they already play for — the league's teams exist already, players do not
create them.

The form asks for the same things the coach's Google Form asked for: division, team, name,
date of birth, phone, email, home address, a headshot for the player credential, and the
bilingual liability release. It adds three things the Google Form could not do:

- **Teams are a dropdown filtered by division**, so the roster groups cleanly instead of
  collecting the same team under three different spellings.
- **Guardian name and phone appear automatically** when the date of birth says the player is
  under 18, and become required.
- **The headshot is downscaled in the browser** before upload, so a photo straight off a phone
  camera works.

### Everything about the league lives in one file

`js/league-config.js` holds the divisions, the teams in each, the fee per division, the age
that counts as a minor, and an on/off switch for registration. Editing that file is the only
thing needed to change what the form offers.

> **The divisions and teams in it right now are placeholders**, labelled `EJEMPLO`. Only
> "Martes — Open Division" is confirmed real. Replace them with the coach's list before this
> page goes live.

### Why the Google Form had to go

The form returned HTTP 401 to everyone: a Google sign-in wall instead of the questions. The
cause was the **FOTO PARA CREDENCIAL** file-upload question — Google Forms requires a signed-in
Google account on any form that contains a file upload, and there is no setting to turn that
off. It was never a misconfiguration, and no amount of fiddling in Settings → Responses would
have fixed it. Players without a Google account, or unwilling to sign in, simply could not
register.

`register.html`, the page that linked out to that form, was removed. `vercel.json` redirects
`/register.html` to `/registro.html`, so anything already shared — an Instagram bio link, a QR
code, a text message — still lands on the right page.

### Not finished yet

The form posts to `/api/register`, **which does not exist yet**. Until it does, a submission
fails. Still to build: that endpoint, a database behind it, the coach's roster page with CSV
export and printable credentials, and Stripe payment.


## Branding

The site is themed off the league crest (`assets/logo.jpg`), with colors sampled from it:

| Token | Hex | Where it comes from | How it's used |
|---|---|---|---|
| `--orange` | `#FC8C00` | the mountains | buttons, bars, blocks, icon chips |
| `--maroon` | `#610200` | the "SOCCER LEAGUE" wordmark | headline accents, links, eyebrows |
| `--ink` | `#0B0B0C` | the shield outline | headlines, stats bar, footer, CTA band |
| `--sky` | `#70A7CE` | the sky in the crest | hero gradient |
| `--green` | `#1F7616` | the green star | veterans division, checkmarks |
| `--pink` | `#E50152` | the pink star | women's division |

**Orange is a fill color, not a text color.** It only hits 2.4:1 contrast on white, so it never
carries body text. Where the design wants orange to read as text, it's black text sitting *on*
orange (the hero headline block, the buttons) — the same move the crest makes with its black
silhouettes over the orange mountains. Text accents use maroon instead, which clears AA easily.

The three division cards use the three star colors from the crest.

## Placeholder content to replace

Real: the league name, the crest, the waiver wording, and `rules.html` — the coach's ten
official rules exactly as they appear on his printed REGLAS sheet, in Spanish and English.

On 2026-09-01 the home page was cut down to just its hero — the stats bar, "how it works"
steps, division cards, why-this-league grid and CTA band were removed along with 90 translation
entries, all of it invented. The Vegas skyline SVG stayed. Recover any of it from
`git show 7ab192c:index.html`. What's left that's still made up:

| What's still invented | Where |
|---|---|
| Phone / WhatsApp | The note under the registration button (`reg_open_note`) says "escríbenos / contact us" but links nowhere. Make it a `tel:` / `wa.me` link. |
| Season label "Temporada 2026" | `index.html`, key `home_eyebrow` |
| "Certified referees, standings table, prizes" | `index.html`, key `home_sub` — check these against what the league actually does |
| Divisions, fees, season dates, venues, standings | Come back with the removed sections and pages, as the coach supplies them. |

## Editing text

Copy lives in **two places** and both must match:

1. The `data-i18n="key"` element in the HTML (this is what shows before JavaScript runs)
2. The `es:` and `en:` entries for that key in `js/i18n.js` (this is what shows after)

Change only the HTML and the language toggle will overwrite it. Change both.

Sanity check that no translation key is missing:

```bash
cd ~/lv-league-site && node -e "
global.window={};require('./js/i18n.js');const T=window.LVSL_TRANSLATIONS,fs=require('fs');
const k=new Set();for(const f of fs.readdirSync('.').filter(f=>f.endsWith('.html')))
for(const m of fs.readFileSync(f,'utf8').matchAll(/data-i18n=\"([^\"]+)\"/g))k.add(m[1]);
let bad=0;for(const x of k)for(const l of ['es','en'])if(T[l][x]===undefined){console.log('MISSING',l,x);bad++}
console.log(bad?'PROBLEMS':'OK '+k.size+' keys');"
```

## Publishing the standings later

There's no schedule page right now. When it comes back, the simplest version is a Google Sheet
the board edits: in Sheets, **File → Share → Publish to web**, then drop the published URL into
an `<iframe>` on the page. The site then updates itself whenever the sheet changes. The old
placeholder table is in git at `git show 7ab192c:schedule.html`.

## Deploying

Any static host works. Vercel, from this folder:

```bash
npx vercel --prod
```

Or drag the folder into Netlify, or push to GitHub Pages.
