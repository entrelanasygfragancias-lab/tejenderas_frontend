import { useState, type FormEvent, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import api from '../../api';
import { AxiosError } from 'axios';
import { getStorageUrl } from '../../utils/imageUrl';
import AdminLayout from '../../components/AdminLayout';


interface VariantConfig {
    id: number;
    name: string;
    basePrice: string;
    markupType: 'percentage' | 'manual';
    markup: string;
    price: string;
    stock: string;
    imageFile?: File | null;
    imagePreview?: string | null;
    image?: string | null;
}

export default function ProductForm() {
    const [barcode, setBarcode] = useState('');
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [isPromo, setIsPromo] = useState(false);
    const [isCombo, setIsCombo] = useState(false);
    const [description, setDescription] = useState('');
    const [stock, setStock] = useState('0');
    const [basePrice, setBasePrice] = useState('0');
    const [price, setPrice] = useState('0');
    const [markupType, setMarkupType] = useState<'percentage' | 'manual'>('percentage');
    const [markup, setMarkup] = useState('30');
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
    const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
    const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [categories, setCategories] = useState<{ id: number; name: string; slug: string; subcategories?: { id: number; name: string }[] }[]>([]);
    const [allAttributes, setAllAttributes] = useState<{ id: number; name: string; values: any[] }[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | ''>('');
    const [productAttributes, setProductAttributes] = useState<number[]>([]);
    const [productAttributeValues, setProductAttributeValues] = useState<VariantConfig[]>([]);

    // Popup state
    const [configuringValue, setConfiguringValue] = useState<VariantConfig | null>(null);

    const barcodeRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    useEffect(() => {
        fetchInitialData();
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchInitialData = async () => {
        try {
            const [catsRes, attrsRes] = await Promise.all([
                api.get('/admin/categories'),
                api.get('/admin/attributes')
            ]);
            setCategories(catsRes.data);
            setAllAttributes(attrsRes.data);
        } catch (err) {
            console.error('Error fetching categories or attributes', err);
        }
    };

    const fetchProduct = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get(`/admin/products/${id}`);
            setName(data.name);
            setBarcode(data.barcode);
            setSelectedCategoryId(data.category_id || '');
            setSelectedSubcategoryId(data.subcategory_id || '');
            setBrand(data.brand || '');
            setIsPromo(Boolean(data.is_promo));
            setIsCombo(Boolean(data.is_combo));
            setDescription(data.description || '');
            setStock(data.stock?.toString() || '0');
            setBasePrice(data.base_price?.toString() || '0');
            setPrice(data.price?.toString() || '0');
            setMarkup(data.markup?.toString() || '30');
            setMarkupType(data.markup_type || 'percentage');

            if (data.image) {
                setMainImagePreview(getStorageUrl(data.image));
            }

            if (data.images && Array.isArray(data.images)) {
                setGalleryImagePreviews(data.images.map((img: string) => getStorageUrl(img)));
            }

            if (data.attributes) {
                setProductAttributes(data.attributes.map((a: any) => a.id));
            }
            if (data.attribute_values) {

                const loadedValues = data.attribute_values.map((v: any) => ({
                    id: v.id,
                    name: v.name,
                    basePrice: v.pivot.base_price?.toString() || '0',
                    markupType: v.pivot.markup_type || 'percentage',
                    markup: v.pivot.markup?.toString() || '0',
                    price: v.pivot.price_delta?.toString() || '0',
                    stock: v.pivot.stock?.toString() || '0',
                    image: v.pivot.image,
                    imagePreview: getStorageUrl(v.pivot.image)
                }));
                setProductAttributeValues(loadedValues);
            }
        } catch (err) {
            setError('Error al cargar el producto');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: barcodeRef,
        documentTitle: name || 'Producto',
    });

    const handlePrintClick = () => {
        if (!name || !barcode || !stock) {
            setError('Por favor completa Nombre, Código y Stock antes de imprimir.');
            return;
        }
        handlePrint();
    };

    const checkBarcode = async (code: string) => {
        if (!code) return;
        setIsChecking(true);
        try {
            const { data } = await api.get<{ exists: boolean; product?: any }>(`/admin/products/check/${code}`);
            if (data.exists && (!isEditing || data.product.id !== parseInt(id!))) {
                setError('Este código de barras ya está registrado para: ' + data.product.name);
            } else {
                setError('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsChecking(false);
        }
    };

    const generateBarcode = async () => {
        setIsChecking(true);
        try {
            const { data } = await api.get<{ barcode: string }>('/admin/products/generate-barcode');
            setBarcode(data.barcode);
            setError('');
        } catch (err) {
            setError('Error al generar código');
        } finally {
            setIsChecking(false);
        }
    };

    // Derived attributes
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const formData = new FormData();
        formData.append('barcode', barcode);
        formData.append('name', name);
        if (selectedCategoryId) {
            formData.append('category_id', selectedCategoryId.toString());
            const cat = categories.find(c => c.id === selectedCategoryId);
            // Save the slug as legacy 'category' field so the tab filter works
            if (cat) formData.append('category', cat.slug);
        }
        if (selectedSubcategoryId) {
            formData.append('subcategory_id', selectedSubcategoryId.toString());
        }

        formData.append('is_promo', isPromo ? '1' : '0');
        formData.append('is_combo', isCombo ? '1' : '0');
        if (brand) formData.append('brand', brand);
        if (description) formData.append('description', description);

        // Product global price and stock
        // If it's a promo/combo or has no variants, we use global fields.
        const useGlobalConfig = isPromo || isCombo || productAttributeValues.length === 0;

        const totalStock = !useGlobalConfig
            ? productAttributeValues.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
            : (parseInt(stock) || 0);

        formData.append('base_price', useGlobalConfig ? basePrice : '0');
        formData.append('price', useGlobalConfig ? price : '0');
        formData.append('markup', useGlobalConfig ? markup : '0');
        formData.append('markup_type', useGlobalConfig ? markupType : 'percentage');
        formData.append('stock', totalStock.toString());

        if (!useGlobalConfig) {
            productAttributes.forEach(attrId => {
                formData.append('attributes[]', attrId.toString());
            });

            productAttributeValues.forEach(val => {
                formData.append('attribute_values[]', val.id.toString());
                formData.append(`attribute_value_price_deltas[${val.id}]`, val.price);
                formData.append(`attribute_value_base_prices[${val.id}]`, val.basePrice);
                formData.append(`attribute_value_markups[${val.id}]`, val.markup);
                formData.append(`attribute_value_markup_types[${val.id}]`, val.markupType);
                formData.append(`attribute_value_stocks[${val.id}]`, val.stock);

                if (val.imageFile) {
                    formData.append(`value_images[${val.id}]`, val.imageFile);
                } else if (val.image) {
                    formData.append(`keep_value_image_${val.id}`, '1');
                }
            });
        }

        if (mainImageFile) {
            formData.append('image', mainImageFile);
        }

        if (galleryImageFiles.length > 0) {
            galleryImageFiles.forEach((file) => {
                formData.append('images[]', file);
            });
        }

        if (isEditing) {
            formData.append('_method', 'PUT');
        }

        try {
            if (isEditing) {
                await api.post(`/admin/products/${id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/admin/products', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            navigate('/admin/products');
        } catch (err) {
            const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
            if (error.response?.data?.errors) {
                const firstError = Object.values(error.response.data.errors)[0];
                setError(firstError[0]);
            } else {
                console.error(err);
                setError('Error al guardar el producto. Verifica los datos.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfigSave = (config: VariantConfig) => {
        setProductAttributeValues(prev => {
            const exists = prev.find(v => v.id === config.id);
            if (exists) {
                return prev.map(v => v.id === config.id ? config : v);
            }
            return [...prev, config];
        });
        setConfiguringValue(null);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50/50 pb-12 px-2 sm:px-6 md:px-12 flex flex-col items-center">
                <div className="w-full max-w-5xl flex flex-col">
                    {/* Header Section */}
                    <div className="pt-20 md:pt-24 mb-8 md:mb-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
                            <div className="space-y-4">
                                <Link
                                    to="/admin/products"
                                    className="group inline-flex items-center gap-3 text-gray-500 hover:text-teal transition-all font-bold uppercase text-[11px] tracking-[0.25em]"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center group-hover:border-teal/30 group-hover:bg-teal/5 transition-all shadow-sm">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </div>
                                    Volver al Inventario
                                </Link>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-graphite tracking-tight leading-none mb-4">
                                        {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                                    </h1>
                                    <p className="text-gray-500 font-bold text-xs sm:text-base uppercase tracking-widest max-w-xl">
                                        {isEditing ? 'Gestión avanzada de existencias y parámetros comerciales' : 'Añade un nuevo tesoro a tu catálogo digital'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                                <button
                                    type="button"
                                    onClick={handlePrintClick}
                                    className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-6 bg-white hover:bg-gray-50 text-graphite font-black uppercase tracking-widest text-[10px] md:text-xs rounded-[1.5rem] border-2 border-gray-100 shadow-sm hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 md:gap-4"
                                >
                                    <span className="text-2xl md:text-3xl">🖨️</span> Imprimir Etiqueta
                                </button>
                                <button
                                    form="product-form"
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-6 bg-teal hover:bg-teal-600 text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-[1.5rem] shadow-xl shadow-teal-500/20 active:scale-95 transition-all"
                                >
                                    {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Publicar')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <form id="product-form" onSubmit={handleSubmit} className="mb-24">
                        {error && (
                            <div className="bg-red-500/10 border-2 border-red-500/20 text-red-600 px-8 py-5 rounded-3xl mb-12 font-bold flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                                <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center text-white shrink-0">⚠️</div>
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            {/* LEFT COLUMN: Main Info */}
                            <div className="lg:col-span-8 space-y-12">
                                {/* General Info Card */}
                                <section className="bg-white rounded-[2rem] md:rounded-[3.0rem] border border-gray-100 shadow-2xl shadow-gray-200/40 p-6 sm:p-8 md:p-16 space-y-8 md:space-y-12 transition-all hover:shadow-teal/5">
                                    <div className="flex items-center gap-5 md:gap-6">
                                        <div className="w-12 h-16 md:w-14 md:h-20 bg-pink-hot rounded-[1.25rem] flex items-center justify-center text-white text-2xl md:text-3xl shadow-xl shadow-pink-500/20 shrink-0">📝</div>
                                        <div>
                                            <h2 className="text-3xl md:text-4xl font-black text-graphite tracking-tight leading-none">Información General</h2>
                                            <p className="text-gray-600 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-2">Identidad y narrativa del producto</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div>
                                            <label htmlFor="name" className="block text-xs font-black text-gray-600 mb-4 uppercase tracking-[0.2rem] ml-1">
                                                Nombre Comercial del Producto
                                            </label>
                                            <input
                                                id="name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-6 md:px-10 py-4 md:py-6 pt-2 bg-gray-50/50 focus:bg-white border-3 border-gray-400 focus:border-teal rounded-[1.5rem] text-graphite placeholder-gray-300 font-bold text-xl md:text-2xl outline-none transition-all shadow-sm focus:shadow-teal/5"
                                                placeholder="Ej: Perfume Textil Vainilla 500ml"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="description" className="block text-xs font-black text-gray-500 mb-4 uppercase tracking-[0.2em] ml-1">
                                                Descripción del Producto
                                            </label>
                                            <textarea
                                                id="description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={4}
                                                className="w-full px-6 md:px-10 py-4 md:py-6 bg-gray-50/50 focus:bg-white border-3 border-gray-400 focus:border-teal rounded-[1.5rem] text-graphite placeholder-gray-300 font-bold text-lg md:text-xl outline-none transition-all resize-none shadow-sm focus:shadow-teal/5"
                                                placeholder="Describe las notas olfativas, composición o detalles relevantes..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-10 pt-6">
                                            <button
                                                type="button"
                                                onClick={() => setIsPromo(!isPromo)}
                                                className={`flex items-center justify-between gap-4 md:gap-8 px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] border-4 md:border-6 transition-all font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] ${isPromo ? 'bg-pink-hot border-transparent text-white shadow-2xl shadow-pink-600/30' : 'bg-white border-gray-100 text-gray-500 hover:border-pink-500/30'}`}
                                            >
                                                <div className="flex items-center gap-3 md:gap-5">
                                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-2xl md:text-3xl transition-colors ${isPromo ? 'bg-white/40' : 'bg-gray-80'}`}>🔥</div>
                                                    Es Promoción
                                                </div>
                                                <div className={`w-12 h-7 md:w-14 md:h-8 rounded-full relative transition-colors p-1 md:p-1.5 ${isPromo ? 'bg-white/30' : 'bg-gray-100'}`}>
                                                    <div className={`w-5 h-5 rounded-full transition-all shadow-sm ${isPromo ? 'ml-5 md:ml-6 bg-white' : 'ml-0 bg-gray-400'}`} />
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setIsCombo(!isCombo)}
                                                className={`flex items-center justify-between gap-4 md:gap-8 px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] border-3 transition-all font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] ${isCombo ? 'bg-teal border-transparent text-white shadow-2xl shadow-teal/30' : 'bg-white border-gray-100 text-gray-500 hover:border-teal/30'}`}
                                            >
                                                <div className="flex items-center gap-3 md:gap-5">
                                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-xl md:text-2xl transition-colors ${isCombo ? 'bg-white/20' : 'bg-gray-50'}`}>📦</div>
                                                    Es Combo
                                                </div>
                                                <div className={`w-12 h-7 md:w-14 md:h-8 rounded-full relative transition-colors p-1 md:p-1.5 ${isCombo ? 'bg-white/30' : 'bg-gray-100'}`}>
                                                    <div className={`w-5 h-5 rounded-full transition-all shadow-sm ${isCombo ? 'ml-5 md:ml-6 bg-white' : 'ml-0 bg-gray-400'}`} />
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                {/* Categorization & Barcode Card */}
                                <section className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 p-6 sm:p-8 md:p-16 space-y-8 md:space-y-12 transition-all hover:shadow-teal/5">
                                    <div className="flex items-center gap-5 md:gap-8">
                                        <div className="w-12 h-16 md:w-14 md:h-20 bg-teal rounded-[1.25rem] flex items-center justify-center text-white text-2xl md:text-3xl shadow-xl shadow-teal-500/20 shrink-0">🏷️</div>
                                        <div className="flex flex-col gap-1 md:gap-3">
                                            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-graphite tracking-tight uppercase">Categorización</h2>
                                            <p className="text-gray-500 font-bold text-[10px] md:text-xs uppercase tracking-widest ml-1">Ubicación y codificación del producto</p>
                                        </div>
                                    </div>

                                    {/* Physical Spacer for guaranteed gap */}
                                    <div className="h-6" aria-hidden="true" />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-8">
                                            <div>
                                                <label className="block text-xs font-black text-gray-500 mb-4 uppercase tracking-[0.2em] ml-1">
                                                    Categoría Principal
                                                </label>
                                                <div className="relative group">
                                                    <select
                                                        value={selectedCategoryId}
                                                        onChange={(e) => {
                                                            setSelectedCategoryId(Number(e.target.value) || '');
                                                            setSelectedSubcategoryId('');
                                                        }}
                                                        className="w-full px-6 md:px-10 py-4 md:py-6 bg-gray-50/50 focus:bg-white border-2 border-gray-100 focus:border-teal rounded-[1.5rem] text-graphite font-black text-lg md:text-2xl outline-none transition-all cursor-pointer appearance-none shadow-sm"
                                                        required
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-teal transition-colors">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedCategoryId && (() => {
                                                const cat = categories.find(c => c.id === selectedCategoryId);
                                                const subs = cat?.subcategories ?? [];
                                                if (subs.length === 0) return null;
                                                return (
                                                    <div className="animate-in fade-in slide-in-from-top-2">
                                                        <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest ml-1">
                                                            Subcategoría (Opcional)
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                value={selectedSubcategoryId}
                                                                onChange={(e) => setSelectedSubcategoryId(Number(e.target.value) || '')}
                                                                className="w-full px-6 py-4 bg-gray-50 focus:bg-white border-2 border-gray-100 focus:border-teal rounded-2xl text-graphite font-black text-lg outline-none transition-all cursor-pointer appearance-none shadow-sm"
                                                            >
                                                                <option value="">Sin subcategoría</option>
                                                                {subs.map((sub: { id: number; name: string }) => (
                                                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="space-y-8">
                                            <div>
                                                <label htmlFor="barcode" className="block text-xs font-black text-gray-500 mb-4 uppercase tracking-[0.2em] ml-1">
                                                    Código de Barras
                                                </label>
                                                <div className="flex gap-4">
                                                    <div className="relative flex-1">
                                                        <input
                                                            id="barcode"
                                                            type="text"
                                                            value={barcode}
                                                            onChange={(e) => setBarcode(e.target.value)}
                                                            onBlur={(e) => checkBarcode(e.target.value)}
                                                            className="w-full px-6 md:px-10 py-4 md:py-6 bg-gray-50/50 focus:bg-white border-2 border-gray-100 focus:border-indigo-500 rounded-[1.5rem] text-graphite font-black text-lg md:text-2xl outline-none transition-all font-mono shadow-sm"
                                                            placeholder="000000000"
                                                            required
                                                        />
                                                        {isChecking && (
                                                            <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                                                <div className="animate-spin h-6 w-6 border-2 border-teal border-t-transparent rounded-full" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={generateBarcode}
                                                        className="px-10 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-[1.25rem] font-black uppercase text-[11px] tracking-widest transition-all border-2 border-indigo-100/50 hover:border-transparent active:scale-95 shadow-sm"
                                                        title="Generar automáticamente"
                                                    >
                                                        Auto
                                                    </button>
                                                </div>
                                            </div>

                                            {barcode && (
                                                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl min-h-[100px] animate-in zoom-in-95">
                                                    <div className="bg-white p-2 rounded-lg shadow-sm">
                                                        <Barcode
                                                            value={barcode}
                                                            format="CODE128"
                                                            width={1.2}
                                                            height={40}
                                                            fontSize={10}
                                                            displayValue={true}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* Prices & Stock Card */}
                                {(isPromo || isCombo) && (
                                    <section className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 p-6 sm:p-8 md:p-16 space-y-8 md:space-y-12 transition-all hover:shadow-indigo-500/5">
                                        <div className="flex items-center gap-5 md:gap-6">
                                            <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white text-2xl md:text-3xl shadow-xl shadow-indigo-600/20 shrink-0">💰</div>
                                            <div>
                                                <h2 className="text-3xl md:text-4xl font-black text-graphite tracking-tight leading-none">Costos y Rentabilidad</h2>
                                                <p className="text-gray-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-2">Estructura de precios y márgenes</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-12">
                                                <div>
                                                    <label className="block text-xs font-black text-gray-500 mb-5 uppercase tracking-[0.2em] ml-1 text-center md:text-left">Costo Base de Producción / Compra</label>
                                                    <div className="relative group">
                                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-gray-200 group-focus-within:text-indigo-600 transition-colors">$</span>
                                                        <input
                                                            type="text"
                                                            value={basePrice}
                                                            onChange={(e) => {
                                                                const base = e.target.value;
                                                                const b = parseFloat(base) || 0;
                                                                const m = parseFloat(markup) || 0;
                                                                let final = '0';
                                                                if (markupType === 'percentage') final = (b + (b * m / 100)).toFixed(2);
                                                                else final = (b + m).toFixed(2);
                                                                setBasePrice(base);
                                                                setPrice(final);
                                                            }}
                                                            className="w-full pl-12 md:pl-20 pr-6 md:pr-10 py-6 md:py-8 bg-gray-50/50 focus:bg-white border-2 border-gray-100 focus:border-indigo-600 rounded-[2rem] font-black text-3xl md:text-5xl text-graphite outline-none transition-all shadow-sm"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-black text-gray-500 mb-5 uppercase tracking-[0.2em] ml-1">Margen de Ganancia</label>
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative flex-1">
                                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-black text-pink-hot">
                                                                {markupType === 'percentage' ? '%' : '$'}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={markup}
                                                                onChange={(e) => {
                                                                    const mark = e.target.value;
                                                                    const b = parseFloat(basePrice) || 0;
                                                                    const m = parseFloat(mark) || 0;
                                                                    let final = '0';
                                                                    if (markupType === 'percentage') final = (b + (b * m / 100)).toFixed(2);
                                                                    else final = (b + m).toFixed(2);
                                                                    setMarkup(mark);
                                                                    setPrice(final);
                                                                }}
                                                                className="w-full px-6 md:px-10 py-4 md:py-6 bg-gray-50/50 focus:bg-white border-2 border-gray-100 focus:border-pink-hot rounded-[2rem] font-black text-3xl md:text-5xl text-pink-hot outline-none transition-all shadow-sm focus:shadow-pink-500/5"
                                                            />
                                                        </div>
                                                        <div className="flex bg-gray-100/50 p-2.5 rounded-[1.75rem] border border-gray-100 h-[96px] shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const b = parseFloat(basePrice) || 0;
                                                                    const m = parseFloat(markup) || 0;
                                                                    const final = (b + (b * m / 100)).toFixed(2);
                                                                    setMarkupType('percentage');
                                                                    setPrice(final);
                                                                }}
                                                                className={`px-8 text-sm font-black rounded-2xl transition-all ${markupType === 'percentage' ? 'bg-pink-hot text-white shadow-xl shadow-pink-500/30' : 'text-gray-500 hover:text-gray-600'}`}
                                                            >%</button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const b = parseFloat(basePrice) || 0;
                                                                    const m = parseFloat(markup) || 0;
                                                                    const final = (b + m).toFixed(2);
                                                                    setMarkupType('manual');
                                                                    setPrice(final);
                                                                }}
                                                                className={`px-8 text-sm font-black rounded-2xl transition-all ${markupType === 'manual' ? 'bg-teal text-white shadow-xl shadow-teal-500/30' : 'text-gray-500 hover:text-gray-600'}`}
                                                            >$</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between space-y-12">
                                                <div>
                                                    <label className="block text-xs font-black text-gray-500 mb-5 uppercase tracking-[0.2em] ml-1 text-center md:text-left">Stock Inicial Disponible</label>
                                                    <input
                                                        type="text"
                                                        value={stock}
                                                        onChange={(e) => setStock(e.target.value)}
                                                        className="w-full px-10 py-7 bg-gray-50/50 focus:bg-white border-2 border-gray-100 focus:border-teal rounded-[1.75rem] font-black text-5xl text-center text-graphite outline-none transition-all shadow-sm"
                                                        placeholder="0"
                                                    />
                                                </div>

                                                <div className="bg-graphite p-12 rounded-[2.5rem] shadow-[0px_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col items-center md:items-start justify-center overflow-hidden relative">
                                                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 -mr-20 -mt-20 rounded-full blur-3xl opacity-50" />
                                                    <span className="text-xs font-black uppercase text-gray-500 tracking-[0.3em] mb-4 relative z-10">Precio Final sugerido</span>
                                                    <div className="flex items-baseline gap-4 relative z-10">
                                                        <span className="text-2xl md:text-3xl font-black text-teal">$</span>
                                                        <span className="text-5xl md:text-7xl font-black text-white tabular-nums tracking-tighter drop-shadow-lg">{price}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* RIGHT COLUMN: Media */}
                            <div className="lg:col-span-4 space-y-12">
                                {/* Images Card */}
                                <section className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 p-6 sm:p-8 md:p-10 space-y-8 md:space-y-12 sticky top-12 transition-all hover:shadow-teal/5">
                                    <div className="flex items-center gap-5 md:gap-6">
                                        <div className="w-12 h-16 md:w-14 md:h-20 bg-teal rounded-[1.25rem] flex items-center justify-center text-white text-2xl md:text-3xl shadow-xl shadow-teal-500/20 shrink-0">📸</div>
                                        <div>
                                            <h2 className="text-3xl md:text-4xl font-black text-graphite tracking-tight leading-none">Galería Multimedia</h2>
                                            <p className="text-gray-600 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-2">Visualización premium del producto</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em] ml-1 text-center">Imagen de Portada</label>
                                        <div className="relative group aspect-[4/5] bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex items-center justify-center overflow-hidden transition-all hover:border-teal/50 hover:bg-teal/[0.02] shadow-sm">
                                            {mainImagePreview ? (
                                                <>
                                                    <img src={mainImagePreview} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-graphite/60 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-center justify-center">
                                                        <label className="px-6 py-3 bg-white text-graphite text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl cursor-pointer shadow-2xl active:scale-95 transition-all">
                                                            Sustituir Imagen
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setMainImageFile(file);
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => setMainImagePreview(reader.result as string);
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }} />
                                                        </label>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="flex flex-col items-center cursor-pointer p-8 text-center group/label">
                                                    <div className="w-20 h-20 bg-white shadow-xl shadow-gray-200/50 rounded-[2rem] flex items-center justify-center text-4xl mb-6 transition-transform group-hover/label:scale-110 group-hover/label:rotate-3 duration-300">🖼️</div>
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Cargar Fotografía</span>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-6">Formatos sugeridos: JPG, PNG • Máx 5MB</p>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setMainImageFile(file);
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setMainImagePreview(reader.result as string);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Gallery */}
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Galería de Fotos</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {galleryImagePreviews.map((preview, idx) => (
                                                <div key={idx} className="relative aspect-square border-2 border-gray-100 rounded-2xl overflow-hidden group">
                                                    <img src={preview} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setGalleryImagePreviews(prev => prev.filter((_, i) => i !== idx));
                                                            setGalleryImageFiles(prev => prev.filter((_, i) => i !== idx));
                                                        }}
                                                        className="absolute top-2 right-2 bg-red-pink text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-md active:scale-90"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="aspect-square border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-teal/30 hover:bg-teal/5 transition-all text-gray-400 hover:text-teal font-black uppercase text-xs tracking-widest gap-3 shadow-sm">
                                                <span className="text-3xl">➕</span>
                                                Subir
                                                <input
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        if (files.length > 0) {
                                                            setGalleryImageFiles(prev => [...prev, ...files]);
                                                            files.forEach(file => {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => setGalleryImagePreviews(prev => [...prev, reader.result as string]);
                                                                reader.readAsDataURL(file);
                                                            });
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </section>
                            </div>
                            {/* Variants / Attributes Section */}
                            {!isPromo && !isCombo && (
                                <section className="pt-20 space-y-14 animate-in fade-in slide-in-from-bottom-8 duration-700 col-span-1 lg:col-span-12">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 border-b border-gray-100 pb-8 md:pb-10">
                                        <div className="flex items-center gap-4 md:gap-6">
                                            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl md:rounded-3xl flex items-center justify-center text-xl md:text-3xl shadow-2xl shadow-rose-500/20 shrink-0 text-white">🌈</div>
                                            <div>
                                                <h3 className="text-2xl md:text-5xl font-black text-graphite tracking-tight uppercase leading-tight">Dimensiones y Variantes</h3>
                                                <p className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-widest md:tracking-[0.3em] mt-1 md:mt-3 ml-1">Configura tallas, colores o atributos específicos</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 1: Attribute Types */}
                                    <div className="bg-white rounded-[1.5rem] md:rounded-[1rem] border-2 border-graphite shadow-[8px_8px_0px_0px_#F2F2F2] md:shadow-[12px_12px_0px_0px_#F2F2F2] p-6 md:p-24 space-y-8 md:space-y-16">
                                        <div className="flex items-center gap-4 md:gap-8">
                                            <span className="w-10 h-10 md:w-16 md:h-16 bg-graphite text-white rounded-xl md:rounded-3xl flex items-center justify-center font-black text-lg md:text-2xl shadow-xl shadow-graphite/20">01</span>
                                            <h4 className="text-xl md:text-3xl font-black text-graphite uppercase tracking-widest md:tracking-[0.2em]">Seleccionar Dimensiones</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2 md:gap-4">
                                            {allAttributes.map(attr => (
                                                <button
                                                    key={attr.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (productAttributes.includes(attr.id)) {
                                                            setProductAttributes(prev => prev.filter(id => id !== attr.id));
                                                            const valueIdsToRemove = attr.values.map((v: any) => v.id);
                                                            setProductAttributeValues(prev => prev.filter(v => !valueIdsToRemove.includes(v.id)));
                                                        } else {
                                                            setProductAttributes(prev => [...prev, attr.id]);
                                                        }
                                                    }}
                                                    className={`px-4 py-2.5 md:px-12 md:py-8 rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-widest text-xs md:text-base transition-all border-2 ${productAttributes.includes(attr.id)
                                                        ? 'bg-pink-hot border-graphite text-white shadow-md md:shadow-[8px_8px_0px_0px_#333] -translate-y-1 md:-translate-y-2'
                                                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-pink-hot/30 hover:text-pink-hot'}`}
                                                >
                                                    {productAttributes.includes(attr.id) ? '✓ ' : ''}{attr.name}
                                                </button>
                                            ))}
                                            <Link
                                                to="/admin/catalog"
                                                className="px-8 md:px-12 py-6 md:py-8 rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[10px] md:text-xs bg-white text-gray-500 border-2 border-dashed border-gray-100 hover:border-teal hover:text-teal hover:bg-teal/[0.02] transition-all flex items-center gap-4 md:gap-6 active:scale-95 shadow-sm"
                                            >
                                                <span className="text-2xl md:text-3xl">➕</span> Configurar Clases
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Step 2: Attribute Values Configuration */}
                                    {productAttributes.length > 0 && (
                                        <div className="space-y-12 animate-in fade-in slide-in-from-top-4">
                                            <div className="flex items-center gap-6 ml-2">
                                                <span className="w-12 h-12 bg-teal text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-teal-500/20">02</span>
                                                <h4 className="text-2xl font-black text-graphite uppercase tracking-widest">Asignar Variantes Específicas</h4>
                                            </div>

                                            {productAttributes.map((attrId) => {
                                                const attr = allAttributes.find(a => a.id === attrId);
                                                if (!attr) return null;
                                                return (
                                                    <div key={attr.id} className="bg-white rounded-1xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden transition-all hover:shadow-2xl hover:shadow-gray-200/60">
                                                        <div className="bg-graphite p-6 md:px-20 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 -mr-32 -mt-32 rounded-full blur-3xl" />
                                                            <div className="flex items-center gap-4 md:gap-5 relative z-10">
                                                                <h5 className="text-white font-black uppercase tracking-widest md:tracking-[0.3em] text-sm md:text-base">{attr.name}</h5>
                                                                <span className="px-3 md:px-5 py-1 md:py-2 bg-white/10 rounded-full text-[9px] md:text-[10px] font-black text-white/50 uppercase tracking-widest">{attr.values.length} Disponibles</span>
                                                            </div>
                                                            <div className="relative group z-10 w-full md:w-auto">
                                                                <input
                                                                    id={`quick-add-${attr.id}`}
                                                                    type="text"
                                                                    placeholder={`Agregar ${attr.name.toLowerCase()}...`}
                                                                    className="pl-10 md:pl-12 pr-12 md:pr-20 py-4 md:py-8 bg-white/5 border border-white/10 rounded-xl md:rounded-[2rem] text-white placeholder-white/20 text-xs md:text-lg font-bold outline-none focus:bg-white/10 focus:border-teal/50 transition-all w-full md:w-[500px]"
                                                                    onKeyDown={async (e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            const input = e.target as HTMLInputElement;
                                                                            if (!input.value) return;
                                                                            try {
                                                                                const { data } = await api.post(`/admin/attributes/${attr.id}/values`, { name: input.value });
                                                                                setAllAttributes(prev => prev.map(a => a.id === attr.id ? { ...a, values: [...a.values, data] } : a));
                                                                                input.value = '';
                                                                            } catch (err) { console.error(err); }
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-teal transition-colors">
                                                                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-6 md:p-14 bg-[#FDFDFD]">
                                                            <div className="flex flex-wrap gap-2 md:gap-3">
                                                                {attr.values.map((val: any) => {
                                                                    const config = productAttributeValues.find(v => v.id === val.id);
                                                                    const isActive = !!config;
                                                                    return (
                                                                        <button
                                                                            key={val.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (isActive) {
                                                                                    setConfiguringValue({ ...config });
                                                                                } else {
                                                                                    setConfiguringValue({ id: val.id, name: val.name, basePrice: '0', markup: '30', markupType: 'percentage', price: '0', stock: '0' });
                                                                                }
                                                                            }}
                                                                            className={`px-5 py-2.5 md:px-16 md:py-9 rounded-xl md:rounded-[2rem] border-2 transition-all font-black uppercase text-xs md:text-base tracking-widest md:tracking-[0.2em] relative overflow-hidden group/btn ${isActive
                                                                                ? 'bg-teal border-transparent text-white shadow-lg md:shadow-xl shadow-teal-500/30 -translate-y-1 md:-translate-y-2'
                                                                                : 'bg-white border-gray-100 text-gray-500 hover:border-teal/50 hover:text-teal hover:shadow-xl hover:-translate-y-1 md:hover:-translate-y-2'}`}
                                                                        >
                                                                            {isActive && <div className="absolute inset-x-0 bottom-0 h-1.5 md:h-2.5 bg-white/30" />}
                                                                            {isActive ? '✓ ' : ''}{val.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Selected Summary for this attribute */}
                                                            {productAttributeValues.filter(v => attr.values.some((av: any) => av.id === v.id)).length > 0 && (
                                                                <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-100">
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                        {productAttributeValues.filter(v => attr.values.some((av: any) => av.id === v.id)).map(v => (
                                                                            <div key={v.id} className="bg-white p-6 rounded-[1.5rem] border-2 border-gray-50 flex items-center justify-between group hover:border-pink-hot/30 hover:shadow-lg transition-all">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm font-black text-graphite uppercase tracking-tight">{v.name}</span>
                                                                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">${v.price} · {v.stock} u.</span>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setProductAttributeValues(prev => prev.filter(pv => pv.id !== v.id))}
                                                                                    className="w-8 h-8 rounded-lg bg-red-pink/5 text-red-pink opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                                                                                >
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            )}

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-16 mt-12 md:mt-32 pt-12 md:pt-24 mb-12 md:mb-16 border-t-4 border-gray-100 col-span-1 lg:col-span-12">
                                <Link
                                    to="/admin/products"
                                    className="w-full md:w-auto px-8 md:px-24 py-6 md:py-11 bg-white border-4 border-gray-100 text-gray-500 font-black uppercase tracking-widest md:tracking-[0.3em] text-[10px] md:text-sm rounded-2xl md:rounded-[2.5rem] hover:bg-gray-50 hover:text-graphite hover:border-graphite shadow-sm active:scale-95 transition-all text-center"
                                >
                                    Descartar y Volver
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full md:min-w-[700px] py-7 md:py-13 px-8 md:px-32 bg-teal hover:bg-teal-600 text-white font-black uppercase tracking-widest md:tracking-[0.5em] text-sm md:text-xl rounded-2xl md:rounded-[3rem] shadow-xl md:shadow-[0px_60px_120px_-20px_rgba(20,184,166,0.6)] hover:-translate-y-2 md:hover:-translate-y-3 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Guardando catálogo...' : (isEditing ? 'Actualizar Información Ahora' : 'Publicar Producto Ahora')}
                                </button>
                            </div>

                            {/* Guaranteed white spacer at the very bottom - Reduced on mobile */}
                            <div className="h-16 md:h-64 col-span-1 lg:col-span-12" aria-hidden="true" />
                        </div>
                    </form>

                    {/* Integrated Footer Area - Now inside max-w-5xl for perfect alignment */}
                    <div className="pt-20 md:pt-40 pb-24 md:pb-48 text-center space-y-8 md:space-y-12 w-full">
                        <div className="flex justify-center gap-4 opacity-10">
                            <div className="w-12 h-1.5 bg-pink-hot rounded-full"></div>
                            <div className="w-12 h-1.5 bg-teal rounded-full"></div>
                        </div>
                        <p className="text-gray-400 text-[10px] sm:text-[14px] font-black uppercase tracking-[0.4em] md:tracking-[0.8em] max-w-5xl mx-auto leading-relaxed opacity-40 italic">
                            SISTEMA CENTRAL DE GESTIÓN VISUAL • VERSIÓN 2.5
                        </p>
                    </div>
                </div>

                <div style={{ display: 'none' }}>
                    <div ref={barcodeRef} className="p-10 flex flex-col items-center bg-white text-black">
                        <h3 className="text-2xl font-black mb-2 uppercase">{name}</h3>
                        <Barcode value={barcode || '0'} format="CODE128" width={2} height={80} displayValue={true} />
                    </div>
                </div>

                {configuringValue && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-graphite/60 backdrop-blur-md p-4 animate-in fade-in duration-500">
                        <div className="w-full max-w-lg bg-white rounded-[2.5rem] border border-gray-100 shadow-[0px_40px_100px_-20px_rgba(0,0,0,0.2)] p-10 transform transition-all animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh] overflow-hidden relative">
                            {/* Decorative element */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal via-pink-hot to-indigo-600 opacity-20" />

                            <div className="flex justify-between items-center mb-6 md:mb-10 border-b border-gray-100 pb-6 md:pb-8 shrink-0">
                                <div className="pr-4">
                                    <p className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest md:tracking-[0.4em] mb-1 md:mb-2 italic">Configuración Detallada</p>
                                    <h2 className="text-xl md:text-4xl font-black uppercase tracking-tighter text-graphite leading-none">
                                        Variante: <span className="text-teal">{configuringValue.name}</span>
                                    </h2>
                                </div>
                                <button onClick={() => setConfiguringValue(null)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gray-50 text-gray-500 hover:text-red-pink hover:bg-red-50 transition-all flex items-center justify-center shadow-sm shrink-0">
                                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-3 space-y-12 custom-scrollbar">
                                <div className="flex flex-col items-center gap-6 md:gap-8 bg-gray-50/50 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100">
                                    <div className="w-32 h-32 md:w-40 md:h-40 border-6 md:border-8 border-white rounded-2xl md:rounded-[2.5rem] flex items-center justify-center overflow-hidden bg-white shadow-2xl relative group">
                                        {configuringValue.imagePreview ? (
                                            <img src={configuringValue.imagePreview} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <span className="text-6xl grayscale opacity-20 mb-3">📸</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sin Foto</span>
                                            </div>
                                        )}
                                    </div>
                                    <label className="px-12 py-4 bg-teal text-white text-xs font-black uppercase tracking-[0.25em] rounded-2xl cursor-pointer transition-all shadow-xl shadow-teal-500/30 hover:bg-teal-600 active:scale-95">
                                        {configuringValue.imagePreview ? 'Cambiar Imagen' : 'Vincular Fotografía'}
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setConfiguringValue({ ...configuringValue, imageFile: file, imagePreview: reader.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>

                                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] space-y-8 md:space-y-10 border border-gray-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 -mr-16 -mt-16 rounded-full blur-2xl" />

                                    <div className="grid grid-cols-2 gap-4 md:gap-8 relative z-10">
                                        <div className="space-y-3 md:space-y-5">
                                            <label className="block text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Costo Base ($)</label>
                                            <input
                                                type="text"
                                                value={configuringValue.basePrice}
                                                onChange={(e) => {
                                                    const base = e.target.value;
                                                    const mark = configuringValue.markup;
                                                    const type = configuringValue.markupType;
                                                    let final = '0';
                                                    const b = parseFloat(base) || 0;
                                                    const m = parseFloat(mark) || 0;
                                                    if (type === 'percentage') final = (b + (b * m / 100)).toFixed(2);
                                                    else final = (b + m).toFixed(2);
                                                    setConfiguringValue({ ...configuringValue, basePrice: base, price: final });
                                                }}
                                                className="w-full px-4 md:px-8 py-3 md:py-5 bg-gray-50/50 border-2 border-gray-50 focus:border-indigo-500 rounded-xl md:rounded-3xl font-black text-lg md:text-2xl text-graphite outline-none transition-all placeholder:text-gray-300"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="flex flex-col space-y-3 md:space-y-5">
                                            <label className="block text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Rentabilidad</label>
                                            <div className="flex bg-gray-50/80 rounded-2xl md:rounded-[1.75rem] border border-gray-100 p-1.5 md:p-2 h-[60px] md:h-[80px]">
                                                <button
                                                    onClick={() => {
                                                        const base = configuringValue.basePrice;
                                                        const mark = configuringValue.markup;
                                                        const b = parseFloat(base) || 0;
                                                        const m = parseFloat(mark) || 0;
                                                        const final = (b + (b * m / 100)).toFixed(2);
                                                        setConfiguringValue({ ...configuringValue, markupType: 'percentage', price: final });
                                                    }}
                                                    className={`flex-1 text-[10px] md:text-[11px] font-black rounded-xl md:rounded-[1.25rem] uppercase tracking-widest transition-all ${configuringValue.markupType === 'percentage' ? 'bg-pink-hot text-white shadow-lg md:shadow-xl shadow-pink-500/30' : 'text-gray-500 hover:text-pink-hot/50'}`}
                                                >Prc.</button>
                                                <button
                                                    onClick={() => {
                                                        const base = configuringValue.basePrice;
                                                        const mark = configuringValue.markup;
                                                        const b = parseFloat(base) || 0;
                                                        const m = parseFloat(mark) || 0;
                                                        const final = (b + m).toFixed(2);
                                                        setConfiguringValue({ ...configuringValue, markupType: 'manual', price: final });
                                                    }}
                                                    className={`flex-1 text-[10px] md:text-[11px] font-black rounded-xl md:rounded-[1.25rem] uppercase tracking-widest transition-all ${configuringValue.markupType === 'manual' ? 'bg-teal text-white shadow-lg md:shadow-xl shadow-teal-500/30' : 'text-gray-500 hover:text-teal/50'}`}
                                                >Fija</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 md:space-y-5">
                                        <label className="block text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                                            Ganancia {configuringValue.markupType === 'percentage' ? 'Aplicada (%)' : 'Cargada ($)'}
                                        </label>
                                        <input
                                            type="text"
                                            value={configuringValue.markup}
                                            onChange={(e) => {
                                                const mark = e.target.value;
                                                const base = configuringValue.basePrice;
                                                const type = configuringValue.markupType;
                                                let final = '0';
                                                const b = parseFloat(base) || 0;
                                                const m = parseFloat(mark) || 0;
                                                if (type === 'percentage') final = (b + (b * m / 100)).toFixed(2);
                                                else final = (b + m).toFixed(2);
                                                setConfiguringValue({ ...configuringValue, markup: mark, price: final });
                                            }}
                                            className="w-full px-6 md:px-10 py-3 md:py-6 bg-gray-50/50 border-2 border-gray-50 focus:border-pink-hot rounded-2xl md:rounded-[1.5rem] font-black text-2xl md:text-5xl text-pink-hot outline-none transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-3 md:space-y-5">
                                        <label className="block text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Control de Stock</label>
                                        <input
                                            type="text"
                                            value={configuringValue.stock}
                                            onChange={(e) => setConfiguringValue({ ...configuringValue, stock: e.target.value })}
                                            className="w-full px-6 md:px-10 py-3 md:py-6 bg-gray-50/50 border-2 border-gray-50 focus:border-teal rounded-2xl md:rounded-[1.5rem] font-black text-2xl md:text-5xl text-graphite outline-none transition-all shadow-sm"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="pt-6 md:pt-10 border-t border-gray-100 flex justify-between items-end text-graphite font-black">
                                        <div>
                                            <span className="uppercase text-[10px] md:text-xs tracking-widest md:tracking-[0.4em] text-gray-500 block mb-1 md:mb-2 italic">Precio de Venta Final</span>
                                            <span className="text-3xl md:text-6xl font-black text-graphite tracking-tighter tabular-nums">${configuringValue.price}</span>
                                        </div>
                                        <div className="w-12 h-12 md:w-16 md:h-16 bg-teal/10 rounded-xl md:rounded-2xl flex items-center justify-center text-teal text-xl md:text-3xl">🏷️</div>
                                    </div>
                                </div>

                                <div className="space-y-4 md:space-y-6 pb-6 md:pb-10">
                                    <button
                                        type="button"
                                        onClick={() => handleConfigSave(configuringValue)}
                                        className="w-full py-5 md:py-7 bg-graphite hover:bg-slate-800 text-white font-black uppercase tracking-widest md:tracking-[0.3em] text-[10px] md:text-[11px] rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-gray-400/20 active:scale-[0.98] transition-all"
                                    >
                                        Fijar Configuración
                                    </button>

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!window.confirm(`¿Eliminar la variante "${configuringValue.name}" permanentemente?`)) return;
                                            try {
                                                const parentAttr = allAttributes.find(a =>
                                                    a.values.some((v: any) => v.id === configuringValue.id)
                                                );
                                                if (parentAttr) {
                                                    await api.delete(`/admin/attributes/${parentAttr.id}/values/${configuringValue.id}`);
                                                }
                                                setAllAttributes(prev => prev.map(a => ({
                                                    ...a,
                                                    values: a.values.filter((v: any) => v.id !== configuringValue.id)
                                                })));
                                                setProductAttributeValues(prev => prev.filter(v => v.id !== configuringValue.id));
                                                setConfiguringValue(null);
                                            } catch (err) {
                                                setProductAttributeValues(prev => prev.filter(v => v.id !== configuringValue.id));
                                                setConfiguringValue(null);
                                            }
                                        }}
                                        className="w-full py-3 md:py-4 text-gray-400 font-bold uppercase tracking-widest text-[9px] hover:text-red-pink hover:bg-red-50/50 rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-2 md:gap-3"
                                    >
                                        <span>🗑️</span> Borrar de Base de Datos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
