// Template Registry - Centralized template exports
import MMP2Template from '../components/templates/MMP2Template';

export const templates = [
  MMP2Template, // Add MMP2Template to the array
];

export const getTemplateById = (id: string) => {
  return templates.find(template => template.id === id);
};

export const getTemplateByCategoryId = (categoryId: string) => {
  return templates.find(template => template.categoryId === categoryId);
};

// Check if a category has a template (for UI display logic)
export const hasTemplate = (categoryId: string) => {
  return getTemplateByCategoryId(categoryId) !== undefined;
};

export const getAllTemplates = () => {
  return templates;
};