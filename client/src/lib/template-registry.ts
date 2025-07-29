// Template Registry - Centralized template exports
import MMP1Template from '../components/templates/MMP1Template';
import CCTVJetVacTemplate from '../components/templates/CCTVJetVacTemplate';

export const templates = [
  MMP1Template, // Add MMP1Template to the array
  CCTVJetVacTemplate, // Add CCTVJetVacTemplate to the array
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