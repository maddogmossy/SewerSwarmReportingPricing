// Template Map - Maps templateId to actual template components
// Used by P003Config and other template systems for dynamic component rendering

import { MMP1Template } from '@/components/MMP1Template';
import { MMP2Template } from '@/components/templates/MMP2Template';
import { TP1Template } from '@/components/TP1Template';

export const TemplateMap = {
  MMP1Template,
  MMP2Template,
  TP1Template,
};

export default TemplateMap;