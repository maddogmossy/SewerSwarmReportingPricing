// Template Creation Library for MMP Template System

export interface TemplateCard {
  id: string;
  name: string;
  component: React.ComponentType<any>;
}

export interface Template {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  cards: TemplateCard[];
}

export function createTemplate(template: Template): Template {
  return template;
}

export const TemplateUtils = {
  getCardById: (template: Template, cardId: string) => {
    return template.cards.find(card => card.id === cardId);
  },
  
  getCardCount: (template: Template) => {
    return template.cards.length;
  },
  
  validateTemplate: (template: Template) => {
    if (!template.id || !template.name || !template.categoryId) {
      throw new Error('Template missing required fields: id, name, categoryId');
    }
    
    if (!template.cards || template.cards.length === 0) {
      throw new Error('Template must have at least one card');
    }
    
    return true;
  }
};