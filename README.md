# V2G — Landing Page (vendas)

Página de vendas pública da V2G: leva o visitante frio até o cadastro.
Site estático (HTML/CSS/JS), sem build, sem dependências.

## Rodar localmente

Abra `index.html` no navegador, ou sirva a pasta:

```bash
python -m http.server 5173
# http://localhost:5173
```

## Deploy na Vercel (estático, zero-config)

1. Suba este repositório no GitHub.
2. Na Vercel: **Add New → Project** → importe o repositório.
3. **Framework Preset: Other** · Build Command: *(vazio)* · Output Directory: *(vazio / raiz)*.
4. Deploy.

## Links para os outros deploys

Os botões de CTA levam ao **cadastro** (repo *Conteúdo*) e o rodapé "Ver as telas"
ao repo *Guia*. Esses são os únicos links que saem deste site, e ficam num só lugar:

Edite **`assets/xlink.js`** com as URLs dos seus projetos Vercel:

```js
window.V2G_URLS = {
  conteudo: "https://SEU-conteudo.vercel.app",
  guia:     "https://SEU-guia.vercel.app",
  lp:       "https://SEU-lp.vercel.app"
};
```

Deixe uma URL como `""` para manter o link relativo (útil ao testar local).
Nada mais precisa ser tocado — o resto é reescrito automaticamente.

## Estrutura

```
index.html              A landing (hero → dor → como funciona → preço → garantia → CTA)
assets/
  v2g.css               Design system (tokens, componentes)
  v2g-landing.css       Estilos da landing
  v2g.js                Logomark pixelado
  xlink.js              << as URLs entre os 3 deploys moram aqui
```
