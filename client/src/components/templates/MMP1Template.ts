import { createTemplate } from "@/lib/templates";
import { PlaceholderCard } from "@/components/ui/PlaceholderCard";

export const MMP1Template = createTemplate({
  id: "mmp1-template",
  templateId: "MMP1Template", 
  title: "MMP1 Template",
  name: "MMP1 Template",
  categoryId: "test-card",
  description: "MMP1 Template for test card configuration - ID1 - ID1.",
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

export default MMP1Template;