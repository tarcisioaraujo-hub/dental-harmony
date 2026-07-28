import { createFileRoute } from "@tanstack/react-router";

import { GAS_DEFAULT_URL } from "@/lib/gas-config";

/**
 * Proxy server-side para o Web App do Google Apps Script.
 *
 * Motivo: o Apps Script responde com redirect 302 para googleusercontent.com e
 * NÃO envia cabeçalhos CORS em respostas de erro/login. Chamando direto do
 * navegador, qualquer falha de permissão vira "Network Error" opaco.
 * Aqui a chamada sai do servidor (sem CORS) e devolvemos sempre JSON legível.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

function gasUrl() {
  return (
    (typeof process !== "undefined" && process.env?.GAS_API_URL) ||
    GAS_DEFAULT_URL
  );
}

/** Converte a resposta bruta do Apps Script em JSON ou erro explícito. */
async function normalize(res: Response) {
  const text = await res.text();

  try {
    return jsonResponse(JSON.parse(text), 200);
  } catch {
    // Não é JSON: quase sempre é a página de login/"Access Denied" do Google.
    const isAccessDenied = /Access Denied|accounts\.google\.com|Sign in/i.test(text);
    const detail = isAccessDenied
      ? 'O Web App do Apps Script está com acesso restrito (HTTP ' +
        res.status +
        '). Reimplante em "Implantar → Gerenciar implantações → Editar → Quem pode acessar: Qualquer pessoa" e use a nova URL /exec.'
      : `Resposta inesperada do Apps Script (HTTP ${res.status}): ${text.slice(0, 300)}`;
    return jsonResponse({ ok: false, error: detail }, 502);
  }
}

export const Route = createFileRoute("/api/public/gas")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      GET: async ({ request }) => {
        try {
          const incoming = new URL(request.url);
          const target = new URL(gasUrl());
          incoming.searchParams.forEach((v, k) => target.searchParams.set(k, v));

          const res = await fetch(target.toString(), {
            method: "GET",
            redirect: "follow",
            headers: { Accept: "application/json, text/plain, */*" },
          });
          return await normalize(res);
        } catch (error) {
          console.error("[gas-proxy][GET]", error);
          return jsonResponse(
            { ok: false, error: error instanceof Error ? error.message : String(error) },
            502,
          );
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.text();
          const res = await fetch(gasUrl(), {
            method: "POST",
            redirect: "follow",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body,
          });
          return await normalize(res);
        } catch (error) {
          console.error("[gas-proxy][POST]", error);
          return jsonResponse(
            { ok: false, error: error instanceof Error ? error.message : String(error) },
            502,
          );
        }
      },
    },
  },
});
