// app/api/clients/route.ts
import { NextResponse } from "next/server";

type Client = { id: string; name: string };

/**
 * Tiny in-memory store so the endpoint works in dev and on Vercel.
 * (It will reset when the function cold-starts; swap for a real DB later.)
 */
function store(): Map<string, Client> {
  const g = globalThis as any;
  if (!g.__CLIENTS_STORE__) g.__CLIENTS_STORE__ = new Map<string, Client>();
  return g.__CLIENTS_STORE__;
}

/** GET /api/clients -> 200 [{ id, name }, ...] */
export async function GET() {
  const data = Array.from(store().values());
  return NextResponse.json(data, { status: 200 });
}

/** POST /api/clients  { name } -> 201 { id, name } */
export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }

  const name = (body?.name ?? "").toString().trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const id = "c_" + Math.random().toString(36).slice(2, 10);
  const client: Client = { id, name };
  store().set(id, client);

  return NextResponse.json(client, { status: 201 });
}

/** Preflight (handy for tests/tools) */
export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
