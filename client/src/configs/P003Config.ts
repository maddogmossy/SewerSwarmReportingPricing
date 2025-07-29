import MMP1Template from "@/components/templates/MMP1Template";
import MMP2Template from "@/components/templates/MMP2Template";

const P003Config = {
  id: "P003",
  name: "CCTV Jet Vac",
  templates: [
    {
      id: "f-cctv-jet-vac",
      name: "CCTV Jet Vac Config (MM1)",
      template: MMP1Template,
    },
    {
      id: "mmp2-template", 
      name: "MMP2 Template (F603)",
      template: MMP2Template,
    },
  ],
};

export default P003Config;