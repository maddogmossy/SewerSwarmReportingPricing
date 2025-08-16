// Fallback data for when database is unavailable
export const FALLBACK_ID760_CONFIG = {
  id: 760,
  userId: 'system',
  sector: 'utilities',
  categoryId: 'cctv-jet-vac',
  categoryName: 'ID760 CCTV/Jet Vac',
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
    mm2IdData: ['utilities'],
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
    name: 'CCTV Van Pack',
    categoryId: 'cctv-van-pack', 
    icon: '🚐',
    color: 'text-purple-600',
    hasColor: false
  },
  {
    id: 3,
    name: 'Patching',
    categoryId: 'patching',
    icon: '🔧',
    color: 'text-orange-600',
    hasColor: false
  },
  {
    id: 4,
    name: 'Ambient Lining',
    categoryId: 'ambient-lining',
    icon: '🎨',
    color: 'text-green-600',
    hasColor: false
  },
  {
    id: 5,
    name: 'Hot Cure Lining',
    categoryId: 'hot-cure-lining',
    icon: '🔥',
    color: 'text-red-600',
    hasColor: false
  },
  {
    id: 6,
    name: 'UV Lining',
    categoryId: 'uv-lining',
    icon: '☀️',
    color: 'text-yellow-600',
    hasColor: false
  },
  {
    id: 7,
    name: 'Excavation', 
    categoryId: 'excavation',
    icon: '⛏️',
    color: 'text-gray-600',
    hasColor: false
  },
  {
    id: 8,
    name: 'Robotic Cutting',
    categoryId: 'f-robot-cutting',
    icon: '🤖',
    color: 'text-indigo-600',
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

// Complete fallback configurations for all essential categories
export const FALLBACK_CONFIGURATIONS = [
  // ID760 CCTV/Jet Vac
  {
    id: 760,
    userId: 'test-user',
    sector: 'utilities', 
    categoryId: 'cctv-jet-vac',
    categoryName: 'ID760 CCTV/Jet Vac',
    pipeSize: '150',
    pipeSizeId: 1501,
    templateType: 'MMP1',
    mmData: {
      mm4DataByPipeSize: {
        '150-1501': [{
          id: 1,
          blueValue: '1850',
          greenValue: '30', 
          purpleDebris: '30',
          purpleLength: '99.99'
        }]
      },
      mm5Rows: [{ id: 1, vehicleWeight: '', costPerMile: '' }],
      selectedPipeSize: '150',
      selectedPipeSizeId: 1501,
      mm1Colors: '#F5A3A3',
      mm2IdData: ['utilities'],
      mm3CustomPipeSizes: []
    },
    pricingOptions: [],
    quantityOptions: [],
    minQuantityOptions: [],
    rangeOptions: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // ID759 CCTV Van Pack
  {
    id: 759,
    userId: 'test-user',
    sector: 'utilities',
    categoryId: 'cctv-van-pack',
    categoryName: 'ID759 CCTV Van Pack', 
    pipeSize: '150',
    pipeSizeId: 1501,
    templateType: 'MMP1',
    mmData: {
      mm4DataByPipeSize: {
        '150-1501': [{
          id: 1,
          blueValue: '1200',
          greenValue: '25',
          purpleDebris: '25',
          purpleLength: '75.00'
        }]
      },
      mm5Rows: [{ id: 1, vehicleWeight: '', costPerMile: '' }],
      selectedPipeSize: '150',
      selectedPipeSizeId: 1501,
      mm1Colors: '#A3F5A3',
      mm2IdData: ['utilities'],
      mm3CustomPipeSizes: []
    },
    pricingOptions: [],
    quantityOptions: [],
    minQuantityOptions: [],
    rangeOptions: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Utilities Patching Configuration (A8)
  {
    id: 763,
    userId: 'test-user', 
    sector: 'utilities',
    categoryId: 'patching',
    categoryName: 'A8 - Patching',
    pipeSize: '150',
    pipeSizeId: 1501,
    templateType: 'TP2',
    mmData: {
      mm4DataByPipeSize: {
        '150-1501': [{
          id: 1,
          blueValue: '2200',
          greenValue: '15',
          purpleDebris: '0',
          purpleLength: '0'
        }]
      },
      mm5Rows: [{ id: 1, vehicleWeight: '', costPerMile: '' }],
      selectedPipeSize: '150',
      selectedPipeSizeId: 1501,
      mm1Colors: '#F5C6A3',
      mm2IdData: ['utilities'],
      mm3CustomPipeSizes: []
    },
    pricingOptions: [],
    quantityOptions: [],
    minQuantityOptions: [],
    rangeOptions: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];