import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const spikeData = [
  { category: 'Billing', current: 89, previous: 52 },
  { category: 'Technical', current: 67, previous: 55 },
  { category: 'Churn', current: 34, previous: 18 },
  { category: 'Support', current: 45, previous: 48 },
  { category: 'Product', current: 28, previous: 31 },
];

export function SpikeChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={spikeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="category"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: '#16161f',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="previous" fill="rgba(100,116,139,0.4)" radius={[4, 4, 0, 0]} name="Previous" />
        <Bar dataKey="current" fill="#22d3ee" fillOpacity={0.7} radius={[4, 4, 0, 0]} name="Current" />
      </BarChart>
    </ResponsiveContainer>
  );
}
