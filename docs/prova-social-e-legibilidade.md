# A LP: o que está no ar, medido em 21/08/2026

**Medição contra `https://www.v2gmidia.com.br/`, com o navegador em
375×812 (celular), e contra o banco de produção.** Não é desenho: é o
registro do que a página entrega hoje ao visitante.

A tarefa da noite era o visual da LP. Ela virou outra coisa no primeiro
levantamento, e o motivo está no §1.

---

## 1. O achado que muda a ordem das prioridades

A LP tem **duas provas sociais inventadas no ar**, e só uma delas se
anuncia.

### 1.1 A que se anuncia — a seção 8

```html
<b class="is-placeholder">[X]</b><span>empresas usando a V2G</span>
<p class="is-placeholder">[DEPOIMENTO CLIENTE 1 — foco em "agora eu entendo o que tá acontecendo"]</p>
<span class="who is-placeholder">— [Nome], [tipo de negócio], [cidade]</span>
```

**Isso está servido em produção agora.** Conferido por `curl` no domínio
público: 3 ocorrências de `[X]`, 3 de `DEPOIMENTO CLIENTE`, 9 elementos com
a classe `is-placeholder`. Um visitante que rolar até a metade da página de
vendas lê, em itálico cinza, a instrução interna de qual depoimento colocar
ali.

### 1.2 A que NÃO se anuncia — o cartão do herói

O primeiro elemento visual da página, ao lado do título, é este:

| o que o cartão diz | |
|---|---|
| **Doceria da Marina** | "Terça, 8h41 · plano ativo" |
| **"Pra cada R$ 1 que você colocou, voltaram R$ 3,40"** | |
| 14 | vendas na semana |
| R$ 620 | investido |
| ✓ | "Meta da semana batida" |

Não há nenhuma marca de exemplo, simulação ou ilustração — nem no texto,
nem no `alt`, nem em atributo nenhum. Ele é desenhado como uma captura de
tela do produto rodando para uma cliente real, com um retorno de 3,4× e um
nome próprio.

**E não existe cliente.** Medido no banco de produção, na mesma hora:

| tabela | linhas |
|---|---|
| `businesses` | 4 — "V2G", dois "Meu negócio" e "Padaria Dona Zilda (FICTICIO)" |
| `campaigns` | **0** |
| `metrics_daily` | **0** |

Zero campanhas já existiram; zero dias de métrica foram registrados.
Nenhum número de retorno como o do cartão pode ter saído de lugar nenhum,
porque nenhuma campanha da V2G foi ao ar.

### 1.3 Por que a segunda é pior que a primeira

O `[PLACEHOLDER]` é feio e é **visivelmente inacabado** — quem lê entende
que falta coisa. O cartão do herói é bonito e **afirma**. Um visitante não
tem como distinguir aquilo de um print de cliente.

E o público é exatamente o que o `README` do projeto descreve como já
tendo sido enganado antes ("isca grátis + cobrança é o golpe que esse
público já sofreu"). A regra de marca do projeto diz *"celebração ruidosa
só depois de conquista real"*. O cartão é uma conquista real de ninguém.

---

## 2. O que eu fiz, e o que deixei para você

### 2.1 Removi a seção 8 (a que se anuncia)

Não há leitura em que `[DEPOIMENTO CLIENTE 1 — foco em ...]` seja aceitável
numa página de vendas no ar. E não existe conserto pela metade: **nenhum
redesenho arruma uma seção que promete depoimento e não tem.** As três
opções eram inventar depoimento (fora de questão), deixar como está
(pior), ou tirar.

A seção sai inteira — as três estatísticas e os três depoimentos. O funil
não fica com buraco de argumento: o trabalho de confiança que ela faria
já está feito, e melhor, pelos **três "nãos" honestos** e pela **garantia
de 7 dias**, que vêm logo depois e são verdadeiros.

**Quando houver cliente, ela volta** — e volta com número medido, não com
número redondo. O lugar dela na ordem (depois do preço, antes dos "nãos")
continua sendo o certo.

### 2.2 NÃO mexi no cartão do herói, e isso é decisão

Ele é o elemento visual principal da página. Tirá-lo às cegas — sem
conseguir ver o resultado, ver §4 — deixaria um buraco no primeiro terço
da tela, e trocar o texto dele é escrever afirmação comercial nova, que
não é minha para escrever.

**As três saídas, em ordem do que custa menos:**

1. **Marcar como exemplo.** Uma etiqueta "Exemplo" no cartão e uma linha
   de legenda dizendo que é uma simulação. Layout intacto, uma linha de
   HTML, e a afirmação deixa de ser falsa. É a que eu recomendaria.
2. **Trocar por algo que é verdade hoje.** O mesmo desenho de cartão
   mostrando a tela real do produto (a cadeia do "o que falta"), que
   existe e não promete resultado nenhum.
3. **Tirar** e refazer o herói só com a promessa e o CTA.

Enquanto nenhuma das três acontecer, a página afirma um resultado que
nunca existiu. **Isso é o item mais urgente desta lista, e é o único que
depende de você.**

---

## 3. O visual: o que estava medido e errado

Com o navegador em 375×812, na página no ar:

| medida | achado |
|---|---|
| falhas de contraste (WCAG AA) | **22** |
| texto abaixo de 12px | **16 elementos**, o menor com 9,5px |
| alvos de toque abaixo de 44px | **10 de 21 links** — a navegação tem 17px de altura |
| tamanhos de fonte distintos | **22** numa página só |
| altura da página no celular | 10.124px |

### 3.1 As 22 falhas de contraste são um token só

Todas vêm de `--ink-mute` (`#7A8B9B`), sobre os três fundos claros:

| sobre | razão | mínimo |
|---|---|---|
| branco | 3,50:1 | 4,5:1 |
| off-white | 3,11:1 | 4,5:1 |
| azul-gelo claro | 3,07:1 | 4,5:1 |

E uma pior que as outras: a seta `→` em cobalto sobre navy, **2,51:1**.

**A paleta não muda** — a regra da noite é explícita. O que muda é qual
token cada elemento usa: `--ink-soft` (`#4A5C6E`), que já está no `:root`,
dá 6,89:1 no branco, 6,12:1 no off-white e 6,05:1 no gelo. Trocar o uso
não é trocar a paleta.

### 3.2 Texto de 9,5px numa página feita para dono de padaria de 45 anos

O brief é "tipografia grande, contraste alto, nada que exija olho
treinado". A página tem 16 elementos abaixo de 12px, e os menores são os
rótulos do comparativo de preço — justamente o argumento de venda.

Piso de 12px nos elementos de conteúdo. Não é generoso; é o mínimo.

### 3.3 A navegação e o rodapé não dão para acertar com o dedo

17px de altura. O piso do iOS é 44px, e o próprio app já aplica essa régua
(`docs/padrao-visual` do webapp fala em 44px como piso, e a `.topbar-help`
foi dimensionada por causa disso). A LP não recebeu a mesma régua.

**Isto toca a chrome que as páginas legais também usam** — cabeçalho e
rodapé são compartilhados. Nenhum texto legal foi alterado; o que muda é a
área de toque de um link. Está dito aqui porque a instrução da noite é não
mexer nas páginas legais, e isto encosta nelas.

---

## 4. O que eu NÃO consegui verificar, e por que importa

**Não consegui ver a página renderizada.** O painel do navegador não
compõe quadros nesta sessão, então `screenshot` falha. Tudo acima foi
medido por JavaScript na página viva — tamanhos, cores, retângulos,
contraste calculado — e nada foi visto.

Isso muda o que é responsável fazer. Contraste, tamanho de fonte e área de
toque são **números**: dá para consertar e reconferir pelo mesmo caminho
que os mediu, e foi o que fiz. Hierarquia, ritmo e proporção são
**julgamento visual**: mudar 22 tamanhos de fonte para um sistema de seis
degraus, sem olhar o resultado, é o tipo de coisa que sai pior e ninguém
percebe até o cliente ver.

Por isso a consolidação da escala **não foi feita** — está medida no §5 e
fica para quem puder abrir a página.

---

## 5. Registrado e não feito: a LP não tem sistema tipográfico

Medido: **22 tamanhos de fonte distintos** em uso (9,5 / 10 / 11 / 12 /
12,5 / 13 / 13,5 / 14 / 14,5 / 15 / 16 / 16,5 / 17 / 17,5 / 19 / 20 / 21 /
22 / 24 / 27 / 28 / 34 px), e **zero tokens de tamanho no `:root`** — só
cores e as duas famílias. Todos os 22 estão escritos à mão no CSS.

O app tem seis degraus (11 / 13 / 15 / 18 / 22 / 26), com nome e regra em
`DESIGN.md`.

**E o encaixe não é direto**, que é o ponto: a âncora de corpo do app é
13px, e a da LP está entre 14,5 e 16,5. Adotar a escala do app como está
**encolheria** a LP — o contrário do que o leitor de 45 anos no celular
precisa. Então "a LP passa a usar os seis degraus do app" não é uma
importação, é um redesenho da escala, e redesenho de escala sem ver a tela
é chute.

O que fica proposto, para quem puder olhar:

> Seis degraus na LP com os **mesmos nomes** do app (`--fs-legenda`,
> `--fs-corpo`, `--fs-titulo`, `--fs-bloco`, `--fs-tela`, `--fs-destaque`)
> e valores próprios, um degrau acima dos do app, porque a LP é lida por
> quem ainda não é cliente, no celular, com o polegar. Mesmo sistema,
> mesma nomenclatura, escalas diferentes — e isso escrito num lugar só,
> senão vira o que a instrução da noite teme: duas marcas.

### 5.1 Um detalhe que ninguém tinha notado

`--body` é `'Segoe UI', system-ui, -apple-system, Roboto, sans-serif` — e
**Segoe UI não existe fora do Windows.** Medido na página viva: 295
elementos renderizam na família de corpo e 144 em Archivo. Ou seja, o texto
corrido da LP **não é a fonte da marca**, e muda de desenho conforme o
aparelho: Segoe no Windows, Roboto no Android, San Francisco no iPhone.

O dono de padaria no celular nunca vê a tipografia que foi escolhida para
ele. Não mexi: trocar `--body` para Archivo muda o desenho de 295
elementos de uma vez, e é a mesma armadilha do §4 — mudança grande demais
para fazer sem ver.

---

## 6. A medição de depois — 21/08/2026

Mesmo instrumento, mesmo viewport (375×812), agora contra o arquivo local
servido em `localhost:4180`:

| medida | antes (no ar) | depois |
|---|---|---|
| falhas de contraste AA | **22** | **0** |
| texto abaixo de 12px | **16** | **0** |
| alvos de toque abaixo de 44px | **10 de 21** | **0** |
| `[PLACEHOLDER]` visíveis | **9** | **0** |
| tamanhos de fonte distintos | 22 | 18 |
| altura no celular | 10.124px | 9.349px |

A linha dos tamanhos distintos é a que **não** foi resolvida, e está no §5.
18 não é um sistema; é 22 com quatro a menos por efeito colateral de outros
consertos.

### O que cada conserto foi, exatamente

- **Contraste**: nenhuma cor da paleta mudou. O que mudou foi qual token
  cada elemento usa — sete lugares trocaram `--ink-mute` por `--ink-soft`,
  os dois já existentes no `:root`.
- **Uma das 22 falhas era uma regra inerte**, e vale registrar porque é o
  mesmo padrão que o webapp catalogou em `docs/regra-inerte.md`:

  ```css
  .hero .cta-sub-link, .final-cta .cta-sub-link, .isca .cta-sub-link { color: var(--ice); }
  .section .cta-sub-link { color: var(--cobalt); }
  ```

  `.isca` e `.final-cta` são `<div>` **dentro** de `<section class="section">`.
  Os dois seletores casam o mesmo link, os dois têm especificidade (0,2,0),
  e vencia o de baixo — cobalto sobre navy, **2,51:1**. A regra do fundo
  escuro estava escrita, correta e sem efeito. Consertada dando a ela a
  especificidade que a intenção pedia, não invertendo a ordem: ordem é o
  que quebra de novo no próximo lote.

- **Tamanho**: piso de 12px. Subiram o rótulo do comparativo de preço (10px
  → 12px, e é o argumento de venda da página), os rótulos do cartão do herói
  (9,5px → 12px) e a linha "Tráfego no piloto" da marca (9,5px → 12px).
- **Toque**: `min-height: 44px` nos links secundários de CTA e nos do
  rodapé, sem mexer no tamanho da letra.

### O que encostou nas páginas legais

O rodapé é compartilhado pelas quatro páginas. O que mudou nele: área de
toque dos links e a opacidade do texto (0,66 → 0,78). **Nenhum texto legal
foi alterado, e nenhum dos três arquivos `.html` legais foi aberto para
edição.** Conferido depois: `privacidade.html` renderiza, sem rolagem
horizontal, com os 16 cabeçalhos e o rodapé no lugar.

### O que continua sem ser visto

Nada disto foi olhado. São números medidos por JavaScript na página, antes
e depois, pelo mesmo caminho — o que prova contraste, corpo de texto e área
de toque, e **não** prova que a página ficou bonita. A primeira coisa a
fazer de manhã é abrir `localhost:4180` no celular e olhar.

---

## 7. A tarja de exemplo, e uma correção do que eu reportei — 22/08/2026

### 7.1 O cartão do herói passou a dizer que é exemplo

Decisão do Victor: **opção 1 do §2.2** — sem inventar número novo e sem
tirar o cartão. Ele mostra como a tela fica, e isso é legítimo; o que não
era legítimo é ele afirmar sem nada por perto dizendo que é simulação.

O que entrou, como primeiro filho do cartão:

> **EXEMPLO**  Tela de demonstração — não é resultado de cliente.

Quatro decisões de execução, e o motivo de cada uma:

- **Primeiro filho, não rodapé do cartão.** Quem lê de cima para baixo
  encontra a palavra **antes** do número. Aviso depois do dado chega tarde.
- **Faixa sangrada até a borda**, em navy sólido — lê como chrome do cartão
  falando, não como mais um dado dentro da tela simulada. Conferido:
  `offsetWidth` da tarja = 319 = `offsetWidth` do cartão, `offsetTop` 0. O
  controle (`.pf-top`, que não deve sangrar) mede 279 em offset 20, então a
  medida distingue os dois casos.
- **14px na frase e 15px na palavra** — o corpo do cartão é 13,5px e o
  número que ela qualifica é 20px. A instrução era palavra visível, não
  letra miúda, e aviso menor que o dado que ele qualifica é a forma educada
  de esconder.
- **Azul-gelo na palavra, não lima.** Lima é a cor de celebração e ganho
  neste sistema, e não há ganho nenhum a celebrar. Gelo é o bloco de
  confiança.

Medido: contraste de **13,2:1** na palavra e **15,5:1** na frase, visível
sem rolar, em 375px e em 1280px, sem rolagem horizontal em nenhum dos dois.

### 7.2 CORREÇÃO — o "22 → 0" do §6 estava errado por instrumento

O §6 diz "falhas de contraste AA: 22 → 0". **Não era 0, era 1.**

A varredura de ontem pulava elemento que tem filho (`el.children.length > 0`),
para não contar o texto do pai duas vezes. O efeito colateral é que ela não
via nenhum elemento que mistura texto com outra tag dentro. Refeita hoje
percorrendo **nós de texto** em vez de elementos, ela achou dois casos que
tinham escapado:

| o que escapou | por quê |
|---|---|
| `.cmp-row.total .cmp-mkt` — "R$ 1.800 a R$ 3.800", 17px, `--crit` sobre off-white, **4,28:1** | contraste reprovado por pouco, e é a linha de TOTAL do comparativo de preço |
| `.pf-tag` — "Meta da semana batida", **11,5px** | abaixo do piso de 12px; tem um `<svg>` dentro |

Os dois consertados agora:

- O total do comparativo foi de 17px para **19px**. A partir de 18,66px em
  negrito o piso da WCAG cai para 3:1, e 4,28 passa com folga. Consertado
  por **tamanho e não por cor** porque a paleta não muda e `--crit` é o que
  dá o sentido de "este é o caro". O número da V2G continua maior (20px) —
  a hierarquia não inverte.
- `.pf-tag` foi para 12px, o mesmo piso do resto.

**Estado real agora, com o instrumento corrigido**, em 375px e 1280px:

```
167 elementos com texto
  0 falhas de contraste AA
  0 textos abaixo de 12px
  0 alvos de toque abaixo de 44px
  0 placeholders
```

A lição não é o número: é que **um instrumento com ponto cego reporta zero
com a mesma cara com que reporta zero de verdade.** O `el.children.length > 0`
existia por um motivo bom (não contar duas vezes) e custou dois achados.
Quem for medir contraste nesta página de novo: percorra nós de texto.

### 7.3 O que continua igual

O cartão continua com os mesmos números, o mesmo nome e o mesmo desenho —
nada foi inventado nem removido. As páginas legais seguem intocadas:
conferido depois que `privacidade.html` renderiza com os 16 cabeçalhos, o
rodapé no lugar, sem cartão, sem tarja e sem rolagem horizontal.
