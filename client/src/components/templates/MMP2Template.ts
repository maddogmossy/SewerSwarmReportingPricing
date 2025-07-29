import { createTemplate } from "@/lib/templates";
import { PlaceholderCard } from "@/components/ui/PlaceholderCard";

const MMP2Template = createTemplate({
  id: "mmp2-template",
  templateId: "MMP2Template",
  title: "MMP2 Template (F603)",
  name: "MMP2 Template",
  categoryId: "f-cctv-jet-vac", 
  description: "Standalone test template under CCTV Jet Vac",
  cards: [
    {
      id: "card-1",
      name: "Placeholder Card 1",
      component: PlaceholderCard,
    },
    {
      id: "card-2", 
      name: "Placeholder Card 2",
      component: PlaceholderCard,
    },
    {
      id: "card-3",
      name: "Placeholder Card 3", 
      component: PlaceholderCard,
    },
    {
      id: "card-4",
      name: "Placeholder Card 4",
      component: PlaceholderCard,
    },
    {
      id: "card-5",
      name: "Placeholder Card 5",
      component: PlaceholderCard,
    },
  ],
});

export default MMP2Template;