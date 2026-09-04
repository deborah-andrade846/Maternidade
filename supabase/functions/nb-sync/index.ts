// ═══════════════════════════════════════════════════════════════════════
// nb-sync — a API do app da mãe.
//
// Autenticação: perfil (uuid) + chave secreta, gerados no primeiro
// aparelho e guardados no localStorage. A chave nunca é gravada em claro:
// o banco guarda o sha-256 dela. Não há login nem cadastro.
//
// Ações:
//   criar      → novo perfil, devolve {perfil, chave, codigo}
//   puxar      → estado do app + reservas, presenças e sugestões do chá
//   empurrar   → grava o estado do app (o mesmo JSON do backup)
//   cha        → grava os dados públicos do chá (título, data, presentes…)
//   reservar   → a própria mãe marca um presente como reservado
//   liberar    → desfaz a reserva
//   sugestao   → aprova ou apaga uma sugestão de convidado
//   presenca   → apaga uma confirmação de presença
// ═══════════════════════════════════════════════════════════════════════
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const texto = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function hash(chave: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(chave));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function sorteio(tamanho: number, alfabeto: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(tamanho));
  return [...bytes].map((b) => alfabeto[b % alfabeto.length]).join("");
}
/* Código do chá: curto, sem caracteres que se confundem lidos em voz alta */
const novoCodigo = () => sorteio(8, "abcdefghjkmnpqrstuvwxyz23456789");
const novaChave = () => sorteio(48, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");

/* Confere perfil + chave e devolve o perfil, ou null */
async function autenticar(perfil: unknown, chave: unknown) {
  if (!UUID.test(String(perfil ?? "")) || typeof chave !== "string" || chave.length < 20) return null;
  const { data } = await db.from("nb_perfis").select("id, chave_hash, versao").eq("id", perfil).maybeSingle();
  if (!data) return null;
  const esperado = await hash(chave);
  /* comparação de tamanho fixo: os dois lados são hashes hex de 64 caracteres */
  if (esperado.length !== data.chave_hash.length) return null;
  let diferenca = 0;
  for (let i = 0; i < esperado.length; i++) diferenca |= esperado.charCodeAt(i) ^ data.chave_hash.charCodeAt(i);
  return diferenca === 0 ? data : null;
}

/* Tudo que o app precisa saber do servidor numa tacada só */
async function estado(perfil: string) {
  const [p, cha, reservas, presencas, sugestoes] = await Promise.all([
    db.from("nb_perfis").select("dados, versao, atualizado_em").eq("id", perfil).maybeSingle(),
    db.from("nb_chas").select("codigo, titulo, quando, onde, recado, aberto, presentes").eq("perfil", perfil).maybeSingle(),
    db.from("nb_reservas").select("item, quem, recado, criado_em").eq("perfil", perfil).order("criado_em"),
    db.from("nb_presencas").select("id, quem, pessoas, vai, recado, criado_em").eq("perfil", perfil).order("criado_em"),
    db.from("nb_sugestoes").select("id, quem, oque, aprovada, criado_em").eq("perfil", perfil).order("criado_em"),
  ]);
  return {
    dados: p.data?.dados ?? {},
    versao: p.data?.versao ?? 0,
    atualizado_em: p.data?.atualizado_em ?? null,
    cha: cha.data ?? null,
    reservas: reservas.data ?? [],
    presencas: presencas.data ?? [],
    sugestoes: sugestoes.data ?? [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "método" }, 405);

  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return json({ erro: "json" }, 400);
  }
  const acao = String(corpo.acao ?? "");

  /* ── criar: a única ação que não exige credencial ── */
  if (acao === "criar") {
    const chave = novaChave();
    const { data: perfil, error } = await db
      .from("nb_perfis")
      .insert({ chave_hash: await hash(chave) })
      .select("id")
      .single();
    if (error || !perfil) return json({ erro: "criar" }, 500);

    let codigo = novoCodigo();
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const { error: e } = await db.from("nb_chas").insert({ perfil: perfil.id, codigo });
      if (!e) break;
      if (tentativa === 4) return json({ erro: "codigo" }, 500);
      codigo = novoCodigo();
    }
    return json({ perfil: perfil.id, chave, codigo });
  }

  const conta = await autenticar(corpo.perfil, corpo.chave);
  if (!conta) return json({ erro: "credencial" }, 401);
  const perfil = conta.id as string;

  switch (acao) {
    case "puxar":
      return json(await estado(perfil));

    /* O app manda o estado inteiro — o mesmo JSON do backup. Quem escreveu
       por último vence: é uma pessoa em um ou dois aparelhos. */
    case "empurrar": {
      const dados = corpo.dados;
      if (!dados || typeof dados !== "object" || Array.isArray(dados)) return json({ erro: "dados" }, 400);
      if (JSON.stringify(dados).length > 4_000_000) return json({ erro: "tamanho" }, 413);
      const { data, error } = await db
        .from("nb_perfis")
        .update({ dados, versao: (conta.versao ?? 0) + 1, atualizado_em: new Date().toISOString() })
        .eq("id", perfil)
        .select("versao, atualizado_em")
        .single();
      if (error) return json({ erro: "gravar" }, 500);
      return json({ ok: true, versao: data.versao, atualizado_em: data.atualizado_em });
    }

    /* A parte pública: o que os convidados enxergam na página do chá */
    case "cha": {
      const presentes = Array.isArray(corpo.presentes) ? corpo.presentes.slice(0, 200) : [];
      const { error } = await db
        .from("nb_chas")
        .update({
          titulo: texto(corpo.titulo, 80) || "Chá de bebê",
          quando: texto(corpo.quando, 120),
          onde: texto(corpo.onde, 160),
          recado: texto(corpo.recado, 400),
          aberto: corpo.aberto !== false,
          presentes: presentes.map((p: Record<string, unknown>) => ({
            id: texto(p.id, 60),
            nome: texto(p.nome, 120),
            qtd: Math.max(1, Math.min(99, Number(p.qtd) || 1)),
            preco: Math.max(0, Number(p.preco) || 0),
            tam: texto(p.tam, 20),
            cat: texto(p.cat, 40),
          })).filter((p) => p.id && p.nome),
          atualizado_em: new Date().toISOString(),
        })
        .eq("perfil", perfil);
      if (error) return json({ erro: "cha" }, 500);
      return json({ ok: true });
    }

    case "reservar": {
      const item = texto(corpo.item, 60), quem = texto(corpo.quem, 60);
      if (!item || !quem) return json({ erro: "campos" }, 400);
      const { error } = await db
        .from("nb_reservas")
        .upsert({ perfil, item, quem, recado: texto(corpo.recado, 300) }, { onConflict: "perfil,item" });
      if (error) return json({ erro: "reservar" }, 500);
      return json({ ok: true });
    }

    case "liberar": {
      const item = texto(corpo.item, 60);
      if (!item) return json({ erro: "campos" }, 400);
      await db.from("nb_reservas").delete().eq("perfil", perfil).eq("item", item);
      return json({ ok: true });
    }

    case "sugestao": {
      const id = String(corpo.id ?? "");
      if (!UUID.test(id)) return json({ erro: "campos" }, 400);
      if (corpo.apagar) await db.from("nb_sugestoes").delete().eq("perfil", perfil).eq("id", id);
      else await db.from("nb_sugestoes").update({ aprovada: corpo.aprovada !== false }).eq("perfil", perfil).eq("id", id);
      return json({ ok: true });
    }

    case "presenca": {
      const id = String(corpo.id ?? "");
      if (!UUID.test(id)) return json({ erro: "campos" }, 400);
      await db.from("nb_presencas").delete().eq("perfil", perfil).eq("id", id);
      return json({ ok: true });
    }

    /* Troca o código do link: usa quando o link vaza para quem não devia */
    case "novo-codigo": {
      const codigo = novoCodigo();
      const { error } = await db.from("nb_chas").update({ codigo }).eq("perfil", perfil);
      if (error) return json({ erro: "codigo" }, 500);
      return json({ ok: true, codigo });
    }

    case "apagar-tudo":
      await db.from("nb_perfis").delete().eq("id", perfil);
      return json({ ok: true });

    default:
      return json({ erro: "acao" }, 400);
  }
});
