# LP V2G mídia — direção aprovada e implementação local

## Aprovação desta rodada

Em 05/10/2026, Victor preferiu a prévia `docs/previa-v2g`: mais sóbria, com juventude nas cores. Autorizou aplicar essa direção à LP completa, seguindo a estrutura e o pré-cadastro atuais, com movimento e interações. Confirmou lançamento em **28/10/2026**. Mantido 00h de Brasília, horário do contador anterior.

## Produto e limites

- Atendimento individual e seleção de negócios por pré-cadastro. Sem contratação ou configuração self-service disponível hoje.
- Formulário, consentimento, campos condicionais, UTMs, antispam e endpoint existentes preservados.
- Sem preço, resultado comercial ou cliente fictício apresentado como fato. Valores nas demonstrações são ilustrativos; conversa não é venda.
- Conteúdo da LP: abertura, problema, proposta, operação, público, estágio atual e evolução, inscrição, dúvidas e contatos legais.
- Canais atuais conforme conteúdo anterior: Instagram e Facebook. Google em breve; ChatGPT Ads no radar.

## Direção visual

Modo: Persuade. Archivo, marinho #051225, cobalto #0B40DA, gelo #B0E9FD, lima #EAFF64 e superfícies claras #ECF5F2. Fotografia da prévia aprovada, marca pixelada, composição editorial aberta. `mídia` menor sob V2G.

## Movimento e interação

- Foco: narrativa da operação acompanhada pelo celular fixo na coluna no desktop; telas mudam conforme a etapa. Abas permitem exploração manual. No celular, as abas são manuais para não disputar com a leitura vertical.
- Continuidade: etapa em foco, linha de progresso de leitura e cabeçalho persistente.
- Feedback: controle de contas ilustrativas, perguntas expansíveis, campos condicionais, erros e confirmação de inscrição.
- Orçamento: sem bibliotecas, sem loops contínuos, trabalho de rolagem agrupado em requestAnimationFrame. Conteúdo visível por padrão; preferência de movimento reduzido acompanhada em tempo real.
- Foto convertida para WebP 1280×853, 105.248 bytes, a partir do PNG aprovado. Origem e prompt completos em `docs/previa-v2g/ASSETS.md`.

## Arquivos

`index.html`, `assets/lp.v5.css`, `assets/lp.v5.js`, `assets/lp-movimento.v5.js`, `assets/negocio-v5.webp`.

Backup do HTML anterior: `docs/antes-direcao-v5/index.html`, ainda aponta para os assets v4 preservados. A prévia curta original permanece em `docs/previa-v2g/`. Não houve alteração de políticas, backend, commit, push ou deploy nesta rodada.

## Verificação local desta rodada

- Inspeção visual da página inteira no desktop (1280 px) e das áreas principais no celular (390 px), com largura de conteúdo dentro da tela e todas as imagens carregadas.
- Formulário vazio: mensagens e foco no primeiro campo inválido. Preenchimento fictício com ramo Outro e investimento Sim: condicionais apareceram, validação limpou os erros e o envio simulado exibiu Recebemos com foco na confirmação.
- Servidor confirmado em `--simular`; não houve gravação real de lead. Persistência em produção não foi testada.
- Barra móvel oculta durante o formulário; destinos internos conferidos; perguntas expansíveis e três telas do celular funcionaram.
- Range pelo teclado: 24 contas no controle e 24 elementos ativos. Movimento reduzido emulado: classe de animação desativada e rolagem automática; preferência restaurada depois.
- Revisão estática independente: formulário idêntico ao backup, sem IDs duplicados ou âncoras ausentes. Console do navegador sem erros durante os testes.
- Detector Impeccable executado uma vez: sem achados em modo regex degradado. Não é uma auditoria automática completa de contraste/acessibilidade.
