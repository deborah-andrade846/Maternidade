# 🧸 Nosso bebê — gestação e enxoval

App de **arquivo único** para acompanhar a gestação semana a semana e organizar tudo o que
vem junto: um enxoval de 75 itens com quantidade recomendada, kits e rotinas, mala da
maternidade, lista de compras, chá de bebê, consultas, orçamento, nomes e plano de parto —
mais 17 ferramentas de acompanhamento: calculadora gestacional, contador de chutes, diário,
colo uterino, IMC, checklist de exames, respiração guiada, sintomas, humor, hidratação,
amamentação, sono, vacinas, marcos do bebê, ciclo, fertilidade e backup.
Abre com dois cliques, funciona **offline**, sem cadastro e sem servidor — os dados ficam
só no `localStorage` do próprio aparelho.

Implementação do design **`Enxoval App.dc.html`** (Claude Design), sobre o design system
**Broadsheet**, seguindo o padrão de construção de [`ARQUITETURA.md`](ARQUITETURA.md).

---

## Como usar

Abra o `index.html` no navegador — ele funciona inteiro assim, inclusive offline.

### Para instalar como app no celular

Um arquivo aberto direto do WhatsApp (`content://…`) ou do gerenciador de arquivos
(`file://…`) **não** pode virar app: navegadores só oferecem a instalação em **origem
segura**, isto é, um endereço `https://`. É regra do navegador, não uma limitação do app.

Este repositório já está pronto para o **GitHub Pages**, que é gratuito em repositório
público:

1. No GitHub, abra **Settings → Pages**
2. Em *Source*, escolha **Deploy from a branch**
3. Selecione a branch **main** e a pasta **/ (root)**, e clique em **Save**
4. Em um ou dois minutos o app estará em
   `https://<seu-usuário>.github.io/Maternidade/`

Abrindo esse endereço no celular, o Chrome mostra **Instalar app** (ou *Adicionar à tela
inicial*): o app ganha ícone próprio, abre sem barra de navegador e continua funcionando
sem internet, porque o service worker guarda tudo no primeiro acesso.

Qualquer outra hospedagem estática com HTTPS serve igual.

No celular o app ocupa a tela inteira; no desktop aparece na moldura de 390×844 do design.
Não há cabeçalho fixo: cada tela abre com o próprio título, e o enxoval começa zerado — o que
está “em casa” é só o que você marcar.

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
| **Nomes** | Favoritos de vocês dois — nome, significado e anotação, tudo editável |
| **Plano de parto** | Temas, opções e anotações que vocês mesmos escrevem |

### 🧰 As 17 ferramentas
O **Mais** agora abre em seções. Além do enxoval, ele guarda um conjunto de ferramentas de
gestação, bem-estar, bebê e ciclo — todas gravando no mesmo `localStorage`, todas offline.

**Gestação**

| | O que faz |
|---|---|
| **Calculadora gestacional** | Data prevista do parto por última menstruação, por DPP conhecida ou por ultrassom (data do exame + semanas e dias). Mostra semana e dia, trimestre, concepção estimada e as datas de cada marco — e o botão que adota essa DPP no app inteiro |
| **Contador de chutes** | Sessão com cronômetro que fecha sozinha nos dez movimentos, histórico por dia e o aviso de quando procurar a maternidade |
| **Diário da gestação** | Anotações com data, semana, título e texto livre |
| **Medição do colo uterino** | Cada medida em mm com semana e observação, classificação automática (colo curto abaixo de 25 mm) e a barra de evolução |
| **IMC gestacional** | IMC de antes da gravidez, faixa e ganho total recomendado (IOM), histórico de peso e a comparação do ganho de hoje com o esperado para a semana |
| **Checklist de exames** | 28 exames do pré-natal separados por trimestre, com a janela de cada um e a data em que você marcou |

**Bem-estar**

| | O que faz |
|---|---|
| **Meditação e respiração** | Seis exercícios guiados (4-7-8, quadrada, diafragmática, da contração, relaxamento progressivo e pausa de um minuto). A bolha cresce e diminui no tempo de cada fase e conta os ciclos |
| **Rastreador de sintomas** | 17 sintomas com intensidade, anotação, os mais frequentes em 30 dias e a lista de sinais que pedem atendimento no mesmo dia |
| **Rastreador de humor** | Nível de 1 a 5, marcadores do que pesa no dia, anotação, média de 14 dias e o gráfico das duas últimas semanas |
| **Calculadora de hidratação** | Meta calculada pelo peso (35 ml/kg mais o acréscimo da gestação ou da amamentação), contador de copos e os últimos 7 dias |

**Bebê**

| | O que faz |
|---|---|
| **Controle de amamentação** | Cronômetro por lado, registro de mamadeira em ml, resumo do dia e há quanto tempo foi a última |
| **Monitor de sono** | Soneca e noite com cronômetro ou horário digitado (atravessando a meia-noite), total do dia e o gráfico de 7 dias |
| **Calendário de vacinas** | Gestante e primeira infância pelo PNI, com a data prevista de cada dose calculada da data de nascimento e o aviso de atraso |
| **Desenvolvimento do bebê** | 33 marcos de 1 a 24 meses, com a data em que cada um aconteceu |

**Ciclo**

| | O que faz |
|---|---|
| **Ciclo menstrual** | Registro de cada menstruação, duração média dos últimos ciclos, dia do ciclo e próxima data prevista |
| **Calculadora de fertilidade** | Ovulação, janela fértil dos próximos três ciclos e a data prevista do parto caso a gravidez aconteça agora |

**Este aparelho**

| | O que faz |
|---|---|
| **Backup e sincronização** | Baixa um arquivo `.json` com tudo, restaura de um arquivo e gera um código de transferência para colar em outro celular. Nada sai do aparelho: não há servidor nem conta |

As abas **Gravidez** e **Saúde** ganharam atalhos para as ferramentas que combinam com elas.

### Nomes e plano de parto são seus
As duas listas começam com uma sugestão, mas nada ali é fixo. Em **Nomes**, o coração
marca o favorito e o toque no nome abre o formulário: nome, significado e uma anotação
livre (quem sugeriu, como combina com o sobrenome), com a opção de apagar. Em **Plano de
parto**, cada tema tem um *editar* que muda o título, acrescenta e apaga opções uma a uma,
escreve a anotação para levar à consulta ou apaga o tema inteiro — e o **+ Adicionar tema**
cria os assuntos que faltarem. Tocar de novo na opção marcada desmarca.

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
icon-*-v2.png           ← ícones do PWA, comuns e maskable
ARQUITETURA.md          ← o padrão de construção seguido aqui
```

> Ao alterar qualquer arquivo, incremente a versão do cache em `sw.js`
> (`const CACHE = "nosso-bebe-v12"`), senão quem já usa o app fica preso na versão antiga.

## Nota

O app organiza a gestação e as compras — ele **não dá orientação médica**. Os textos de
semana a semana, o checklist de exames, o calendário de vacinas, os marcos de desenvolvimento
e as contas de IMC, hidratação e fertilidade são informativos e seguem referências públicas
(PNI, IOM); dúvidas sobre a gravidez, o parto ou o bebê são com a obstetra e o pediatra.
A calculadora de fertilidade não serve como método contraceptivo.
