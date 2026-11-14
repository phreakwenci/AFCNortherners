#!/usr/bin/env python3
"""Build the site's NFL data files from nflverse's open game data.

Source: nflverse/nfldata games.csv (public, hosted on GitHub, updated through the
season - https://github.com/nflverse/nfldata). Stdlib only. Run by GitHub Actions.

Writes:
  data/schedule.json    every regular-season game of the season with scores
  data/standings.json   records, division/conference records, streaks, seeds
  data/draft-order.json projected next-draft order "if the season ended today"
Standings and seeds are computed from game results here. NFL tiebreakers are
simplified (win %, then division/conference win %, then point differential), so
seeds can differ from the official ones in close races; the site says so.
On any failure the old files are left untouched (site keeps last good numbers).
"""
import csv, io, json, os, sys, time, urllib.request, datetime as dt
from zoneinfo import ZoneInfo

SEASON = int(os.environ.get("NFL_SEASON", "2026"))
OUT = os.path.join(os.path.dirname(__file__), "..", "data")
SOURCES = [
    "https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv",
    "https://github.com/nflverse/nfldata/raw/master/data/games.csv",
]
ET = ZoneInfo("America/New_York")

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
NAMES = {
    "BAL": "Baltimore Ravens", "CIN": "Cincinnati Bengals", "CLE": "Cleveland Browns", "PIT": "Pittsburgh Steelers",
    "BUF": "Buffalo Bills", "MIA": "Miami Dolphins", "NE": "New England Patriots", "NYJ": "New York Jets",
    "HOU": "Houston Texans", "IND": "Indianapolis Colts", "JAX": "Jacksonville Jaguars", "TEN": "Tennessee Titans",
    "DEN": "Denver Broncos", "KC": "Kansas City Chiefs", "LV": "Las Vegas Raiders", "LAC": "Los Angeles Chargers",
    "CHI": "Chicago Bears", "DET": "Detroit Lions", "GB": "Green Bay Packers", "MIN": "Minnesota Vikings",
    "DAL": "Dallas Cowboys", "NYG": "New York Giants", "PHI": "Philadelphia Eagles", "WSH": "Washington Commanders",
    "ATL": "Atlanta Falcons", "CAR": "Carolina Panthers", "NO": "New Orleans Saints", "TB": "Tampa Bay Buccaneers",
    "ARI": "Arizona Cardinals", "LAR": "Los Angeles Rams", "SF": "San Francisco 49ers", "SEA": "Seattle Seahawks",
}
# nflverse codes -> the ESPN-style codes the site uses
ALIASES = {"LA": "LAR", "WAS": "WSH", "JAC": "JAX", "OAK": "LV", "SD": "LAC", "STL": "LAR"}


def norm(a):
    return ALIASES.get(a, a)


def download():
    last = None
    for attempt in range(3):
        for url in SOURCES:
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "afcnortherners-site-data (GitHub Actions)"})
                with urllib.request.urlopen(req, timeout=60) as r:
                    return r.read().decode("utf-8")
            except Exception as e:
                last = f"{type(e).__name__} from {url}: {e}"
                print("  retrying:", last, file=sys.stderr)
        time.sleep(5 * (attempt + 1))
    raise RuntimeError(last)


def to_int(v):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def build_schedule(rows):
    games = []
    for r in rows:
        if to_int(r.get("season")) != SEASON or r.get("game_type") != "REG":
            continue
        away, home = norm(r["away_team"]), norm(r["home_team"])
        a, h = to_int(r.get("away_score")), to_int(r.get("home_score"))
        done = a is not None and h is not None
        kick = None
        try:
            hh, mm = (r.get("gametime") or "13:00").split(":")[:2]
            y, mo, d = map(int, r["gameday"].split("-"))
            kick = dt.datetime(y, mo, d, int(hh), int(mm), tzinfo=ET).astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z")
        except Exception:
            pass
        winner = None
        if done:
            winner = home if h > a else away if a > h else "TIE"
        games.append({
            "id": r.get("game_id"), "week": to_int(r.get("week")), "date": kick,
            "away": away, "home": home, "awayScore": a, "homeScore": h,
            "state": "post" if done else "pre", "completed": done, "winner": winner,
            "detail": ("Final/OT" if r.get("overtime") == "1" else "Final") if done else "",
            "afcNorth": bool({away, home} & set(DIVISIONS["AFC North"])),
        })
    if len(games) < 250:
        raise RuntimeError(f"only {len(games)} {SEASON} regular-season games in source")
    games.sort(key=lambda g: (g["week"], g["date"] or ""))
    return games


def rec_pct(w, l, t):
    n = w + l + t
    return (w + 0.5 * t) / n if n else 0.0


def build_standings(games):
    T = {ab: {"w": 0, "l": 0, "t": 0, "dw": 0, "dl": 0, "dt": 0, "cw": 0, "cl": 0, "ct": 0,
              "pf": 0, "pa": 0, "results": []} for ab in TEAM_DIV}
    for g in games:
        if not g["completed"]:
            continue
        for me, opp, mine, theirs in ((g["home"], g["away"], g["homeScore"], g["awayScore"]),
                                      (g["away"], g["home"], g["awayScore"], g["homeScore"])):
            if me not in T or opp not in T:
                continue
            s = T[me]
            s["pf"] += mine; s["pa"] += theirs
            k = "w" if mine > theirs else "l" if mine < theirs else "t"
            s[k] += 1; s["results"].append(k.upper())
            if TEAM_DIV[me] == TEAM_DIV[opp]: s["d" + k] += 1
            if TEAM_DIV[me][:3] == TEAM_DIV[opp][:3]: s["c" + k] += 1

    def fmt(w, l, t): return f"{w}-{l}" + (f"-{t}" if t else "")

    teams = {}
    for ab, s in T.items():
        streak = ""
        if s["results"]:
            last = s["results"][-1]; n = 0
            for x in reversed(s["results"]):
                if x != last: break
                n += 1
            streak = f"{last}{n}"
        teams[ab] = {
            "abbr": ab, "team": NAMES[ab], "conf": TEAM_DIV[ab][:3], "div": TEAM_DIV[ab],
            "w": s["w"], "l": s["l"], "t": s["t"], "pct": round(rec_pct(s["w"], s["l"], s["t"]), 3),
            "seed": None, "clincher": "", "streak": streak, "pf": s["pf"], "pa": s["pa"],
            "divRecord": fmt(s["dw"], s["dl"], s["dt"]), "confRecord": fmt(s["cw"], s["cl"], s["ct"]),
            "_div": rec_pct(s["dw"], s["dl"], s["dt"]), "_conf": rec_pct(s["cw"], s["cl"], s["ct"]),
        }

    # Simplified seeding: division winners 1-4, everyone else 5-16.
    for conf in ("AFC", "NFC"):
        def key_div(t): return (t["pct"], t["_div"], t["pf"] - t["pa"])
        def key_conf(t): return (t["pct"], t["_conf"], t["pf"] - t["pa"])
        leaders = [max((teams[a] for a in DIVISIONS[d]), key=key_div) for d in DIVISIONS if d.startswith(conf)]
        others = [t for t in teams.values() if t["conf"] == conf and t not in leaders]
        order = sorted(leaders, key=key_conf, reverse=True) + sorted(others, key=key_conf, reverse=True)
        for i, t in enumerate(order):
            t["seed"] = i + 1
    for t in teams.values():
        t.pop("_div"); t.pop("_conf")
    return teams


def current_week(games):
    upcoming = [g["week"] for g in games if not g["completed"]]
    return min(upcoming) if upcoming else max(g["week"] for g in games)


def draft_order(teams):
    """'If the season ended today': non-playoff teams worst-first, then playoff teams."""
    def key(t): return (t["pct"], t["w"], t["pf"] - t["pa"])
    playoff = [t for t in teams.values() if t["seed"] and t["seed"] <= 7]
    rest = [t for t in teams.values() if t not in playoff]
    order = sorted(rest, key=key) + sorted(playoff, key=key)
    return [{"pick": i + 1, "abbr": t["abbr"], "team": t["team"],
             "record": f'{t["w"]}-{t["l"]}' + (f'-{t["t"]}' if t["t"] else ""),
             "afcNorth": t["div"] == "AFC North"} for i, t in enumerate(order)]


def write(name, obj):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        json.dump(obj, f, indent=1)
    print("wrote", path)


def main():
    os.makedirs(OUT, exist_ok=True)
    stamp = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    rows = list(csv.DictReader(io.StringIO(download())))
    games = build_schedule(rows)
    teams = build_standings(games)
    src = "nflverse"
    write("schedule.json", {"season": SEASON, "updated": stamp, "source": src, "currentWeek": current_week(games), "games": games})
    write("standings.json", {"season": SEASON, "updated": stamp, "source": src,
                             "note": "Computed from game results; NFL tiebreakers simplified.",
                             "teams": sorted(teams.values(), key=lambda t: (t["div"], -t["pct"]))})
    write("draft-order.json", {"draftYear": SEASON + 1, "updated": stamp, "projected": True,
                               "note": "If the season ended today. Tiebreakers approximate.", "order": draft_order(teams)})


if __name__ == "__main__":
    main()
