// app/api/uploads/route.ts
import { reports } from "@/db/schema";
// ...
await db.insert(reports).values({
  sectorCode,
  sectorTitle,        // if you have it (e.g., "Utilities")
  clientName,
  projectFolder,
  projectNo,
  address,
  postcode,
  pathname,
  url,
  filename: file.name,
  contentType: (file as any).type || guessType(file.name),
  size: file.size,
});
