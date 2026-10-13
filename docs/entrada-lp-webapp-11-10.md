# Contrato de entrada da LP para o WebApp — 11/10/2026

## Estado deste bloco

Alterações locais em `C:/Users/victo/v2g-deploy/lp`. Não houve commit, push,
deploy, alteração de banco, cobrança, pedido ou consulta externa de CNPJ.

## O que a LP apresenta

- Mensalidade: **R$ 500 por mês por conta de anúncios**.
- Permanência mínima: **seis meses**.
- Anual à vista: **R$ 5.280 por conta**, desconto de **12%** e economia de
  **R$ 720** frente a doze mensalidades.
- Verba de mídia: separada da mensalidade.

O CTA comercial é `#pre-cadastro` e diz **“Enviar interesse para contratar”**.
O texto separa interesse, qualificação, compra, pagamento e acesso. Nenhum
CTA público aponta para `/contratar`.

## Contrato HTTP da LP

### Interesse

`POST https://www.v2gmidia.com.br/api/pre-cadastro`

O navegador envia JSON com:

```text
nome, whatsapp, email, negocio, cnpj, nicho, nicho_outro, instagram,
perfil, vende_whatsapp, investe_anuncios, faixa_investimento, site,
consentimento, empresa_url, utm_source, utm_medium, utm_campaign,
utm_content, pagina_origem
```

- `empresa_url` é honeypot e não libera contato quando preenchido.
- `pagina_origem` e os quatro UTMs são preenchidos pelo navegador e enviados
  no mesmo pedido.
- O consentimento é obrigatório e o servidor grava o texto vigente do
  consentimento, quando a RPC de produção aceita o lead.
- O CNPJ é obrigatório e validado por formato e dígitos verificadores no
  navegador e no servidor.
- **Situação cadastral ativa não é consultada pela LP.** A confirmação dela é
  uma etapa humana antes de abrir a compra.

### Respostas

| Situação | Resposta |
|---|---|
| Interesse aceito pela RPC | `200 { ok: true, contato_url }` |
| Campo inválido, incluindo CNPJ | `422 { ok: false, campos }` |
| Limite do mesmo IP | `429` |
| Falha ao gravar | `502` |

`200` representa somente o interesse recebido. Não cria `commercial_orders`,
não inicia cobrança e não equivale a `payment_approved`.

Depois de `200`, o botão de WhatsApp é liberado apenas se a URL recebida for
HTTPS, host `wa.me` e caminho do número configurado. Abrir o WhatsApp depende
de clique da pessoa.

## Dados preservados e limites atuais

O schema/RPC `inserir_lead_lp` vigente armazena origem, UTMs e consentimento.
A migration de 12/10 adicionou a coluna CNPJ e uma nova assinatura da RPC,
mas a LP publicada ainda usa a assinatura antiga. Portanto, o CNPJ informado
na LP ainda não é persistido até a publicação e ativação da integração nova.

### Integração do CNPJ, ainda não publicada na LP (12/10)

`supabase/leads_lp_cnpj_20261012.sql` foi aplicada somente no projeto V2G-SITE em 12/10, após autorização específica de Victor. A primeira tentativa falhou por um tipo `text` excedente na declaração de permissão e foi integralmente revertida. Corrigida a assinatura, a migration passou e consta no ledger como `20261013023519_leads_lp_cnpj_20261012`. A verificação confirmou coluna CNPJ nullable para preservar leads anteriores, constraint de formato, duas assinaturas da RPC (19 argumentos antiga e 20 nova), `SECURITY DEFINER`, `search_path` vazio e execução concedida apenas a `anon`. Nenhum lead teve CNPJ preenchido por esta migration. A LP local normaliza o CNPJ, mas só envia `p_cnpj` quando `LEADS_CNPJ_RPC_ENABLED=1`. A flag continua desligada; a LP publicada não foi alterada neste bloco.

Próxima ordem segura: publicar a LP nova ainda com a flag desligada; ligar a flag na Vercel e publicar novamente; enviar um único lead fictício e comprovar o CNPJ persistido. Depois de confirmar que não há instâncias antigas, avaliar separadamente `supabase/leads_lp_cnpj_finalizar_20261012.sql` para remover a assinatura antiga da RPC. O teste positivo anterior à migration continua sem CNPJ recuperável no registro; não preencher retroativamente por inferência.

O navegador bloqueia novo clique enquanto há um envio em andamento. A RPC
limita cinco envios por IP em uma hora. Não há deduplicação durável por e-mail
ou CNPJ; isso também exige mudança no banco/RPC e uma regra para tratar
tentativas legítimas.

## LP → WebApp hoje

### Acesso existente

| Caso | URL pública | Dados na URL |
|---|---|---|
| Pessoa que já tem conta | `https://v2g-deploy-webapp.vercel.app/entrar?modo=login` | Somente `modo=login` |
| Primeiro acesso após pagamento confirmado | `https://v2g-deploy-webapp.vercel.app/entrar?modo=cadastro` | Somente `modo=cadastro` |

Em desenvolvimento, as mesmas URLs usam `http://localhost:3000`. O arquivo
`assets/jornada.v6.js` escolhe a origem pelo hostname da LP e remove qualquer
dado pessoal que exista na query string de origem.

### Compra ainda indisponível para a LP

O WebApp local protege `/contratar` por
`checkoutSandboxSeguroNesteServidor()`. Fora do ambiente QA específico, a rota
retorna 404. Portanto, a LP não encaminha interesse para `/contratar` e não há
hoje uma URL pública de contratação para fornecer ao visitante.

O `modo=cadastro` do WebApp é para criar acesso **após** pagamento aprovado;
ele não deve substituir a etapa de contratação.

## Contrato que o WebApp precisa fornecer

Para concluir a passagem automática da LP para contratação sem expor dados
pessoais na URL, o WebApp precisa disponibilizar uma rota pública de entrada
que:

1. receba somente um identificador opaco de interesse ou um código de sessão
   de curta duração, nunca nome, e-mail, WhatsApp ou CNPJ na query string;
2. recupere no servidor o lead já aceito, incluindo origem, UTMs, consentimento
   e CNPJ persistido;
3. consulte e registre a situação cadastral ativa do CNPJ por uma fonte
   definida e auditável antes de criar o pedido;
4. tenha idempotência por interesse/CNPJ/e-mail e mostre um pedido existente
   sem abrir outro;
5. crie `commercial_orders` em estado anterior a pagamento e só libere o
   WebApp quando o provedor confirmar `payment_approved`;
6. trate falha de consulta, CNPJ inapto e pagamento pendente sem afirmar que
   houve compra ou acesso.

Há uma divergência a resolver no WebApp: `lib/contratacao/preco.ts` ainda
calcula 5% de desconto semestral à vista, enquanto a decisão de 06/10 registra
que não há desconto aprovado para seis meses antecipados. A LP não apresenta
esse desconto.

## Validação executada

- `node --check` nos arquivos JavaScript alterados: passou.
- `node scripts/conferir-contato.cjs`: passou com `fetch` substituído e sem
  rede; cobre CNPJ, consentimento, origem, honeypot, falhas e simulação.
- `node scripts/conferir-jornada.cjs`: passou sem rede; cobre preço anual,
  campos, âncoras, links sem PII, estado de interesse e prevenção de envio
  concorrente.
- Navegador em `http://localhost:5173` com `LEADS_SIMULAR=1`: CNPJ inválido
  foi bloqueado; envio com dados fictícios mostrou “Prévia local” e confirmou
  que nenhum contato foi salvo.

Esses testes não provam gravação real de lead, consulta ativa de CNPJ, criação
de pedido, cobrança, pagamento, login ou publicação em produção.
