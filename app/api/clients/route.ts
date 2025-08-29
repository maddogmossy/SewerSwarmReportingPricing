// app/api/clients/route.ts
import { NextResponse } from "next/server";

type Client = { id: string; name: string };

function store() {
  const g = globalThis as any;
  if (!g.__CLIENTS_STORE__) g.__CLIENTS_STORE__ = new Map<string, Client>();
  return g.__CLIENTS_STORE__ as Map<string, Client>;
}

export async function GET() {
  return NextResponse.json(Array.from(store().values()), { status: 200 });
}

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const name = (body?.name ?? "").toString().trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const id = "c_" + Math.random().toString(36).slice(2, 10);
  const client = { id, name };
  store().set(id, client);
  return NextResponse.json(client, { status: 201 });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
