import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Activity,
  Zap,
  Wrench,
  Building,
  Truck,
  Gauge,
  Waves,
  Target
} from 'lucide-react';

interface DataHealthIndicatorProps {
  sectionData: any[];
  isLoading?: boolean;
}

interface HealthMetrics {
  totalSections: number;
  grade0: number;
  grade2: number;
  grade3: number;
  grade4: number;
  dataCompleteness: number;
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export function DataHealthIndicator({ sectionData, isLoading }: DataHealthIndicatorProps) {
  const [currentMetric, setCurrentMetric] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Calculate health metrics
  const calculateHealthMetrics = (): HealthMetrics => {
    if (!sectionData || sectionData.length === 0) {
      return {
        totalSections: 0,
        grade0: 0,
        grade2: 0,
        grade3: 0,
        grade4: 0,
        dataCompleteness: 0,
        overallHealth: 'critical'
      };
    }

    // Filter out split records (13a, 21a, etc.) - only count base sections
    const baseSections = sectionData.filter(s => !s.letterSuffix);
    
    const totalSections = baseSections.length;
    const grade0 = baseSections.filter(s => s.severityGrade === 0 || s.severityGrade === '0').length;
    const grade2 = baseSections.filter(s => s.severityGrade === 2 || s.severityGrade === '2').length;
    const grade3 = baseSections.filter(s => s.severityGrade === 3 || s.severityGrade === '3').length;
    const grade4 = baseSections.filter(s => s.severityGrade === 4 || s.severityGrade === '4').length;

    // Calculate data completeness based on required fields (using base sections only)
    const completeRecords = baseSections.filter(s => 
      s.startMH && s.finishMH && s.pipeSize && s.pipeMaterial && s.totalLength
    ).length;
    const dataCompleteness = Math.round((completeRecords / totalSections) * 100);

    // Determine overall health
    let overallHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    if (grade4 > 0) overallHealth = 'critical';
    else if (grade3 > totalSections * 0.3) overallHealth = 'warning';
    else if (grade2 > totalSections * 0.2) overallHealth = 'good';

    return {
      totalSections,
      grade0,
      grade2,
      grade3,
      grade4,
      dataCompleteness,
      overallHealth
    };
  };

  const metrics = calculateHealthMetrics();

  // Rotate through different metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMetric(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animation phase cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 3);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = () => {
    switch (metrics.overallHealth) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthIcon = () => {
    switch (metrics.overallHealth) {
      case 'excellent': return CheckCircle;
      case 'good': return Target;
      case 'warning': return AlertTriangle;
      case 'critical': return XCircle;
      default: return Activity;
    }
  };

  const infrastructureIcons = [
    { Icon: Building, label: 'Infrastructure', color: 'text-blue-500' },
    { Icon: Waves, label: 'Flow', color: 'text-cyan-500' },
    { Icon: Wrench, label: 'Maintenance', color: 'text-orange-500' },
    { Icon: Truck, label: 'Equipment', color: 'text-purple-500' },
    { Icon: Gauge, label: 'Monitoring', color: 'text-green-500' },
    { Icon: Zap, label: 'Power', color: 'text-yellow-500' }
  ];

  const metricDisplays = [
    {
      label: 'Grade 0 (Good)',
      value: metrics.grade0,
      total: metrics.totalSections,
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: CheckCircle,
      id: 'grade-0-indicator'
    },
    {
      label: 'Grade 2 (Minor)',
      value: metrics.grade2,
      total: metrics.totalSections,
      color: 'text-yellow-800',
      bgColor: 'bg-yellow-100',
      icon: Target,
      id: 'grade-2-indicator'
    },
    {
      label: 'Grade 3+ (Action)',
      value: metrics.grade3,
      total: metrics.totalSections,
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      icon: AlertTriangle,
      id: 'grade-3-indicator'
    },
    {
      label: 'Grade 4+ (Critical)',
      value: metrics.grade4,
      total: metrics.totalSections,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: XCircle,
      id: 'grade-4-indicator'
    }
  ];

  const currentDisplay = metricDisplays[currentMetric];
  const HealthIcon = getHealthIcon();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center space-x-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Activity className="w-6 h-6 text-blue-500" />
          </motion.div>
          <span className="text-gray-600 font-medium">Analyzing inspection data...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      data-component="data-health-indicator"
      data-total-sections={metrics.totalSections}
      data-current-metric={currentMetric}
    >
      {/* Header with overall health status */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <HealthIcon className={`w-6 h-6 ${getHealthColor()}`} />
            </motion.div>
            <div>
              <h3 className="font-semibold text-gray-800">Data Health Status</h3>
              <p className={`text-sm font-medium capitalize ${getHealthColor()}`}>
                {metrics.overallHealth}
              </p>
            </div>
          </div>
          
          {/* Animated infrastructure icons */}
          <div className="flex space-x-2">
            {infrastructureIcons.map(({ Icon, color }, index) => (
              <motion.div
                key={index}
                animate={{
                  y: animationPhase === 0 ? [0, -5, 0] : 
                     animationPhase === 1 ? [0, -3, 0] : [0, -2, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut"
                }}
              >
                <Icon className={`w-4 h-4 ${color}`} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main metrics display */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Rotating metric display */}
          <div className="space-y-3">
            <div className="text-sm text-gray-600 font-medium">Current Focus</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMetric}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`${currentDisplay.bgColor} rounded-lg p-4`}
                data-component="metric-display"
                data-metric-id={currentDisplay.id}
                data-metric-value={currentDisplay.value}
                data-metric-total={currentDisplay.total}
              >
                <div className="flex items-center space-x-3">
                  <currentDisplay.icon className={`w-5 h-5 ${currentDisplay.color}`} />
                  <div>
                    <div className="text-sm text-gray-600">{currentDisplay.label}</div>
                    <div className={`text-2xl font-bold ${currentDisplay.color}`}>
                      {currentDisplay.value}
                      <span className="text-sm text-gray-500 ml-1">
                        / {currentDisplay.total}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3 bg-white rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={currentDisplay.color.replace('text-', 'bg-')}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${Math.round((currentDisplay.value / currentDisplay.total) * 100)}%` 
                    }}
                    transition={{ duration: 1, delay: 0.5 }}
                    style={{ height: '100%' }}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Data completeness */}
          <div className="space-y-3">
            <div className="text-sm text-gray-600 font-medium">Data Completeness</div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Field Completeness</span>
                <span className="text-2xl font-bold text-gray-800">
                  {metrics.dataCompleteness}%
                </span>
              </div>
              
              {/* Circular progress indicator */}
              <div className="relative w-16 h-16 mx-auto">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                    fill="none"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke={metrics.dataCompleteness >= 90 ? "#10b981" : 
                            metrics.dataCompleteness >= 70 ? "#3b82f6" : "#ef4444"}
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 176" }}
                    animate={{ 
                      strokeDasharray: `${(metrics.dataCompleteness / 100) * 176} 176` 
                    }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  >
                    <Activity className="w-6 h-6 text-gray-600" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Sections Analyzed</span>
            <motion.span 
              className="font-bold text-gray-800"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.3 }}
              data-component="total-sections"
              data-section-count={metrics.totalSections}
            >
              {metrics.totalSections}
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}