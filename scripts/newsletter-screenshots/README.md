# Newsletter website screenshots

The live site can't be reached from the cloud sandbox, so the pictures in the newsletter's "Have you checked out the website?"
block are rendered from this repo locally. Steps (about 3 minutes):

1. `mkdir /tmp/shots && cd /tmp/shots && npm init -y && npm i tailwindcss@3.4.17 @fontsource/anton @fontsource/archivo-narrow @fontsource/roboto-mono @fontsource/caveat @fontsource/kalam @fortawesome/fontawesome-free`
2. Build the CSS the pages normally get from the Tailwind CDN (stock Tailwind, no custom config):
   `echo '@tailwind base; @tailwind components; @tailwind utilities;' > in.css`
   `echo "module.exports={content:['$REPO/index.html','$REPO/season.html','$REPO/draft.html']}" > tw.config.js`
   `npx tailwindcss -c tw.config.js -i in.css -o tw.css`
3. Build `fonts.css` from the @fontsource `400.css`/`700.css` files for anton, archivo-narrow, roboto-mono, caveat, kalam, with
   every `url(./files/` rewritten to `url(http://localhost:8000/__fonts/<package>/files/`.
4. Serve the repo: `cd $REPO && python3 -m http.server 8000 &`
5. `WORK=/tmp/shots REPO=$REPO node scripts/newsletter-screenshots/shoot.js` → writes `home-full.png`, `season-full.png`, `draft-full.png`
   (Pacific time zone, real fonts).
6. Crop with Pillow to 1200px-wide JPEGs (quality 80) and save in `Assets/img/newsletter/`:
   `site-season-hq.jpg` (top 915px of season), `site-host-picks.jpg` (leaderboard + first pick rows),
   `site-draft-hq.jpg` (mock board + live tracker), `site-past-drafts.jpg` (past drafts table). Look at each crop before using it.
