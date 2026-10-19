# Auditoria pública da LP — 19/10/2026

Fonte: [Deco Score público](https://studio.decocms.com/report/v2gmidia.com.br?share_id=v2gmidia.com.br%3Areport%3Ae1a34732&utm_source=share&utm_medium=report&utm_campaign=report), varredura de 19/10/2026. O relatório mediu 100 de 392 verificações: 15 reprovações, 85 aprovações e 35 não medidas. O escopo foi público e não usou credenciais.

Este documento distingue o relatório, as verificações desta revisão e as alterações **locais**. Nenhuma alteração desta revisão foi publicada.

| Achado Deco | Estado nesta revisão | Evidência e limite |
| --- | --- | --- |
| Nome acessível dos logos | Corrigido localmente | Removidos rótulos extras da home; o texto visível passa a nomear os links. |
| Conteúdo fora de landmarks | Corrigido localmente | Atalhos fixos agrupados em navegação nomeada. |
| Regras explícitas para robôs de IA | Corrigido localmente | `robots.txt` separa busca/consulta de treino, conforme escolha do Victor. |
| Cadeia de redirecionamentos | Não corrigida no código | HTTP no domínio raiz passa por HTTPS raiz e depois HTTPS `www`; medido com `curl -I -L`. A [Vercel informa](https://community.vercel.com/t/redirects-from-http-www-to-non-www-on-https/8374/6) que força HTTPS antes de aplicar o redirecionamento de domínio. `www` é a configuração [recomendada pela Vercel](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting). |
| JSON-LD Schema.org | Corrigido localmente | `Organization` com nome, razão social, URL, logo e Instagram já presentes na LP; JSON válido. |
| HSTS com subdomínios e preload | Pendente de revisão de todos os subdomínios | Produção já envia `max-age=63072000`. `api.v2gmidia.com.br` respondeu em HTTPS com 401, porém isso não valida todos os subdomínios nem serviços futuros. Incluir subdomínios/preload sem revisão pode bloquear acesso. |
| CSP | Corrigido localmente | Política de mesma origem e sem `unsafe-inline`; estilo embutido da página 404 foi extraído. Testado na prévia local, sem prova em produção. |
| SPF/DKIM/DMARC | Pendente de DNS | O relatório encontrou SPF e DKIM, mas não DMARC; consulta pública a `_dmarc.v2gmidia.com.br` também não retornou TXT nesta revisão. |
| Contraste AAA | Corrigido na amostra local | 76 violações na primeira execução local do axe-core; zero após ajuste dos textos. O relatório encontrou 68 na produção. Varia com viewport e momento da animação. |
| `security.txt` | Corrigido localmente | Arquivo em `/.well-known/security.txt`, com contato de e-mail já publicado no site e validade até 19/04/2027. Entrega do e-mail não verificada. |
| Referrer-Policy | Corrigido localmente | `strict-origin-when-cross-origin`. |
| Speed Index | Pendente de comprovação | Relatório: 4,7 s. Lighthouse móvel independente nesta revisão: 3,7 s na produção, 1,5 s local; ambientes diferentes, sem comparação causal. |
| Permissions-Policy | Corrigido localmente | Câmera, microfone, geolocalização, pagamento e USB bloqueados na LP. |
| Isolamento cross-origin | Corrigido localmente em COOP | `Cross-Origin-Opener-Policy: same-origin`; COEP/CORP não foram impostos sem verificar dependências externas. |
| Coerência da política de robôs de IA | Corrigido localmente com ressalva | Busca e consulta permitidas; GPTBot, ClaudeBot e Google-Extended bloqueados. Google-Extended também controla grounding no Gemini, embora não afete Google Search. |

## Verificação local

- `node scripts/conferir-jornada.cjs`: passou; âncoras, assets, oferta, formulário, links e estados.
- `node scripts/conferir-contato.cjs`: passou em modo simulado; nenhuma gravação externa.
- `git diff --check`: passou.
- Lighthouse móvel da prévia local: acessibilidade 1,00 e boas práticas 1,00 após as correções.
- axe-core 4.10.3: zero violações automáticas na home local após aguardar a entrada da hero; contraste AAA zero na amostra local.
- Navegador local: home carregou com CSP, e `security.txt` retornou 200 em `text/plain`. Teste visual pontual no desktop.

## Próximas provas

1. Publicar somente após revisão da diferença de código. Repetir verificação de cabeçalhos, `robots.txt`, `security.txt`, dados estruturados, formulário e acessibilidade no domínio real.
2. Conferir a topologia de subdomínios antes de decidir sobre HSTS ampliado.
3. Configurar DMARC no provedor de DNS/e-mail após conferir o domínio e o destino de relatórios.
4. Revisar no painel da Vercel se a cadeia de redirecionamentos aceita alguma otimização; não trocar o domínio canônico só para aumentar uma nota.
5. Repetir medições móveis de desempenho no domínio publicado para separar variância de regressão real.
