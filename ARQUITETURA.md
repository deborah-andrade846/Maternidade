# Regra de Funcionamento — Padrão de App de Arquivo Único

Este documento descreve **o padrão de construção** usado no NutriCasa (`index.html`), de forma
independente do tema. Siga estas regras para replicar a mesma "execução" em qualquer outro
domínio (finanças, treinos, estudos, plantas, hábitos, manutenção, leitura…).

O tema muda. **As regras abaixo não mudam.**

---

## 1. Princípios invioláveis

| # | Regra | Motivo |
|---|-------|--------|
| 1 | **Um único arquivo `index.html`** contendo CSS + HTML + JS | Abre com duplo clique, sem build, sem servidor |
| 2 | **Zero dependências externas** — nada de CDN, framework, fonte remota ou API | Funciona offline e para sempre, sem quebrar |
| 3 | **JavaScript puro (`"use strict"`)**, sem transpilação | Nenhuma etapa de build |
| 4 | **Todo o dado do usuário no `localStorage`** | Privacidade total, nenhum backend |
| 5 | **Um único objeto `state`** como fonte da verdade | Salvar = serializar um objeto |
| 6 | **Renderização por string de HTML** (`innerHTML`) | Simples, sem virtual DOM |
| 7 | **Um único listener global** por tipo de evento (delegação) | O HTML é recriado o tempo todo; listeners individuais morreriam |
| 8 | **Dados são constantes no topo do script** | O "banco de dados" é código versionado |
| 9 | **Emoji no lugar de ícones** | Zero assets, funciona em qualquer lugar |
| 10 | **PWA instalável e offline** (`manifest` + `sw.js`) | Vira app de celular sem loja |

---

## 2. Estrutura de arquivos

```
index.html              ← o app inteiro
manifest.webmanifest    ← nome, ícones, cores, display standalone
sw.js                   ← service worker (cache offline)
icon-192.png            ← ícone comum
icon-512.png            ← ícone comum
icon-maskable-192.png   ← ícone maskable (Android)
icon-maskable-512.png   ← ícone maskable (Android)
README.md               ← descrição das funcionalidades
```

### Layout interno do `index.html`

```
<head>          meta, título, link do manifest, ícones, meta apple/mobile
<style>         design system inteiro (tokens → layout → componentes → responsivo)
<body>          esqueleto FIXO: sidebar + topbar + <main id="content"> vazio + modal + toast
<script>        DADOS → ESTADO → MOTOR → RENDER → ACTIONS → EVENTOS → INIT
```

O `<body>` **nunca** contém o conteúdo das telas. Ele é só a moldura: tudo que muda vive
dentro de `<main id="content">`, preenchido por JavaScript.

---

## 3. As seis camadas do script

A ordem no arquivo importa: cada camada só usa o que foi definido acima dela.

### Camada 1 — DADOS (constantes)

O "banco de dados" é um array de constantes no topo. Duas formas:

```js
// Entidades simples e numerosas: array de arrays (compacto)
const ITENS = [
  ["id","Nome","emoji","Categoria",["tag1","tag2"]],
  ...
];
// Índice de acesso rápido por id — SEMPRE crie um
const ITEM_MAP = Object.fromEntries(ITENS.map(i=>[i[0],{id:i[0],nome:i[1],emoji:i[2],cat:i[3],props:i[4]}]));
const CATS = [...new Set(ITENS.map(i=>i[3]))];

// Entidades complexas: array de objetos
const COMBINACOES = [
  {id:"...", nome:"...", emj:"...", tipo:[...], req:[...], opt:[...], passos:[...], desc:"..."},
];
```

Regras:
- **`id`** é sempre uma string curta, minúscula, sem acento e sem espaço (`paofrances`, `ovo`).
- Toda entidade complexa referencia outras **por `id`**, nunca por nome.
- Configurações também são constantes: `OBJETIVOS`, `RESTRICOES`, `PERFIS`, `TABS`.
- No `init()`, valide as referências cruzadas e avise no console se algum `id` não existir.

### Camada 2 — ESTADO

Um único objeto, com valores padrão declarados inline, mais `load()` e `save()`:

```js
const LS_KEY = "meuapp_v1";
let state = {
  selecionados:[], qtd:{}, unidade:{}, objetivos:[], perfil:"moderado",
  favoritos:[], lista:[], historico:[], theme:"light",
  planoAtual:null, metasDia:{date:todayStr(), ...},
};
function load(){
  try{ const s = JSON.parse(localStorage.getItem(LS_KEY)); if(s) state = {...state, ...s}; }catch(e){}
  // MIGRAÇÃO: garanta campos novos em dados antigos
  if(!state.qtd) state.qtd = {};
  state.selecionados.forEach(id=>{ if(state.qtd[id]==null) state.qtd[id]=1; });
  // Reset diário
  if(!state.metasDia || state.metasDia.date!==todayStr()) state.metasDia = {date:todayStr(), ...};
}
function save(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){} }
```

Regras:
- `state = {...state, ...s}` é obrigatório — assim campos novos ganham valor padrão automaticamente.
- `load()` é o lugar da **migração**: todo campo adicionado depois precisa de um `if` que o preencha
  para quem já tinha dados salvos. Nunca quebre o app de quem já usava.
- `save()` sempre dentro de `try/catch` (modo anônimo pode bloquear).
- Helpers derivados logo abaixo: `const tem = id => state.selecionados.includes(id);`

### Camada 3 — MOTOR (regras de negócio)

Funções **puras** que leem `state` + constantes e devolvem dados calculados. **Nunca tocam no DOM.**

Este é o coração do app e a única camada realmente específica do domínio. O padrão é sempre:

```js
// 1. Pontuar uma entidade contra o estado do usuário
function match(x){
  const req = x.req||[];
  const missing = req.filter(id=>!tem(id));
  const optHave = (x.opt||[]).filter(id=>tem(id)).length;
  const score = (req.length ? (req.length-missing.length)/req.length : 1)*0.75
              + (optHave/((x.opt||[]).length||1))*0.25;
  return {missing, score, complete: missing.length===0};
}

// 2. Filtrar + ordenar por pontuação
function getItens({tipo=null, perfil=null, mode="all", ...}={}){
  let list = COMBINACOES.slice();
  if(tipo)   list = list.filter(x=>x.tipo.includes(tipo));
  if(perfil) list = list.filter(x=>x.perfil.includes(perfil));
  const out = [];
  for(const x of list){
    if(violaRestricao(x)) continue;
    const m = match(x);
    if(mode==="makeable" && !m.complete) continue;
    out.push({...x, ...m});
  }
  out.sort((a,b)=> (b.complete-a.complete) || (b.score-a.score) || (a.tempo-b.tempo));
  return out;
}

// 3. Gerar um plano a partir da lista ordenada (com variedade)
function gerarPlano(){
  const usados = new Set();
  return SLOTS.map(([hora,label,tipo])=>{
    let cands = getItens({tipo}).filter(x=>!usados.has(x.id));
    if(!cands.length) cands = getItens({tipo});
    const pool = (cands.filter(x=>x.complete).length ? cands.filter(x=>x.complete) : cands).slice(0,3);
    const pick = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
    if(pick) usados.add(pick.id);
    return {hora, label, tipo, item:pick};
  });
}
```

Regras:
- **Nenhuma IA, nenhuma API.** A "inteligência" é filtro + pontuação + ordenação determinísticos.
- Aleatoriedade só entre os **3 melhores** candidatos — dá variedade sem dar resultado ruim.
- Use `Set` de usados para nunca repetir dentro do mesmo plano/dia seguinte.
- Seja **honesto** nos rótulos: distinga "tem tudo" de "dá pra fazer" de "faltam N".

### Camada 4 — RENDER

Cada aba é uma função que **retorna uma string** de HTML. Um dispatcher escolhe qual chamar.

```js
const TABS = [
  ["id","Título da Aba","emoji","Subtítulo mostrado na topbar"],
  ...
];
let currentTab = "primeira";

function navTo(tab){
  currentTab = tab;
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active", n.dataset.tab===tab));
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("scrim").classList.remove("show");
  const t = TABS.find(x=>x[0]===tab);
  document.getElementById("topTitle").textContent = t[1];
  document.getElementById("topSub").textContent  = t[3];
  render();
  window.scrollTo(0,0);
}

function render(){
  renderNav();                       // reconstrói a sidebar (badges atualizados)
  const r = { aba1:renderAba1, aba2:renderAba2, ... }[currentTab];
  document.getElementById("content").innerHTML = `<div class="view active">${r()}</div>`;
}

// helper de cabeçalho reutilizado por TODAS as abas
function head(emj,titulo,desc){
  return `<div class="view-head"><h2><span class="emj">${emj}</span>${titulo}</h2><p>${desc}</p></div>`;
}
```

Regras:
- Funções `renderX()` **retornam string**, não escrevem no DOM. Só `render()` escreve.
- Montagem sempre com template literals + `.map(...).join("")`.
- Estado de UI que **não** é persistido (busca, filtro ativo) vive em variáveis soltas no
  módulo (`let buscaAtual = ""`), não dentro de `state`.
- Toda lista precisa de um **estado vazio** desenhado (`.empty`), nunca uma tela em branco.

### Camada 5 — ACTIONS (interação)

Todo elemento clicável declara sua intenção no HTML via `data-action` + `data-*`:

```html
<button data-action="toggle-item" data-id="ovo">…</button>
<button data-action="nav" data-tab="lista">…</button>
```

E existe **um mapa** de handlers:

```js
const ACTIONS = {
  "nav":(d)=>navTo(d.tab),
  "noop":()=>{},                      // para elementos que só precisam parar o clique
  "toggle-theme":()=>{ state.theme = state.theme==="dark"?"light":"dark"; applyTheme(); save(); },
  "toggle-item":(d)=>{
    const i = state.selecionados.indexOf(d.id);
    if(i>=0) state.selecionados.splice(i,1); else state.selecionados.push(d.id);
    state.planoAtual = null;          // invalida o que dependia disso
    save();
    if(currentTab==="itens") patchItens(); else render();   // patch preserva o scroll
    renderNav();
  },
};
```

E **um único listener** por tipo de evento, no `document`:

```js
document.addEventListener("click",(e)=>{
  const el = e.target.closest("[data-action]");
  if(!el) return;
  if(ACTIONS[el.dataset.action]){ e.preventDefault(); ACTIONS[el.dataset.action](el.dataset); }
});
document.addEventListener("input",(e)=>{ /* busca e campos numéricos, por id/classe */ });
document.addEventListener("change",(e)=>{ /* <select>, por classe */ });
document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") closeModal(); });
```

Regras:
- **Nunca** use `onclick=` inline nem `addEventListener` em elementos gerados: eles somem no
  próximo `render()`.
- Todo handler recebe o `dataset` do elemento — os parâmetros viajam no HTML.
- **Todo handler que muda `state` deve chamar `save()`.**
- O ciclo canônico é sempre: **clique → ACTION altera `state` → `save()` → `render()`**.

### Camada 6 — INIT

```js
function applyTheme(){
  document.documentElement.setAttribute("data-theme", state.theme==="dark"?"dark":"light");
  /* atualiza ícone e rótulo do botão de tema */
}
function init(){
  load();
  applyTheme();
  renderNav();
  navTo("primeiraAba");
  // dev check: valida ids cruzados dos dados
  let bad=[]; COMBINACOES.forEach(x=>[...(x.req||[]),...(x.opt||[])].forEach(id=>{ if(!ITEM_MAP[id]) bad.push(x.id+":"+id); }));
  if(bad.length) console.warn("Referências inexistentes:",bad);
}
init();

if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
```

---

## 4. O ciclo de vida (fluxo de dados)

```
   CONSTANTES (dados fixos)
            │
            ▼
   state  ◄────────  localStorage (load / save)
     │
     ▼
   MOTOR (funções puras: match, filtrar, ordenar, gerar)
     │
     ▼
   renderX() → string HTML
     │
     ▼
   #content.innerHTML
     │
     ▼
   clique em [data-action]
     │
     ▼
   ACTIONS[acao](dataset) → muda state → save() → render()
            └────────────── volta ao topo ──────────────┘
```

---

## 5. Design system (CSS)

Ordem obrigatória dentro do `<style>`:

1. **Tokens em `:root`** — cores, sombras, raios, transição, fonte
2. **Tema escuro** — `[data-theme="dark"]{ ...mesmas variáveis... }`
3. **Reset** — `*{margin:0;padding:0;box-sizing:border-box}`
4. **Layout** — `.app`, `.sidebar`, `.main`, `.topbar`, `.content`, `.view`
5. **Componentes** — `.btn`, `.chip`, `.card`, `.grid`, `.stat`, `.modal`, `.toast`
6. **Blocos específicos do domínio**
7. **Responsivo** — no fim

```css
:root{
  --bg:#f4f6f4; --surface:#fff; --surface-2:#f7faf7; --surface-3:#eef2ee; --border:#e3e8e3;
  --text:#1c2620; --text-soft:#5c6a60; --text-faint:#93a097;
  --accent:#16a34a; --accent-d:#0f7a37; --accent-l:#dcf5e6;   /* ← trocar por app */
  --amber:#e08a1e; --rose:#e2486b; --violet:#7c5cff;           /* cores de status */
  --shadow-sm:…; --shadow-md:…; --shadow-lg:…;
  --r-sm:10px; --r-md:16px; --r-lg:22px; --r-xl:28px;
  --t:.22s cubic-bezier(.4,0,.2,1);
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
}
[data-theme="dark"]{ /* redefine as MESMAS variáveis */ }
```

Regras:
- **Nenhuma cor literal fora do `:root`.** Se você escrever `#fff` num componente, o tema escuro quebra.
- Trocar de app = trocar `--accent`, `--accent-d`, `--accent-l` e os emojis. O resto continua.
- Classes utilitárias que sempre existem: `.card`, `.grid .g-2 .g-3 .g-auto`, `.btn .btn-primary
  .btn-ghost .btn-sm .btn-block`, `.chip .chip-row`, `.stat-row .stat`, `.section-title`, `.empty`.
- Responsivo por breakpoint: `880px` (sidebar vira gaveta) e `760px` (grades colapsam).
- Sidebar mobile: `.sidebar.open` + `.tab-scrim.show`, controlados por `open-menu` / `close-menu`.

---

## 6. Componentes fixos do esqueleto

| Componente | Como funciona |
|---|---|
| **Sidebar** | `renderNav()` recria os botões a partir de `TABS`, com `.nav-badge` mostrando contadores do `state` |
| **Topbar** | título + subtítulo trocados por `navTo()`; botão de menu no mobile |
| **Modal** | `#modalBg > #modal`; abre preenchendo `#modal.innerHTML` e adicionando `.show`; fecha ao clicar no fundo (`e.target.id==="modalBg"`) ou com `Escape` |
| **Toast** | `toast(msg, emoji)` cria a div, agenda o fade em 2200 ms e remove |
| **Tema** | botão no rodapé da sidebar → `state.theme` → `applyTheme()` → atributo `data-theme` no `<html>` |

---

## 7. Padrão de quantidade e unidade (opcional, mas reutilizável)

Quando os itens do usuário precisam de quantidade:

- `state.qtd[id]` (número, aceita decimal) e `state.unidade[id]` (string).
- Unidade **de referência** por categoria (`CAT_UNIT`) com exceções por item (`UNIT_OVERRIDE`),
  usada nos cálculos internos — ela nunca muda.
- Unidade **efetiva** = a que o usuário escolheu (`unitOf(id)`), usada só na exibição.
- Passo do `+/−` conforme a unidade: `g`/`ml` → 50; `kg`/`L` → 0,5; resto → 1.
- Entrada aceita vírgula: `parseFloat(String(v).replace(",","."))`; saída formata com vírgula.
- Quando a unidade do usuário **difere** da de referência, o cálculo vira **referência**
  ("usado em N vezes · você tem X"), não um número falsamente exato. **Nunca minta no número.**

---

## 8. PWA

`manifest.webmanifest`:
```json
{ "name":"…", "short_name":"…", "description":"…", "lang":"pt-BR",
  "start_url":"./", "scope":"./", "display":"standalone", "orientation":"portrait",
  "background_color":"#…", "theme_color":"#…", "categories":["…"],
  "icons":[ {"src":"icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},
            {"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},
            {"src":"icon-maskable-192.png","sizes":"192x192","type":"image/png","purpose":"maskable"},
            {"src":"icon-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"} ] }
```

`sw.js` — estratégia:
- `install`: `cache.addAll(ASSETS)` + `skipWaiting()`
- `activate`: apaga caches de versões antigas + `clients.claim()`
- `fetch`: navegação → rede com fallback pro `index.html` em cache; demais GET → cache primeiro,
  rede como reserva (e atualiza o cache).

**Regra crítica:** toda vez que mudar arquivos, **incremente a versão do cache**
(`const CACHE = "meuapp-v2"`), senão o usuário fica preso na versão antiga.

O `<head>` precisa de: `manifest`, `icon`, `apple-touch-icon`, `theme-color`,
`apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, `mobile-web-app-capable`.

O service worker só registra em `http`/`https` — abrindo por `file://` o app funciona,
mas não instala.

---

## 9. Armadilhas conhecidas (aprendidas na prática)

| Problema | Solução aplicada |
|---|---|
| Campo de busca perde o foco a cada tecla, porque o `render()` recria o input | Depois do `render()`, refocar e restaurar o cursor com `setSelectionRange(len,len)` |
| A lista pula para o topo ao marcar um item | Não dar `render()` completo: usar uma função `patchX()` que só alterna classes e atualiza números |
| Digitar quantidade dispara re-render e atrapalha | No `input`, só alterar `state` + `save()`; **não** renderizar |
| Clique dentro do modal fecha o modal | Fechar apenas quando `e.target.id === "modalBg"` |
| `<select>` dentro de um card clicável dispara a ação do card | Dar `data-action="noop"` ao `<select>` |
| Usuário atualiza e vê a versão antiga | Incrementar a versão do cache no `sw.js` |
| Dados antigos quebram após adicionar um campo | Migração explícita dentro do `load()` |
| Texto longo estoura o card | `min-width:0` + `overflow-wrap:anywhere` nos contêineres flex |

---

## 10. Checklist para criar um app novo

1. **Defina as três perguntas do domínio:**
   - O que o usuário **cadastra**? → vira `ITENS` + `state.selecionados`
   - O que o app **gera** a partir disso? → vira `COMBINACOES` + o motor
   - Em quantos **modos/perfis** isso acontece? → vira `PERFIS` (o equivalente a "intensidade")
2. Copie o esqueleto: `<head>`, `<style>` inteiro, `<body>` (sidebar/topbar/modal/toast), camadas 2, 4, 5 e 6.
3. Troque `--accent*`, o emoji da marca, o nome, o `LS_KEY` e o título.
4. Escreva as constantes de dados (comece com 20–30 entradas; expanda depois).
5. Defina `TABS` — de 6 a 12 abas. Sugestão de arco narrativo:
   **cadastrar → configurar objetivo → configurar ritmo → gerar plano → explorar → planejar semana → apoio → saída (lista/exportação) → favoritos → histórico**.
6. Escreva uma `renderX()` por aba, todas usando `head()` e as classes utilitárias.
7. Escreva o motor (`match`, `getX`, `gerarPlano`).
8. Adicione as ações em `ACTIONS`.
9. Gere os 4 ícones, ajuste `manifest.webmanifest` e `sw.js` (nome + versão do cache).
10. Atualize o `README.md` descrevendo cada recurso pela ótica do usuário.

---

## 11. Esqueleto mínimo funcional

Base copiável — já roda, já persiste, já tem tema, navegação, toast e modal.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>MeuApp</title>
<link rel="manifest" href="manifest.webmanifest">
<style>
:root{--bg:#f4f6f4;--surface:#fff;--surface-2:#f7faf7;--border:#e3e8e3;--text:#1c2620;
  --text-soft:#5c6a60;--accent:#16a34a;--accent-d:#0f7a37;--accent-l:#dcf5e6;
  --r-md:16px;--r-lg:22px;--t:.22s cubic-bezier(.4,0,.2,1);
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
[data-theme="dark"]{--bg:#10140f;--surface:#1a211a;--surface-2:#202a20;--border:#2c382e;
  --text:#e8efe9;--text-soft:#a3b3a6;--accent-l:#173a24}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:var(--font)}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
.app{display:flex;min-height:100vh}
.sidebar{width:250px;background:var(--surface);border-right:1px solid var(--border);
  padding:18px 12px;display:flex;flex-direction:column;gap:4px}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;
  font-size:14px;font-weight:600;color:var(--text-soft);text-align:left;transition:var(--t)}
.nav-item.active{background:var(--accent);color:#fff}
.main{flex:1;min-width:0}
.topbar{display:flex;align-items:center;gap:12px;padding:16px 26px;border-bottom:1px solid var(--border)}
.content{padding:26px;max-width:1180px;margin:0 auto}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px}
.grid{display:grid;gap:16px}.g-auto{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.btn{padding:11px 17px;border-radius:var(--r-md);background:var(--surface);
  border:1px solid var(--border);font-weight:650;font-size:14px;transition:var(--t)}
.btn-primary{background:var(--accent);color:#fff;border-color:transparent}
.view-head{margin-bottom:20px}.view-head h2{font-size:25px;font-weight:780}
.view-head p{color:var(--text-soft);font-size:14.5px;margin-top:5px}
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);
  align-items:center;justify-content:center;padding:20px;z-index:50}
.modal-bg.show{display:flex}
.modal{background:var(--surface);border-radius:var(--r-lg);padding:24px;max-width:520px;
  width:100%;max-height:85vh;overflow:auto}
.toast-wrap{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:60}
.toast{background:var(--text);color:var(--bg);padding:11px 18px;border-radius:99px;
  font-size:13.5px;font-weight:650;margin-top:8px}
@media(max-width:880px){.sidebar{position:fixed;inset:0 auto 0 0;z-index:40;
  transform:translateX(-100%);transition:var(--t)}.sidebar.open{transform:none}}
</style>
</head>
<body>
<div class="app">
  <aside class="sidebar" id="sidebar">
    <nav id="nav"></nav>
    <div style="margin-top:auto">
      <button class="btn" data-action="toggle-theme" id="themeBtn">🌙 Modo escuro</button>
    </div>
  </aside>
  <div class="main">
    <header class="topbar"><h1 id="topTitle"></h1><span id="topSub"></span></header>
    <main class="content" id="content"></main>
  </div>
</div>
<div class="modal-bg" id="modalBg"><div class="modal" id="modal"></div></div>
<div class="toast-wrap" id="toastWrap"></div>

<script>
"use strict";

/* ---------- 1. DADOS ---------- */
const ITENS = [
  ["item1","Item Um","🔹","Categoria A",["tag"]],
  ["item2","Item Dois","🔸","Categoria B",["tag"]],
];
const ITEM_MAP = Object.fromEntries(ITENS.map(i=>[i[0],{id:i[0],nome:i[1],emoji:i[2],cat:i[3],props:i[4]}]));
const CATS = [...new Set(ITENS.map(i=>i[3]))];
const TABS = [
  ["itens","Meus Itens","📦","O que você tem hoje"],
  ["plano","Plano","📋","Gerado a partir dos seus itens"],
];

/* ---------- 2. ESTADO ---------- */
const LS_KEY = "meuapp_v1";
const todayStr = ()=> new Date().toISOString().slice(0,10);
let state = { selecionados:[], theme:"light", plano:null };
function load(){
  try{ const s = JSON.parse(localStorage.getItem(LS_KEY)); if(s) state = {...state,...s}; }catch(e){}
  if(!state.selecionados) state.selecionados = [];
}
function save(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){} }
const tem = id => state.selecionados.includes(id);

/* ---------- 3. MOTOR ---------- */
function gerarPlano(){
  return ITENS.filter(i=>tem(i[0])).map(i=>({id:i[0], nome:i[1], emoji:i[2]}));
}

/* ---------- 4. RENDER ---------- */
let currentTab = "itens";
function head(emj,t,d){ return `<div class="view-head"><h2>${emj} ${t}</h2><p>${d}</p></div>`; }
function renderNav(){
  document.getElementById("nav").innerHTML = TABS.map(t=>
    `<button class="nav-item ${t[0]===currentTab?'active':''}" data-action="nav" data-tab="${t[0]}">
       <span>${t[2]}</span><span>${t[1]}</span></button>`).join("");
}
function renderItens(){
  return head("📦","Meus Itens","Toque para marcar o que você tem.") +
    `<div class="grid g-auto">` + ITENS.map(i=>
      `<button class="card" data-action="toggle-item" data-id="${i[0]}"
         style="border-color:${tem(i[0])?'var(--accent)':'var(--border)'}">
         ${i[2]} <strong>${i[1]}</strong></button>`).join("") + `</div>`;
}
function renderPlano(){
  const p = state.plano || [];
  return head("📋","Plano","Montado com o que você marcou.") +
    `<button class="btn btn-primary" data-action="gerar">Gerar plano</button>
     <div class="grid g-auto" style="margin-top:16px">` +
     (p.length ? p.map(x=>`<div class="card">${x.emoji} <strong>${x.nome}</strong></div>`).join("")
               : `<p style="color:var(--text-soft)">Nenhum plano ainda.</p>`) + `</div>`;
}
function render(){
  renderNav();
  const r = { itens:renderItens, plano:renderPlano }[currentTab];
  document.getElementById("content").innerHTML = r();
}
function navTo(tab){
  currentTab = tab;
  const t = TABS.find(x=>x[0]===tab);
  document.getElementById("topTitle").textContent = t[1];
  document.getElementById("topSub").textContent = t[3];
  document.getElementById("sidebar").classList.remove("open");
  render(); window.scrollTo(0,0);
}
function toast(msg,emj="✓"){
  const el = document.createElement("div");
  el.className="toast"; el.textContent = emj+" "+msg;
  document.getElementById("toastWrap").appendChild(el);
  setTimeout(()=>el.remove(), 2200);
}
function closeModal(){ document.getElementById("modalBg").classList.remove("show"); }

/* ---------- 5. ACTIONS + EVENTOS ---------- */
const ACTIONS = {
  "nav":(d)=>navTo(d.tab),
  "noop":()=>{},
  "toggle-theme":()=>{ state.theme = state.theme==="dark"?"light":"dark"; applyTheme(); save(); },
  "toggle-item":(d)=>{
    const i = state.selecionados.indexOf(d.id);
    if(i>=0) state.selecionados.splice(i,1); else state.selecionados.push(d.id);
    state.plano = null; save(); render();
  },
  "gerar":()=>{ state.plano = gerarPlano(); save(); render(); toast("Plano gerado!","✨"); },
};
document.addEventListener("click",(e)=>{
  const el = e.target.closest("[data-action]"); if(!el) return;
  if(ACTIONS[el.dataset.action]){ e.preventDefault(); ACTIONS[el.dataset.action](el.dataset); }
});
document.getElementById("modalBg").addEventListener("click",(e)=>{ if(e.target.id==="modalBg") closeModal(); });
document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") closeModal(); });

/* ---------- 6. INIT ---------- */
function applyTheme(){
  document.documentElement.setAttribute("data-theme", state.theme==="dark"?"dark":"light");
  const b = document.getElementById("themeBtn");
  if(b) b.textContent = state.theme==="dark" ? "☀️ Modo claro" : "🌙 Modo escuro";
}
function init(){ load(); applyTheme(); renderNav(); navTo("itens"); }
init();

if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
</script>
</body>
</html>
```

---

## 12. Resumo em uma frase

> Constantes de dados no topo, um objeto `state` no `localStorage`, funções puras que pontuam e
> ordenam, funções que devolvem HTML como string, um mapa de `ACTIONS` acionado por delegação de
> eventos — tudo num arquivo só, sem dependências, instalável como PWA.

Troque os dados e o motor: você tem outro app.
