import { useState, useEffect } from 'react';
import api from '../../api';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'react-hot-toast';

interface Subcategory {
    id: number;
    name: string;
    slug: string;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    subcategories: Subcategory[];
}

interface AttributeValue {
    id: number;
    name: string;
    slug: string;
    price_delta: number;
}

interface Attribute {
    id: number;
    name: string;
    slug: string;
    values: AttributeValue[];
}

export default function CatalogManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'categories' | 'attributes'>('categories');

    // Modal/Form states
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [editingItem, setEditingItem] = useState<{ type: 'category' | 'subcategory' | 'attribute' | 'value', id: number, name: string, parentId?: number } | null>(null);

    // States for adding child items (subcategories/values) inline
    const [addingTo, setAddingTo] = useState<{ type: 'subcategory' | 'value', parentId: number } | null>(null);
    const [addChildName, setAddChildName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [catsRes, attrsRes] = await Promise.all([
                api.get('/admin/categories'),
                api.get('/admin/attributes')
            ]);
            setCategories(catsRes.data);
            setAttributes(attrsRes.data);
        } catch (error) {
            toast.error('Error al cargar el catálogo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (activeTab === 'categories') {
                await api.post('/admin/categories', { name: newItemName });
            } else {
                await api.post('/admin/attributes', { name: newItemName });
            }
            toast.success(`${activeTab === 'categories' ? 'Categoría' : 'Atributo'} creado con éxito`);
            setNewItemName('');
            setShowAddModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al crear el elemento');
        }
    };

    const handleAddChild = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addingTo || !addChildName.trim()) return;
        try {
            if (addingTo.type === 'subcategory') {
                await api.post(`/admin/categories/${addingTo.parentId}/subcategories`, { name: addChildName });
            } else {
                await api.post(`/admin/attributes/${addingTo.parentId}/values`, { name: addChildName });
            }
            toast.success(`${addingTo.type === 'subcategory' ? 'Subcategoría' : 'Valor'} añadido`);
            setAddChildName('');
            setAddingTo(null);
            fetchData();
        } catch (error) {
            toast.error('Error al añadir');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        try {
            const { type, id, name, parentId } = editingItem;
            if (type === 'category') await api.put(`/admin/categories/${id}`, { name });
            else if (type === 'subcategory') await api.put(`/admin/categories/${parentId}/subcategories/${id}`, { name });
            else if (type === 'attribute') await api.put(`/admin/attributes/${id}`, { name });
            else if (type === 'value') await api.put(`/admin/attributes/${parentId}/values/${id}`, { name });

            toast.success('Cambios guardados');
            setEditingItem(null);
            fetchData();
        } catch (error) {
            toast.error('Error al actualizar');
        }
    };

    const handleDelete = async (type: string, id: number, parentId?: number) => {
        if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;
        try {
            if (type === 'category') await api.delete(`/admin/categories/${id}`);
            else if (type === 'subcategory') await api.delete(`/admin/categories/${parentId}/subcategories/${id}`);
            else if (type === 'attribute') await api.delete(`/admin/attributes/${id}`);
            else if (type === 'value') await api.delete(`/admin/attributes/${parentId}/values/${id}`);

            toast.success('Eliminado correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    return (
        <AdminLayout
            title="Gestión de Catálogo"
            subtitle="Organiza tus categorías y atributos de forma visual y profesional"
            actions={
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 bg-pink-hot hover:bg-pink-600 text-white font-black uppercase tracking-widest rounded-2xl border-4 border-graphite shadow-[6px_6px_0px_0px_#333] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_#333] transition-all flex items-center justify-center gap-3 text-xs sm:text-base"
                >
                    <span className="text-xl sm:text-2xl">+</span> Nuevo {activeTab === 'categories' ? 'Categoría' : 'Atributo'}
                </button>
            }
        >
            <div className="flex flex-col items-center w-full">
                <div className="h-10 md:h-12"></div>

                {/* Tabs Modernas */}
                <div className="flex justify-center flex-wrap gap-4">
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-5 py-3 sm:px-8 sm:py-4 md:px-10 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.15em] text-xs sm:text-sm transition-all border-b-8 ${activeTab === 'categories'
                            ? 'bg-pink-hot text-white border-pink-700 shadow-[5px_5px_0px_0px_#333] -translate-y-1'
                            : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        🧵 Categorías
                    </button>
                    <button
                        onClick={() => setActiveTab('attributes')}
                        className={`px-5 py-3 sm:px-8 sm:py-4 md:px-10 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.15em] text-xs sm:text-sm transition-all border-b-8 ${activeTab === 'attributes'
                            ? 'bg-purple-600 text-white border-purple-800 shadow-[5px_5px_0px_0px_#333] -translate-y-1'
                            : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        ✨ Atributos
                    </button>
                </div>

                {/* Gran Espaciador para evitar solapamiento */}
                <div className="h-16 md:h-24"></div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl md:rounded-2xl border-4 border-graphite shadow-xl">
                        <div className="animate-spin w-14 h-14 border-8 border-gray-100 border-t-pink-hot rounded-full mb-6"></div>
                        <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Sincronizando Catálogo...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {activeTab === 'categories' ? (
                            categories.map(cat => (
                                <div key={cat.id} className="group bg-white rounded-xl md:rounded-2xl border-4 border-graphite shadow-[6px_6px_0px_0px_#333] md:shadow-[10px_10px_0px_0px_#333] overflow-hidden transition-all hover:-translate-y-1">
                                    <div className="p-4 sm:p-6 md:p-8 bg-graphite flex flex-col sm:flex-row justify-between items-center text-white gap-4">
                                        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-hot rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] shrink-0">
                                                📦
                                            </div>
                                            <h3 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight italic">{cat.name}</h3>
                                        </div>
                                        <div className="flex gap-1 sm:gap-2">
                                            <button onClick={() => setEditingItem({ type: 'category', id: cat.id, name: cat.name })} className="p-2 hover:bg-white/10 rounded-lg text-teal"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                            <button onClick={() => handleDelete('category', cat.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-pink"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </div>
                                    </div>
                                    <div className="p-4 sm:p-6 md:p-8">
                                        <div className="flex flex-col gap-3">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b-2 border-gray-50 pb-2">Subcategorías</p>
                                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                                {cat.subcategories.map(sub => (
                                                    <div key={sub.id} className="group/sub flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-50 border-2 border-gray-100 rounded-lg text-sm font-bold text-graphite transition-all hover:bg-white hover:border-pink-hot/30">
                                                        <span>{sub.name}</span>
                                                        <div className="flex">
                                                            <button onClick={() => setEditingItem({ type: 'subcategory', id: sub.id, name: sub.name, parentId: cat.id })} className="text-teal hover:scale-110 p-1">✎</button>
                                                            <button onClick={() => handleDelete('subcategory', sub.id, cat.id)} className="text-red-pink hover:scale-110 p-1">×</button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {addingTo?.type === 'subcategory' && addingTo.parentId === cat.id ? (
                                                    <form onSubmit={handleAddChild} className="flex gap-2">
                                                        <input
                                                            autoFocus
                                                            className="px-3 py-1 bg-white border-2 border-pink-hot rounded-lg text-sm font-bold w-28 sm:w-32 outline-none"
                                                            value={addChildName}
                                                            onChange={(e) => setAddChildName(e.target.value)}
                                                            onBlur={() => { if (!addChildName) setAddingTo(null); }}
                                                            placeholder="Nombre..."
                                                        />
                                                        <button type="submit" className="text-pink-hot font-black text-xl hover:scale-110">✓</button>
                                                        <button type="button" onClick={() => setAddingTo(null)} className="text-gray-400 font-black text-xl hover:scale-110">×</button>
                                                    </form>
                                                ) : (
                                                    <button
                                                        onClick={() => setAddingTo({ type: 'subcategory', parentId: cat.id })}
                                                        className="px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-bold text-gray-400 hover:border-pink-hot hover:text-pink-hot transition-all"
                                                    >
                                                        + Añadir
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            attributes.map(attr => (
                                <div key={attr.id} className="group bg-white rounded-xl md:rounded-2xl border-4 border-graphite shadow-[6px_6px_0px_0px_#333] md:shadow-[10px_10px_0px_0px_#333] overflow-hidden transition-all hover:-translate-y-1">
                                    <div className="p-4 sm:p-6 md:p-8 bg-purple-900 flex flex-col sm:flex-row justify-between items-center text-white gap-4">
                                        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] shrink-0">
                                                🛠️
                                            </div>
                                            <h3 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight italic">{attr.name}</h3>
                                        </div>
                                        <div className="flex gap-1 sm:gap-2">
                                            <button onClick={() => setEditingItem({ type: 'attribute', id: attr.id, name: attr.name })} className="p-2 hover:bg-white/10 rounded-lg text-teal"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                            <button onClick={() => handleDelete('attribute', attr.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-pink"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </div>
                                    </div>
                                    <div className="p-4 sm:p-6 md:p-8">
                                        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-purple-100 rounded-xl bg-purple-50/30">
                                            <p className="text-xs font-black text-purple-300 uppercase tracking-widest text-center px-4">
                                                Los valores se gestionan desde el Inventario al crear un producto.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Modal para Crear Item */}
                {showAddModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-graphite/40 backdrop-blur-sm p-3 sm:p-4">
                        <div className="w-full max-w-lg bg-white rounded-xl md:rounded-2xl border-4 border-graphite shadow-2xl p-5 sm:p-8">
                            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter mb-5">Nuevo {activeTab === 'categories' ? 'Categoría' : 'Atributo'}</h3>
                            <form onSubmit={handleCreate} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Nombre del Item</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold focus:outline-none focus:border-pink-hot focus:bg-white transition-all text-base sm:text-lg"
                                        placeholder={`Ej: ${activeTab === 'categories' ? 'Sedas Finas' : 'Tipo de Cuello'}`}
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 sm:py-4 font-black uppercase tracking-widest text-gray-400 hover:text-graphite transition-all text-sm">Cancelar</button>
                                    <button type="submit" className="flex-[2] py-3 sm:py-4 bg-teal text-white font-black uppercase tracking-[0.15em] rounded-xl border-2 border-graphite shadow-[4px_4px_0px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#333] transition-all text-sm">Crear Item</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal para Editar Item */}
                {editingItem && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-graphite/40 backdrop-blur-sm p-3 sm:p-4">
                        <div className="w-full max-w-lg bg-white rounded-xl md:rounded-2xl border-4 border-graphite shadow-2xl p-5 sm:p-8">
                            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter mb-5">Editar {editingItem.type}</h3>
                            <form onSubmit={handleUpdate} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold focus:outline-none focus:border-pink-hot focus:bg-white transition-all text-base sm:text-lg"
                                        value={editingItem.name}
                                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-3 sm:py-4 font-black uppercase tracking-widest text-gray-400 hover:text-graphite transition-all text-sm">Cancelar</button>
                                    <button type="submit" className="flex-[2] py-3 sm:py-4 bg-teal text-white font-black uppercase tracking-[0.15em] rounded-xl border-2 border-graphite shadow-[4px_4px_0px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#333] transition-all text-sm">Guardar Cambios</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {/* Integrated Footer Area */}
                <div className="pt-12 md:pt-96 pb-24 md:pb-48 text-center space-y-8 md:space-y-12 w-full">
                    <div className="flex justify-center gap-4 opacity-10">
                        <div className="w-12 h-1.5 bg-pink-hot rounded-full"></div>
                        <div className="w-12 h-1.5 bg-teal rounded-full"></div>
                    </div>
                    <p className="text-gray-400 text-[10px] sm:text-[14px] font-black uppercase tracking-[0.4em] md:tracking-[0.8em] max-w-5xl mx-auto leading-relaxed opacity-40 italic">
                        SISTEMA CENTRAL DE GESTIÓN VISUAL • VERSIÓN 2.5
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
