// ═══════════════════════════════════════════════════════════════════════
// nb-cha — a API da página dos convidados.
//
// Autenticação: só o código do chá, que vai no link compartilhado. Quem
// tem o link vê a lista de presentes e pode reservar, confirmar presença,
// deixar um recadinho e sugerir um presente. Nada além do chá é exposto:
// esta função nunca lê a tabela de perfis, onde mora o resto do app.
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

/* Limites para uma festa de verdade — e para o link não virar mural de ninguém */
const TETO = { reservas: 300, presencas: 300, sugestoes: 200 };

async function acharCha(codigo: string) {
  if (!/^[a-z0-9]{4,16}$/.test(codigo)) return null;
  const { data } = await db
    .from("nb_chas")
    .select("perfil, codigo, titulo, quando, onde, recado, aberto, presentes")
    .eq("codigo", codigo)
    .maybeSingle();
  return data ?? null;
}
const contar = async (tabela: string, perfil: string) => {
  const { count } = await db.from(tabela).select("id", { count: "exact", head: true }).eq("perfil", perfil);
  return count ?? 0;
};

/* A página inteira numa resposta só */
async function verCha(cha: Record<string, unknown>) {
  const perfil = cha.perfil as string;
  const [reservas, presencas, sugestoes] = await Promise.all([
    db.from("nb_reservas").select("item, quem, recado, criado_em").eq("perfil", perfil).order("criado_em"),
    db.from("nb_presencas").select("quem, pessoas, vai, recado, criado_em").eq("perfil", perfil).order("criado_em"),
    db.from("nb_sugestoes").select("quem, oque, aprovada, criado_em").eq("perfil", perfil).order("criado_em"),
  ]);
  return {
    titulo: cha.titulo,
    quando: cha.quando,
    onde: cha.onde,
    recado: cha.recado,
    aberto: cha.aberto,
    presentes: cha.presentes,
    reservas: reservas.data ?? [],
    presencas: presencas.data ?? [],
    /* o convidado só vê as sugestões que a mãe já aprovou */
    sugestoes: (sugestoes.data ?? []).filter((s) => s.aprovada),
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

  const cha = await acharCha(texto(corpo.codigo, 16).toLowerCase());
  if (!cha) return json({ erro: "nao-encontrado" }, 404);
  const perfil = cha.perfil as string;
  const acao = String(corpo.acao ?? "ver");

  if (acao === "ver") return json(await verCha(cha));
  if (!cha.aberto) return json({ erro: "fechado" }, 403);

  switch (acao) {
    /* Reservar um presente: só pega o que ainda está livre */
    case "reservar": {
      const item = texto(corpo.item, 60), quem = texto(corpo.quem, 60);
      if (!item || !quem) return json({ erro: "campos" }, 400);
      const presentes = (cha.presentes as { id: string }[]) || [];
      if (!presentes.some((p) => p.id === item)) return json({ erro: "item" }, 400);
      if (await contar("nb_reservas", perfil) >= TETO.reservas) return json({ erro: "cheio" }, 429);
      const { error } = await db.from("nb_reservas").insert({
        perfil, item, quem, recado: texto(corpo.recado, 300),
      });
      /* violação da unicidade = alguém reservou primeiro */
      if (error) return json({ erro: "ja-reservado" }, 409);
      return json({ ...(await verCha(cha)), ok: true });
    }

    /* Confirmar presença — o mesmo nome atualiza a resposta anterior */
    case "presenca": {
      const quem = texto(corpo.quem, 60);
      if (!quem) return json({ erro: "campos" }, 400);
      if (await contar("nb_presencas", perfil) >= TETO.presencas) return json({ erro: "cheio" }, 429);
      const { error } = await db.from("nb_presencas").upsert({
        perfil, quem,
        pessoas: Math.max(1, Math.min(20, Number(corpo.pessoas) || 1)),
        vai: corpo.vai !== false,
        recado: texto(corpo.recado, 300),
      }, { onConflict: "perfil,quem_chave" });
      if (error) return json({ erro: "presenca" }, 500);
      return json({ ...(await verCha(cha)), ok: true });
    }

    /* Sugerir um presente que não está na lista — a mãe aprova no app */
    case "sugerir": {
      const quem = texto(corpo.quem, 60), oque = texto(corpo.oque, 120);
      if (!quem || !oque) return json({ erro: "campos" }, 400);
      if (await contar("nb_sugestoes", perfil) >= TETO.sugestoes) return json({ erro: "cheio" }, 429);
      const { error } = await db.from("nb_sugestoes").insert({ perfil, quem, oque });
      if (error) return json({ erro: "sugerir" }, 500);
      return json({ ...(await verCha(cha)), ok: true });
    }

    default:
      return json({ erro: "acao" }, 400);
  }
});
