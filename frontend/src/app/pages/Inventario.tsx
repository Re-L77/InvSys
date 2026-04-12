import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { KPICard } from '../shared/components/KPICard';
import { StockBadge } from '../shared/components/StockBadge';
import { getProductos, type ProductoRecord } from '../shared/api/inventory';
import { formatCurrency, getStockLevel } from '../shared/utils/inventory';
import { Archive, DollarSign, AlertTriangle, Download } from 'lucide-react';

export function Inventario() {
  const [filterNivel, setFilterNivel] = useState('');
  const [productos, setProductos] = useState<ProductoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInventario = async () => {
      setIsLoading(true);
      setError('');

      try {
        setProductos(await getProductos());
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el inventario');
      } finally {
        setIsLoading(false);
      }
    };

    void loadInventario();
  }, []);

  const unidadesTotales = productos.reduce((sum, p) => sum + p.stockTotal, 0);
  const valorTotal = productos.reduce((sum, p) => sum + (p.stockTotal * p.precio), 0);
  const productosCriticos = productos.filter(p => getStockLevel(p.stockTotal, p.stockMin) === 'Bajo').length;

  const filteredProductos = productos.filter(p => {
    if (!filterNivel) return true;
    return getStockLevel(p.stockTotal, p.stockMin) === filterNivel;
  });

  const productosConDetalles = filteredProductos.map(p => ({
    ...p,
    nivel: getStockLevel(p.stockTotal, p.stockMin),
    valorInventario: p.stockTotal * p.precio,
  }));

  const handleExport = () => {
    if (productosConDetalles.length === 0) {
      return;
    }

    const headers = [
      'ID',
      'Producto',
      'Categoria',
      'Proveedor',
      'StockTotal',
      'StockMin',
      'Nivel',
      'Precio',
      'ValorInventario',
    ];

    const escapeCsv = (value: string | number) => {
      const text = String(value ?? '');
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const rows = productosConDetalles.map((p) => [
      p.idProducto,
      p.nombre,
      p.categoriaNombre,
      p.proveedorNombre,
      p.stockTotal,
      p.stockMin,
      p.nivel,
      p.precio,
      p.valorInventario,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((col) => escapeCsv(col)).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

    link.href = url;
    link.setAttribute('download', `inventario-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Inventario Actual">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          Cargando inventario...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Inventario Actual">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Inventario Actual">
      {/* Filters bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Nivel de Stock:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterNivel('')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  filterNivel === ''
                    ? 'bg-[#1E3A5F] text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterNivel('Alto')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  filterNivel === 'Alto'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${filterNivel === 'Alto' ? 'bg-green-200' : 'bg-green-500'}`}></span>
                Alto
              </button>
              <button
                onClick={() => setFilterNivel('Medio')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  filterNivel === 'Medio'
                    ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${filterNivel === 'Medio' ? 'bg-yellow-200' : 'bg-yellow-500'}`}></span>
                Medio
              </button>
              <button
                onClick={() => setFilterNivel('Bajo')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  filterNivel === 'Bajo'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${filterNivel === 'Bajo' ? 'bg-red-200' : 'bg-red-500'}`}></span>
                Bajo
              </button>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={productosConDetalles.length === 0}
            className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <KPICard
          icon={Archive}
          value={unidadesTotales.toLocaleString('es-MX')}
          label="Unidades Totales"
          variant="success"
          trend={{ value: 5, isPositive: true }}
        />
        <KPICard
          icon={DollarSign}
          value={`$${(valorTotal / 1000).toFixed(1)}K`}
          label="Valor Total del Inventario"
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          icon={AlertTriangle}
          value={productosCriticos}
          label="Productos en Nivel Crítico"
          variant="danger"
          trend={{ value: 8, isPositive: false }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoría</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Proveedor</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Total</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Mín</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nivel</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Precio</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor Inventario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productosConDetalles.map((p) => (
                <tr
                  key={p.idProducto}
                  className={`hover:bg-gray-50 transition-colors ${
                    p.nivel === 'Bajo' ? 'bg-red-50/30' : ''
                  }`}
                >
                  <td className="py-4 px-6 text-sm text-gray-500">{p.idProducto}</td>
                  <td className="py-4 px-6 text-sm text-gray-900 font-semibold">{p.nombre}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{p.categoriaNombre}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{p.proveedorNombre}</td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-bold text-blue-600">{p.stockTotal}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{p.stockMin}</td>
                  <td className="py-4 px-6">
                    <StockBadge nivel={p.nivel} />
                  </td>
                  <td className="py-4 px-6 text-sm font-semibold text-gray-900">
                    ${formatCurrency(p.precio)}
                  </td>
                  <td className="py-4 px-6 text-sm font-bold text-green-600">
                    ${formatCurrency(p.valorInventario)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold text-gray-900">{productosConDetalles.length}</span> de{' '}
            <span className="font-semibold text-gray-900">{productos.length}</span> productos
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
