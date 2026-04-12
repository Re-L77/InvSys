export type StockLevel = 'Bajo' | 'Medio' | 'Alto';

export function getStockLevel(stockTotal: number, stockMin: number): StockLevel {
  if (stockTotal <= stockMin) return 'Bajo';
  if (stockTotal <= stockMin * 2) return 'Medio';
  return 'Alto';
}

export function formatCurrency(value: number) {
  return value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}