import { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { almacenes, inventarios } from '../shared/data/mockData';
import { Pencil, Trash2, Plus, Warehouse } from 'lucide-react';

export function Almacenes() {
  const [showModal, setShowModal] = useState(false);
  const [selectedAlmacen, setSelectedAlmacen] = useState<any>(null);

  const almacenesConStats = almacenes.map(a => {
    const productosCount = inventarios.filter(i => i.idAlmacen === a.idAlmacen && i.stockLocal > 0).length;
    const totalUnidades = inventarios
      .filter(i => i.idAlmacen === a.idAlmacen)
      .reduce((sum, i) => sum + i.stockLocal, 0);

    return {
      ...a,
      productosCount,
      totalUnidades
    };
  });

  return (
    <DashboardLayout title="Almacenes">
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setSelectedAlmacen(null);
            setShowModal(true);
          }}
          className="px-5 py-3 bg-gradient-to-r from-[#1E3A5F] to-[#2d5a8f] text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 font-semibold shadow-md"
        >
          <Plus size={20} />
          Nuevo Almacén
        </button>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-3 gap-6">
        {almacenesConStats.map((a) => (
          <div key={a.idAlmacen} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-[1.02] transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                <Warehouse className="text-blue-600" size={28} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedAlmacen(a);
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">{a.nombre}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-600 mb-1">Productos</p>
                <p className="text-2xl font-bold text-blue-600">{a.productosCount}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-600 mb-1">Unidades</p>
                <p className="text-2xl font-bold text-gray-900">{a.totalUnidades}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {selectedAlmacen ? 'Editar Almacén' : 'Nuevo Almacén'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  defaultValue={selectedAlmacen?.nombre}
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
