const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  for (const [q, out] of [['', 'von-icon-1024.png'], ['?clear', 'von-logo-clear.png']]) {
    await p.goto('file://' + __dirname + '/icon-gen.html' + q); await p.waitForFunction('window.done', null, { timeout: 20000 });
    const d = await p.evaluate('window.png'); fs.writeFileSync(__dirname + '/' + out, Buffer.from(d.split(',')[1], 'base64'));
  } await b.close(); })();
