#!/usr/bin/env python3
"""Pull NFL standings + full regular-season schedule/scores from ESPN's public
JSON feed and write site data files. Stdlib only. Run by GitHub Actions.

Writes:
  data/standings.json   every team's record, division, seed, clinch status
  data/schedule.json    every regular-season game (weeks 1-18) with scores
  data/draft-order.json projected next-draft order "if the season ended today"
On any network/parse failure the old files are left untouched (site keeps
showing the last good numbers).
"""
import json, os, sys, urllib.request, datetime as dt

SEASON = int(os.environ.get("NFL_SEASON", "2026"))
OUT = os.path.join(os.path.dirname(__file__), "..", "data")
UA = {"User-Agent": "Mozilla/5.0 (site-data-bot)"}

# Static division map (ESPN abbreviations) - divisions don't change.
DIVISIONS = {
    "AFC North": ["BAL", "CIN", "CLE", "PIT"],
    "AFC East": ["BUF", "MIA", "NE", "NYJ"],
    "AFC South": ["HOU", "IND", "JAX", "TEN"],
    "AFC West": ["DEN", "KC", "LV", "LAC"],
    "NFC North": ["CHI", "DET", "GB", "MIN"],
    "NFC East": ["DAL", "NYG", "PHI", "WSH"],
    "NFC South": ["ATL", "CAR", "NO", "TB"],
    "NFC West": ["ARI", "LAR", "SF", "SEA"],
}
TEAM_DIV = {t: d for d, ts in DIVISIONS.items() for t in ts}
ALIASES = {"WAS": "WSH", "JAC": "JAX", "LA": "LAR"}


def norm(a):
    return ALIASES.get(a, a)


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def walk_entries(node):
    """ESPN nests standings differently depending on params; collect every entry."""
    out = []
    if isinstance(node, dict):
        st = node.get("standings")
        if isinstance(st, dict):
            out += st.get("entries", [])
        for c in node.get("children", []) or []:
            out += walk_entries(c)
    return out


def stat_map(entry):
    m = {}
    for s in entry.get("stats", []):
        key = s.get("name") or s.get("type")
        m[key] = s.get("value") if s.get("value") is not None else s.get("displayValue")
        m[key + "_display"] = s.get("displayValue")
    return m


def fetch_standings():
    data = get(f"https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season={SEASON}&level=3")
    teams = {}
    for e in walk_entries(data):
        t = e.get("team", {})
        ab = norm(t.get("abbreviation", ""))
        if ab not in TEAM_DIV or ab in teams:
            continue
        s = stat_map(e)
        w, l, tie = int(s.get("wins") or 0), int(s.get("losses") or 0), int(s.get("ties") or 0)
        gp = w + l + tie
        clinch = (s.get("clincher_display") or "").strip().lower()
        teams[ab] = {
            "abbr": ab,
            "team": t.get("displayName") or t.get("name") or ab,
            "conf": TEAM_DIV[ab][:3],
            "div": TEAM_DIV[ab],
            "w": w, "l": l, "t": tie,
            "pct": round((w + 0.5 * tie) / gp, 3) if gp else 0.0,
            "seed": int(s["playoffSeed"]) if s.get("playoffSeed") not in (None, "", 0, "0") else None,
            "clincher": clinch,  # ESPN codes: z=bye, y=division, x=playoff berth, e=eliminated
            "streak": s.get("streak_display") or "",
            "pf": s.get("pointsFor"), "pa": s.get("pointsAgainst"),
            "divRecord": s.get("divisionRecord_display") or s.get("vs. Div._display") or "",
        }
    if len(teams) != 32:
        raise RuntimeError(f"standings parse got {len(teams)} teams, expected 32")
    return teams


def fetch_schedule():
    games = []
    for wk in range(1, 19):
        d = get(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week={wk}&dates={SEASON}")
        for ev in d.get("events", []):
            comp = (ev.get("competitions") or [{}])[0]
            side = {}
            for c in comp.get("competitors", []):
                side[c.get("homeAway")] = {
                    "abbr": norm(c.get("team", {}).get("abbreviation", "")),
                    "score": int(c["score"]) if str(c.get("score", "")).isdigit() else None,
                    "winner": c.get("winner"),
                }
            st = (ev.get("status") or {}).get("type", {})
            home, away = side.get("home", {}), side.get("away", {})
            winner = None
            if st.get("completed"):
                if home.get("winner"): winner = home["abbr"]
                elif away.get("winner"): winner = away["abbr"]
                else: winner = "TIE"
            games.append({
                "id": ev.get("id"), "week": wk, "date": ev.get("date"),
                "away": away.get("abbr"), "home": home.get("abbr"),
                "awayScore": away.get("score"), "homeScore": home.get("score"),
                "state": st.get("state"),  # pre | in | post
                "completed": bool(st.get("completed")), "winner": winner,
                "detail": st.get("shortDetail"),
                "afcNorth": bool({away.get("abbr"), home.get("abbr")} & set(DIVISIONS["AFC North"])),
            })
    if len(games) < 200:
        raise RuntimeError(f"schedule parse got only {len(games)} games")
    return games


def current_week(games):
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    upcoming = [g["week"] for g in games if not g["completed"]]
    return min(upcoming) if upcoming else 18


def draft_order(teams):
    """'If the season ended today': non-playoff teams worst-first, then playoff
    teams worst-first. Real tiebreakers (strength of schedule) are not applied."""
    def key(t): return (t["pct"], t["w"])
    playoff = [t for t in teams.values() if t["seed"] and t["seed"] <= 7]
    rest = [t for t in teams.values() if t not in playoff]
    order = sorted(rest, key=key) + sorted(playoff, key=key)
    return [{"pick": i + 1, "abbr": t["abbr"], "team": t["team"], "record": f'{t["w"]}-{t["l"]}' + (f'-{t["t"]}' if t["t"] else ""),
             "afcNorth": t["div"] == "AFC North"} for i, t in enumerate(order)]


def write(name, obj):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        json.dump(obj, f, indent=1)
    print("wrote", path)


def main():
    os.makedirs(OUT, exist_ok=True)
    stamp = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    ok = True
    try:
        teams = fetch_standings()
        write("standings.json", {"season": SEASON, "updated": stamp, "source": "ESPN", "teams": sorted(teams.values(), key=lambda t: (t["div"], -t["pct"]))})
        write("draft-order.json", {"draftYear": SEASON + 1, "updated": stamp, "projected": True,
                                   "note": "If the season ended today. Tiebreakers approximate.", "order": draft_order(teams)})
    except Exception as e:
        ok = False; print("STANDINGS FAILED:", e, file=sys.stderr)
    try:
        games = fetch_schedule()
        write("schedule.json", {"season": SEASON, "updated": stamp, "currentWeek": current_week(games), "games": games})
    except Exception as e:
        ok = False; print("SCHEDULE FAILED:", e, file=sys.stderr)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
