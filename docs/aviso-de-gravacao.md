# Aviso de gravação — o que falar no início da entrevista

Documento de **operação**, não de código. É para quem da V2G conduz a
reunião de onboarding.

O aviso não é formalidade: é a base legal da transcrição. Sem ele, o texto
que sai da reunião foi coletado sem a pessoa saber, e nenhum ajuste de
política conserta isso depois.

---

## O texto

Falar **antes de qualquer pergunta sobre o negócio**, com a transcrição já
ligada — assim o próprio aviso fica registrado.

> "Antes de começar: essa conversa vai ser transcrita automaticamente. É
> texto, não áudio — a gravação não fica guardada, só o que a gente
> escrever aqui.
>
> Serve para eu não ter que ficar anotando enquanto você fala, e para
> montar o perfil do seu negócio direito. Você vai revisar esse perfil
> depois e corrigir o que estiver errado.
>
> Fica guardado enquanto você for cliente, e você pode pedir para apagar
> quando quiser — inclusive sem cancelar nada.
>
> Tudo bem para você?"

**Esperar a resposta.** Não seguir sem ela.

## Se a pessoa disser não

> "Sem problema. Então eu vou anotando à mão e a gente segue igual — só vai
> demorar um pouquinho mais em alguns pontos."

Desligar a transcrição, e registrar no formulário que a entrevista foi
sem transcrição. **Não insistir.** Alguém que se sente pressionado a
aceitar não consentiu.

## Se entrar mais alguém no meio da reunião

Repetir o aviso para quem chegou, em uma frase:

> "Ó, só avisando que a conversa está sendo transcrita — texto, não áudio.
> Tudo bem?"

## Se for falar de foto de funcionário

Quando a conversa chegar em imagem de pessoa que não é o cliente:

> "Se você quiser usar foto de alguém da equipe no anúncio, precisa que
> essa pessoa saiba e concorde. A gente registra que você confirmou isso.
> E se ela mudar de ideia depois, ela pode falar direto com a gente que a
> foto sai."

---

## O que registrar depois da reunião

| Campo | Onde |
|---|---|
| data e hora | `entrevistas.realizada_em` |
| quem conduziu | `entrevistas.conduzida_por` |
| o texto | `entrevistas.transcricao` |
| números anotados à mão | `entrevistas.anotacoes_numeros` |

O aceite do aviso fica **dentro da própria transcrição**, porque o aviso
foi dado com ela ligada. É por isso que a ordem importa: ligar, avisar,
esperar o sim, começar.

---

## Três coisas que não fazer

**Não avisar depois de começar.** Se a pergunta sobre faturamento já foi
feita, o aviso virou aviso sobre o que já aconteceu.

**Não tratar o "tudo bem" como assinatura.** Se a pessoa hesitar, oferecer
a alternativa sem transcrição antes de seguir.

**Não guardar o áudio "por segurança".** A ferramenta pode oferecer isso.
A política diz que não guardamos, e voz tem leitura de dado biométrico —
o que traria um regime bem mais pesado que o do texto.
