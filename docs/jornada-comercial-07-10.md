# Jornada comercial da LP — 07/10/2026

**Estado:** alteração local validada, sem commit, push ou deploy. O registro
completo da jornada, das verificações e das limitações está no
[`WebApp — entrada e LP`](../../webapp/docs/estado/entrada-lp-07-10.md).

## Entrega deste bloco

A LP existente apresenta R$ 500 mensais por conta de anúncios, permanência
mínima de seis meses e verba de mídia separada, conforme
`../webapp/docs/decisoes.md`. A contratação e o pagamento continuam
assistidos. Checkout automático, integração Asaas por API/webhook,
assinatura eletrônica, fiscal e lançamento completo são trabalhos futuros.

Os CTAs de atendimento levam ao formulário completo em `#pre-cadastro`.
Nome, e-mail e WhatsApp continuam obrigatórios; qualificadores, consentimento,
payload, validação e RPC existentes foram preservados. A API só devolve
`contato_url` após `resultado.ok === true` (`api/pre-cadastro.js:158`). O
navegador valida o destino e mostra um botão para abrir o WhatsApp por
clique; não envia mensagem nem abre a conversa automaticamente
(`assets/lp.v6.js:250`).

Login e primeiro acesso usam `assets/jornada.v6.js:5`, com origem pública
`https://v2g-deploy-webapp.vercel.app` e local `http://localhost:3000`.
Os links mantêm um `href` público de reserva no HTML. A volta do WebApp usa
`webapp/lib/site-publico.ts`: LP em `localhost:5173` no desenvolvimento e
`https://www.v2gmidia.com.br` nos demais ambientes. Troca de domínio exige
revisar também configuração e redirects Supabase/Meta; futuros checkout e
webhook devem entrar nessa revisão quando integrados.

## Evidência e limites

Os dois conferidores locais passaram com mocks, sem rede. O navegador
local comprovou navegação entre os projetos e envio fictício com o aviso
“Prévia local”; o simulador informa que nenhum contato foi salvo. A revisão
visual independente terminou em `ship`. Isso não comprova persistência de
lead, pagamento ou integração viva. Nenhuma página legal, variável de
ambiente, tabela ou migration foi alterada por este bloco.

## Seleção no GitHub Desktop

Repositório `C:/Users/victo/v2g-deploy/lp` — arquivos deste bloco:

- `index.html`
- `assets/jornada.v6.css`
- `assets/jornada.v6.js`
- `assets/lp.v6.js`
- `api/pre-cadastro.js`
- `scripts/servidor-local.js`
- `scripts/conferir-contato.cjs`
- `scripts/conferir-jornada.cjs`
- `docs/jornada-comercial-07-10.md`

Revisar os trechos antes de selecionar: esta lista não inclui mudanças
anteriores de marca nem trabalhos paralelos. A seleção do WebApp está no
registro vinculado acima. As 14 capturas em
`webapp/.impeccable/review/entrada-lp-07-10/` são evidência local e não
precisam entrar no commit de produto.
