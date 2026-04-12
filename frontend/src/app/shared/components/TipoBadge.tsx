interface TipoBadgeProps {
  tipo: 'entrada' | 'salida';
}

export function TipoBadge({ tipo }: TipoBadgeProps) {
  const isEntrada = tipo === 'entrada';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
      isEntrada
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-red-50 text-red-700 border-red-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isEntrada ? 'bg-green-500' : 'bg-red-500'}`}></span>
      {isEntrada ? 'Entrada' : 'Salida'}
    </span>
  );
}
