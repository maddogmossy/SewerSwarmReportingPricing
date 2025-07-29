// Template Registry - Centralized template exports
import { MMP2Template } from '../templates/mmp2';

export const templates = [
  MMP2Template, // Add MMP2Template to the array
];

export const getTemplateById = (id: string) => {
  return templates.find(template => template.id === id);
};

export const getTemplateByCategoryId = (categoryId: string) => {
  return templates.find(template => template.categoryId === categoryId);
};

export const getAllTemplates = () => {
  return templates;
};