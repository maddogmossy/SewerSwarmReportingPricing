// P003 Configuration - F606 CCTV/Jet Vac Category
// Defines P003 category templates and configuration options

export interface P003Template {
  id: string;
  name: string;
  description: string;
  templateType: 'MMP1' | 'MMP2';
  icon: string;
  defaultValues?: any;
}

export const P003_TEMPLATES: P003Template[] = [
  {
    id: 'mmp1-option',
    name: 'MMP1 Template',
    description: 'Standard MMP1 template with 5 placeholder UI cards',
    templateType: 'MMP1',
    icon: 'Settings'
  },
  {
    id: 'mmp2-option', 
    name: 'MMP2 Template',
    description: 'Advanced MMP2 template with enhanced configuration options',
    templateType: 'MMP2',
    icon: 'Video'
  }
];

export const P003_CATEGORY = {
  id: 'f-cctv-jet-vac',
  name: 'F606 CCTV/Jet Vac',
  description: 'F606 CCTV/Jet Vac configuration with MMP2 template',
  templates: P003_TEMPLATES,
  defaultTemplate: 'MMP2'
};

export default P003_CATEGORY;