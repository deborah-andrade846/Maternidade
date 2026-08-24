# 🧸 Nosso bebê — gestação e enxoval

App de **arquivo único** para acompanhar a gestação semana a semana e organizar tudo o que
vem junto: enxoval, bolsa da maternidade, consultas, orçamento, nomes e plano de parto.
Abre com dois cliques, funciona **offline**, sem cadastro e sem servidor — os dados ficam
só no `localStorage` do próprio aparelho.

Implementação do design **`Enxoval App.dc.html`** (Claude Design), sobre o design system
**Broadsheet**, seguindo o padrão de construção de [`ARQUITETURA.md`](ARQUITETURA.md).

---

## Como usar

Abra o `index.html` no navegador.

Servindo por `http`/`https` (por exemplo `npx http-server`), instala como PWA: vira ícone na
tela inicial e continua funcionando sem internet.

No celular o app ocupa a tela inteira; no desktop aparece na moldura de 390×844 do design.

---

## As telas

### 🏠 Início
Semana e trimestre, contagem regressiva para a data prevista, barra de progresso da gestação
e o texto do desenvolvimento daquela semana. Abaixo, três atalhos vivos: itens do enxoval já
em casa, próxima consulta e quanto já foi gasto.

### 🍼 Enxoval
Os itens agrupados por categoria (Roupinhas, Higiene, Sono, Passeio, Amamentação), cada um
com tamanho, loja, preço e a contagem `tem/quer`. Toque para abrir o item: ali você ajusta a
quantidade no `−` / `+`, edita todos os campos ou apaga. O botão **+ Adicionar item** cria
itens novos em qualquer categoria.

### 💗 Gravidez
Semana a semana, do grão de gergelim ao morfológico. A semana atual aparece destacada em
ciano; as que já passaram, em cinza.

### 🩺 Saúde
Agenda de consultas, exames e vacinas. Toque no texto para editar, no círculo para marcar
como feita.

### ⋯ Mais
- **Orçamento** — total gasto, gasto por categoria e quanto ainda falta comprar
- **Bolsa da maternidade** — checklist separado por “Você”, “Bebê” e “Volta pra casa”, com
  campo para acrescentar o que faltar
- **Nomes** — lista de favoritos, com significado, marcados no coração
- **Plano de parto** — via de parto, alívio da dor, acompanhante, pós-nascimento e ambiente

### Sua gestação
Toque em **sem N/40**, no topo, para informar a data prevista do parto e o orçamento
planejado. É daí que saem a semana, a contagem regressiva, o texto da home e a barra do
orçamento.

---

## Design system — Broadsheet

Tudo vem dos tokens de `styles.css` do projeto de design: Source Serif 4 em todo o app,
fundo papel `#f3f2f2`, texto `#201e1d`, ciano `#0088b0` para o que é interativo e magenta
`#d6006c` como segunda cor de destaque, raios de 1–4 px e hierarquia feita por escala
tipográfica e espaço em branco — sem caixas nem linhas divisórias.

O app não usa CDN nem arquivo externo nenhum: a fonte **Source Serif 4** (OFL) está embutida
como `woff2` em base64, os ícones **Phosphor duotone** (MIT) como sprite SVG e as ilustrações
do ursinho como WebP em base64 — tudo dentro do `index.html`. Você pode mandar só esse arquivo
por WhatsApp ou e-mail que ele abre inteiro, com as imagens.

---

## Arquivos

```
index.html              ← o app inteiro (CSS + HTML + JS, fonte, ícones e ilustrações embutidos)
manifest.webmanifest    ← nome, ícones, cores, display standalone
sw.js                   ← service worker (cache offline)
icon-*.png              ← ícones do PWA, comuns e maskable
ARQUITETURA.md          ← o padrão de construção seguido aqui
```

> Ao alterar qualquer arquivo, incremente a versão do cache em `sw.js`
> (`const CACHE = "nosso-bebe-v4"`), senão quem já usa o app fica preso na versão antiga.

## Nota

O app organiza a gestação e as compras — ele **não dá orientação médica**. Os textos de
semana a semana são informativos; dúvidas sobre a gravidez, o parto ou o bebê são com a
obstetra e o pediatra.
