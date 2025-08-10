// Fallback data for when database is unavailable
export const FALLBACK_F690_CONFIG = {
  id: 690,
  userId: 'system',
  sector: 'utilities',
  categoryId: 'cctv-jet-vac',
  categoryName: 'F690 CCTV/Jet Vac',
  pipeSize: '150',
  pipeSizeId: 1501,
  templateType: 'MMP1',
  mmData: {
    mm4DataByPipeSize: {
      '150-1501': [{
        id: 1,
        blueValue: '1850',  // Day rate
        greenValue: '30',   // Runs per shift
        purpleDebris: '30', // Debris range
        purpleLength: '99.99' // Length range
      }]
    },
    mm5Rows: [{
      id: 1,
      vehicleWeight: '',
      costPerMile: ''
    }],
    mm4Rows: [{
      id: 1,
      blueValue: '1850',
      greenValue: '30', 
      purpleDebris: '30',
      purpleLength: '99.99'
    }],
    selectedPipeSize: '150',
    selectedPipeSizeId: 1501,
    mm1Colors: '#F5A3A3',
    mm2IdData: ['id7'],
    mm3CustomPipeSizes: []
  },
  pricingOptions: [],
  quantityOptions: [],
  minQuantityOptions: [],
  rangeOptions: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

export const FALLBACK_WORK_CATEGORIES = [
  {
    id: 1,
    name: 'CCTV/Jet Vac',
    categoryId: 'cctv-jet-vac',
    icon: '🚛',
    color: 'text-blue-600',
    hasColor: false
  },
  {
    id: 2,
    name: 'Patching',
    categoryId: 'patching',
    icon: '🔧',
    color: 'text-orange-600',
    hasColor: false
  },
  {
    id: 3,
    name: 'Excavation', 
    categoryId: 'excavation',
    icon: '⛏️',
    color: 'text-red-600',
    hasColor: false
  }
];

export const FALLBACK_VEHICLE_RATES = [
  {
    id: 1,
    userId: 'system',
    vehicleType: 'CCTV Van',
    baseCost: 45.00,
    costPerMile: 2.50,
    sector: 'utilities'
  }
];