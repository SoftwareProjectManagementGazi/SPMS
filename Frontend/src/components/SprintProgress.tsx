import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

const data = [
  { name: 'Tamamlanan', value: 24, color: '#10b981' },
  { name: 'Devam Eden', value: 12, color: '#3b82f6' },
  { name: 'Bekleyen', value: 8, color: '#6b7280' },
];

const stats = [
  { label: 'Tamamlanan', value: 24, icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100' },
  { label: 'Devam Eden', value: 12, icon: AlertCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { label: 'Bekleyen', value: 8, icon: Circle, color: 'text-gray-600', bgColor: 'bg-gray-100' },
];

export function SprintProgress() {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const completionRate = Math.round((data[0].value / total) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-gray-900 mb-1">Haftalık İş Özeti</h2>
        <p className="text-sm text-gray-500">Son 7 günlük performans</p>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-center">
          <div className="relative">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx={100}
                  cy={100}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl text-gray-900">%55</div>
                <div className="text-xs text-gray-500">Verimlilik</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="text-sm text-gray-700">{stat.label}</span>
            </div>
            <span className="text-gray-900">{stat.value}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Aktif İş Yükü</span>
          <span className="text-gray-900">12 Görev</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Tamamlanan</span>
          <span className="text-gray-900">8 Görev</span>
        </div>
      </div>
    </div>
  );
}