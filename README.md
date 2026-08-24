# Las Vegas Soccer League — team registration site

Static site (plain HTML/CSS/JS, no build step). Bilingual **Spanish / English**, Spanish by default.
Team registration runs through the coach's existing Google Form, embedded on `register.html`.

> Separate from `~/lv-soccer-league`, which is the existing Next.js + Supabase game-schedule/admin
> app. If the two should become one project, the schedule page here is the natural place to link
> or merge into it.

```
index.html      Home — hero, how it works, divisions, why this league
league.html     The League — format, divisions table, fees (#fees), fields
rules.html      Rules — the coach's ten official rules, poster-style (REAL content)
schedule.html   Schedule & standings — empty state + table format preview
register.html   Register — embedded Google Form + checklist + what happens next
contact.html    Contact — phone/WhatsApp/email cards + FAQ (#faq)
css/style.css   All styling
js/i18n.js      All ES/EN copy
js/main.js      Nav, language toggle, scroll reveal, counters, FAQ accordion
```

## Run it locally

```bash
cd ~/lv-league-site
python3 -m http.server 8000
# open http://localhost:8000
```

---

## ⚠️ Do this first: the Google Form is currently locked

The form at `https://forms.gle/bxiA7X9htGQmF93U8` returns **HTTP 401 (sign-in required)**.
Anyone who visits the Register page will hit a Google sign-in wall instead of the form, and
if the form is restricted to an organization, people outside it won't be able to submit at all.

The coach needs to open the form in Google Forms → **Settings (gear icon)** → **Responses**, and:

- Turn **off** "Restrict to users in <organization>"
- Set "Collect email addresses" to **Do not collect** or **Responder input** (not *Verified*)

Then re-check by opening the form link in a private/incognito window. If the form loads without
asking to sign in, the embed on `register.html` will work for everyone.

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

The league name and logo are real, and so is `rules.html` — it carries the coach's ten official
rules exactly as they appear on his printed REGLAS sheet, in Spanish and English. Everything
below is still **made up** to make the layout read correctly — replace it with the coach's real
info before this goes live.

> ⚠️ **Known contradiction:** the divisions on `index.html` and `league.html` still say
> "11 vs 11" (keys `home_div1_t1`, `home_div2_t1`, `home_div3_t1`, `lg_r1c3`, `lg_r2c3`,
> `lg_r3c3`). Real rule 2 is **8 vs 8**. Fix these together with the real division info.

| What | Where |
|---|---|
| Phone `(702) 555-0100` | footers, `contact.html` (also the `tel:` and `wa.me` links) |
| Email `info@lasvegassoccerleague.com` | footers, `contact.html` |
| Divisions, ages, game days | `index.html`, `league.html`, `js/i18n.js` |
| Fees ($350 / $70 / $100) | `league.html` `#fees` section |
| Season months (Feb–Jun / Aug–Dec) | `league.html`, `js/i18n.js` |
| Field / venue names | `league.html` |
| 2026 season label | `index.html` hero eyebrow, `js/i18n.js` `home_eyebrow` |

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

`schedule.html` ships with a placeholder table and an HTML comment showing how to swap in a live
Google Sheet (File → Share → Publish to web → embed the URL in an iframe). The sheet then updates
the site automatically whenever the board edits it.

## Deploying

Any static host works. Vercel, from this folder:

```bash
npx vercel --prod
```

Or drag the folder into Netlify, or push to GitHub Pages.
