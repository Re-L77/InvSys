import { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StockBadge } from '../shared/components/StockBadge';
import { productos, categorias, proveedores, getNivelStock } from '../shared/data/mockData';
import { useAuth } from '../core/auth/AuthContext';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';

export function Productos() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterProveedor, setFilterProveedor] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<any>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Filter products
  const filteredProductos = productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = !filterCategoria || p.idCategoria === parseInt(filterCategoria);
    const matchesProveedor = !filterProveedor || p.idProveedor === parseInt(filterProveedor);
    const matchesNivel = !filterNivel || getNivelStock(p.idProducto) === filterNivel;
    return matchesSearch && matchesCategoria && matchesProveedor && matchesNivel;
  });

  const productosWithDetails = filteredProductos.map(p => {
    const categoria = categorias.find(c => c.idCategoria === p.idCategoria);
    const proveedor = proveedores.find(pr => pr.idProveedor === p.idProveedor);
    return {
      ...p,
      categoria: categoria?.nombre || '',
      proveedor: proveedor?.nombre || '',
      nivel: getNivelStock(p.idProducto)
    };
  });

  return (
    <DashboardLayout title="Productos">
      {/* Filters bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent shadow-sm"
            />
          </div>

          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] shadow-sm font-medium text-gray-700"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => (
              <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>
            ))}
          </select>

          <select
            value={filterProveedor}
            onChange={(e) => setFilterProveedor(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] shadow-sm font-medium text-gray-700"
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map(p => (
              <option key={p.idProveedor} value={p.idProveedor}>{p.nombre}</option>
            ))}
          </select>

          <select
            value={filterNivel}
            onChange={(e) => setFilterNivel(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] shadow-sm font-medium text-gray-700"
          >
            <option value="">Nivel de Stock</option>
            <option value="Alto">Alto</option>
            <option value="Medio">Medio</option>
            <option value="Bajo">Bajo</option>
          </select>

          {isAdmin && (
            <button
              onClick={() => {
                setSelectedProducto(null);
                setShowModal(true);
              }}
              className="px-5 py-3 bg-gradient-to-r from-[#1E3A5F] to-[#2d5a8f] text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 font-semibold shadow-md"
            >
              <Plus size={20} />
              Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoría</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Proveedor</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Precio</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Total</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Mín</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nivel Stock</th>
                {isAdmin && (
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productosWithDetails.map((p) => (
                <tr key={p.idProducto} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-sm text-gray-500">{p.idProducto}</td>
                  <td className="py-4 px-6 text-sm text-gray-900 font-semibold">{p.nombre}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{p.categoria}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{p.proveedor}</td>
                  <td className="py-4 px-6 text-sm font-semibold text-gray-900">${p.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-bold text-blue-600">{p.stockTotal}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{p.stockMin}</td>
                  <td className="py-4 px-6">
                    <StockBadge nivel={p.nivel} />
                  </td>
                  {isAdmin && (
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProducto(p);
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProducto(p);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold text-gray-900">{productosWithDetails.length}</span> de{' '}
            <span className="font-semibold text-gray-900">{productos.length}</span> productos
          </p>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  defaultValue={selectedProducto?.nombre}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent shadow-sm">
                  {categorias.map(c => (
                    <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Proveedor</label>
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent shadow-sm">
                  {proveedores.map(p => (
                    <option key={p.idProveedor} value={p.idProveedor}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={selectedProducto?.precio}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Mínimo</label>
                <input
                  type="number"
                  defaultValue={selectedProducto?.stockMin || 10}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent shadow-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-[#1E3A5F] to-[#2d5a8f] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <Trash2 className="text-red-600" size={32} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-center mb-3 text-gray-900">
              ¿Eliminar producto?
            </h3>
            <p className="text-center text-gray-600 mb-2">
              Estás a punto de eliminar:
            </p>
            <p className="text-center font-semibold text-gray-900 mb-1">"{selectedProducto?.nombre}"</p>
            <p className="text-center text-sm text-gray-500 mb-8">Esta acción no se puede deshacer</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-5 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 hover:shadow-lg transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
