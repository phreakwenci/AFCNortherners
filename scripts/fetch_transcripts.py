#!/usr/bin/env python3
"""Save captions of AFC Northerners shows to transcripts/ for the weekly jobs.

Preferred: the official YouTube Data API, signed in as the channel owner
(GitHub secrets YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN). Owners may
download their own videos' caption tracks, including auto-generated ones.
Without those secrets it falls back to youtube-transcript-api, which YouTube
usually blocks from GitHub's servers.

Videos: the channel's recent uploads plus anything listed in transcripts/wanted.txt.
Skips Shorts (< 20 min) and never overwrites an existing transcript.
"""
import json, os, re, sys, urllib.parse, urllib.request, xml.etree.ElementTree as ET

CHANNEL_ID = "UCkbDbT5JkrnpkFDh-IBtDkQ"
UPLOADS_PLAYLIST = "UU" + CHANNEL_ID[2:]
OUT = os.path.join(os.path.dirname(__file__), "..", "transcripts")
API = "https://www.googleapis.com/youtube/v3"


def ts(sec):
    sec = int(sec); h, m, s = sec // 3600, sec % 3600 // 60, sec % 60
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def http_json(url, token=None, data=None):
    req = urllib.request.Request(url, data=data, headers={"Authorization": f"Bearer {token}"} if token else {})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


# ---------- official API path ----------
def access_token():
    cid, secret, refresh = (os.environ.get(k) for k in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"))
    if not (cid and secret and refresh):
        return None
    body = urllib.parse.urlencode({"client_id": cid, "client_secret": secret,
                                   "refresh_token": refresh, "grant_type": "refresh_token"}).encode()
    return http_json("https://oauth2.googleapis.com/token", data=body)["access_token"]


def api_recent_videos(token, n=15):
    q = urllib.parse.urlencode({"part": "snippet", "playlistId": UPLOADS_PLAYLIST, "maxResults": n})
    for it in http_json(f"{API}/playlistItems?{q}", token).get("items", []):
        sn = it["snippet"]
        yield sn["resourceId"]["videoId"], sn["title"], sn.get("publishedAt", "")


def parse_srt(srt):
    lines = []
    for block in re.split(r"\r?\n\r?\n", srt.strip()):
        parts = block.splitlines()
        if len(parts) < 3 or "-->" not in parts[1]:
            continue
        h, m, s = parts[1].split("-->")[0].strip().replace(",", ".").split(":")
        start = int(h) * 3600 + int(m) * 60 + float(s)
        text = " ".join(p.strip() for p in parts[2:] if p.strip())
        if text and (not lines or lines[-1][1] != text):
            lines.append((start, text))
    return lines


def api_transcript(token, vid):
    q = urllib.parse.urlencode({"part": "snippet", "videoId": vid})
    tracks = http_json(f"{API}/captions?{q}", token).get("items", [])
    tracks = [t for t in tracks if t["snippet"].get("language", "").startswith("en")]
    if not tracks:
        raise RuntimeError("no English caption track yet")
    # Prefer a human-edited track, else the auto-generated (ASR) one
    tracks.sort(key=lambda t: t["snippet"].get("trackKind") == "asr")
    req = urllib.request.Request(f"{API}/captions/{tracks[0]['id']}?tfmt=srt", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return parse_srt(r.read().decode("utf-8", "replace"))


# ---------- fallback path ----------
def rss_recent_videos():
    ns = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as r:
        root = ET.fromstring(r.read())
    for e in root.findall("a:entry", ns):
        yield e.find("yt:videoId", ns).text, e.find("a:title", ns).text, e.find("a:published", ns).text


def scraper_transcript(vid):
    from youtube_transcript_api import YouTubeTranscriptApi
    return [(s.start, s.text) for s in YouTubeTranscriptApi().fetch(vid, languages=["en"])]


def wanted():
    path = os.path.join(OUT, "wanted.txt")
    if not os.path.exists(path):
        return
    for line in open(path):
        line = line.strip()
        if line and not line.startswith("#"):
            vid, _, title = line.partition(" ")
            yield vid, title or vid, ""


def main():
    os.makedirs(OUT, exist_ok=True)
    index_path = os.path.join(OUT, "index.json")
    index = json.load(open(index_path)) if os.path.exists(index_path) else {}

    token = None
    try:
        token = access_token()
    except Exception as e:
        print("YouTube API sign-in failed (check the YT_* secrets):", e)
    print("Using", "official YouTube API" if token else "fallback scraper (no YT_* secrets)")

    try:
        recent = list(api_recent_videos(token) if token else rss_recent_videos())
    except Exception as e:
        print("Could not list recent uploads:", e); recent = []

    for vid, title, published in recent + list(wanted()):
        if vid in index:
            continue
        try:
            lines = api_transcript(token, vid) if token else scraper_transcript(vid)
        except Exception as e:
            print(f"skip {vid} ({title}): {type(e).__name__}: {str(e)[:200]}")
            continue
        if not lines or lines[-1][0] < 20 * 60:
            print(f"skip short video {vid} ({title})"); continue
        date = (published or "")[:10] or "undated"
        path = os.path.join(OUT, f"{date}_{vid}.txt")
        with open(path, "w") as f:
            f.write(f"# {title}\n# https://www.youtube.com/watch?v={vid}\n# published {published}\n\n")
            f.write("\n".join(f"[{ts(t)}] {x}" for t, x in lines) + "\n")
        index[vid] = {"title": title, "published": published, "file": os.path.basename(path)}
        print("saved", path)

    json.dump(index, open(index_path, "w"), indent=1)


if __name__ == "__main__":
    main()
