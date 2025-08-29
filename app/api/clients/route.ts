// app/api/clients/route.ts
import { NextResponse } from "next/server";

export const runtime = "edge";

// In-memory seed list (for picker). Replace with your DB later.
const SEED = [
  { id: "c1", name: "Example Client A" },
  { id: "c2", name: "Example Client B" },
];

export async function GET() {
  // You can add simple filtering later via ?q=
  return NextResponse.json(SEED, { status: 200 });
}

// Optional: accept creation of a new client (no persistence here)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const name = (body?.name ?? "").toString().trim();
    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const client = { id: crypto.randomUUID(), name };
    // NOTE: not persisted – swap this for DB/Blob/KV when ready.
    return NextResponse.json(client, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
