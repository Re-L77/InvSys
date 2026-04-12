import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { createAlmacen, deleteAlmacen, getAlmacenes, getInventario, updateAlmacen, type AlmacenRecord, type InventarioRecord } from '../shared/api/inventory';
import { Pencil, Trash2, Plus, Warehouse } from 'lucide-react';
import { toast } from 'sonner';

export function Almacenes() {
  const [almacenes, setAlmacenes] = useState<AlmacenRecord[]>([]);
  const [inventarios, setInventarios] = useState<InventarioRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAlmacen, setSelectedAlmacen] = useState<AlmacenRecord | null>(null);
  const [nombre, setNombre] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [almacenesData, inventariosData] = await Promise.all([getAlmacenes(), getInventario()]);
        setAlmacenes(almacenesData);
        setInventarios(inventariosData);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los almacenes');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

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

  const reloadData = async () => {
    const [almacenesData, inventariosData] = await Promise.all([getAlmacenes(), getInventario()]);
    setAlmacenes(almacenesData);
    setInventarios(inventariosData);
  };

  const openCreate = () => {
    setSelectedAlmacen(null);
    setNombre('');
    setShowModal(true);
  };

  const openEdit = (almacen: AlmacenRecord) => {
    setSelectedAlmacen(almacen);
    setNombre(almacen.nombre);
    setShowModal(true);
  };

  const handleSave = async () => {
    const cleanNombre = nombre.trim();
    if (!cleanNombre) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setIsSaving(true);

    try {
      if (selectedAlmacen) {
        await updateAlmacen(selectedAlmacen.idAlmacen, { nombre: cleanNombre });
        toast.success('Almacén actualizado');
      } else {
        await createAlmacen({ nombre: cleanNombre });
        toast.success('Almacén creado');
      }

      await reloadData();
      setShowModal(false);
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'No se pudo guardar el almacén');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (almacen: AlmacenRecord) => {
    if (!window.confirm(`¿Eliminar el almacén "${almacen.nombre}"?`)) {
      return;
    }

    try {
      await deleteAlmacen(almacen.idAlmacen);
      toast.success('Almacén eliminado');
      await reloadData();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'No se pudo eliminar el almacén');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Almacenes">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          Cargando almacenes...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Almacenes">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Almacenes">
      <div className="mb-6 flex justify-end">
        <button
          onClick={openCreate}
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
                  onClick={() => openEdit(a)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Pencil size={18} />
                </button>
                <button onClick={() => void handleDelete(a)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-[#1E3A5F] text-white rounded-md hover:bg-[#152d4a] disabled:opacity-70"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
