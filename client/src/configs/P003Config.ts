import MMP1Template from "@/components/templates/MMP1Template";
import CCTVJetVacTemplate from "@/components/templates/CCTVJetVacTemplate";

const P003Config = {
  id: "P003",
  name: "Template Configurations",
  templates: [
    {
      id: "test-card",
      name: "Test Cat Card Configuration",
      template: MMP1Template,
    },
    {
      id: "f-cctv-jet-vac",
      name: "CCTV/Jet Vac Configuration",
      template: CCTVJetVacTemplate,
    },
  ],
};

export default P003Config;