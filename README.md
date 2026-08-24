# 🧸 Enxoval — planejador de enxoval do bebê

App de **arquivo único** para planejar o enxoval, montar a mala da maternidade e saber
exatamente o que ainda falta comprar. Abre com dois cliques, funciona **offline**, sem
cadastro, sem servidor e sem enviar nada para lugar nenhum — tudo fica no `localStorage`
do próprio navegador.

Construído segundo o padrão descrito em [`ARQUITETURA.md`](ARQUITETURA.md).

---

## Como usar

Abra o `index.html` no navegador. Só isso.

Servindo por `http`/`https` (por exemplo `npx http-server`), o app também se instala como
PWA no celular: vira ícone na tela inicial e continua funcionando sem internet.

---

## O que o app faz

### 🏠 Painel
Resumo em uma tela: porcentagem do enxoval concluída, quanto falta comprar (total e só o
essencial), quanto já foi investido, quantos kits estão prontos, os próximos passos e a
barra de progresso de cada categoria.

### 📋 Enxoval
Os **75 itens** do enxoval, divididos em 8 categorias (Roupinhas, Fraldas, Higiene & Banho,
Quarto & Sono, Alimentação, Passeio, Saúde e Mamãe). Para cada um, você informa quanto já
tem; o app mostra quanto é recomendado, quanto falta e quanto isso custa. Tem busca,
filtro por categoria, filtro por situação (falta / já tenho / desejos) e a possibilidade de
**ocultar** itens que não fazem sentido para você — o que sai do progresso e da lista de
compras.

Cada item tem uma **dica prática** (💡) e um preço médio de referência, editável.

### 🎀 Perfil
É aqui que as recomendações são calibradas:

| Ajuste | Efeito |
|---|---|
| **Tamanho do enxoval** (Essencial / Completo / Caprichado) | muda a quantidade recomendada de cada item |
| **Estação dos primeiros meses** | peças fora de estação entram com metade da quantidade — nunca somem |
| **Número de bebês** | roupas, fraldas e itens de consumo aumentam 80% por bebê extra |
| **Data provável do parto** | liga a contagem regressiva e o cronograma por fase |
| **Orçamento** | vira barra de acompanhamento na Lista de Compras |

### 🧺 Kits & Rotinas
13 kits que representam situações reais (banho, troca de fralda, cuidado do umbigo, sono
seguro, amamentação, passeio, consulta no pediatra, troca da madrugada, dia frio, dia
quente, malas). Cada kit é classificado com honestidade:

- 🟢 **pronto** — você tem a quantidade recomendada de tudo
- 🟡 **dá para fazer** — tem pelo menos uma unidade de cada item obrigatório
- 🔴 **faltam N** — ainda falta item obrigatório

Cada kit traz também o passo a passo de como usar.

### 👜 Mala da Maternidade
Checklist gerado a partir dos kits de mala, separado em “para o bebê” e “para a mamãe”.
Marque conforme for colocando na mala; o que **ainda não está em casa** aparece destacado.
A partir da 34ª semana o app avisa que a mala já deveria estar pronta. Dá para copiar a
lista em texto.

### 🛒 Lista de Compras
Só o que falta, ordenado por prioridade (essencial → importante → opcional), com o custo
de cada linha e o total. Ao tocar em **Comprei**, você registra quantidade e valor: a
quantidade entra no enxoval e o valor vai para o histórico.

### 🎉 Chá de Bebê
Sugestões de presente montadas a partir do que realmente falta, agrupadas por faixa de
preço. Dá para **reservar** um item no nome do convidado, para ninguém repetir presente, e
copiar a lista pronta para mandar no grupo.

### 📅 Cronograma
Quatro fases por semana gestacional — até 20, 21–28, 29–34 e 35+ — cada uma com as
categorias daquele momento, o progresso delas e as ações recomendadas. Com a data prevista
informada, o app marca em que fase você está.

### ⭐ Favoritos e 📜 Histórico
Lista de desejos com o custo para completá-la, e o histórico de compras com total gasto,
ticket médio, percentual do orçamento e gasto por categoria.

---

## Detalhes

- **Tema claro e escuro**, alternado no rodapé da barra lateral.
- **Backup**: em Perfil → *Exportar dados* você copia o JSON do seu estado.
- **Recomeçar do zero** apaga tudo deste navegador (com confirmação).
- Os preços são **referências médias em reais** e servem para dimensionar o esforço —
  ajuste no ✏️ de cada item para chegar perto da sua realidade.
- Este app organiza compras. Ele **não dá orientação médica**: dúvidas sobre o bebê,
  amamentação ou puerpério são com o pediatra e o obstetra.

## Arquivos

```
index.html              ← o app inteiro (CSS + HTML + JS)
manifest.webmanifest    ← nome, ícones, cores, display standalone
sw.js                   ← service worker (cache offline)
icon-*.png              ← ícones comuns e maskable
ARQUITETURA.md          ← o padrão de construção seguido aqui
```

> Ao alterar qualquer arquivo, incremente a versão do cache em `sw.js`
> (`const CACHE = "enxoval-v2"`), senão quem já usa o app fica preso na versão antiga.
