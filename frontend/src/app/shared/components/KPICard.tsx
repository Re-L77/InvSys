import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function KPICard({ icon: Icon, value, label, variant = 'default', trend }: KPICardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'bg-white',
          iconBg: 'bg-red-50',
          iconColor: 'text-red-600',
          border: 'border-l-4 border-red-500'
        };
      case 'success':
        return {
          bg: 'bg-white',
          iconBg: 'bg-green-50',
          iconColor: 'text-green-600',
          border: 'border-l-4 border-green-500'
        };
      case 'warning':
        return {
          bg: 'bg-white',
          iconBg: 'bg-yellow-50',
          iconColor: 'text-yellow-600',
          border: 'border-l-4 border-yellow-500'
        };
      default:
        return {
          bg: 'bg-white',
          iconBg: 'bg-blue-50',
          iconColor: 'text-blue-600',
          border: 'border-l-4 border-blue-500'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`${styles.bg} ${styles.border} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${styles.iconBg} p-3 rounded-xl`}>
          <Icon className={styles.iconColor} size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-600 font-medium">{label}</p>
      </div>
    </div>
  );
}
