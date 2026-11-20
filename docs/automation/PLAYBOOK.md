# AFC Northerners — Weekly Automation Playbook

Instructions for the Claude scheduled tasks that run the show's weekly busywork.
Each scheduled task names a job below; follow that job's steps exactly.
Humans: edit this file to change how the jobs behave.

## Shared context

- **Show:** AFC Northerners, live Tuesdays 6:30 PM PT on Twitch + YouTube (@afcnorthernersshow).
- **Repo:** `phreakwenci/AFCNortherners`. The live site (afcnortherners.com) is served from `main`.
  Before any job: `git fetch origin main` and work from the latest `origin/main` copy of `data/`, `transcripts/`, and this playbook.
- **Data files (on main):**
  - `data/standings.json`, `data/schedule.json`, `data/draft-order.json` — refreshed automatically by the
    "Update site data" GitHub Action from nflverse (open NFL data). Never hand-edit.
  - `transcripts/*.txt` + `transcripts/index.json` — YouTube auto-captions of each show, saved by the same Action.
    Captions have **no speaker names**; `>>` marks a speaker change. Infer speakers from names used in conversation.
  - `data/picks.json` — built by these jobs from the Airtable Weekly Picks table (format below).
  - `data/draft-pundits.json` — built by the Draft HQ job (format below).
  - `data/hero.json` — homepage hero video = newest full episode, start/end seconds skip the pre-show (auto, from the transcript job).
  - `data/draft-history.json` — every AFC North pick since 2000 (auto, from nflverse). `data/draft-live.json` — draft-night picks + host mocks.
- **Publishing rule:** commit ONLY files under `data/` (and `transcripts/` if needed), rebase on `origin/main`,
  push to `main`. Never change any other file on main. Use commit messages like `Picks update Wk11`.
- **Hosts (the main six)** — name / team / email:
  | Host | Team | Email |
  |---|---|---|
  | Jan (Jan-David Soutar) — show owner | BAL | afcnortherners@gmail.com |
  | Justen (Justen Finch) | BAL | justen.finch@gmail.com |
  | Chris (Chris Adkins) | PIT | cadkins112@gmail.com |
  | Gabe (Gabe Bellotti) | PIT | gfbellotti@gmail.com |
  | Rob (Rob Gressis) | CIN | rgressis@gmail.com |
  | Dave ("DGBG", Dave Green) | CLE | dgbrowns1975@gmail.com |
  Alternates (John, Ace) are not emailed.
- **Notion (AFC Northerners HQ):**
    (Entry, Week, Game "AWAY @ HOME", Host, Pick, Predicted Score, Source Email|On-air, Result Pending|Correct|Wrong|Tie, Verified, Episode, Quote)
  - 📥 Takes Submissions — `collection://8370d0f4-2c4a-4b33-93ad-641754e1db0b`
  - 6-Pack Friday Newsletter — `collection://c1c11f6a-2a50-4f07-86e9-bcc3938f3293`
  - 6-Pack Friday Layout & Style Guide — page `3252a1b0cda88149b96ef36cbed590a9` (read it before building an issue)
  - Public takes form: https://brook-nova-9f7.notion.site/3252a1b0cda88025a083e33783c6b6b1
- **Airtable — Weekly Picks (source of truth for picks):** base `appnddOLSU3eJWA0M`, table `tblLKa319Hw12RYuf`
  (Entry, Week, Game "AWAY @ HOME", Host Jan|Justen|Chris|Gabe|Rob|Dave, Pick, Predicted Score, Source Email|On-air,
  Result Pending|Correct|Wrong|Tie, Verified, Episode, Quote). Picks moved here from Notion on 2026-11-14 because the
  Notion workspace hit its free block limit — do NOT write picks to Notion.
- **Airtable — Hot Takes:** base `appnddOLSU3eJWA0M`, table `tblt6oqNTT99SLQqm`
  (Take Text, Team, Active, Week Label, Sort Order, Yes Votes, No Votes) — feeds the site's Hot Take Meter.
- **MailerLite:** the 6-Pack Friday newsletter is a MailerLite campaign (account 2194589).
- **Team codes:** ESPN abbreviations everywhere (BAL CIN CLE PIT, JAX, LAR, WSH…).
- **Email voice:** short bar-talk. Open "Hello AFC Northerners," and sign off
  "Your friendly AI assistant, on behalf of AFC Northerners". Send from afcnortherners@gmail.com.
- **Time zones:** Quote times to Jan in Pacific. Pacific is UTC-8 (PST) from the first Sunday in November to the second Sunday
  in March, and UTC-7 (PDT) the rest of the year. Convert from UTC with the right offset for that date, and double-check
  before writing "AM/PM PT" in any message (e.g. 19:24 UTC on Nov 20 = 11:24 AM PST).
- **Honesty rule:** if a source is missing (no transcript yet, connector down, ESPN data stale), skip that part and
  say so in the note to Jan. Never invent picks, quotes, stats or takes.
- **Sending rule:** emails to the six hosts are pre-approved for the jobs below. The 6-Pack Friday newsletter to
  subscribers is NEVER sent automatically — build it and ask Jan to approve.

### data/picks.json format
Keep existing `season`, `note`, `hosts`. Set `updated` to now (ISO). `games` = one object per (Week, Game) from the Airtable Weekly Picks table:
```json
{"week": 11, "away": "PIT", "home": "CIN", "picks": {"Jan": "CIN", "Chris": "PIT"}, "scores": {"Jan": "30-27"}, "unconfirmed": ["Chris"]}
```
Include every row. If a host has both an Email and an On-air pick for a game, Email wins. For On-air rows whose
`Verified` is unchecked (speaker attribution uncertain), add the host's name to that game's `"unconfirmed": []` list —
the site shows those with a "?" until Jan confirms (ticks Verified in Airtable) or corrects them. Omit empty `scores`. The website grades picks itself against `data/schedule.json`.

### data/draft-pundits.json format
```json
{"draftYear": 2027, "updated": "ISO", "mocks": [
  {"pundit": "Mel Kiper Jr.", "outlet": "ESPN", "date": "2026-11-10", "url": "https://…", "version": "Mock 1.0",
   "picks": [{"pick": 1, "team": "LAC", "player": "Name", "pos": "QB", "school": "Texas"}]}
 ],
 "afcNorth": {"BAL": [{"player": "Name", "pos": "EDGE", "school": "…", "mentions": 4, "pundits": ["Kiper", "Brugler"]}]},
 "risers": [{"player": "…", "note": "one line"}]}
```

---

## Job: WEDNESDAY — show recap + takes & picks email
1. Find last night's show in `transcripts/` (newest file). If absent, skip 2–3 and note it.
2. **On-air picks:** log every winner/score prediction a host made on an AFC North game as an Airtable Weekly Picks record:
   Source=On-air, Verified unchecked, Result=Pending, Episode=YouTube URL, Quote=the transcript lines (with timestamps)
   it came from, Entry="Wk<N> — <Host> — <Game>". Only log when the speaker is reasonably clear. Never overwrite Email rows.
3. **Hot Take Meter:** (public on the homepage — fans vote Fire 🔥 / Cap ❄️.)
   - Pick the 4–5 most debatable, *prediction-style* takes from the show (a team's season, a player's future, a coach, a
     game outcome, a trade/draft call). Rewrite each as ONE punchy, vote-able sentence a fan can agree or disagree with,
     e.g. "The Steelers win the AFC North." No hedging, no "the hosts think".
   - **Never** attribute a take to a specific host, and never turn into a take: accusations or jokes about crimes or
     off-field conduct, personal attacks, injuries/medical speculation about named players, slurs, or anything a host
     said as crude banter. If in doubt, leave it out — 4 clean takes beats 5.
   - Add each to Airtable `Hot Takes`: Take Text, Team (the team it's about, or `All`), Week Label (`Week <N>` for the
     upcoming NFL week, e.g. `Week 11`; create the option if missing), Active ✔, Yes/No votes 0, Sort Order 1–5
     (spiciest first).
   - Keep the meter fresh: afterwards no more than 8 takes may be Active. Uncheck Active on the oldest first (never
     delete — votes are history). Skip a take if an Active or recent one already says the same thing.
   - List the takes you added in the note to Jan (step 6) so a bad one can be unticked in Airtable in seconds.
   - **Fan submissions:** fans suggest takes through the site's Submit Your Hot Take form, which creates rows in the
     same Hot Takes table with **Active unchecked, no Sort Order, and 0/blank votes** (anything with Active unchecked and a
     `createdTime` since the last Wednesday that you didn't create yourself). Review them each Wednesday:
     pick up to **2** that are the most fun and debatable, apply the same safety rules as above, lightly tidy spelling and
     make them a single vote-able sentence (keep the fan's idea), then tick Active, set Week Label to the upcoming week,
     and Sort Order after your own takes. Leave the rest inactive — never delete a fan's submission. If none are usable,
     add none; never invent a fan take.
   - In the note to Jan, list the fan takes you promoted and a count of the others ("6 fan submissions, 2 used"),
     with the rejected ones' text so Jan can overrule you.
4. **6-Pack Friday issue:** create this week's issue page in Notion if missing (Status Draft, next Issue Number,
   Send Date this Friday, Week Label), following the style guide. Fill the four team News fields, Around the League
   and Odds note from current reporting; sources in Notes.
5. **One email to all six hosts.** Subject like "6-Pack Friday #<n> + Week <N> picks — due Thu 6 PM PT":
   - 2–3 bullets on this week's AFC North storylines.
   - TAKES: one take for your team via the form, due Thursday 6 PM PT; one league-wide take, first to claim by reply-all.
   - PICKS: every AFC North game this week (from `data/schedule.json`, kickoff in PT). Reply with a winner for each,
     plus a score if you want. Picks lock at each game's kickoff.
   - "On-air picks I heard last night" list so hosts can correct mis-attributions by replying.
6. **Note to Jan only:** what you logged, anything you couldn't attribute (with quotes), hot takes added, gaps.
7. Rebuild and publish `data/picks.json`.

## Job: THURSDAY — collect picks + reminders
1. Read replies to this week's Wednesday email thread (and any direct replies from the six hosts since then).
2. For each pick in a reply, create/update an Airtable Weekly Picks record (Source=Email, Verified checked, Result=Pending),
   only if received before that game's kickoff. Corrections to on-air picks: fix the row and check Verified.
3. Check Takes Submissions for this week.
4. Email only the hosts still missing picks and/or a take: a short nudge with what's missing and the deadline
   (takes 6 PM PT today; picks before kickoff). No email if everyone is in.
5. Rebuild and publish `data/picks.json`.

## Job: FRIDAY — build 6-Pack Friday
1. Log any new pick replies (as Thursday step 1–2).
2. Pull this week's takes from Takes Submissions (and any league-wide take claimed by reply-all) into the issue's
   take fields; refresh the odds note and any stale news. Leave a field blank rather than invent a take.
3. Build/refresh the MailerLite campaign draft from the issue page per the style guide (don't create duplicates —
   update this week's draft if one exists). Set the Notion issue Status to "Ready to Send" only if every section is filled.
4. Email Jan only: the MailerLite preview link, which takes are missing, and "reply SEND to send it" — do NOT send
   the campaign. If Jan has replied SEND to a previous Friday note in this session's inbox, send that campaign then.
5. Rebuild and publish `data/picks.json`.

### 6-Pack Friday newsletter rules (learned from issue #3 — follow every week)
- **Look: copy the previous issues, never invent a layout.** Issues #1–#3 share one dark design: black page, dark card,
  logo + orange-to-red "AFC NORTHERNERS" header with "🍺 6-PACK FRIDAY · ISSUE #N · DATE", an amber WEEK tag, big white
  title + grey subtitle (the opening line), then team-colored bordered take cards (dot + emoji + "TEAM — HOST",
  bold headline, body). Use `docs/automation/newsletter-template.html` as the starting HTML and fill it in.
  MailerLite's "builder_html" emails can't be read back through the connector, so don't try to fetch an old issue's HTML;
  the template file is the source of truth. Compare with the previous campaign's screenshot
  (`screenshot_url` from `list_campaigns`) before telling Jan it's ready.
- **Run each take as the host's FULL submission** (headline = their title, body = the whole "Supporting Argument"), the way
  issues #1 and #2 did. Do NOT condense takes into short summaries. Fix only typos/markup; keep their words. If a
  submission looks cut off mid-sentence (the Notion form can clip long text), end at the last complete paragraph/bullet,
  never invent an ending, and tell Jan. Flag script-isms (like-button asks, internal "notebook" citations) and anything
  claiming facts about real people for Jan to review before it goes out.
- **Never build from the style guide's description alone: first look at what the last two issues actually did and copy that.**
  Where the written guide and the sent issues disagree (e.g. "1-3 sentence takes" vs. full submissions), the sent issues win.
  Compare your draft's screenshot to the previous issue's before reporting it ready.
- **Which takes run (Notion → 📥 Takes Submissions).** Jan curates in the "🔥 Review Board" view (board grouped by Status),
  not the Default view. Status **Selected** = running in an issue; **Passed** = rejected; **Submitted** = not reviewed yet.
  Build from **Selected** takes only. The Newsletter Issue relation is often left empty, so decide which issue a Selected
  take belongs to by date: Selected takes created after the previous issue's send date are this issue's; earlier ones already
  ran. Never run Submitted or Passed takes; if nothing is Selected for a team, leave that team out. Don't change Status or
  other fields on Jan's board unless asked.
- **Website promo block goes right AFTER Clip of the Week (before the footer), not at the top (Jan's call):** "Have you checked out the website? If not, here's why
  you should." with 3-4 screenshots that each link to the page (Season HQ, host picks leaderboard, Draft HQ, past drafts) and a
  button to afcnortherners.com. Use stills (small JPEGs, ~60KB), not video; an animated GIF only if it's small. Refresh the
  images each Friday with `scripts/newsletter-screenshots/` (see its README) so standings/picks are current, save them in
  `Assets/img/newsletter/`, and reference them by raw.githubusercontent.com URL on `main` (once merged). Rotate which features
  you show (e.g. the Hot Take Meter, Playbook, hosts) so it doesn't get stale.
- **Only include what exists.** If a host's take is missing, leave that card out entirely — no "[TAKE MISSING]" placeholders
  in the campaign. Say who's missing in the note to Jan instead.
- **No repeats.** A take counts once. Takes already used in a previous issue (check the previous issue's Notion fields and
  campaign screenshot; takes are usually dated before that issue's send date) must not be reused. If a host's newest
  submission is for this week, use it, not their older one.
- **Fill every section yourself** when it can be sourced: opening line, title (suggest one; Jan approves), team news,
  Around the League, Odds & Lines (current spreads/totals from reputable sources, state when a line wasn't found, never guess),
  and Clip of the Week.
- **Clip of the Week:** find a standout moment in the latest show transcript (`transcripts/`), and link it with a timestamp
  (`https://www.youtube.com/watch?v=<id>&t=<seconds>s`). Examples: a host eating crow, a hot take, a big call.
  Jan may name the clip; if he does, use it.
- **Draft only.** The campaign stays a draft until Jan replies SEND to the Friday note. Don't click or trigger sending.
- MailerLite connector quirk: create/update/get campaign calls can return a "schema" error even though they worked.
  Verify with `list_campaigns` (status draft) before retrying, so you don't create duplicates.

## Job: SUNDAY — final picks sweep
1. Log any pick replies received before each game's kickoff (Sunday early games kick off 10 AM PT).
2. Rebuild and publish `data/picks.json`. No emails unless something is broken.

## Job: TUESDAY — grade the week
1. Using `data/schedule.json`, set Result (Correct/Wrong/Tie) on every Pending Airtable Weekly Picks record whose game is final.
2. Rebuild and publish `data/picks.json`.
3. Email Jan a 5-line prep note for tonight's show: this week's pick standings (who went 3-0, who went 0-3), the season
   leaderboard top/bottom, and any unverified on-air picks still waiting for a check.
   Add a **"Hot Take Meter — read these on air"** block: for each Active take, its Fire % and vote count (Yes Votes vs
   No Votes from Airtable), flagging the most lopsided ("92% say Fire") and the most split (closest to 50/50, the best
   debates). Give the host a one-line suggested read for the top 2 ("Fans are split 51/49 on: ...").
   Also list the fan-submitted takes that are still unused so the hosts can read a few live and Jan can tick Active
   on any he likes. Keep it short; if there are fewer than 10 total votes this week, say so instead of making a trend up.

## Job: PRE-SHOW — plug the website on the stream (Tuesday, ~50 min before the show)
Goal: make sure the hosts actually promote afcnortherners.com on air every week. Email **Jan only**
(afcnortherners@gmail.com), subject like "Show in ~50 min — plug the site". Keep it skimmable; it's read on a phone.
1. **Three plugs, with this week's specifics** (pull the numbers from `data/` and Airtable, never invent):
   - **Season HQ** — "afcnortherners.com/season.html has every host's picks, graded." Include the current picks leader
     and last week's best/worst from `data/picks.json` + `data/schedule.json`, as a hook the hosts can say out loud.
   - **Hot Take Meter** — name 2–3 of the Active takes and say "vote 🔥 or ❄️ on the site, and send us your own."
   - **One rotating plug:** Draft HQ (include a North team's projected pick), the 6-Pack Friday newsletter signup, or
     Patreon — rotate week to week; say which you picked and why.
2. **When to say them:** plug 1 in the first 10 minutes, plug 2 at the picks/predictions segment, plug 3 in the outro CTA
   (with "like, subscribe, and the link is in the description").
3. **Ready to paste:** one chat message to pin on Twitch/YouTube, e.g. "🏈 Picks, standings & the Hot Take Meter →
   afcnortherners.com", plus a 2-line addition for the video description.
4. Say the URL as short as possible: "afcnortherners dot com". No other email, no other action.

## Job: DRAFT HQ — pundit roundup
1. Search the web for the latest NFL mock drafts and big boards for the next draft from every major pundit/outlet you
   can find (e.g. ESPN Kiper & Reid, NFL.com Jeremiah/Zierlein/Brooks/Davis, The Athletic Brugler, PFF, CBS, The Ringer,
   Bleacher Report, Pro Football Network, Draft Network, USA Today, Yahoo, SI, Fox, NFL Draft Buzz). Only use mocks you
   actually opened; record date + URL.
2. Use the projected order in `data/draft-order.json` as context. For each mock, store its full first round.
3. Build the `afcNorth` summary: for BAL/CIN/CLE/PIT, the players pundits most often send to them (with counts and who).
4. Add up to 5 "risers" from fresh reporting.
5. Write `data/draft-pundits.json` (format above), keep at most the 2 most recent mocks per pundit, publish.
6. Email Jan only if something big moved (e.g. a consensus AFC North pick changed).

## Job: BACKFILL — season picks history (one-time)
For each 2026 show transcript in `transcripts/` (weeks 1–9 are listed in `transcripts/wanted.txt`), run the
Wednesday step 2 (on-air picks, Verified unchecked). Then email Jan a review list grouped by week with quotes so he
can tick Verified in Airtable, and publish `data/picks.json`.
