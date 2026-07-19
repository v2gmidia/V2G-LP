/* ============================================================
   V2G — links entre os 3 deploys (Guia · Conteúdo · LP)
   Cole aqui a URL de cada projeto na Vercel (sem barra no fim).
   Deixe "" para manter o link relativo (útil ao rodar localmente).
   Só precisa editar este bloco — o resto é automático.
   ============================================================ */
window.V2G_URLS = {
  conteudo: "https://v2g-conteudo.vercel.app",
  guia:     "https://v2g-guia.vercel.app",
  lp:       "https://v2g-lp.vercel.app"
};

(function () {
  "use strict";
  var u = window.V2G_URLS || {};
  document.querySelectorAll("a[data-x]").forEach(function (a) {
    var base = u[a.getAttribute("data-x")];
    if (!base) return; /* vazio => mantém href relativo */
    var href = a.getAttribute("href") || "";
    a.setAttribute("href", base.replace(/\/+$/, "") + "/" + href.replace(/^\.?\//, ""));
  });
})();
