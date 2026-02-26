import { useState, type FormEvent, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import api from '../../api';
import { AxiosError } from 'axios';
import { getStorageUrl } from '../../utils/imageUrl';
import AdminLayout from '../../components/AdminLayout';

const getShapeIcon = (name: string) => {
    const n = name.toLowerCase().trim();
    if (n.includes('redon') || n.includes('circ') || n.includes('round') || n.includes('esfer') || n.includes('bola') || n.includes('botón') || n.includes('disco')) {
        return (
            <svg className="w-6 h-6 shrink-0 overflow-visible" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
            </svg>
        );
    }
    if (n.includes('cuadr') || n.includes('squar') || n.includes('rect') || n.includes('box')) {
        return (
            <svg className="w-6 h-6 shrink-0 overflow-visible" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="20" height="20" rx="3" />
            </svg>
        );
    }
    if (n.includes('trian') || n.includes('delta')) {
        return (
            <svg className="w-6 h-6 shrink-0 overflow-visible" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 21H22L12 2Z" />
            </svg>
        );
    }
    return null;
};

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
            <div style={{ paddingTop: '1rem', paddingBottom: '2rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }} className="flex flex-col items-center w-full">
                {/* Title Section (Outside) */}
                <div className="w-full max-w-4xl mb-12 flex justify-between items-end px-4">
                    <div className="flex flex-col">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-graphite uppercase tracking-tight leading-none mb-4">
                            {isEditing ? 'Editar Inventario' : 'Cargar Inventario'}
                        </h1>
                        <p className="text-gray-500 font-bold text-base sm:text-lg uppercase tracking-widest">
                            {isEditing ? 'Modifica los detalles del producto' : 'Configura el costo e imagen por cada clase'}
                        </p>
                    </div>
                    <Link
                        to="/admin/products"
                        className="bg-pink-hot border-2 border-graphite p-2.5 rounded-xl shadow-[3px_3px_0px_0px_#333] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                        title="Cerrar y Volver"
                    >
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Link>
                </div>

                <div className="w-full max-w-4xl rounded-2xl md:rounded-3xl border-[6px] border-pink-hot bg-white shadow-[15px_18px_0px_0px_#333] mb-16 overflow-hidden">
                    <div className="p-6 sm:p-10 md:p-16">

                        {error && (
                            <div className="bg-red-pink/10 border-2 border-red-pink text-red-pink px-4 py-3 rounded-xl mb-6 font-bold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Name, Barcode, Category — single column */}
                            <div className="flex flex-col gap-6">
                                <section className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <label htmlFor="name" className="block text-lg font-black text-graphite mb-3 uppercase tracking-wider">
                                            Nombre del Producto
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-6 py-4 bg-white border-[3px] border-graphite rounded-2xl text-graphite placeholder-gray-400 font-bold text-lg focus:outline-none focus:border-pink-hot focus:shadow-[6px_6px_0px_0px_#FE6196] transition-all"
                                            placeholder="Ej: Hilo de Algodón"
                                            required
                                        />
                                    </div>

                                    {/* Promo / Combo Switches */}
                                    <div className="flex flex-wrap gap-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsPromo(!isPromo)}
                                            className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-2xl border-[4px] transition-all font-black uppercase tracking-widest text-sm ${isPromo ? 'bg-pink-hot border-graphite text-white shadow-[6px_6px_0px_0px_#333] scale-105' : 'bg-white border-graphite/10 text-gray-400 hover:border-pink-hot/50 hover:text-pink-hot'}`}
                                        >
                                            <span className="text-2xl">{isPromo ? '🔥' : '🏷️'}</span>
                                            Es Promoción
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsCombo(!isCombo)}
                                            className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-2xl border-[4px] transition-all font-black uppercase tracking-widest text-sm ${isCombo ? 'bg-teal border-graphite text-white shadow-[6px_6px_0px_0px_#333] scale-105' : 'bg-white border-graphite/10 text-gray-400 hover:border-teal/50 hover:text-teal'}`}
                                        >
                                            <span className="text-2xl">{isCombo ? '📦' : '🎁'}</span>
                                            Es Combo
                                        </button>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label htmlFor="description" className="block text-lg font-black text-graphite mb-3 uppercase tracking-wider">
                                            Descripción del Producto
                                        </label>
                                        <textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className="w-full px-6 py-4 bg-white border-[3px] border-graphite rounded-2xl text-graphite placeholder-gray-400 font-bold text-lg focus:outline-none focus:border-pink-hot focus:shadow-[6px_6px_0px_0px_#FE6196] transition-all resize-none"
                                            placeholder="Detalla las características de la promoción o producto..."
                                        />
                                    </div>

                                    {/* Global Config (Show ONLY if Promo or Combo) */}
                                    {(isPromo || isCombo) && (
                                        <div className="bg-gray-50 p-8 sm:p-10 rounded-3xl border-4 border-dashed border-gray-200 space-y-8 animate-in fade-in slide-in-from-top-4">
                                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest text-center shadow-sm py-2 bg-white rounded-full border border-gray-100">Configuración de {isPromo ? 'Promoción' : 'Combo'} / Costos</p>

                                            {/* Image Upload for Promo/Combo */}
                                            <div className="flex flex-col items-center gap-6 bg-white p-10 rounded-3xl border-4 border-indigo-50 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600 opacity-20"></div>
                                                <div className="w-52 h-52 border-[6px] border-gray-100 rounded-3xl flex items-center justify-center overflow-hidden bg-gray-50 transition-all group-hover:border-indigo-100">
                                                    {mainImagePreview ? (
                                                        <img src={mainImagePreview} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-7xl grayscale opacity-10">🖼️</span>
                                                    )}
                                                </div>
                                                <label className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-widest rounded-2xl cursor-pointer transition-all shadow-lg active:scale-95 flex items-center gap-2">
                                                    <span>{mainImagePreview ? '🔄' : '📤'}</span>
                                                    {mainImagePreview ? 'Cambiar Imagen' : 'Subir Imagen del Combo'}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setMainImageFile(file);
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setMainImagePreview(reader.result as string);
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                <div>
                                                    <label className="block text-sm font-black text-gray-500 mb-3 uppercase tracking-widest ml-1">Costo Base ($)</label>
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
                                                        className="w-full px-6 py-4 bg-white border-[3px] border-gray-200 rounded-2xl font-black text-2xl text-graphite focus:border-pink-hot outline-none transition-all shadow-inner"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-black text-gray-500 mb-3 uppercase tracking-widest ml-1">Tipo de Utilidad</label>
                                                    <div className="flex bg-white rounded-2xl border-[3px] border-gray-200 p-1.5 h-[68px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const b = parseFloat(basePrice) || 0;
                                                                const m = parseFloat(markup) || 0;
                                                                const final = (b + (b * m / 100)).toFixed(2);
                                                                setMarkupType('percentage');
                                                                setPrice(final);
                                                            }}
                                                            className={`flex-1 text-sm font-black rounded-xl transition-all ${markupType === 'percentage' ? 'bg-pink-hot text-white shadow-md scale-[1.02]' : 'text-gray-300 hover:text-gray-400'}`}
                                                        >PORCENTAJE (%)</button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const b = parseFloat(basePrice) || 0;
                                                                const m = parseFloat(markup) || 0;
                                                                const final = (b + m).toFixed(2);
                                                                setMarkupType('manual');
                                                                setPrice(final);
                                                            }}
                                                            className={`flex-1 text-sm font-black rounded-xl transition-all ${markupType === 'manual' ? 'bg-teal text-white shadow-md scale-[1.02]' : 'text-gray-300 hover:text-gray-400'}`}
                                                        >MONTO FIJO ($)</button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                <div>
                                                    <label className="block text-sm font-black text-gray-500 mb-3 uppercase tracking-widest ml-1">Margen de Ganancia</label>
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
                                                        className="w-full px-6 py-4 bg-white border-[3px] border-gray-200 rounded-2xl font-black text-2xl text-pink-hot focus:border-pink-hot outline-none transition-all shadow-inner"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-black text-gray-500 mb-3 uppercase tracking-widest ml-1">Stock Inicial</label>
                                                    <input
                                                        type="text"
                                                        value={stock}
                                                        onChange={(e) => setStock(e.target.value)}
                                                        className="w-full px-6 py-4 bg-white border-[3px] border-gray-200 rounded-2xl font-black text-2xl text-graphite focus:border-teal outline-none transition-all shadow-inner"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>

                                            {/* Gallery Upload (Promos/Combos special focus but available for all) */}
                                            <div className="bg-white p-8 sm:p-10 rounded-3xl border-4 border-indigo-50 shadow-sm">
                                                <p className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <span>📸</span> Galería de Fotos de Referencia
                                                </p>

                                                <div className="flex flex-wrap gap-4">
                                                    {galleryImagePreviews.map((preview, idx) => (
                                                        <div key={idx} className="relative w-24 h-24 sm:w-32 sm:h-32 border-2 border-gray-100 rounded-2xl overflow-hidden group">
                                                            <img src={preview} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setGalleryImagePreviews(prev => prev.filter((_, i) => i !== idx));
                                                                    setGalleryImageFiles(prev => prev.filter((_, i) => i !== idx));
                                                                }}
                                                                className="absolute top-1 right-1 bg-red-pink text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <label className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                                                        <span className="text-2xl sm:text-3xl grayscale group-hover:grayscale-0 transition-all">➕</span>
                                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2 group-hover:text-indigo-400">Subir</span>
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
                                                                        reader.onloadend = () => {
                                                                            setGalleryImagePreviews(prev => [...prev, reader.result as string]);
                                                                        };
                                                                        reader.readAsDataURL(file);
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center bg-blue-600 px-10 py-8 rounded-3xl border-4 border-white shadow-xl">
                                                <span className="text-sm font-black uppercase text-white tracking-[0.2em]">Precio Final de Venta</span>
                                                <span className="text-4xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)]">${price}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Category */}
                                    <div>
                                        <label className="block text-lg font-black text-graphite mb-3 uppercase tracking-wider">
                                            Categoría Principal
                                        </label>
                                        <select
                                            value={selectedCategoryId}
                                            onChange={(e) => {
                                                setSelectedCategoryId(Number(e.target.value) || '');
                                                setSelectedSubcategoryId('');
                                            }}
                                            className="w-full px-6 py-4 bg-white border-[3px] border-graphite rounded-2xl text-graphite font-black text-lg focus:outline-none focus:border-pink-hot transition-all cursor-pointer appearance-none shadow-sm"
                                            required
                                        >
                                            <option value="">Seleccionar Categoría</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Subcategory selector — depends on selected category */}
                                    {selectedCategoryId && (() => {
                                        const cat = categories.find(c => c.id === selectedCategoryId);
                                        const subs = cat?.subcategories ?? [];
                                        if (subs.length === 0) return null;
                                        return (
                                            <div>
                                                <label className="block text-sm font-black text-graphite mb-2 uppercase tracking-wide">
                                                    Subcategoría
                                                </label>
                                                <select
                                                    value={selectedSubcategoryId}
                                                    onChange={(e) => setSelectedSubcategoryId(Number(e.target.value) || '')}
                                                    className="w-full px-4 py-3 bg-white border-2 border-graphite rounded-xl text-graphite font-bold focus:outline-none focus:border-pink-hot transition-all"
                                                >
                                                    <option value="">Sin subcategoría</option>
                                                    {subs.map((sub: { id: number; name: string }) => (
                                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })()}

                                    {/* Barcode */}
                                    <div>
                                        <label htmlFor="barcode" className="block text-lg font-black text-graphite mb-3 uppercase tracking-wider">
                                            Código de Barras Único
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="relative flex-1 min-w-[160px]">
                                                <input
                                                    id="barcode"
                                                    type="text"
                                                    value={barcode}
                                                    onChange={(e) => setBarcode(e.target.value)}
                                                    onBlur={(e) => checkBarcode(e.target.value)}
                                                    className="w-full px-6 py-4 bg-white border-[3px] border-graphite rounded-2xl text-graphite font-black text-lg focus:outline-none focus:border-pink-hot focus:shadow-[6px_6px_0px_0px_#FE6196] transition-all font-mono"
                                                    placeholder="Escanea o genera..."
                                                    required
                                                />
                                                {isChecking && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        <svg className="animate-spin h-5 w-5 text-teal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={generateBarcode}
                                                className="flex-1 sm:flex-none px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl border-[3px] border-graphite shadow-[5px_5px_0px_0px_#333] active:translate-y-1 active:shadow-none transition-all"
                                            >
                                                Generar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handlePrintClick}
                                                className="flex-1 sm:flex-none px-8 py-4 bg-teal hover:bg-teal-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl border-[3px] border-graphite shadow-[5px_5px_0px_0px_#333] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                                            >
                                                <span>🖨️</span> Imprimir
                                            </button>
                                        </div>

                                        {/* Live barcode preview */}
                                        {barcode && (
                                            <div className="mt-4 flex flex-col items-center bg-white border-2 border-gray-200 rounded-2xl py-5 px-4 shadow-sm">
                                                {name && <p className="text-sm font-black text-graphite mb-2 uppercase tracking-wide truncate max-w-full">{name}</p>}
                                                <Barcode
                                                    value={barcode}
                                                    format="CODE128"
                                                    width={2}
                                                    height={60}
                                                    fontSize={14}
                                                    displayValue={true}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Hidden Barcode for Printing */}
                                    <div style={{ display: 'none' }}>
                                        <div ref={barcodeRef} className="p-8 flex flex-col items-center justify-center bg-white min-w-[300px]">
                                            <h4 className="font-bold text-lg mb-2 text-center">{name}</h4>
                                            <Barcode
                                                value={barcode || '000000000000'}
                                                format="CODE128"
                                                width={2}
                                                height={60}
                                                fontSize={16}
                                                displayValue={true}
                                            />
                                            <p className="mt-2 text-sm text-center max-w-[250px] truncate">{description}</p>
                                        </div>
                                    </div>
                                </section>

                            </div>

                            {/* Variants Section (Hide if Promo or Combo) */}
                            {!isPromo && !isCombo && (
                                <div className="pt-14 border-t-4 border-gray-100 space-y-10 animate-in fade-in zoom-in-95 duration-300">
                                    {/* Section Header */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-lg shrink-0 border-4 border-indigo-400">✨</div>
                                        <div>
                                            <h3 className="text-4xl font-black text-graphite uppercase tracking-tight">Clases y Variantes</h3>
                                            <p className="text-base font-bold text-indigo-400 uppercase tracking-widest mt-1">Selecciona las clases, luego activa y configura cada variante</p>
                                        </div>
                                    </div>

                                    {/* Step 1: Select attribute groups */}
                                    <div className="bg-indigo-50 rounded-3xl border-[3px] border-indigo-200 p-8 sm:p-10 md:p-12 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <span className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-lg shrink-0 border-2 border-white shadow-sm">1</span>
                                            <p className="text-base font-black text-indigo-700 uppercase tracking-widest">Clases disponibles — actívalas haciendo clic</p>
                                        </div>
                                        <div className="flex flex-wrap gap-3 md:gap-5">
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
                                                    className={`px-5 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm md:text-base transition-all border-4 ${productAttributes.includes(attr.id)
                                                        ? 'bg-indigo-600 text-white border-indigo-800 shadow-[4px_4px_0px_0px_#333] -translate-y-0.5 sm:-translate-y-1'
                                                        : 'bg-white text-indigo-400 border-indigo-200 hover:border-indigo-500 hover:text-indigo-700 hover:shadow-md'}`}
                                                >
                                                    {productAttributes.includes(attr.id) ? '✓ ' : ''}{attr.name}
                                                </button>
                                            ))}
                                            <Link
                                                to="/admin/catalog"
                                                className="px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs bg-white text-gray-400 border-2 border-dashed border-gray-300 hover:bg-gray-50 hover:text-gray-600 transition-all flex items-center gap-2"
                                            >
                                                + Gestionar Clases
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Step 2: Configure values for each selected attribute */}
                                    {productAttributes.length > 0 && (() => {
                                        const COLORS = [
                                            { header: '#4f46e5', headerText: '#e0e7ff', light: '#eef2ff', border: '#a5b4fc', chip: '#c7d2fe', chipText: '#3730a3' },
                                            { header: '#7c3aed', headerText: '#ede9fe', light: '#f5f3ff', border: '#c4b5fd', chip: '#ddd6fe', chipText: '#5b21b6' },
                                            { header: '#9d174d', headerText: '#fce7f3', light: '#fdf2f8', border: '#f9a8d4', chip: '#fbcfe8', chipText: '#831843' },
                                            { header: '#0d9488', headerText: '#ccfbf1', light: '#f0fdfa', border: '#5eead4', chip: '#99f6e4', chipText: '#115e59' },
                                        ];
                                        return (
                                            <div className="space-y-10">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">2</span>
                                                    <p className="text-sm font-black text-indigo-700 uppercase tracking-widest">Activa y configura cada variante</p>
                                                </div>
                                                {productAttributes.map((attrId, attrIdx) => {
                                                    const attr = allAttributes.find(a => a.id === attrId);
                                                    const c = COLORS[attrIdx % COLORS.length];
                                                    if (!attr) return null;
                                                    return (
                                                        <div key={attr.id} style={{ borderColor: c.border, background: '#fff' }} className="rounded-2xl md:rounded-3xl border-2 overflow-hidden shadow-md">
                                                            {/* Attribute Header */}
                                                            <div style={{ background: c.header }} className="px-4 sm:px-6 md:px-8 py-4 md:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    <span style={{ color: c.headerText }} className="font-black uppercase tracking-widest text-base sm:text-lg md:text-xl">{attr.name}</span>
                                                                    <span style={{ color: c.headerText }} className="text-xs sm:text-sm font-bold opacity-70">({attr.values.length} variantes)</span>
                                                                </div>
                                                                {/* Add new value input */}
                                                                <div className="flex gap-2 items-center">
                                                                    <div className="relative flex-1 sm:flex-none">
                                                                        <input
                                                                            id={`add-input-${attr.id}`}
                                                                            type="text"
                                                                            placeholder={`+ Nueva variante...`}
                                                                            className="pl-4 pr-10 py-2 sm:py-2.5 bg-white/15 border border-white/40 rounded-xl text-white placeholder-white/60 text-sm font-bold outline-none focus:bg-white/25 focus:border-white transition-all w-full sm:w-44 md:w-48"
                                                                            onKeyDown={async (e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    e.preventDefault();
                                                                                    const inputEl = e.target as HTMLInputElement;
                                                                                    const val = inputEl.value;
                                                                                    if (!val) return;
                                                                                    try {
                                                                                        const { data } = await api.post(`/admin/attributes/${attr.id}/values`, { name: val });
                                                                                        const updatedAttrs = allAttributes.map(a =>
                                                                                            a.id === attr.id ? { ...a, values: [...a.values, data] } : a
                                                                                        );
                                                                                        setAllAttributes(updatedAttrs);
                                                                                        inputEl.value = '';
                                                                                        setConfiguringValue({ id: data.id, name: data.name, basePrice: '0', markup: '30', markupType: 'percentage', price: '0', stock: '0' });
                                                                                    } catch (err) { console.error(err); }
                                                                                }
                                                                            }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={async () => {
                                                                                const inputEl = document.getElementById(`add-input-${attr.id}`) as HTMLInputElement;
                                                                                const val = inputEl?.value;
                                                                                if (!val) return;
                                                                                try {
                                                                                    const { data } = await api.post(`/admin/attributes/${attr.id}/values`, { name: val });
                                                                                    const updatedAttrs = allAttributes.map(a =>
                                                                                        a.id === attr.id ? { ...a, values: [...a.values, data] } : a
                                                                                    );
                                                                                    setAllAttributes(updatedAttrs);
                                                                                    inputEl.value = '';
                                                                                    setConfiguringValue({ id: data.id, name: data.name, basePrice: '0', markup: '30', markupType: 'percentage', price: '0', stock: '0' });
                                                                                } catch (err) { console.error(err); }
                                                                            }}
                                                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/20 text-white rounded-lg flex items-center justify-center hover:bg-pink-hot transition-all"
                                                                        >
                                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Values Grid */}
                                                            <div style={{ background: c.light }} className="p-4 sm:p-6 md:p-8">
                                                                {attr.values.length === 0 ? (
                                                                    <p className="text-center text-sm font-bold uppercase opacity-40 py-4">Sin variantes — escribe arriba y Enter</p>
                                                                ) : (
                                                                    <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                                                                        {attr.values.map((val: any) => {
                                                                            const config = productAttributeValues.find(v => v.id === val.id);
                                                                            const isSelected = !!config;
                                                                            const nameLow = val.name.toLowerCase().trim();
                                                                            const isRound = nameLow.includes('redon') || nameLow.includes('circ') || nameLow.includes('round') || nameLow.includes('esfer') || nameLow.includes('bola') || nameLow.includes('botón') || nameLow.includes('disco');
                                                                            const isTriangle = nameLow.includes('trian') || nameLow.includes('delta');
                                                                            const isSquare = nameLow.includes('cuad') || nameLow.includes('squar') || nameLow.includes('rect') || nameLow.includes('box');
                                                                            const isStar = nameLow.includes('estre') || nameLow.includes('star');
                                                                            const isHeart = nameLow.includes('cora') || nameLow.includes('heart');
                                                                            const shapeIcon = getShapeIcon(val.name);

                                                                            return (
                                                                                <button
                                                                                    key={val.id}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        if (isSelected) {
                                                                                            if (config) setConfiguringValue({ ...config });
                                                                                        } else {
                                                                                            const newConfig: VariantConfig = { id: val.id, name: val.name, basePrice: '0', markup: '30', markupType: 'percentage', price: '0', stock: '0' };
                                                                                            setConfiguringValue(newConfig);
                                                                                        }
                                                                                    }}
                                                                                    style={{
                                                                                        borderRadius: isRound ? '50%' : isTriangle ? '0' : '14px',
                                                                                        aspectRatio: isRound || isTriangle || isSquare || isStar || isHeart ? '1/1' : undefined,
                                                                                        clipPath: isTriangle ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
                                                                                        background: isSelected ? c.header : '#fff',
                                                                                        borderColor: isSelected ? c.header : c.border,
                                                                                        color: isSelected ? '#fff' : c.header,
                                                                                        boxShadow: isSelected ? '4px 4px 0px 0px #333' : 'none',
                                                                                    }}
                                                                                    className={`font-black transition-all border-2 flex items-center justify-center gap-1 relative hover:opacity-80 ${isRound || isTriangle || isSquare || isStar || isHeart ? 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-[9px] sm:text-xs flex-col p-1 sm:p-2' : 'px-3 py-2 sm:px-5 sm:py-3 md:px-6 md:py-4 rounded-xl text-xs sm:text-sm md:text-base'}`}
                                                                                >
                                                                                    {shapeIcon && <div className="opacity-60 mb-1">{shapeIcon}</div>}
                                                                                    <span className="truncate max-w-full">{val.name}</span>
                                                                                    {isSelected && !isRound && !isTriangle && !isSquare && !isStar && !isHeart && (
                                                                                        <span className="ml-2 bg-white/20 px-1.5 rounded text-xs">✓</span>
                                                                                    )}
                                                                                    {isSelected && (isRound || isTriangle || isSquare || isStar || isHeart) && (
                                                                                        <div className="absolute top-0 right-0 w-4 h-4 bg-pink-hot rounded-full border-2 border-white" />
                                                                                    )}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                                {/* Selected variants summary */}
                                                                {productAttributeValues.filter(v => attr.values.some((av: any) => av.id === v.id)).length > 0 && (
                                                                    <div style={{ borderColor: c.border }} className="mt-6 pt-6 border-t-2">
                                                                        <p className="text-xs font-black uppercase tracking-widest mb-3 opacity-60">Variantes configuradas:</p>
                                                                        <div className="flex flex-wrap gap-3">
                                                                            {productAttributeValues.filter(v => attr.values.some((av: any) => av.id === v.id)).map(v => (
                                                                                <div key={v.id} style={{ background: c.chip, borderColor: c.border, color: c.chipText }} className="flex items-center gap-2 border rounded-2xl px-4 py-2.5">
                                                                                    <span className="text-sm font-black">{v.name}</span>
                                                                                    <span className="text-xs font-bold opacity-60">💲{v.price} · 📦{v.stock}</span>
                                                                                    <button type="button" onClick={() => setProductAttributeValues(prev => prev.filter(pv => pv.id !== v.id))} className="text-red-400 hover:text-red-600 transition-colors ml-1 font-black">✕</button>
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
                                        );
                                    })()}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-6 pt-12 md:pt-16 border-t-[6px] border-gray-100">
                                <Link
                                    to="/admin/products"
                                    className="flex-1 py-6 md:py-8 px-8 bg-white hover:bg-gray-50 text-graphite font-black uppercase tracking-widest text-base md:text-lg rounded-2xl border-[4px] border-graphite text-center transition-all active:translate-y-1 shadow-[4px_4px_0px_0px_#333] hover:shadow-none"
                                >
                                    Cancelar
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-[2] py-6 md:py-8 px-8 bg-teal hover:bg-teal-600 text-white font-black uppercase tracking-widest text-base md:text-lg rounded-2xl border-[4px] border-graphite shadow-[8px_8px_0px_0px_#333] md:shadow-[12px_12px_0px_0px_#333] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Inventario' : 'Finalizar Carga')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Print Barcode Section */}
            <div style={{ display: 'none' }}>
                <div ref={barcodeRef} className="p-10 flex flex-col items-center bg-white text-black">
                    <h3 className="text-2xl font-black mb-2 uppercase">{name}</h3>
                    <Barcode value={barcode || '0'} format="CODE128" width={2} height={80} displayValue={true} />
                </div>
            </div>

            {/* CONFIG MODAL */}
            {configuringValue && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-graphite/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-xl bg-white rounded-[3rem] border-4 border-graphite shadow-[20px_20px_0px_0px_rgba(0,0,0,0.3)] p-10 transform transition-all animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8 border-b-2 border-indigo-50 pb-4">
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-indigo-900">
                                Configurar: <span className="text-pink-hot">{configuringValue.name}</span>
                            </h3>
                            <button onClick={() => setConfiguringValue(null)} className="text-gray-300 hover:text-red-pink transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-indigo-200">
                                <div className="w-32 h-32 border-4 border-white rounded-3xl flex items-center justify-center overflow-hidden bg-white shadow-xl">
                                    {configuringValue.imagePreview ? (
                                        <img src={configuringValue.imagePreview} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl grayscale opacity-20">🖼️</span>
                                    )}
                                </div>
                                <label className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl cursor-pointer transition-all shadow-md">
                                    {configuringValue.imagePreview ? 'Cambiar Foto' : 'Subir Foto'}
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

                            <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-widest">Costo Base ($)</label>
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
                                            className="w-full px-5 py-3 bg-white border-2 border-indigo-100 rounded-2xl font-black text-xl text-graphite focus:border-indigo-600 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="block text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-widest">Tipo Margen</label>
                                        <div className="flex bg-white rounded-2xl border-2 border-indigo-100 p-1">
                                            <button
                                                onClick={() => {
                                                    const base = configuringValue.basePrice;
                                                    const mark = configuringValue.markup;
                                                    const b = parseFloat(base) || 0;
                                                    const m = parseFloat(mark) || 0;
                                                    const final = (b + (b * m / 100)).toFixed(2);
                                                    setConfiguringValue({ ...configuringValue, markupType: 'percentage', price: final });
                                                }}
                                                className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${configuringValue.markupType === 'percentage' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300'}`}
                                            >%</button>
                                            <button
                                                onClick={() => {
                                                    const base = configuringValue.basePrice;
                                                    const mark = configuringValue.markup;
                                                    const b = parseFloat(base) || 0;
                                                    const m = parseFloat(mark) || 0;
                                                    const final = (b + m).toFixed(2);
                                                    setConfiguringValue({ ...configuringValue, markupType: 'manual', price: final });
                                                }}
                                                className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${configuringValue.markupType === 'manual' ? 'bg-teal text-white shadow-md' : 'text-indigo-300'}`}
                                            >$</button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-widest">
                                        {configuringValue.markupType === 'percentage' ? 'Porcentaje de Utilidad' : 'Ganancia Manual'}
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
                                        className="w-full px-5 py-3 bg-white border-2 border-indigo-100 rounded-2xl font-black text-xl text-pink-hot focus:border-pink-hot outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-indigo-400 mb-2 uppercase tracking-widest">
                                        Stock Disponible
                                    </label>
                                    <input
                                        type="text"
                                        value={configuringValue.stock}
                                        onChange={(e) => setConfiguringValue({ ...configuringValue, stock: e.target.value })}
                                        className="w-full px-5 py-3 bg-white border-2 border-indigo-100 rounded-2xl font-black text-xl text-graphite focus:border-indigo-600 outline-none"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="pt-4 border-t-2 border-indigo-100/50 flex justify-between items-center text-indigo-900 font-black">
                                    <span className="uppercase text-xs tracking-widest">Precio Final de Venta</span>
                                    <span className="text-3xl font-black text-teal">${configuringValue.price}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleConfigSave(configuringValue)}
                                className="w-full py-5 bg-teal text-white font-black uppercase tracking-widest rounded-3xl border-4 border-graphite shadow-[8px_8px_0px_0px_#31473E] hover:translate-y-1 hover:shadow-none transition-all mb-4"
                            >
                                Asignar a Variante
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    if (!window.confirm(`¿Eliminar la variante "${configuringValue.name}" del sistema? Esta acción no se puede deshacer.`)) return;
                                    try {
                                        // Find parent attribute to build correct URL
                                        const parentAttr = allAttributes.find(a =>
                                            a.values.some((v: any) => v.id === configuringValue.id)
                                        );
                                        if (parentAttr) {
                                            await api.delete(`/admin/attributes/${parentAttr.id}/values/${configuringValue.id}`);
                                        }
                                        // Remove from all attributes list (UI disappears)
                                        setAllAttributes(prev => prev.map(a => ({
                                            ...a,
                                            values: a.values.filter((v: any) => v.id !== configuringValue.id)
                                        })));
                                        // Remove from product selection
                                        setProductAttributeValues(prev => prev.filter(v => v.id !== configuringValue.id));
                                        setConfiguringValue(null);
                                    } catch (err) {
                                        console.error('Error eliminando variante:', err);
                                        setProductAttributeValues(prev => prev.filter(v => v.id !== configuringValue.id));
                                        setConfiguringValue(null);
                                    }
                                }}
                                className="w-full py-4 text-red-pink font-black uppercase tracking-widest text-xs hover:bg-red-50 rounded-2xl transition-all"
                            >
                                🗑️ Eliminar Variante del Sistema
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
