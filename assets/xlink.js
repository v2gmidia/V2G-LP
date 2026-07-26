/* ============================================================
   V2G — links da LP para o resto do mundo.
   Edite só este bloco. O resto é automático.

   Só dois deploys ficam no ar: a LP e o App (o Guia foi descontinuado).
   - conteudo: URL do App (repo v2gapp) na Vercel.
   - lead: para onde vai o CTA principal "análise gratuita"
     (link do WhatsApp com mensagem pronta, ou o link do seu agendamento).
   ============================================================ */
window.V2G_URLS = {
  conteudo: "https://v2gapp.vercel.app",
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
