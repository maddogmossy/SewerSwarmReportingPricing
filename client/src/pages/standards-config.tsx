import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface SectorStandard {
  id: number;
  sector: string;
  standardName: string;
  bellyThreshold: number;
  description: string;
  authority: string;
  referenceDocument: string;
  createdAt: string;
  updatedAt: string;
}

interface DefectRule {
  type: string;
  mscc5Code: string;
  description: string;
  outcome: string;
  status: 'pass' | 'conditional' | 'fail';
}

interface StandardsData {
  sector: string;
  sectorName: string;
  color: string;
  primaryStandards: string[];
  defectRules: {
    [category: string]: {
      description: string;
      rules: DefectRule[];
      additionalInfo: string[];
    };
  };
}

export function StandardsConfig() {
  const [location] = useLocation();
  const [selectedSector, setSelectedSector] = useState<string>('');
  
  // Extract sector from URL parameter
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const sectorParam = urlParams.get('sector') || '';

  useEffect(() => {
    setSelectedSector(sectorParam);
  }, [sectorParam]);

  const sectorDisplayNames = {
    utilities: 'Utilities',
    adoption: 'Adoption',
    highways: 'Highways',
    insurance: 'Insurance',
    construction: 'Construction',
    domestic: 'Domestic'
  };

  const standardsData: { [key: string]: StandardsData } = {
    adoption: {
      sector: 'adoption',
      sectorName: 'Adoption',
      color: '#10b981',
      primaryStandards: [
        'Sewers for Adoption 7th/8th Edition',
        'WRc MSCC5',
        'Model Contract Document for Sewer Condition Inspection',
        'Civil Engineering Specification for the Water Industry (CESWI)',
        'BS EN 1610:2015',
        'Water Industry Act 1991 Section 104'
      ],
      defectRules: {
        'Cracks': {
          description: '📌 Cracks (CR, CC, CL) are NOT always a "fail" under SFA7: Instead, they are graded as conditional defects and must be interpreted in context.',
          rules: [
            { type: 'Fine Cracks', mscc5Code: 'CR or CL', description: 'Longitudinal/Circumferential, <0.5 mm wide', outcome: 'Conditional – Pass unless progressive', status: 'conditional' },
            { type: 'Minor Displacement', mscc5Code: 'JDL', description: '<6mm offset, no visible infiltration', outcome: 'Conditional', status: 'conditional' },
            { type: 'Multiple Hairline Cracks', mscc5Code: 'CMJ', description: 'Not continuous or affecting structure', outcome: 'Conditional', status: 'conditional' },
            { type: 'Fractures or Broken Pipes', mscc5Code: 'BF, FJ, FX', description: 'Full-depth structural loss, angular cracks', outcome: 'Fail – Must be repaired', status: 'fail' },
            { type: 'Crack + Infiltration', mscc5Code: 'CCJ, CRJ + IN', description: 'If water is entering, or soil staining seen', outcome: 'Fail', status: 'fail' },
            { type: 'Progressive / Multiple Cracks', mscc5Code: 'CMJ + STR Grade 4/5', description: 'Aggregated damage score too high', outcome: 'Fail', status: 'fail' },
            { type: 'Any Crack > 0.5mm wide', mscc5Code: 'CR, CC, CL + wide', description: 'Defined as structural under WRc', outcome: 'Fail if confirmed', status: 'fail' }
          ],
          additionalInfo: [
            'SFA7, Appendix H: "Pipes must be free of structural defects that may compromise their performance under load or hydraulic capacity."',
            'CESWI Clause 507.3: "Pipes with visible structural defects shall be replaced or relined prior to adoption."',
            'MSCC5 Guidance: Cracks without visible infiltration or deformation are condition grades 2–3, which are not automatic fails.'
          ]
        },
        'Joint Defects': {
          description: 'Joint defects include displaced joints, open joints, and joint infiltration requiring specific assessment under adoption standards.',
          rules: [
            { type: 'Minor Joint Displacement', mscc5Code: 'JDL', description: '<6mm displacement, no infiltration', outcome: 'Conditional – Monitor', status: 'conditional' },
            { type: 'Major Joint Displacement', mscc5Code: 'JDM', description: '6-12mm displacement', outcome: 'Fail – Repair required', status: 'fail' },
            { type: 'Open Joint Minor', mscc5Code: 'OJL', description: 'Minor opening, no soil ingress', outcome: 'Conditional', status: 'conditional' },
            { type: 'Open Joint Major', mscc5Code: 'OJM', description: 'Major opening, potential soil ingress', outcome: 'Fail – Immediate repair', status: 'fail' },
            { type: 'Joint Infiltration', mscc5Code: 'JI', description: 'Water entering through joints', outcome: 'Fail – Seal required', status: 'fail' }
          ],
          additionalInfo: [
            'OS20x Standard: Joint displacements >6mm require remedial action',
            'Adoption criteria: All joint defects affecting structural integrity must be repaired',
            'Infiltration at joints indicates potential long-term stability issues'
          ]
        },
        'Deformation': {
          description: 'Pipe deformation affecting cross-sectional area and hydraulic capacity under adoption standards.',
          rules: [
            { type: 'Minor Deformation', mscc5Code: 'DEF', description: '<5% cross-sectional area loss', outcome: 'Pass – Monitor', status: 'pass' },
            { type: 'Moderate Deformation', mscc5Code: 'DEF', description: '5-10% cross-sectional area loss', outcome: 'Conditional', status: 'conditional' },
            { type: 'Significant Deformation', mscc5Code: 'DEF', description: '10-25% cross-sectional area loss', outcome: 'Fail – Repair required', status: 'fail' },
            { type: 'Severe Deformation', mscc5Code: 'DEF', description: '>25% cross-sectional area loss', outcome: 'Fail – Replace required', status: 'fail' }
          ],
          additionalInfo: [
            'BS EN 1610:2015: Deformation limits based on pipe material and loading conditions',
            'Adoption standard: Deformation >10% typically requires remedial action',
            'Hydraulic capacity significantly affected above 15% deformation'
          ]
        },
        'Debris and Deposits': {
          description: 'Debris, deposits, and sediment accumulation affecting pipe performance and adoptability.',
          rules: [
            { type: 'Light Debris', mscc5Code: 'DER', description: '<10% cross-sectional obstruction', outcome: 'Pass – Cleanse before adoption', status: 'pass' },
            { type: 'Moderate Debris', mscc5Code: 'DER', description: '10-25% cross-sectional obstruction', outcome: 'Conditional – Clean and resurvey', status: 'conditional' },
            { type: 'Heavy Debris', mscc5Code: 'DER', description: '>25% cross-sectional obstruction', outcome: 'Fail – Full cleansing required', status: 'fail' },
            { type: 'Sediment Deposits', mscc5Code: 'DES', description: 'Settled material in pipe invert', outcome: 'Cleanse before adoption', status: 'conditional' },
            { type: 'Construction Debris', mscc5Code: 'DER', description: 'Construction materials in pipe', outcome: 'Fail – Remove before adoption', status: 'fail' }
          ],
          additionalInfo: [
            'All debris must be removed before adoption completion',
            'Post-cleansing survey required to confirm successful removal',
            'Construction debris indicates incomplete building works'
          ]
        }
      }
    },
    utilities: {
      sector: 'utilities',
      sectorName: 'Utilities',
      color: '#3b82f6',
      primaryStandards: [
        'WRc MSCC5 (Manual of Sewer Condition Classification)',
        'WRc SRM (Sewerage Rehabilitation Manual)',
        'WRc Drain Repair Book 4th Edition',
        'WRc Sewer Cleaning Manual',
        'BS EN 752:2017 - Drain and sewer systems',
        'Water Industry Act 1991'
      ],
      defectRules: {
        'Structural Defects': {
          description: 'MSCC5 structural defects requiring immediate assessment and potential repair under utilities standards.',
          rules: [
            { type: 'Fractures', mscc5Code: 'FC', description: 'Circumferential or longitudinal fractures', outcome: 'Grade 3-4 – Repair required', status: 'fail' },
            { type: 'Collapsed Pipe', mscc5Code: 'CO', description: 'Complete structural failure', outcome: 'Grade 5 – Immediate replacement', status: 'fail' },
            { type: 'Deformation', mscc5Code: 'DEF', description: 'Pipe shape distortion >10%', outcome: 'Grade 3-4 – Assessment required', status: 'fail' },
            { type: 'Root Intrusion', mscc5Code: 'RI', description: 'Roots penetrating pipe wall', outcome: 'Grade 2-3 – Root cutting required', status: 'conditional' },
            { type: 'Joint Displacement', mscc5Code: 'JDL/JDM', description: 'Joint misalignment', outcome: 'Grade 2-4 – Repair based on severity', status: 'conditional' }
          ],
          additionalInfo: [
            'MSCC5 grading determines repair priority and method',
            'Structural defects Grade 4+ require immediate action',
            'WRc SRM provides repair method guidance'
          ]
        },
        'Service Defects': {
          description: 'MSCC5 service defects affecting operational performance and maintenance requirements.',
          rules: [
            { type: 'Debris/Deposits', mscc5Code: 'DER/DES', description: 'Material obstruction in pipe', outcome: 'Grade 2-3 – Cleansing required', status: 'conditional' },
            { type: 'Water Level', mscc5Code: 'WL', description: 'Standing water >25% pipe height', outcome: 'Grade 3 – Investigation required', status: 'conditional' },
            { type: 'Infiltration', mscc5Code: 'IN', description: 'Water entering pipe system', outcome: 'Grade 2-3 – Sealing required', status: 'conditional' },
            { type: 'Obstructions', mscc5Code: 'OB', description: 'Foreign objects in pipe', outcome: 'Grade 2-4 – Removal required', status: 'conditional' },
            { type: 'Surface Damage', mscc5Code: 'SUR', description: 'Interior surface deterioration', outcome: 'Grade 1-2 – Monitor/repair', status: 'pass' }
          ],
          additionalInfo: [
            'Service defects focus on operational efficiency',
            'Cleansing standards per WRc Sewer Cleaning Manual',
            'Water level thresholds: >25% indicates potential blockage'
          ]
        }
      }
    },
    construction: {
      sector: 'construction',
      sectorName: 'Construction',
      color: '#8b5cf6',
      primaryStandards: [
        'BS EN 1610:2015 - Construction and testing of drains and sewers',
        'WRc MSCC5',
        'Building Regulations Approved Document H',
        'BS 8301:1985 - Code of practice for building drainage',
        'Construction (Design and Management) Regulations 2015'
      ],
      defectRules: {
        'Installation Defects': {
          description: 'Construction-phase defects requiring immediate remediation before project completion.',
          rules: [
            { type: 'Poor Bedding', mscc5Code: 'PB', description: 'Inadequate pipe support/bedding', outcome: 'Fail – Re-lay required', status: 'fail' },
            { type: 'Incorrect Gradient', mscc5Code: 'IG', description: 'Fall not meeting design specification', outcome: 'Fail – Relay to correct gradient', status: 'fail' },
            { type: 'Joint Defects', mscc5Code: 'JD', description: 'Poor joint sealing/alignment', outcome: 'Fail – Rejoint required', status: 'fail' },
            { type: 'Pipe Damage', mscc5Code: 'PD', description: 'Construction damage to pipe', outcome: 'Fail – Replace damaged section', status: 'fail' },
            { type: 'Incomplete Installation', mscc5Code: 'II', description: 'Unfinished construction work', outcome: 'Fail – Complete installation', status: 'fail' }
          ],
          additionalInfo: [
            'BS EN 1610:2015 specifies installation requirements',
            'All construction defects must be remedied before handover',
            'Post-construction testing required per BS standards'
          ]
        },
        'Material Compliance': {
          description: 'Material and component compliance with construction standards and specifications.',
          rules: [
            { type: 'Non-Compliant Materials', mscc5Code: 'NCM', description: 'Materials not meeting specification', outcome: 'Fail – Replace with compliant materials', status: 'fail' },
            { type: 'Damaged Materials', mscc5Code: 'DM', description: 'Materials damaged during construction', outcome: 'Fail – Replace damaged components', status: 'fail' },
            { type: 'Incorrect Specification', mscc5Code: 'IS', description: 'Wrong materials/components used', outcome: 'Fail – Replace with correct specification', status: 'fail' },
            { type: 'Quality Issues', mscc5Code: 'QI', description: 'Materials below required quality', outcome: 'Fail – Replace with quality materials', status: 'fail' }
          ],
          additionalInfo: [
            'All materials must meet project specifications',
            'Quality control testing required during construction',
            'Compliance certificates required for drainage materials'
          ]
        }
      }
    },
    highways: {
      sector: 'highways',
      sectorName: 'Highways',
      color: '#f97316',
      primaryStandards: [
        'HADDMS (Highway Asset and Drainage Data Management System)',
        'Design Manual for Roads and Bridges (DMRB)',
        'Specification for Highway Works (SHW)',
        'BS EN 752:2017',
        'Traffic Management Act 2004'
      ],
      defectRules: {
        'Highway Drainage Defects': {
          description: 'Highway drainage system defects affecting road safety and infrastructure integrity.',
          rules: [
            { type: 'Gully Defects', mscc5Code: 'GD', description: 'Damaged or blocked highway gullies', outcome: 'Priority repair – Road safety risk', status: 'fail' },
            { type: 'Carriageway Flooding', mscc5Code: 'CF', description: 'Surface water not draining', outcome: 'Emergency repair – Traffic hazard', status: 'fail' },
            { type: 'Pipe Collapse', mscc5Code: 'PC', description: 'Highway drain collapse', outcome: 'Immediate repair – Road closure risk', status: 'fail' },
            { type: 'Structural Damage', mscc5Code: 'SD', description: 'Damage to highway drainage structure', outcome: 'Structural assessment required', status: 'fail' },
            { type: 'Debris Blockage', mscc5Code: 'DB', description: 'Highway drain blocked with debris', outcome: 'Cleansing required – Monitor', status: 'conditional' }
          ],
          additionalInfo: [
            'HADDMS categorizes defects by risk to highway users',
            'Emergency response required for flooding/collapse',
            'Regular cleansing prevents major blockages'
          ]
        }
      }
    },
    insurance: {
      sector: 'insurance',
      sectorName: 'Insurance',
      color: '#ef4444',
      primaryStandards: [
        'ABI (Association of British Insurers) Guidelines',
        'RICS Building Survey Standards',
        'BS 8102:2009 - Code of practice for protection of buildings',
        'Building Research Establishment (BRE) Standards',
        'Insurance Standards for Property Assessment'
      ],
      defectRules: {
        'Insurance Assessment Defects': {
          description: 'Defects relevant to insurance claims and property damage assessment.',
          rules: [
            { type: 'Subsidence Risk', mscc5Code: 'SR', description: 'Drainage causing ground movement', outcome: 'High risk – Immediate assessment', status: 'fail' },
            { type: 'Property Damage', mscc5Code: 'PD', description: 'Drainage affecting building structure', outcome: 'Claim relevant – Professional assessment', status: 'fail' },
            { type: 'Flood Risk', mscc5Code: 'FR', description: 'Drainage increasing flood potential', outcome: 'Risk assessment required', status: 'conditional' },
            { type: 'Maintenance Issues', mscc5Code: 'MI', description: 'Poor maintenance causing deterioration', outcome: 'May affect coverage', status: 'conditional' }
          ],
          additionalInfo: [
            'ABI guidelines determine insurance liability',
            'Professional structural assessment often required',
            'Maintenance records important for claims'
          ]
        }
      }
    },
    domestic: {
      sector: 'domestic',
      sectorName: 'Domestic',
      color: '#eab308',
      primaryStandards: [
        'Building Regulations Approved Document H',
        'BS 8301:1985 - Building drainage',
        'Trading Standards Guidelines',
        'Building Act 1984',
        'Private Drainage Protection Standards'
      ],
      defectRules: {
        'Domestic Drainage Defects': {
          description: 'Residential drainage defects affecting domestic properties and compliance.',
          rules: [
            { type: 'Building Regs Compliance', mscc5Code: 'BRC', description: 'Non-compliance with Part H', outcome: 'Fail – Bring to compliance', status: 'fail' },
            { type: 'Health Hazard', mscc5Code: 'HH', description: 'Drainage creating health risk', outcome: 'Immediate action required', status: 'fail' },
            { type: 'Nuisance Issues', mscc5Code: 'NI', description: 'Drainage causing neighbor issues', outcome: 'Resolution required', status: 'conditional' },
            { type: 'Maintenance Required', mscc5Code: 'MR', description: 'Routine maintenance needed', outcome: 'Homeowner responsibility', status: 'pass' }
          ],
          additionalInfo: [
            'Building Regulations compliance mandatory',
            'Health and safety issues require immediate action',
            'Homeowner responsible for private drainage maintenance'
          ]
        }
      }
    }
  };

  const currentSectorData = selectedSector ? standardsData[selectedSector] : null;

  const getStatusIcon = (status: 'pass' | 'conditional' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'conditional':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'conditional' | 'fail') => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200';
      case 'conditional':
        return 'bg-amber-50 border-amber-200';
      case 'fail':
        return 'bg-red-50 border-red-200';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/upload">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
        </Link>
        <Settings className="h-6 w-6" style={{ color: currentSectorData?.color || '#3b82f6' }} />
        <h1 className="text-3xl font-bold">
          Display Standards/Guide Rules
          {currentSectorData && ` - ${currentSectorData.sectorName} Sector`}
        </h1>
      </div>

      {currentSectorData ? (
        <div className="space-y-6">
          {/* Primary Standards */}
          <Card>
            <CardHeader>
              <CardTitle style={{ color: currentSectorData.color }}>
                {currentSectorData.sectorName} Standards - According to:
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentSectorData.primaryStandards.map((standard, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: currentSectorData.color }}>•</span>
                    <span className="text-sm font-medium">{standard}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Defect Rules */}
          {Object.entries(currentSectorData.defectRules).map(([category, categoryData]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-xl">
                  {currentSectorData.sectorName} Standards – {category}: Pass or Fail?
                </CardTitle>
                <p className="text-sm text-gray-600">{categoryData.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Pass/Conditional Rules */}
                  <div>
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-green-700 mb-4">
                      <CheckCircle className="h-5 w-5" />
                      When {category} are Pass/Conditional
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Type</th>
                            <th className="text-left p-3 font-semibold">MSCC5 Code</th>
                            <th className="text-left p-3 font-semibold">Description</th>
                            <th className="text-left p-3 font-semibold">Typical Outcome</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryData.rules.filter(rule => rule.status !== 'fail').map((rule, index) => (
                            <tr key={index} className={`border-b ${getStatusColor(rule.status)}`}>
                              <td className="p-3 font-medium">{rule.type}</td>
                              <td className="p-3 font-mono text-sm">{rule.mscc5Code}</td>
                              <td className="p-3 text-sm">{rule.description}</td>
                              <td className="p-3 flex items-center gap-2">
                                {getStatusIcon(rule.status)}
                                <span className="text-sm">{rule.outcome}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Fail Rules */}
                  {categoryData.rules.some(rule => rule.status === 'fail') && (
                    <div>
                      <h4 className="flex items-center gap-2 text-lg font-semibold text-red-700 mb-4">
                        <XCircle className="h-5 w-5" />
                        When {category} are a Fail (Remedial Required)
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-semibold">Type</th>
                              <th className="text-left p-3 font-semibold">MSCC5 Code</th>
                              <th className="text-left p-3 font-semibold">Description</th>
                              <th className="text-left p-3 font-semibold">{currentSectorData.sectorName} Outcome</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryData.rules.filter(rule => rule.status === 'fail').map((rule, index) => (
                              <tr key={index} className={`border-b ${getStatusColor(rule.status)}`}>
                                <td className="p-3 font-medium">{rule.type}</td>
                                <td className="p-3 font-mono text-sm">{rule.mscc5Code}</td>
                                <td className="p-3 text-sm">{rule.description}</td>
                                <td className="p-3 flex items-center gap-2">
                                  {getStatusIcon(rule.status)}
                                  <span className="text-sm">{rule.outcome}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="flex items-center gap-2 font-semibold text-blue-800 mb-3">
                      📚 Backed by:
                    </h4>
                    <ul className="space-y-2">
                      {categoryData.additionalInfo.map((info, index) => (
                        <li key={index} className="text-sm text-blue-700 italic">
                          {info}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Sector Selection */
        <Card>
          <CardHeader>
            <CardTitle>Select a Sector to View Standards</CardTitle>
            <p className="text-sm text-gray-600">
              Choose a sector to view detailed defect classification rules and standards guidance.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(standardsData).map(([sectorId, sectorData]) => (
                <Link key={sectorId} href={`/standards-config?sector=${sectorId}`}>
                  <div 
                    className="border-2 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer h-full"
                    style={{ borderColor: sectorData.color }}
                  >
                    <h3 
                      className="font-semibold text-lg mb-2"
                      style={{ color: sectorData.color }}
                    >
                      {sectorData.sectorName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {Object.keys(sectorData.defectRules).length} defect categories
                    </p>
                    <div className="text-xs text-gray-500">
                      <p><strong>Standards:</strong> {sectorData.primaryStandards.length} standards</p>
                      <p><strong>Rules:</strong> {Object.values(sectorData.defectRules).reduce((total, cat) => total + cat.rules.length, 0)} defect rules</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StandardsConfig;