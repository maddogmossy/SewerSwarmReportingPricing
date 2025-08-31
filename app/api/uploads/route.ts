export const runtime = "nodejs";

import { NextResponse } from "next/server";
// alias → relative
import { db } from "../../../db";
import { reports } from "../../../db/schema";

// …your existing upload handler code…
