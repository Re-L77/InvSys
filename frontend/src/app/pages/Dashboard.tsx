import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { KPICard } from '../shared/components/KPICard';
import { StockBadge } from '../shared/components/StockBadge';
import { TipoBadge } from '../shared/components/TipoBadge';
import { Package, Archive, AlertTriangle, DollarSign } from 'lucide-react';
import { getHistorialMovimientos, getProductos, type MovimientoHistorialRecord, type ProductoRecord } from '../shared/api/inventory';
import { getStockLevel, formatCurrency } from '../shared/utils/inventory';

export function Dashboard() {
  const [productos, setProductos] = useState<ProductoRecord[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoHistorialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [productosData, movimientosData] = await Promise.all([
          getProductos(),
          getHistorialMovimientos(),
        ]);
        setProductos(productosData);
        setMovimientos(movimientosData);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const totalProductos = productos.length;
  const stockTotal = productos.reduce((sum, p) => sum + p.stockTotal, 0);
  const productosCriticos = productos.filter(p => getStockLevel(p.stockTotal, p.stockMin) === 'Bajo').length;
  const valorInventario = productos.reduce((sum, p) => sum + (p.stockTotal * p.precio), 0);

  const productosStockBajo = productos
    .filter(p => getStockLevel(p.stockTotal, p.stockMin) === 'Bajo')
    .slice(0, 5)
    .map(p => ({
      ...p,
      nivel: getStockLevel(p.stockTotal, p.stockMin),
    }));

  const ultimosMovimientos = [...movimientos].slice(0, 5);

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          Cargando datos del dashboard...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <KPICard
          icon={Package}
          value={totalProductos}
          label="Productos Registrados"
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          icon={Archive}
          value={stockTotal.toLocaleString('es-MX')}
          label="Unidades en Sistema"
          variant="success"
          trend={{ value: 8, isPositive: true }}
        />
        <KPICard
          icon={AlertTriangle}
          value={productosCriticos}
          label="Productos Críticos"
          variant="danger"
          trend={{ value: 15, isPositive: false }}
        />
        <KPICard
          icon={DollarSign}
          value={`$${(valorInventario / 1000).toFixed(1)}K`}
          label="Valor Total del Inventario"
          variant="warning"
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Productos con Stock Bajo */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Productos con Stock Bajo</h3>
            <p className="text-sm text-gray-500 mt-0.5">Requieren reabastecimiento urgente</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Actual</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Mínimo</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nivel</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Proveedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productosStockBajo.map((p) => (
                  <tr key={p.idProducto} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">{p.nombre}</td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-bold text-red-600">{p.stockTotal}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{p.stockMin}</td>
                    <td className="py-4 px-6"><StockBadge nivel={p.nivel} /></td>
                    <td className="py-4 px-6 text-sm text-gray-600">{p.proveedorNombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimos Movimientos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Últimos Movimientos</h3>
            <p className="text-sm text-gray-500 mt-0.5">Actividad reciente</p>
          </div>
          <div className="p-4 space-y-3">
            {ultimosMovimientos.map((m, index) => (
              <div key={`${m.fecha}-${m.producto}-${m.usuario}-${index}`} className="p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">{m.producto}</p>
                  <TipoBadge tipo={m.tipo} />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium">{m.cantidad} unidades</span>
                  <span>•</span>
                  <span>{new Date(m.fecha).toLocaleDateString('es-MX')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{m.usuario}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
