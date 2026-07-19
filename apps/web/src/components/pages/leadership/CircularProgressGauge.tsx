import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface CircularProgressGaugeProps {
  value: number;
  size: number;
  title: string;
}

/**
 * getGradientColor - دالة مساعدة لتحديد لون التدرج بناءً على القيمة.
 * @param {number} value - القيمة المئوية.
 * @returns {[string, string]} - مصفوفة تحتوي على لون البداية والنهاية للتدرج.
 */
const getGradientColor = (value: number): [string, string] => {
  if (value >= 80) return ['#10b981', '#34d399']; // Green
  if (value >= 61) return ['#facc15', '#fde047']; // Yellow
  if (value >= 41) return ['#f59e0b', '#fbbf24']; // Orange
  return ['#ef4444', '#f87171']; // Red
};

/**
 * CircularProgressGauge - مكون لعرض مقياس تقدم دائري متحرك.
 * 
 * @component
 * @param {CircularProgressGaugeProps} props - الخصائص.
 * @returns {JSX.Element} - مكون React
 * 
 * @example
 * <CircularProgressGauge 
 *   value={75} 
 *   size={150} 
 *   title="Overall Completion" 
 * />
 */
const CircularProgressGauge: React.FC<CircularProgressGaugeProps> = ({ value, size, title }) => {
  const [startColor, endColor] = getGradientColor(value);
  const data = [{ name: 'completion', value: value }];

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div style={{ width: size, height: size }}>
        <ResponsiveContainer>
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
            barSize={12}
          >
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={startColor} />
                <stop offset="100%" stopColor={endColor} />
              </linearGradient>
            </defs>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: 'rgba(128, 128, 128, 0.1)' }}
              dataKey="value"
              cornerRadius={10}
              angleAxisId={0}
              fill={`url(#gradient-${title})`}
            />
             <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-2xl font-bold fill-current text-foreground dark:text-dark-foreground"
            >
              {`${Math.round(value)}%`}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-400 max-w-[150px]">{title}</p>
    </div>
  );
};

export default CircularProgressGauge;
