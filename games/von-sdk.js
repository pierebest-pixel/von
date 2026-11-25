/*
 * Von SDK — à inclure dans chaque jeu :  <script src="../von-sdk.js"></script>
 *
 *   Von.sound            -> true/false : le joueur a activé le son dans les Réglages
 *   Von.score(n)         -> enregistre un score (Von garde le meilleur)
 *   Von.onPause(fn)      -> appelé quand le joueur ouvre le menu pause
 *   Von.onResume(fn)     -> appelé quand il reprend
 *   Von.onRestart(fn)    -> appelé sur « Recommencer » (par défaut : recharge le jeu)
 *   Von.quit()           -> revient à Von
 */
(function () {
  "use strict";
  var handlers = { pause: [], resume: [], restart: [] };
  var inVon = window.parent !== window;
  function send(msg) { if (inVon) window.parent.postMessage(msg, location.origin); }
  function readSound() {
    try { var v = localStorage.getItem("von:sound"); return v === null ? true : JSON.parse(v); } catch (e) { return true; }
  }
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || !e.data.von) return;
    var type = e.data.von;
    if (type === "restart" && handlers.restart.length === 0) { location.reload(); return; }
    (handlers[type] || []).forEach(function (fn) { try { fn(); } catch (err) { console.error(err); } });
  });
  window.Von = {
    get sound() { return readSound(); },
    score: function (n) { send({ von: "score", value: Number(n) }); },
    onPause: function (fn) { handlers.pause.push(fn); },
    onResume: function (fn) { handlers.resume.push(fn); },
    onRestart: function (fn) { handlers.restart.push(fn); },
    quit: function () { send({ von: "quit" }); },
  };
})();
