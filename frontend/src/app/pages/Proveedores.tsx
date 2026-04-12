import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { createProveedor, deleteProveedor, getProveedores, updateProveedor, type ProveedorRecord } from '../shared/api/inventory';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

export function Proveedores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [proveedores, setProveedores] = useState<ProveedorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<ProveedorRecord | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError('');

      try {
        setProveedores(await getProveedores());
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los proveedores');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const filteredProveedores = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const reloadData = async () => {
    setProveedores(await getProveedores());
  };

  const openCreate = () => {
    setSelectedProveedor(null);
    setNombre('');
    setEmail('');
    setTelefono('');
    setShowModal(true);
  };

  const openEdit = (proveedor: ProveedorRecord) => {
    setSelectedProveedor(proveedor);
    setNombre(proveedor.nombre);
    setEmail(proveedor.email);
    setTelefono(proveedor.telefono ?? '');
    setShowModal(true);
  };

  const handleSave = async () => {
    const cleanNombre = nombre.trim();
    const cleanEmail = email.trim();
    const cleanTelefono = telefono.trim();

    if (!cleanNombre || !cleanEmail) {
      toast.error('Nombre y email son obligatorios');
      return;
    }

    setIsSaving(true);

    try {
      if (selectedProveedor) {
        await updateProveedor(selectedProveedor.idProveedor, {
          nombre: cleanNombre,
          email: cleanEmail,
          telefono: cleanTelefono,
        });
        toast.success('Proveedor actualizado');
      } else {
        await createProveedor({
          nombre: cleanNombre,
          email: cleanEmail,
          telefono: cleanTelefono,
        });
        toast.success('Proveedor creado');
      }

      await reloadData();
      setShowModal(false);
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'No se pudo guardar el proveedor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (proveedor: ProveedorRecord) => {
    if (!window.confirm(`¿Eliminar el proveedor "${proveedor.nombre}"?`)) {
      return;
    }

    try {
      await deleteProveedor(proveedor.idProveedor);
      toast.success('Proveedor eliminado');
      await reloadData();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'No se pudo eliminar el proveedor');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Proveedores">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
          Cargando proveedores...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Proveedores">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Proveedores">
      {/* Filters bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent shadow-sm"
            />
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-3 bg-gradient-to-r from-[#1E3A5F] to-[#2d5a8f] text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 font-semibold shadow-md"
          >
            <Plus size={20} />
            Nuevo Proveedor
          </button>
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
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Teléfono</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProveedores.map((p) => (
                <tr key={p.idProveedor} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-sm text-gray-500">{p.idProveedor}</td>
                  <td className="py-4 px-6 text-sm text-gray-900 font-semibold">{p.nombre}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{p.email}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{p.telefono}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => void handleDelete(p)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold text-gray-900">{filteredProveedores.length}</span> de{' '}
            <span className="font-semibold text-gray-900">{proveedores.length}</span> proveedores
          </p>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {selectedProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
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
