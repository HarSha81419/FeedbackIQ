import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

interface ChurnRiskChartProps {
  value: number;
}

export function ChurnRiskChart({ value }: ChurnRiskChartProps) {
  const percent = Math.round(value * 100);
  const data = [{ name: 'risk', value: percent, fill: value > 0.7 ? '#f87171' : value > 0.4 ? '#fbbf24' : '#34d399' }];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={160}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={8}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={4} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-slate-100">{percent}%</span>
        <span className="text-xs text-slate-500">Churn risk</span>
      </div>
    </div>
  );
}
