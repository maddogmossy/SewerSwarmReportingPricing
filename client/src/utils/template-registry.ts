// Template Registry - Central template type mapping
// Defines which template type each categoryId should use

export type TemplateType = 'TP1' | 'P26' | 'P006' | 'P006a' | 'MMP1' | 'MMP2';

export function getTemplateType(categoryId: string): TemplateType {
  switch (categoryId) {
    case "f-cctv-jet-vac":
      return "MMP2";
    case "f-cctv-van-pack":
      return "MMP1";
    case "test-card":
      return "MMP1";
    case "cctv-jet-vac":
      return "MMP1";
    case "cart-card":
      return "TP1";
    case "day-rate-db11":
      return "P26";
    case "cctv":
    case "van-pack":
    case "jet-vac":
    case "cctv-van-pack":
    case "cctv-cleansing-root-cutting":
      return "P006a";
    default:
      // Handle P006 CTF templates
      if (categoryId?.startsWith('P006-')) {
        return "P006";
      }
      // Handle P006a templates
      if (categoryId?.includes('-p006a')) {
        return "P006a";
      }
      // Default fallback
      return "TP1";
  }
}

export default getTemplateType;