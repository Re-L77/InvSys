import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../core/auth/AuthContext';
import { toast } from 'sonner';
import { Minus, Plus, AlertTriangle } from 'lucide-react';
import { createMovimiento, getAlmacenes, getProductos, type AlmacenRecord, type ProductoRecord } from '../shared/api/inventory';
import { getStockLevel } from '../shared/utils/inventory';

export function Movimientos() {
  const { currentUser } = useAuth();
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [idAlmacen, setIdAlmacen] = useState('');
  const [idProducto, setIdProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [almacenes, setAlmacenes] = useState<AlmacenRecord[]>([]);
  const [productos, setProductos] = useState<ProductoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [almacenesData, productosData] = await Promise.all([getAlmacenes(), getProductos()]);
        setAlmacenes(almacenesData);
        setProductos(productosData);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el formulario');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const selectedProducto = productos.find(p => p.idProducto === parseInt(idProducto));
  const stockLocal = selectedProducto?.stockTotal ?? 0;
  const nivelStock = selectedProducto ? getStockLevel(selectedProducto.stockTotal, selectedProducto.stockMin) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idAlmacen || !idProducto) {
      toast.error('Selecciona almacén y producto');
      return;
    }

    setIsSubmitting(true);

    try {
      const movimiento = await createMovimiento({
        idAlmacen: parseInt(idAlmacen),
        idProducto: parseInt(idProducto),
        cantidad,
        tipo,
        usuario: currentUser?.username,
      });

      const productoNombre = selectedProducto?.nombre || '';
      const almacenNombre = almacenes.find(a => a.idAlmacen === parseInt(idAlmacen))?.nombre || '';

      toast.success(
        `✅ ${movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'} de ${cantidad} unidades de ${productoNombre} registrada exitosamente en ${almacenNombre}`
      );

      setIdAlmacen('');
      setIdProducto('');
      setCantidad(1);
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'No se pudo registrar el movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Registrar Movimiento">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          Cargando formulario...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Registrar Movimiento">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Registrar Movimiento">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Registrar Movimiento de Inventario</h2>
            <p className="text-gray-600">Registra entradas y salidas de productos en los almacenes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Movimiento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de Movimiento</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTipo('entrada')}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    tipo === 'entrada'
                      ? 'border-green-500 bg-green-50 shadow-lg shadow-green-500/20'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/30'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 text-lg font-bold">
                    <span className={`w-3 h-3 rounded-full ${tipo === 'entrada' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    Entrada
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('salida')}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    tipo === 'salida'
                      ? 'border-red-500 bg-red-50 shadow-lg shadow-red-500/20'
                      : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/30'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 text-lg font-bold">
                    <span className={`w-3 h-3 rounded-full ${tipo === 'salida' ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                    Salida
                  </div>
                </button>
              </div>
            </div>

            {/* Almacén */}
            <div>
              <label htmlFor="almacen" className="block text-sm font-semibold text-gray-700 mb-2">
                Almacén
              </label>
              <select
                id="almacen"
                value={idAlmacen}
                onChange={(e) => setIdAlmacen(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent shadow-sm font-medium"
                required
              >
                <option value="">Seleccionar almacén...</option>
                {almacenes.map(a => (
                  <option key={a.idAlmacen} value={a.idAlmacen}>{a.nombre}</option>
                ))}
              </select>
            </div>

            {/* Producto */}
            <div>
              <label htmlFor="producto" className="block text-sm font-semibold text-gray-700 mb-2">
                Producto
              </label>
              <select
                id="producto"
                value={idProducto}
                onChange={(e) => setIdProducto(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent shadow-sm font-medium"
                required
              >
                <option value="">Seleccionar producto...</option>
                {productos.map(p => (
                  <option key={p.idProducto} value={p.idProducto}>
                    {p.nombre} (Stock: {p.stockTotal})
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div>
              <label htmlFor="cantidad" className="block text-sm font-semibold text-gray-700 mb-2">
                Cantidad
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Minus size={20} />
                </button>
                <input
                  id="cantidad"
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-center text-2xl font-bold shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setCantidad(cantidad + 1)}
                  className="p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Usuario */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={currentUser?.username || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-medium shadow-sm"
              />
            </div>

            {/* Info Panel */}
            {selectedProducto && idAlmacen && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 space-y-3">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Información del Stock
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur rounded-xl p-3">
                    <p className="text-xs text-gray-600 mb-1">Stock en almacén</p>
                    <p className="text-2xl font-bold text-blue-600">{stockLocal}</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur rounded-xl p-3">
                    <p className="text-xs text-gray-600 mb-1">Stock total</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedProducto.stockTotal}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white/80 backdrop-blur rounded-xl p-3">
                  <span className="text-sm font-semibold text-gray-700">Nivel de stock:</span>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${
                    nivelStock === 'Alto' ? 'bg-green-50 text-green-700 border-green-300' :
                    nivelStock === 'Medio' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                    'bg-red-50 text-red-700 border-red-300'
                  }`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                      nivelStock === 'Alto' ? 'bg-green-500' :
                      nivelStock === 'Medio' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></span>
                    {nivelStock}
                  </span>
                </div>
                {tipo === 'salida' && cantidad > stockLocal && (
                  <div className="bg-red-100 border-2 border-red-300 rounded-xl p-3 flex items-center gap-2">
                    <AlertTriangle className="text-red-600" size={20} />
                    <p className="text-red-700 font-semibold text-sm">
                      No hay suficiente stock. Máximo: {stockLocal} unidades
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-6 py-4 text-white rounded-xl transition-all font-bold shadow-lg ${
                  tipo === 'entrada'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:shadow-green-500/50'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:shadow-red-500/50'
                } disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-lg`}
              >
                {isSubmitting ? 'Registrando...' : `Registrar ${tipo === 'entrada' ? 'Entrada' : 'Salida'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
