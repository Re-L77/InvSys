interface StockBadgeProps {
  nivel: 'Bajo' | 'Medio' | 'Alto';
}

export function StockBadge({ nivel }: StockBadgeProps) {
  const getColors = () => {
    switch (nivel) {
      case 'Alto':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Medio':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Bajo':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getDot = () => {
    switch (nivel) {
      case 'Alto':
        return 'bg-green-500';
      case 'Medio':
        return 'bg-yellow-500';
      case 'Bajo':
        return 'bg-red-500';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getColors()}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDot()}`}></span>
      {nivel}
    </span>
  );
}
