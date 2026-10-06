# Refinamento da LP — 05/10/2026

## Três alternativas de hero

1. **Seu investimento em anúncios. Acompanhado de perto.**
   Aplicada nesta rodada. Liga o cuidado com a verba à presença da equipe, que é o modo de atendimento atual. Apoio: “A V2G organiza a operação com você. Da oferta às conversas recebidas, clareza sobre a verba e o próximo passo.”
2. **Seus anúncios rodando. Você entendendo cada passo.**
   Mais próxima da assinatura existente. Prioriza compreensão da operação. Apoio: “Oferta, campanha e acompanhamento com a equipe por perto. Você sabe o que está acontecendo e participa da próxima decisão.”
3. **Sua verba merece contexto. Cada decisão também.**
   Mais centrada no investimento e na leitura dos indicadores. Apoio: “Quanto foi aplicado, quantas conversas chegaram e o que discutir a seguir. A V2G organiza seus anúncios e acompanha esses números com você.”

São propostas de posicionamento, sem promessa de retorno, vendas ou automação total.

## Tese de movimento

- Foco: o contexto do negócio percorre oferta, criativo, publicação, conversas e próxima decisão. A sequência constrói uma explicação e para.
- Continuidade: títulos revelados por linha ao entrar na tela; fluxo de artefatos conectado; moldura do celular com dimensão fixa por tamanho de tela. Apenas o conteúdo do aparelho muda.
- Controle: as abas do celular entram em modo manual; “Acompanhar etapas” permite voltar à narrativa no desktop. No celular a troca é manual.
- Feedback: WhatsApp discreto, perguntas nativas e formulário original. Pré-cadastro continua sendo a ação principal.
- Orçamento: sem bibliotecas novas nem loops. Observadores de visibilidade e animações curtas; sequências pausam fora de vista, movimento reduzido mostra o caminho completo. Texto visível por padrão se o JavaScript falhar.

## Escopo preservado

Paleta, Archivo, fotografia, composição da hero, data 28/10/2026, contas do cliente, estágio atual, canais, formulário, endpoint, consentimento, UTMs e sucesso. Nenhum commit, push ou deploy nesta rodada. A skill Impeccable orientou continuidade, hierarquia e movimento acessível dentro da direção aprovada.

## Verificação local

- Conferência visual em desktop 1440 × 1000, notebook 1280 × 720 e mobile 390 × 844. Sem transbordamento horizontal observado.
- As três telas mantêm a mesma moldura: 294 × 536 no desktop, 294 × 500 no notebook e 278 × 536 no mobile. Em alturas menores, o conteúdo interno permite rolagem.
- No mobile, as abas continuam manuais; WhatsApp fica acima da barra de pré-cadastro. O contato flutuante desaparece com formulário ou rodapé visíveis.
- Preferência de movimento reduzido respeitada: títulos legíveis, sequências completas e sem animação. Sem JavaScript, os oito títulos, o formulário e as três telas do aparelho continuam disponíveis; telas percorrem um viewport rolável e abas inativas ficam ocultas.
- Formulário comparado integralmente à versão anterior desta rodada, sem diferenças. O arquivo responsável por validação, envio, UTMs, consentimento, contador e sucesso manteve o mesmo SHA-256.
- Campos vazios exibiram os dez avisos esperados. Envio com dados fictícios em servidor `--simular` exibiu “Recebemos.”. Isso verifica o fluxo local, sem comprovar persistência em produção.
- Sintaxe do JavaScript e `git diff --check`: código de saída 0. Nenhum erro no console observado na sessão de revisão.
