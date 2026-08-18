# O que eu assumi ao escrever os textos legais

**Isto é rascunho e precisa de revisão de advogado antes de ir ao ar.**
Não sou advogado, e as decisões abaixo são de redação e de produto — não
de direito. Cada uma pode estar errada de um jeito que só quem é da área
percebe.

Referente às mudanças em `privacidade.html` e `exclusao-de-dados.html`.

---

## Premissas que precisam de confirmação jurídica

**1. Base legal da transcrição é execução de contrato, não consentimento.**
Assumi que transcrever a reunião de onboarding é parte de entregar o
serviço contratado, como já são a classificação de nicho e a geração de
copy. A alternativa seria consentimento — mais seguro, porém revogável a
qualquer momento, e revogar deixaria o perfil sem origem. **Se o advogado
preferir consentimento, o texto muda e o fluxo também:** passa a exigir
aceite formal, não o "tudo bem" verbal.

**2. Aviso verbal com transcrição ligada é registro suficiente do aceite.**
Assumi que dar o aviso com a transcrição já rodando, e o "tudo bem" ficar
dentro do texto, prova o consentimento. Pode não bastar — pode ser exigido
aceite escrito antes da chamada.

**3. O cliente pode declarar que tem autorização de terceiro.**
Este é o ponto mais frágil de todos. Escrevi que, ao enviar a foto de um
funcionário, o cliente **declara** ter a autorização dele, e que a V2G
confia nessa declaração. Isso transfere a responsabilidade — mas
transferir por cláusula nem sempre funciona, e a V2G continua sendo
**controladora** desse dado enquanto ele estiver nos nossos servidores.
Se o advogado disser que não transfere, o desenho muda: seria preciso
coletar o consentimento da pessoa retratada diretamente, o que é um fluxo
que não existe.

**4. Prazo de 15 dias para remover foto a pedido do retratado.**
Inventei esse número por analogia com os 30 dias da exclusão de conta, pela
metade, por ser um pedido mais simples. Está marcado como
`legal-placeholder` nas duas páginas. A LGPD fala em "prazo razoável" para
vários casos e em 15 dias para outros — não sei qual se aplica.

**5. Transcrição sai em 30 dias e não fica os 5 anos fiscais.**
Assumi que transcrição não é documento fiscal nem registro exigido por lei.
Parece óbvio, mas se ela contiver combinação comercial — preço acordado,
escopo — alguém pode argumentar que é prova contratual.

**6. Atender o retratado sem consultar o cliente contratante.**
Escrevi que removemos a foto a pedido da pessoa retratada mesmo que o
contratante discorde, e que apenas o avisamos depois. Acho que é o certo,
mas cria conflito com quem paga, e vale confirmar se há dever de
notificação prévia.

**7. "Não guardamos áudio" depende da ferramenta.**
O texto promete que áudio e vídeo não são retidos. **Isso é promessa sobre
o comportamento do Google Meet, não sobre o nosso código.** Se a gravação
ficar no Drive de quem conduziu, mesmo por engano, a política está mentindo.
Precisa de uma configuração verificada, não de confiança — e ninguém
verificou ainda.

---

## O que eu deliberadamente não fiz

**Não mexi na seção 5 (compartilhamento).** A transcrição passa pela
ferramenta de reunião, que é um terceiro — provavelmente Google. Ele
deveria estar listado como operador, junto com Meta e Supabase. Não
escrevi porque não sei qual ferramenta será usada de fato.

**Não mexi na seção 6 (transferência internacional).** Mesma razão: se a
transcrição é gerada por servidor fora do Brasil, isso entra ali.

**Não criei formulário de pedido de remoção pelo retratado.** O texto manda
escrever para o e-mail. Um formulário seria melhor, mas é tela, e telas
não estão neste lote.

**Não datei as páginas.** As duas dizem "Última atualização: 31 de julho de
2026". Deixei como está de propósito: mudar a data anuncia que o conteúdo
mudou, e o conteúdo ainda não foi revisado por advogado. **Atualizar a data
faz parte de publicar, não de escrever.**

---

## Antes da primeira entrevista real

1. Advogado revisa os dois HTML e este documento
2. Confirmar qual ferramenta de reunião, e configurá-la para não reter mídia
3. Verificar que a gravação não fica no Drive de ninguém
4. Fechar o prazo dos 15 dias e tirar os dois `legal-placeholder`
5. Atualizar a data das duas páginas e publicar
6. Só então marcar a entrevista
