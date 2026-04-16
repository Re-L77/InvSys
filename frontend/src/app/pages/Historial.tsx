import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { TipoBadge } from '../shared/components/TipoBadge';
import { getHistorialMovimientos, getAlmacenes, type MovimientoHistorialRecord, type AlmacenRecord } from '../shared/api/inventory';
import { Filter } from 'lucide-react';

export function Historial() {
  const [filterTipo, setFilterTipo] = useState('');
  const [filterAlmacen, setFilterAlmacen] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [historial, setHistorial] = useState<MovimientoHistorialRecord[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAlmacenes = async () => {
      try {
        setAlmacenes(await getAlmacenes());
      } catch {
        console.error('No se pudieron cargar los almacenes');
      }
    };
    void loadAlmacenes();
  }, []);

  useEffect(() => {
    const loadHistorial = async () => {
      setIsLoading(true);
      setError('');

      try {
        const idAlmacen = filterAlmacen ? Number(filterAlmacen) : undefined;
        setHistorial(
          await getHistorialMovimientos(
            idAlmacen,
            filterTipo || undefined,
            filterFechaDesde || undefined,
            filterFechaHasta || undefined
          )
        );
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el historial');
      } finally {
        setIsLoading(false);
      }
    };

    void loadHistorial();
  }, [filterTipo, filterAlmacen, filterFechaDesde, filterFechaHasta]);

  const totalEntradas = historial.filter(h => h.tipo === 'entrada').length;
  const totalSalidas = historial.filter(h => h.tipo === 'salida').length;

  const productoMovimientos = new Map<string, number>();
  historial.forEach(h => {
    const count = productoMovimientos.get(h.producto) || 0;
    productoMovimientos.set(h.producto, count + 1);
  });
  const productoMasMovimiento = Array.from(productoMovimientos.entries())
    .sort((a, b) => b[1] - a[1])[0];

  if (isLoading) {
    return (
      <DashboardLayout title="Historial de Movimientos">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          Cargando historial...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Historial de Movimientos">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Historial de Movimientos">
      {/* Filters bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Filter size={20} className="text-gray-600" />
          </div>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] shadow-sm font-medium text-gray-700"
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>

          <select
            value={filterAlmacen}
            onChange={(e) => setFilterAlmacen(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] shadow-sm font-medium text-gray-700"
          >
            <option value="">Todos los almacenes</option>
            {almacenes.map(a => (
              <option key={a.idAlmacen} value={String(a.idAlmacen)}>
                {a.nombre}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterFechaDesde}
            onChange={(e) => setFilterFechaDesde(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] shadow-sm font-medium text-gray-700"
          />

          <input
            type="date"
            value={filterFechaHasta}
            onChange={(e) => setFilterFechaHasta(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] shadow-sm font-medium text-gray-700"
          />

          {(filterFechaDesde || filterFechaHasta || filterAlmacen || filterTipo) && (
            <button
              onClick={() => {
                setFilterTipo('');
                setFilterAlmacen('');
                setFilterFechaDesde('');
                setFilterFechaHasta('');
              }}
              className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              Limpiar filtros
            </button>
          )}

          <div className="flex-1"></div>

          <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm font-semibold text-blue-700">
              {historial.length} movimientos encontrados
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Cantidad</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Usuario</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Almacén</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historial.map((h) => (
                <tr key={h.idMovimiento} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {new Date(h.fecha).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-4 px-6">
                    <TipoBadge tipo={h.tipo} />
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-900 font-semibold">{h.producto}</td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-bold text-blue-600">{h.cantidad}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{h.usuario}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{h.almacen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Resumen de Actividad
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
            <p className="text-sm font-semibold text-green-700 mb-2">Total Entradas</p>
            <p className="text-4xl font-bold text-green-600">{totalEntradas}</p>
            <p className="text-xs text-green-600 mt-1">movimientos</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-6">
            <p className="text-sm font-semibold text-red-700 mb-2">Total Salidas</p>
            <p className="text-4xl font-bold text-red-600">{totalSalidas}</p>
            <p className="text-xs text-red-600 mt-1">movimientos</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
            <p className="text-sm font-semibold text-blue-700 mb-2">Producto Más Activo</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">
              {productoMasMovimiento?.[0] || 'N/A'}
            </p>
            {productoMasMovimiento && (
              <p className="text-sm text-blue-600 mt-1">
                {productoMasMovimiento[1]} movimientos
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
