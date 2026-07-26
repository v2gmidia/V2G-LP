/* ============================================================
   V2G — links da LP para o resto do mundo.
   Edite só este bloco. O resto é automático.

   - conteudo/guia/lp: URLs dos outros deploys na Vercel (sem barra no fim).
   - lead: para onde vai o CTA principal "análise gratuita"
     (link do WhatsApp com mensagem pronta, ou o link do seu agendamento).
   Deixe "" para manter o comportamento padrão (link relativo / href="#").
   ============================================================ */
window.V2G_URLS = {
  conteudo: "https://v2g-conteudo.vercel.app",
  guia:     "https://v2g-guia.vercel.app",
  lp:       "https://v2g-lp.vercel.app",
  lead:     "https://wa.me/5500000000000?text=Oi!%20Quero%20fazer%20a%20an%C3%A1lise%20gratuita%20do%20meu%20neg%C3%B3cio."
};

(function () {
  "use strict";
  var u = window.V2G_URLS || {};

  /* links entre os deploys: prefixa a URL base + o caminho relativo */
  document.querySelectorAll("a[data-x]").forEach(function (a) {
    var base = u[a.getAttribute("data-x")];
    if (!base) return;
    var href = a.getAttribute("href") || "";
    a.setAttribute("href", base.replace(/\/+$/, "") + "/" + href.replace(/^\.?\//, ""));
  });

  /* CTA de análise gratuita: manda direto pro link de lead (WhatsApp/agendamento) */
  if (u.lead) {
    document.querySelectorAll("a[data-lead]").forEach(function (a) {
      a.setAttribute("href", u.lead);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    });
  }
})();
