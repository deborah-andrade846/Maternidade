# 🧸 Nosso bebê — gestação e enxoval

App de **arquivo único** para acompanhar a gestação semana a semana e organizar tudo o que
vem junto: um enxoval de 75 itens com quantidade recomendada, kits e rotinas, mala da
maternidade, lista de compras, chá de bebê, consultas, orçamento, nomes e plano de parto.
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
Catálogo de **75 itens em 8 categorias** — Roupinhas, Fraldas, Higiene & Banho, Quarto & Sono,
Alimentação, Passeio, Saúde e Mamãe. Cada um traz quantidade recomendada, tamanho, loja, preço,
prioridade e uma dica prática. Tem busca, filtro por categoria e por situação (falta / já tenho /
desejos), e dá para ocultar o que não faz sentido para você. Toque no item para ajustar a
quantidade no `−` / `+`, marcar como desejo, editar todos os campos ou apagar. O botão
**+ Adicionar item** cria itens seus em qualquer categoria.

### 💗 Gravidez
Semana a semana, do grão de gergelim ao morfológico. A semana atual aparece destacada em
ciano; as que já passaram, em cinza.

### 🩺 Saúde
Agenda de consultas, exames e vacinas. Toque no texto para editar, no círculo para marcar
como feita.

Abaixo, o **cronograma do enxoval**: quatro fases por semana gestacional, com o progresso das
categorias de cada momento e o que fazer em cada uma.

### ⋯ Mais
| | O que é |
|---|---|
| **Perfil do enxoval** | Tamanho (essencial / completo / caprichado), estação dos primeiros meses, quantos bebês, data prevista do parto e orçamento |
| **Lista de compras** | Só o que falta, por prioridade, com custo por linha; “Comprei” registra a compra |
| **Orçamento** | Valor já em casa, gasto por categoria e quanto ainda falta |
| **Kits & rotinas** | 13 situações reais — banho, troca, sono seguro, passeio, malas — com três estados: pronto, dá para fazer, faltam N |
| **Mala da maternidade** | Gerada dos kits de mala, destacando o que ainda não está em casa |
| **Chá de bebê** | Sugestões do que falta, por faixa de preço, reserváveis no nome do convidado |
| **Lista de desejos** | O que você marcou com ♥, com o custo para completar |
| **Histórico** | Cada compra registrada, com data, valor e gasto por categoria |
| **Nomes** | Favoritos de vocês dois, com significado |
| **Plano de parto** | Via de parto, alívio da dor, acompanhante, pós-nascimento e ambiente |

### O perfil muda tudo
O perfil do enxoval define a quantidade recomendada de cada item: o tamanho escolhido, a
estação (peças fora de estação entram com metade da quantidade, nunca somem) e o número de
bebês (+80% por bebê extra nos itens de consumo). A data prevista do parto alimenta a semana,
a contagem regressiva, o texto da home e o cronograma.

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
> (`const CACHE = "nosso-bebe-v5"`), senão quem já usa o app fica preso na versão antiga.

## Nota

O app organiza a gestação e as compras — ele **não dá orientação médica**. Os textos de
semana a semana são informativos; dúvidas sobre a gravidez, o parto ou o bebê são com a
obstetra e o pediatra.
