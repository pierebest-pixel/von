// Capture des planches de maquettes en images : node capture.js
const path = require("path"), puppeteer = require(path.join(__dirname, "../../../../bande-annonce/node_modules/puppeteer-core"));
(async () => {
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--allow-file-access-from-files"] });
  const p = await b.newPage(); await p.setViewport({ width: 1680, height: 3200, deviceScaleFactor: 1.5 });
  p.on("pageerror", (e) => console.log("[erreur]", e.message)); p.on("console", (m) => m.type() === "error" && console.log("[console]", m.text()));
  await p.goto("file:///" + path.join(__dirname, "maquettes.html").replace(/\\/g, "/")); await p.waitForFunction("window.ready === true", { timeout: 60000 });
  const names = ["1-maison-5-niveaux", "2-batiments", "8-village-de-base", "3-construire-partout", "4-les-pieces", "5-decorer", "9-vetements", "6-deco-catalogue-1", "7-deco-catalogue-2", "10-deco-exterieur"];
  const els = await p.$$(".planche");
  for (let i = 0; i < els.length; i++) { await els[i].screenshot({ path: path.join(__dirname, names[i] + ".jpg"), type: "jpeg", quality: 88 }); console.log("ok", names[i]); }
  await b.close();
})();
