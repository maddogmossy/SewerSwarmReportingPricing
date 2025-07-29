import { createTemplate } from "@/lib/templates";
import { PlaceholderCard } from "@/components/ui/PlaceholderCard";

export const CCTVJetVacTemplate = createTemplate({
  id: "cctv-jet-vac-template",
  templateId: "CCTVJetVacTemplate", 
  title: "CCTV/Jet Vac Template",
  name: "CCTV/Jet Vac Template",
  categoryId: "f-cctv-jet-vac",
  description: "CCTV/Jet Vac Template with ID1-ID6 selection system and enhanced configuration management",
  cards: [
    {
      id: "mm1-card",
      name: "MM1 - ID Selection (P002 Pattern)",
      component: PlaceholderCard,
    },
    {
      id: "mm2-card", 
      name: "MM2 - Color Picker",
      component: PlaceholderCard,
    },
    {
      id: "mm3-card",
      name: "MM3 - UK Drainage Pipe Sizes", 
      component: PlaceholderCard,
    },
    {
      id: "mm4-card",
      name: "MM4 - Data Management",
      component: PlaceholderCard,
    },
    {
      id: "mm5-card",
      name: "MM5 - Vehicle Travel",
      component: PlaceholderCard,
    },
  ],
});

export default CCTVJetVacTemplate;