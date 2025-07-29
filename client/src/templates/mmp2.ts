import { createTemplate } from "@/lib/templates";
import { PlaceholderCard } from "@/components/ui/PlaceholderCard";

export const MMP2Template = createTemplate({
  id: "mmp2-template",
  name: "MMP2 Template",
  categoryId: "mmp2-card", 
  description: "MMP2 Template for enhanced configuration management with 5 placeholder cards.",
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