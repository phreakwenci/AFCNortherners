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
3. **Hot Take Meter:** pick the 3–5 spiciest, most debatable takes from the show; rewrite each as one vote-able
   sentence; add to Airtable (Active checked, Team, matching Week Label, votes 0). Uncheck Active on takes 3+ weeks old.
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

## Job: SUNDAY — final picks sweep
1. Log any pick replies received before each game's kickoff (Sunday early games kick off 10 AM PT).
2. Rebuild and publish `data/picks.json`. No emails unless something is broken.

## Job: TUESDAY — grade the week
1. Using `data/schedule.json`, set Result (Correct/Wrong/Tie) on every Pending Airtable Weekly Picks record whose game is final.
2. Rebuild and publish `data/picks.json`.
3. Email Jan a 5-line prep note for tonight's show: this week's pick standings (who went 3-0, who went 0-3), the season
   leaderboard top/bottom, and any unverified on-air picks still waiting for a check.

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
