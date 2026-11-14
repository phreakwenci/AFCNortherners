#!/usr/bin/env python3
"""Save auto-captions of new AFC Northerners YouTube videos to transcripts/.
Uses the channel's public RSS feed (latest ~15 uploads incl. finished streams)
and youtube-transcript-api. Only videos longer than ~20 min of captions are kept
(skips Shorts). Never overwrites an existing transcript.
"""
import os, re, sys, json, urllib.request, xml.etree.ElementTree as ET

CHANNEL_ID = "UCkbDbT5JkrnpkFDh-IBtDkQ"
OUT = os.path.join(os.path.dirname(__file__), "..", "transcripts")
NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}


def feed():
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as r:
        root = ET.fromstring(r.read())
    for e in root.findall("a:entry", NS):
        yield e.find("yt:videoId", NS).text, e.find("a:title", NS).text, e.find("a:published", NS).text


def wanted():
    path = os.path.join(OUT, "wanted.txt")
    if not os.path.exists(path):
        return
    for line in open(path):
        line = line.strip()
        if line and not line.startswith("#"):
            vid, _, title = line.partition(" ")
            yield vid, title or vid, "0000-00-00"


def ts(sec):
    sec = int(sec); h, m, s = sec // 3600, sec % 3600 // 60, sec % 60
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def main():
    from youtube_transcript_api import YouTubeTranscriptApi
    api = YouTubeTranscriptApi()
    os.makedirs(OUT, exist_ok=True)
    index_path = os.path.join(OUT, "index.json")
    index = json.load(open(index_path)) if os.path.exists(index_path) else {}
    failures = 0
    try:
        recent = list(feed())
    except Exception as e:
        print("RSS feed failed:", e); recent = []
    for vid, title, published in recent + list(wanted()):
        path = os.path.join(OUT, f"{published[:10]}_{vid}.txt")
        if vid in index or os.path.exists(path):
            continue
        try:
            snippets = api.fetch(vid, languages=["en"])
        except Exception as e:  # live/upcoming, no captions yet, or blocked
            print(f"skip {vid} ({title}): {type(e).__name__}: {e}"[:300]); failures += 1
            continue
        lines = [f"[{ts(s.start)}] {s.text}" for s in snippets]
        if not snippets or snippets[-1].start < 20 * 60:
            print(f"skip short video {vid} ({title})"); continue
        with open(path, "w") as f:
            f.write(f"# {title}\n# https://www.youtube.com/watch?v={vid}\n# published {published}\n\n" + "\n".join(lines) + "\n")
        index[vid] = {"title": title, "published": published, "file": os.path.basename(path)}
        print("saved", path)
    json.dump(index, open(index_path, "w"), indent=1)


if __name__ == "__main__":
    main()
