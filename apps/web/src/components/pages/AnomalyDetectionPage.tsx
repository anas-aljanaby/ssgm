
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceDot } from 'recharts';
import { useLocalization } from '../../hooks/useLocalization';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { AnomalyDetectionIcon } from '../icons/ModuleIcons';
import { KPI_TIME_SERIES_DATA } from '../../data/anomalyData';
import { detectAnomalies } from '../../lib/anomalyDetection';
import type { KpiDataPoint, Anomaly } from '../../types';
import Spinner from '../common/Spinner';
import { TrendingUp, TrendingDown } from 'lucide-react';

const kpiConfig = {
    dailyDonations: { icon: <TrendingUp className="w-8 h-8 text-green-500" />, color: "hsl(145, 63%, 42%)" },
    websiteVisitors: { icon: <TrendingUp className="w-8 h-8 text-blue-500" />, color: "hsl(210, 40%, 50%)" },
    newSignups: { icon: <TrendingDown className="w-8 h-8 text-red-500" />, color: "hsl(0, 72%, 51%)" }
};

type KpiKey = keyof typeof KPI_TIME_SERIES_DATA;

const AnomalyDetectionPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
    const { t, language } = useLocalization(['anomaly_detection', 'common', 'sidebar']);
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const toast = useToast();

    const [selectedKpi, setSelectedKpi] = useState<KpiKey>('dailyDonations');
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [algorithm, setAlgorithm] = useState<'z-score' | 'iqr'>('z-score');
    const [sensitivity, setSensitivity] = useState(2.5);
    
    const kpiData = useMemo(() => KPI_TIME_SERIES_DATA[selectedKpi], [selectedKpi]);

    const handleRunDetection = () => {
        setIsLoading(true);
        setTimeout(() => {
            const detected = detectAnomalies(kpiData, algorithm, sensitivity);
            setAnomalies(detected);
            setIsLoading(false);
            toast.showSuccess(`Found ${detected.length} anomalies.`, { title: 'Detection Complete' });
        }, 1500); // Simulate processing time
    };
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          const point = payload[0].payload as KpiDataPoint;
          const anomaly = anomalies.find(a => a.date === point.date);
          return (
            <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border dark:border-slate-700 shadow-lg">
              <p className="font-bold">{label}</p>
              <p>{t('anomaly_detection.tooltipValue')}: {point.value}</p>
              {anomaly && <p className="text-red-500 font-semibold">{t('anomaly_detection.tooltipAnomaly')}: {t(`anomaly_detection.anomalyReason_${anomaly.reason}`)}</p>}
            </div>
          );
        }
        return null;
    };


    return (
        <div className="space-y-6 animate-fade-in">
            {!embedded && (
                <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground flex items-center gap-3">
                    <AnomalyDetectionIcon /> {t('sidebar.anomaly_detection')}
                </h1>
            )}

            {/* KPI Selection */}
            <div>
                <h2 className="text-xl font-semibold mb-2">{t('anomaly_detection.selectKpi')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.keys(kpiConfig).map(key => (
                        <button key={key} onClick={() => setSelectedKpi(key as KpiKey)} className={`p-4 border-2 rounded-lg transition-colors ${selectedKpi === key ? 'border-primary bg-primary-light/50' : 'bg-card dark:bg-dark-card hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-4">
                                {kpiConfig[key as KpiKey].icon}
                                <span className="font-bold text-lg">{t(`anomaly_detection.kpi_${key}`)}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Config & Alerts */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
                        <h3 className="font-bold mb-4">{t('anomaly_detection.configuration')}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">{t('anomaly_detection.algorithm')}</label>
                                <select value={algorithm} onChange={e => setAlgorithm(e.target.value as any)} className="w-full p-2 mt-1 border rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-600">
                                    <option value="z-score">Z-Score</option>
                                    <option value="iqr">IQR</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">{t('anomaly_detection.sensitivity')} ({sensitivity})</label>
                                <input type="range" min="1" max="5" step="0.1" value={sensitivity} onChange={e => setSensitivity(parseFloat(e.target.value))} className="w-full mt-1" />
                            </div>
                            <button onClick={handleRunDetection} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-dark rounded-lg disabled:bg-gray-400">
                                {isLoading ? <Spinner /> : null} {isLoading ? t('anomaly_detection.runningDetection') : t('anomaly_detection.runDetection')}
                            </button>
                        </div>
                    </div>
                     <div className="bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
                        <h3 className="font-bold mb-4">{t('anomaly_detection.alertLog')}</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {anomalies.length > 0 ? anomalies.map((a, i) => (
                                <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
                                    <p><strong>{a.date}:</strong> {t(`anomaly_detection.anomalyReason_${a.reason}`)} ({t('anomaly_detection.tooltipValue')}: {a.value})</p>
                                </div>
                            )) : <p className="text-sm text-gray-500 text-center py-8">{t('anomaly_detection.noAlerts')}</p>}
                        </div>
                    </div>
                </div>

                {/* Right Column: Chart */}
                <div className="lg:col-span-2 bg-card dark:bg-dark-card p-6 rounded-2xl shadow-soft border dark:border-slate-700/50">
                    <h3 className="font-bold mb-4">{t('anomaly_detection.anomalyChart')} - {t(`anomaly_detection.kpi_${selectedKpi}`)}</h3>
                    <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={kpiData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#4A5568" : "#E2E8F0"} />
                                <XAxis dataKey="date" tick={{ fill: isDark ? '#A0AEC0' : '#4A5568' }} />
                                <YAxis tick={{ fill: isDark ? '#A0AEC0' : '#4A5568' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="value" name={t('anomaly_detection.actualValue')} stroke={kpiConfig[selectedKpi].color} strokeWidth={2} dot={{r: 2}} />
                                {anomalies.map((a, i) => (
                                    <ReferenceDot key={i} x={a.date} y={a.value} r={6} fill="red" stroke="white" strokeWidth={2} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnomalyDetectionPage;
