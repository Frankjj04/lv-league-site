# Las Vegas Soccer League — start here

Everything for the league's team-registration website lives in this folder
(`~/lv-league-site`). Last updated **September 1, 2026**.

The site is deliberately **three pages** right now — Home, Rules and Registration. The League,
Schedule and Contact pages were removed; they get added back little by little as the coach
supplies real information.

## The live link

**https://lv-league-site.vercel.app** — public, send this one to the coach.

> ⚠️ Do **not** send `lv-league-site-e1v6v17wo-frankjj04s-projects.vercel.app` or
> `lv-league-site-frankjj04s-projects.vercel.app`. Those sit behind Vercel's deployment
> protection and bounce anyone who isn't Frank to a login screen.

To publish changes after editing:

```bash
cd ~/lv-league-site
vercel deploy --prod
```

To preview locally before publishing:

```bash
cd ~/lv-league-site
python3 -m http.server 8000    # then open http://localhost:8000
```

## Message to send the coach

> Here's the website for the league: https://lv-league-site.vercel.app
>
> The registration page has your Google Form hooked up. Two things:
>
> 1. Right now it's just the registration form and your rules — the real stuff. Send me your
>    phone number, the fees, the divisions and the season dates and I'll add those pages back
>    one at a time.
> 2. Your form is asking people to sign into Google before they can fill it out, which will
>    cost you registrations. In Google Forms: **Settings → Responses → turn off "Limit to 1
>    response."** Then test the link in an incognito window.

For step 2, `COACH-SETUP.md` in this folder has the full instructions in Spanish and English —
forward it as-is if that's easier.

## What's in here

| File | What it is |
|---|---|
| `index.html` | Home — hero only: headline, the two buttons, and the Vegas skyline |
| `rules.html` | The coach's ten official rules, poster-style — **real content** |
| `register.html` | Button that opens the coach's Google Form in a new tab |
| `css/style.css` | All styling, palette sampled from the crest |
| `js/i18n.js` | All Spanish + English copy |
| `js/main.js` | Nav, language toggle, scroll reveal |
| `assets/logo.jpg` | The league crest |
| `vercel.json` | Redirects the three removed page URLs to the home page |
| `README.md` | Full technical notes — branding, editing copy, what's placeholder |
| `COACH-SETUP.md` | Bilingual instructions for unlocking the Google Form |

### Removed on September 1, 2026

`league.html`, `schedule.html` and `contact.html` were deleted, along with their Spanish/English
copy in `js/i18n.js`. Everything on them was invented placeholder content. **Nothing is lost:**
they're in git at commit `7ab192c`, so any page can come back with

```bash
git show 7ab192c:league.html > league.html      # and the same for the others
git show 7ab192c:js/i18n.js                     # to lift the old copy back out
```

`vercel.json` redirects the old URLs to the home page so no link the coach already shared breaks.

The home page's second hero button used to say "Cómo funciona la liga" and point at the deleted
league page; it now says "Ver el reglamento" and goes to the rules.

## Design pass — September 1, 2026

Reviewed all three pages rendered at 1440×900 desktop and 390×844 mobile, in both languages.
Four things were fixed:

| Fix | Why |
|---|---|
| EN button copy: "Register in my team" → **"Register my team"** | Literal translation of "Registrar mi equipo"; wrong in English |
| `.hl` highlight block got `.05em` top padding | The accent on **REGÍSTRALO** poked out above the orange box in Spanish, the default language |
| `body` is now a flex column with the footer pushed to the bottom | The Register page is short — on tall screens it left a band of white below the footer |
| `.form-cta-note` and `.lang-btn` moved off `--text-mute` | `#79828C` is only 3.9:1 on white, under the 4.5:1 AA minimum. They now use `--text-dim` (7.6:1) |

Checked and found fine: no horizontal overflow on any page at 390px, the hamburger appears on
all three, the skyline meets the footer cleanly through the orange border, and the rules page
lays out well at both sizes.

`--text-mute` is still defined and still used by `.fee-price span`, which is dead CSS from the
removed fees section. The stylesheet keeps the rules for all the removed sections on purpose —
they'll be needed when those pages come back.

## Open items

1. **The Google Form requires a sign-in.** Verified directly: logged-out visitors get
   HTTP 401 and a Google sign-in wall. That's why the register page links out to the form
   in a new tab instead of embedding it — Chrome blocks the cookies an embedded sign-in
   needs. The embed code is still in `register.html`, commented out, ready to restore once
   the coach turns that setting off. See `COACH-SETUP.md`.

2. **There is no contact info on the site at all now.** The footer's phone and email were
   invented, so they came out with the contact page. The note under the registration button
   still says "escríbenos / contact us" but no longer links anywhere. As soon as the coach
   sends a real phone or WhatsApp number, that becomes a `tel:` link and the footer gets a
   contact column back.

3. **The home page is now just the hero.** On 2026-09-01 everything below the "Inscripciones
   abiertas" note came off — the stats bar, the 4-step "how it works", the division cards, the
   why-this-league grid and the CTA band — along with 90 translation entries. All of it was
   invented placeholder copy. The skyline stayed. Recover any of it from git:
   `git show 7ab192c:index.html`.

4. **Still to be added back**, as he supplies it: divisions, fees, season dates, venues,
   standings, and contact info.

5. **The hero's own copy is still partly invented** — the "Temporada 2026" eyebrow
   (`home_eyebrow`) and the subheadline's promises of certified referees and a standings table
   (`home_sub`). Worth checking against what the coach actually offers.

## Related

`~/lv-soccer-league` is a **separate** Next.js + Supabase app for the same league — admin
login, games, and schedule pages, built in June 2026. It shares the same crest. If the two
should merge, the schedule page here is the natural seam.
