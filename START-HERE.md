# Las Vegas Soccer League — start here

Everything for the league's team-registration website lives in this folder
(`~/lv-league-site`). Last updated **August 23, 2026**.

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
> 1. The phone number, email, fees, divisions, and rules on there are placeholders so you
>    could see the layout — send me the real ones and I'll swap them in.
> 2. Your form is asking people to sign into Google before they can fill it out, which will
>    cost you registrations. In Google Forms: **Settings → Responses → turn off "Limit to 1
>    response."** Then test the link in an incognito window.

For step 2, `COACH-SETUP.md` in this folder has the full instructions in Spanish and English —
forward it as-is if that's easier.

## What's in here

| File | What it is |
|---|---|
| `index.html` | Home — hero with the Vegas skyline, divisions, how it works |
| `league.html` | Format, divisions table, fees (`#fees`), fields |
| `rules.html` | The coach's ten official rules, poster-style — **real content** |
| `schedule.html` | Standings placeholder (season hasn't been drawn yet) |
| `register.html` | Button that opens the coach's Google Form in a new tab |
| `contact.html` | Contact cards + FAQ (`#faq`) |
| `css/style.css` | All styling, palette sampled from the crest |
| `js/i18n.js` | All Spanish + English copy |
| `js/main.js` | Nav, language toggle, scroll reveal, FAQ accordion |
| `assets/logo.jpg` | The league crest |
| `README.md` | Full technical notes — branding, editing copy, what's placeholder |
| `COACH-SETUP.md` | Bilingual instructions for unlocking the Google Form |

## Open items

1. **The Google Form requires a sign-in.** Verified directly: logged-out visitors get
   HTTP 401 and a Google sign-in wall. That's why the register page links out to the form
   in a new tab instead of embedding it — Chrome blocks the cookies an embedded sign-in
   needs. The embed code is still in `register.html`, commented out, ready to restore once
   the coach turns that setting off. See `COACH-SETUP.md`.

2. **Most league details are still placeholders.** Phone, email, fees, divisions, season
   dates, and venues were invented to make the layout read correctly. `README.md` has the
   table of exactly what to replace and where. The league name, the crest, and the rules
   page are real.

3. **`index.html` and `league.html` still say "11 vs 11"** in six places, which contradicts
   real rule 2 (8 vs 8). Worth fixing in the same pass as the real division info.

## Related

`~/lv-soccer-league` is a **separate** Next.js + Supabase app for the same league — admin
login, games, and schedule pages, built in June 2026. It shares the same crest. If the two
should merge, the schedule page here is the natural seam.
