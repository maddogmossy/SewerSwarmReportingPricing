/**
 * SECTOR-SPECIFIC STANDARDS CONFIGURATION
 * 
 * This module defines the standards applied for each of the six sectors
 * and provides the standards information for display on reports
 */

export interface SectorStandard {
  name: string;
  version?: string;
  description: string;
  authority: string;
  url?: string;
}

export interface SectorStandardsConfig {
  sectorName: string;
  sectorColor: string;
  sectorIcon: string;
  standards: SectorStandard[];
  complianceNote: string;
}

export const SECTOR_STANDARDS: Record<string, SectorStandardsConfig> = {
  utilities: {
    sectorName: "Utilities",
    sectorColor: "#3B82F6", // Blue
    sectorIcon: "Building",
    standards: [
      {
        name: "MSCC5",
        version: "5th Edition",
        description: "Manual of Sewer Condition Classification",
        authority: "WRc Group",
        url: "https://wrcgroup.com/products/mscc5"
      },
      {
        name: "SRM",
        version: "Latest Edition",
        description: "Sewerage Rehabilitation Manual",
        authority: "WRc Group",
        url: "https://wrcgroup.com/products/srm"
      },
      {
        name: "BS EN 752:2017",
        description: "Drain and sewer systems outside buildings - Sewer system management",
        authority: "BSI British Standards",
        url: "https://www.bsigroup.com/en-GB/standards/bs-en-752-2017/"
      },
      {
        name: "Water Industry Act 1991",
        description: "UK legislation governing water and sewerage undertakers",
        authority: "UK Parliament",
        url: "https://www.legislation.gov.uk/ukpga/1991/56"
      },
      {
        name: "WRc Drain Repair Book",
        version: "4th Edition",
        description: "Comprehensive guide to drain repair methods and techniques",
        authority: "WRc Group",
        url: "https://wrcgroup.com/products/drain-repair-book"
      },
      {
        name: "WRc Sewer Cleaning Manual",
        description: "Best practices for sewer cleaning and maintenance",
        authority: "WRc Group",
        url: "https://wrcgroup.com/products/sewer-cleaning-manual"
      }
    ],
    complianceNote: "All observations and recommendations are assessed against WRc Group MSCC5 standards with cross-reference to BS EN 752:2017 requirements for utilities sector compliance."
  },
  
  adoption: {
    sectorName: "Adoption",
    sectorColor: "#10B981", // Green
    sectorIcon: "CheckCircle",
    standards: [
      {
        name: "Sewers for Adoption",
        version: "8th Edition",
        description: "Design and construction guide for adoptable sewers",
        authority: "Water UK",
        url: "https://www.water.org.uk/sewers-for-adoption/"
      },
      {
        name: "OS20x Series",
        description: "Operational Standards for new connections and adoptions",
        authority: "Water UK"
      },
      {
        name: "SSG",
        description: "Specification for the Sewerage Sector Guidance",
        authority: "Water UK"
      },
      {
        name: "DCSG",
        description: "Developers' Code of Sewerage Guidance",
        authority: "Water UK"
      },
      {
        name: "BS EN 1610:2015",
        description: "Construction and testing of drains and sewers",
        authority: "BSI British Standards",
        url: "https://www.bsigroup.com/en-GB/standards/bs-en-1610-2015/"
      },
      {
        name: "Water Industry Act 1991",
        description: "Section 104 agreements and adoption procedures",
        authority: "UK Parliament",
        url: "https://www.legislation.gov.uk/ukpga/1991/56"
      }
    ],
    complianceNote: "All defects are assessed against Sewers for Adoption 8th Edition standards with adoptability determination based on OS20x compliance requirements."
  },
  
  highways: {
    sectorName: "Highways",
    sectorColor: "#F59E0B", // Orange
    sectorIcon: "Car",
    standards: [
      {
        name: "HADDMS",
        description: "Highway Asset Data and Data Management System",
        authority: "Department for Transport",
        url: "https://www.gov.uk/government/publications/highway-asset-data-and-data-management-system-haddms"
      },
      {
        name: "Design Manual for Roads and Bridges",
        version: "Current Edition",
        description: "UK standards for highway drainage design",
        authority: "Department for Transport",
        url: "https://www.standardsforhighways.co.uk/dmrb/"
      },
      {
        name: "BS EN 752:2017",
        description: "Drain and sewer systems outside buildings",
        authority: "BSI British Standards",
        url: "https://www.bsigroup.com/en-GB/standards/bs-en-752-2017/"
      },
      {
        name: "Highways Act 1980",
        description: "UK legislation governing highway drainage responsibilities",
        authority: "UK Parliament",
        url: "https://www.legislation.gov.uk/ukpga/1980/66"
      },
      {
        name: "Surface Water Management Guidelines",
        description: "Highway drainage and flood risk management",
        authority: "Department for Transport"
      }
    ],
    complianceNote: "All highway drainage defects are assessed against HADDMS criteria with compliance verification according to Design Manual for Roads and Bridges standards."
  },
  
  insurance: {
    sectorName: "Insurance",
    sectorColor: "#EF4444", // Red
    sectorIcon: "ShieldCheck",
    standards: [
      {
        name: "ABI Guidelines",
        description: "Association of British Insurers drainage investigation standards",
        authority: "Association of British Insurers",
        url: "https://www.abi.org.uk/"
      },
      {
        name: "RICS Professional Standards",
        description: "Royal Institution of Chartered Surveyors drainage survey standards",
        authority: "RICS",
        url: "https://www.rics.org/uk/upholding-professional-standards/professional-standards/"
      },
      {
        name: "BS EN 752:2017",
        description: "Drain and sewer systems outside buildings",
        authority: "BSI British Standards",
        url: "https://www.bsigroup.com/en-GB/standards/bs-en-752-2017/"
      },
      {
        name: "Defects Analysis Protocol",
        description: "Insurance industry standard for defect classification and liability assessment",
        authority: "ABI Technical Committee"
      },
      {
        name: "Risk Assessment Framework",
        description: "Property damage risk evaluation for drainage defects",
        authority: "Insurance Industry Standards"
      }
    ],
    complianceNote: "All defects are assessed against ABI Guidelines with risk classification and liability determination according to insurance industry standards."
  },
  
  construction: {
    sectorName: "Construction",
    sectorColor: "#8B5CF6", // Purple
    sectorIcon: "HardHat",
    standards: [
      {
        name: "BS EN 1610:2015",
        description: "Construction and testing of drains and sewers",
        authority: "BSI British Standards",
        url: "https://www.bsigroup.com/en-GB/standards/bs-en-1610-2015/"
      },
      {
        name: "BS EN 752:2017",
        description: "Drain and sewer systems outside buildings",
        authority: "BSI British Standards",
        url: "https://www.bsigroup.com/en-GB/standards/bs-en-752-2017/"
      },
      {
        name: "CDM Regulations 2015",
        description: "Construction (Design and Management) Regulations",
        authority: "HSE",
        url: "https://www.hse.gov.uk/construction/cdm/2015/"
      },
      {
        name: "CIRIA Guidelines",
        description: "Construction Industry Research and Information Association drainage standards",
        authority: "CIRIA",
        url: "https://www.ciria.org/"
      },
      {
        name: "NHBC Standards",
        description: "National House Building Council technical standards",
        authority: "NHBC",
        url: "https://www.nhbc.co.uk/builders/products-and-services/techzone/nhbc-standards/"
      }
    ],
    complianceNote: "All construction defects are assessed against BS EN 1610:2015 standards with compliance verification according to CDM Regulations and CIRIA guidelines."
  },
  
  domestic: {
    sectorName: "Domestic",
    sectorColor: "#FBBF24", // Yellow
    sectorIcon: "Home",
    standards: [
      {
        name: "Building Regulations Part H",
        description: "Drainage and waste disposal for domestic properties",
        authority: "UK Government",
        url: "https://www.gov.uk/government/publications/drainage-and-waste-disposal-approved-document-h"
      },
      {
        name: "BS EN 752:2017",
        description: "Drain and sewer systems outside buildings",
        authority: "BSI British Standards",
        url: "https://www.bsigroup.com/en-GB/standards/bs-en-752-2017/"
      },
      {
        name: "Trading Standards Guidelines",
        description: "Consumer protection standards for domestic drainage work",
        authority: "Trading Standards",
        url: "https://www.tradingstandards.uk/"
      },
      {
        name: "Water Supply (Water Fittings) Regulations 1999",
        description: "UK regulations governing domestic water and drainage connections",
        authority: "UK Government",
        url: "https://www.legislation.gov.uk/uksi/1999/1148/contents/made"
      },
      {
        name: "Home Insurance Standards",
        description: "Domestic property drainage maintenance requirements",
        authority: "Insurance Industry"
      }
    ],
    complianceNote: "All domestic drainage defects are assessed against Building Regulations Part H with compliance verification according to Trading Standards guidelines."
  }
};

export function getSectorStandards(sector: string): SectorStandardsConfig | null {
  return SECTOR_STANDARDS[sector] || null;
}

export function getAllSectorStandards(): SectorStandardsConfig[] {
  return Object.values(SECTOR_STANDARDS);
}