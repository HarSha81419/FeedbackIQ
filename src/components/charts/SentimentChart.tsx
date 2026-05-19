import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface SentimentChartProps {
  data: { name: string; value: number; color: string }[];
}

export function SentimentChart({ data }: SentimentChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#16161f',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [`${value}%`, 'Share']}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
