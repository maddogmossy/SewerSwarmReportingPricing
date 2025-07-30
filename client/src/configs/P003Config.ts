// P003 Configuration - F606 CCTV/Jet Vac Category
// Defines P003 category templates and configuration options

export const P003Config = {
  id: "P003",
  name: "CCTV Jet Vac",
  templates: [
    {
      id: "mmp2-template",
      templateId: "MMP2Template",
      title: "MMP2 Template (F606)",
      categoryId: "f-cctv-jet-vac",
      description: "Standalone template under CCTV Jet Vac",
    },
    {
      id: "mmp1-template",
      templateId: "MMP1Template",
      title: "MMP1 Template (F607)",
      categoryId: "f-cctv-van-pack",
      description: "Legacy template under CCTV Van Pack",
    },
  ],
};

export default P003Config;