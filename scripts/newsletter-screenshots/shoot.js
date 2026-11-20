const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const R = process.env.WORK || __dirname;   // folder holding tw.css, fonts.css, node_modules
const REPO = process.env.REPO || '/home/user/AFCNortherners';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1, timezoneId: 'America/Los_Angeles', locale: 'en-US' });
  const tw = fs.readFileSync(R + '/tw.css', 'utf8');
  await ctx.route('**/*', async route => {
    const u = route.request().url();
    if (u.startsWith('http://localhost:8000')) {
      const p = new URL(u).pathname;
      if (p.startsWith('/__fonts/')) { const f = path.join(R,'node_modules/@fontsource',p.replace('/__fonts/','')); return fs.existsSync(f) ? route.fulfill({path:f, contentType: f.endsWith('woff2')?'font/woff2':'font/woff', headers:{'access-control-allow-origin':'*'}}) : route.abort(); }
      return route.continue();
    }
    if (u.includes('cdn.tailwindcss.com')) return route.fulfill({ contentType: 'text/javascript', body: '' });
    if (u.includes('fonts.googleapis.com')) return route.fulfill({ contentType: 'text/css', body: fs.readFileSync(R+'/fonts.css','utf8') });
    if (u.includes('font-awesome')) { if (u.endsWith('.css')) return route.fulfill({contentType:'text/css', body: fs.readFileSync(R+'/node_modules/@fortawesome/fontawesome-free/css/all.min.css','utf8').replace(/\.\.\/webfonts\//g,'http://localhost:8000/__fa/')}); }
    if (u.includes('raw.githubusercontent.com/phreakwenci/AFCNortherners/main/')) { const rel = decodeURIComponent(u.split('/main/')[1]); const f = REPO+'/'+rel; return fs.existsSync(f) ? route.fulfill({path:f}) : route.abort(); }
    return route.abort();
  });
  await ctx.route('http://localhost:8000/__fa/**', r => { const f = R+'/node_modules/@fortawesome/fontawesome-free/webfonts/'+new URL(r.request().url()).pathname.replace('/__fa/',''); fs.existsSync(f)?r.fulfill({path:f}):r.abort(); });
  const p = await ctx.newPage();
  for (const [name, url] of [['home','/index.html'],['season','/season.html'],['draft','/draft.html']]) {
    await p.goto('http://localhost:8000'+url, { waitUntil: 'load', timeout: 30000 }).catch(e=>console.log('goto',e.message.slice(0,80)));
    await p.addStyleTag({ content: tw });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: R+'/'+name+'-full.png', fullPage: true });
    console.log(name, await p.evaluate(()=>document.body.scrollHeight));
  }
  await b.close();
})();
