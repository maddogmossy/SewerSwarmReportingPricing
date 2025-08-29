// app/upload/[sector]/page.tsx
import UploadClient from "./upload-client";

const sectorMeta: Record<
  string,
  { title: string; standards: string; code: string }
> = {
  utilities:   { title: "Utilities",    standards: "WRc SRM standards",  code: "S1" },
  adoption:    { title: "Adoption",     standards: "SfA8 compliance",    code: "S2" },
  highways:    { title: "Highways",     standards: "DMRB standards",     code: "S3" },
  domestic:    { title: "Domestic",     standards: "Regulatory compliance", code: "S4" },
  insurance:   { title: "Insurance",    standards: "ABI guidelines",     code: "S5" },
  construction:{ title: "Construction", standards: "Building regs",      code: "S6" },
};

export default function Page({ params }: { params: { sector: string } }) {
  const meta = sectorMeta[params.sector] ?? {
    title: params.sector,
    standards: "",
    code: "",
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <UploadClient
        sectorSlug={params.sector}
        sectorCode={meta.code}
        sectorTitle={meta.title}
        sectorStandards={meta.standards}
      />
    </main>
  );
}
