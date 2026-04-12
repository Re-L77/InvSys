import { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { categorias, productos } from '../shared/data/mockData';
import { Pencil, Trash2, Plus, Tag } from 'lucide-react';

export function Categorias() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<any>(null);

  const categoriasConStats = categorias.map(c => {
    const productosCount = productos.filter(p => p.idCategoria === c.idCategoria).length;
    return {
      ...c,
      productosCount
    };
  });

  return (
    <DashboardLayout title="Categorías">
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setSelectedCategoria(null);
            setShowModal(true);
          }}
          className="px-5 py-3 bg-gradient-to-r from-[#1E3A5F] to-[#2d5a8f] text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 font-semibold shadow-md"
        >
          <Plus size={20} />
          Nueva Categoría
        </button>
      </div>

      {/* Grid of categories */}
      <div className="grid grid-cols-2 gap-5">
        {categoriasConStats.map((c) => (
          <div key={c.idCategoria} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:shadow-lg hover:scale-[1.01] transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <Tag className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{c.nombre}</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  <span className="font-semibold text-blue-600">{c.productosCount}</span> productos
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedCategoria(c);
                  setShowModal(true);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Pencil size={18} />
              </button>
              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {selectedCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  defaultValue={selectedCategoria?.nombre}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-[#1E3A5F] text-white rounded-md hover:bg-[#152d4a]"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
