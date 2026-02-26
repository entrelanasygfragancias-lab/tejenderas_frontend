import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import api from '../../api';
import { getStorageUrl } from '../../utils/imageUrl';
import AdminLayout from '../../components/AdminLayout';

interface DbSubcategory {
    id: number;
    category_id: number;
    name: string;
    slug: string;
}

interface DbCategory {
    id: number;
    name: string;
    slug: string;
    subcategories?: DbSubcategory[];
}

interface Product {
    id: number;
    barcode: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image: string | null;
    category_id?: number;
    subcategory_id?: number;
    variants?: { id: string; name: string; values: { id: string; name: string; priceDelta?: string | number }[] }[] | string | null;
    sold_quantity?: number;
    stock_in_total?: number;
    stock_out_total?: number;
    variant_movements?: Record<string, { in?: number; out?: number }>;
}

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const [copiedBarcodeId, setCopiedBarcodeId] = useState<number | null>(null);
    const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
    const [stockModalQty, setStockModalQty] = useState('');
    const [isStockSaving, setIsStockSaving] = useState(false);
    const [stockModalVariants, setStockModalVariants] = useState<Record<string, string>>({});

    const [currentCategory, setCurrentCategory] = useState('todos');
    const [selectedDbCategoryId, setSelectedDbCategoryId] = useState<number | null>(null);
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | 'all'>('all');
    const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const isPerfumCat = (catId?: number) => {
        if (!catId) return false;
        const cat = dbCategories.find(c => c.id === catId);
        if (!cat) return false;
        return cat.slug?.toLowerCase().includes('perfum') || cat.name?.toLowerCase().includes('perfum');
    };

    const filteredProducts = products.filter(product => {
        // Search filter
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode.includes(searchTerm);
        if (!matchesSearch) return false;

        // Category filter
        if (currentCategory === 'todos') return true;

        if (currentCategory === 'telas') {
            if (isPerfumCat(product.category_id)) return false;
        }

        if (currentCategory === 'perfumeria') {
            if (!isPerfumCat(product.category_id)) return false;
        }

        // Tiered filter checks
        if (selectedDbCategoryId && product.category_id !== selectedDbCategoryId) return false;
        if (selectedSubcategoryId !== 'all' && product.subcategory_id !== selectedSubcategoryId) return false;

        return true;
    });

    // Expand variants for the table display
    const displayedRows = filteredProducts.flatMap(p => {
        const attrs = (p as any).attribute_values || [];
        if (attrs.length > 0) {
            return attrs.map((av: any) => ({
                ...p,
                rowKey: `${p.id}-var-${av.id}`,
                variantName: av.attribute ? `${av.attribute.name}: ${av.name}` : av.name,
                price: av.pivot?.price_delta || p.price,
                stock: av.pivot?.stock ?? 0,
                isVariant: true,
                variantAttributeId: av.attribute?.id,
                variantValueId: av.id
            }));
        }
        return [{ ...p, rowKey: `prod-${p.id}`, isVariant: false }];
    });

    const parseVariants = (variants: Product['variants']) => {
        if (Array.isArray(variants)) return variants;
        if (typeof variants === 'string') {
            try {
                const parsed = JSON.parse(variants);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: selectedProduct ? selectedProduct.name : 'Producto',
    });

    useEffect(() => {
        if (selectedProduct) {
            handlePrint();
            // Reset selection after print dialog opens (approximate)
            setTimeout(() => setSelectedProduct(null), 1000);
        }
    }, [selectedProduct]);

    const onPrintClick = (product: Product) => {
        setSelectedProduct(product);
    };

    const handleCopyBarcode = async (product: Product) => {
        try {
            await navigator.clipboard.writeText(product.barcode);
            setCopiedBarcodeId(product.id);
            setTimeout(() => setCopiedBarcodeId(null), 1200);
        } catch {
            setError('No se pudo copiar el código. Intenta de nuevo.');
        }
    };

    const openStockModal = (item: any) => {
        setStockModalProduct(item);
        setStockModalQty('');
        const initialVars: Record<string, string> = {};
        if (item.isVariant && item.variantAttributeId) {
            initialVars[String(item.variantAttributeId)] = String(item.variantValueId);
        }
        setStockModalVariants(initialVars);
        setError('');
    };

    const closeStockModal = () => {
        if (isStockSaving) return;
        setStockModalProduct(null);
        setStockModalQty('');
        setStockModalVariants({});
    };

    const handleSaveStock = async () => {
        if (!stockModalProduct) return;
        const qty = parseInt(stockModalQty, 10);
        if (!qty || qty <= 0) {
            setError('Ingresa una cantidad válida.');
            return;
        }
        const variantOptions = parseVariants(stockModalProduct.variants);
        if (variantOptions.length > 0) {
            const missing = variantOptions.some(opt => !stockModalVariants[opt.id]);
            if (missing) {
                setError('Selecciona todas las variantes.');
                return;
            }
        }
        const selections = variantOptions.length
            ? variantOptions.map(opt => {
                const chosenId = stockModalVariants[opt.id];
                const val = opt.values.find((v: { id: string; name: string; priceDelta?: string | number }) => String(v.id) === String(chosenId));
                return { option: opt.name, value: val?.name || '', priceDelta: val?.priceDelta ?? 0 };
            })
            : undefined;
        setIsStockSaving(true);
        try {
            const { data } = await api.post(`/admin/products/${stockModalProduct.id}/stock-in`, {
                quantity: qty,
                ...(selections ? { variants: selections } : {}),
            });
            const updated = data?.product;
            setProducts(prev => prev.map(p => (p.id === stockModalProduct.id ? { ...p, ...updated } : p)));
            setStockModalProduct(null);
            setStockModalQty('');
            setStockModalVariants({});
        } catch {
            setError('No se pudo registrar el ingreso.');
        } finally {
            setIsStockSaving(false);
        }
    };

    const getVariantTotals = (product: Product) => {
        const entries = Object.values(product.variant_movements ?? {});
        return entries.reduce(
            (acc: { in: number; out: number }, entry) => ({
                in: acc.in + (entry.in ?? 0),
                out: acc.out + (entry.out ?? 0),
            }),
            { in: 0, out: 0 }
        );
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories-public');
            setDbCategories(response.data);
        } catch (err) {
            console.error('Error al cargar categorías', err);
        }
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            // Local filtering is now used for categories too for consistency
            const response = await api.get('/admin/products');
            setProducts(response.data);
        } catch (err) {
            setError('Error al cargar los productos');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        try {
            await api.delete(`/admin/products/${id}`);
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            setError('Error al eliminar el producto');
            console.error(err);
        }
    };

    return (
        <AdminLayout
            title="Inventario"
            subtitle="Gestiona tus productos"
            titleWrapperClassName="translate-x-6 md:translate-x-12"
            actions={
                <Link
                    to="/admin/products/new"
                    className="px-6 py-3 bg-pink-hot hover:bg-pink-600 text-white font-black uppercase tracking-widest rounded-xl border-2 border-graphite shadow-[4px_4px_0px_0px_#333] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#333] transition-all flex items-center gap-2"
                >
                    <span className="text-xl">+</span> Nuevo Producto
                </Link>
            }
        >

            <div className="flex flex-col items-center w-full">
                {/* Title Spacer */}
                <div className="h-6 md:h-8 w-full block"></div>

                {error && (
                    <div className="w-[90%] md:w-full max-w-6xl mx-auto bg-red-pink/10 border-2 border-red-pink text-red-pink px-4 py-3 rounded-xl mb-6 font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                {/* Category Tabs */}
                <div className="w-[90%] md:w-full max-w-6xl mx-auto flex flex-col gap-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => { setCurrentCategory('todos'); setSelectedDbCategoryId(null); setSelectedSubcategoryId('all'); }}
                            className={`flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-lg transition-all border-b-8 ${currentCategory === 'todos'
                                ? 'bg-graphite text-white border-black shadow-[4px_4px_0px_0px_#333] translate-y-[-2px]'
                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            📦 Todos
                        </button>
                        <button
                            onClick={() => { setCurrentCategory('telas'); setSelectedDbCategoryId(null); setSelectedSubcategoryId('all'); }}
                            className={`flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-lg transition-all border-b-8 ${currentCategory === 'telas'
                                ? 'bg-pink-hot text-white border-pink-700 shadow-[4px_4px_0px_0px_#333] translate-y-[-2px]'
                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            🧵 Telas e Insumos
                        </button>
                        <button
                            onClick={() => { setCurrentCategory('perfumeria'); setSelectedDbCategoryId(null); setSelectedSubcategoryId('all'); }}
                            className={`flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-lg transition-all border-b-8 ${currentCategory === 'perfumeria'
                                ? 'bg-purple-600 text-white border-purple-800 shadow-[4px_4px_0px_0px_#333] translate-y-[-2px]'
                                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            ✨ Perfumería
                        </button>
                    </div>

                    {/* Level 2: Categorías dentro del grupo */}
                    {currentCategory !== 'todos' && (
                        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
                            <span className="w-full text-xs font-black uppercase text-gray-400 mb-1">Categorías:</span>
                            <button
                                onClick={() => { setSelectedDbCategoryId(null); setSelectedSubcategoryId('all'); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${selectedDbCategoryId === null ? 'bg-graphite text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200'}`}
                            >
                                Todas
                            </button>
                            {dbCategories.filter(c => {
                                const isP = c.slug?.toLowerCase().includes('perfum') || c.name?.toLowerCase().includes('perfum');
                                return currentCategory === 'perfumeria' ? isP : !isP;
                            }).map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => { setSelectedDbCategoryId(cat.id); setSelectedSubcategoryId('all'); }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${selectedDbCategoryId === cat.id ? 'bg-graphite text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200'}`}
                                >
                                    {cat.name.replace(/perfumería/gi, '').trim()}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Level 3: Subcategorías */}
                    {selectedDbCategoryId && (
                        <div className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm animate-fadeIn">
                            <span className="w-full text-[10px] font-black uppercase text-gray-300 mb-1">Subcategorías:</span>
                            <button
                                onClick={() => setSelectedSubcategoryId('all')}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${selectedSubcategoryId === 'all' ? 'bg-pink-hot text-white' : 'bg-gray-50 text-gray-400'}`}
                            >
                                Todas
                            </button>
                            {dbCategories.find(c => c.id === selectedDbCategoryId)?.subcategories?.map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => setSelectedSubcategoryId(sub.id)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${selectedSubcategoryId === sub.id ? 'bg-pink-hot text-white' : 'bg-gray-50 text-gray-400'}`}
                                >
                                    {sub.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search Input */}
                <div className="w-[90%] md:w-full max-w-6xl mx-auto mb-8">
                    <div className="relative">
                        {!searchTerm && !isSearchFocused && (
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none select-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                        )}
                        <input
                            type="text"
                            placeholder={searchTerm || isSearchFocused ? 'Buscar por nombre o código...' : ''}
                            className="w-full pl-12 pr-4 py-4 bg-white border-4 border-graphite rounded-2xl text-lg font-bold placeholder-gray-400 focus:outline-none focus:border-pink-hot transition-colors shadow-[4px_4px_0px_0px_#333]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-12 h-12 border-4 border-graphite border-t-pink-hot rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Cargando productos...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="w-[90%] md:w-full max-w-6xl mx-auto bg-white rounded-lg border-4 border-dashed border-gray-300 p-14 md:p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-graphite mb-2 uppercase">
                            {searchTerm ? 'No se encontraron resultados' : 'No hay productos'}
                        </h3>
                        <p className="text-gray-500 mb-8 font-medium">
                            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza agregando tu primer producto al inventario'}
                        </p>
                        {!searchTerm && (
                            <Link
                                to="/admin/products/new"
                                className="inline-block px-8 py-4 bg-teal hover:bg-teal-600 text-white font-black uppercase tracking-widest rounded-xl border-2 border-graphite shadow-[4px_4px_0px_0px_#333] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#333] transition-all"
                            >
                                Agregar producto
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="w-[90%] md:w-full max-w-6xl mx-auto">
                        <div className="bg-white rounded-lg border-4 border-graphite shadow-xl" style={{ padding: '16px' }}>
                            <div className="overflow-x-auto p-2 md:p-4">
                                <table className="w-full">
                                    <thead className="bg-graphite text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-black text-gray-300 uppercase tracking-wider" style={{ minWidth: '280px' }}>Producto</th>
                                            <th className="px-6 py-4 text-left text-xs font-black text-gray-300 uppercase tracking-wider" style={{ minWidth: '160px' }}>Código</th>
                                            <th className="px-6 py-4 text-center text-xs font-black text-gray-300 uppercase tracking-wider" style={{ minWidth: '200px' }}>Precio</th>
                                            <th className="py-4 text-center text-xs font-black text-gray-300 uppercase tracking-wider" style={{ paddingLeft: '1.2rem', paddingRight: '1.2rem', minWidth: '90px' }}>Stock</th>
                                            <th className="py-4 text-center text-xs font-black text-gray-300 uppercase tracking-wider" style={{ paddingLeft: '1.2rem', paddingRight: '1.2rem', minWidth: '90px' }}>Entradas</th>
                                            <th className="py-4 text-center text-xs font-black text-gray-300 uppercase tracking-wider" style={{ paddingLeft: '1.2rem', paddingRight: '1.2rem', minWidth: '90px' }}>Salidas</th>
                                            <th className="py-4 text-center text-xs font-black text-gray-300 uppercase tracking-wider" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', minWidth: '180px' }}>Totales Variantes</th>
                                            <th className="px-6 py-4 text-right text-xs font-black text-gray-300 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {displayedRows.map((item: any) => (
                                            <tr key={item.rowKey} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-6" style={{ minWidth: '280px' }}>
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                                                            {item.image ? (
                                                                <img
                                                                    src={getStorageUrl(item.image) || ''}
                                                                    alt={item.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-xl">🧶</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-graphite group-hover:text-pink-hot transition-all uppercase flex items-center gap-2">
                                                                {item.name}
                                                                {(item as any).is_promo && <span className="px-1.5 py-0.5 bg-pink-hot text-[9px] text-white font-black rounded uppercase">Promo</span>}
                                                                {(item as any).is_combo && <span className="px-1.5 py-0.5 bg-teal text-[9px] text-white font-black rounded uppercase">Combo</span>}
                                                            </div>
                                                            {item.variantName && (
                                                                <p className="mt-1 text-[10px] text-pink-hot font-black uppercase tracking-wider">
                                                                    {item.variantName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td
                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono cursor-pointer select-none"
                                                    onClick={() => handleCopyBarcode(item)}
                                                    title="Clic para copiar"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="group-hover:text-graphite transition-colors">{item.barcode}</span>
                                                        {copiedBarcodeId === item.id && (
                                                            <span className="text-xs font-black uppercase tracking-widest text-lime">Copiado</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-sm font-black text-teal">${Number(item.price).toFixed(2)}</span>
                                                </td>
                                                <td className="py-4 whitespace-nowrap text-center" style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
                                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${item.stock > 10
                                                        ? 'bg-green-100 text-green-800'
                                                        : item.stock > 0
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {item.stock}
                                                    </span>
                                                </td>
                                                <td className="py-4 whitespace-nowrap text-center text-sm font-black text-gray-600" style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
                                                    {item.stock_in_total ?? 0}
                                                </td>
                                                <td className="py-4 whitespace-nowrap text-center text-sm font-black text-red-pink" style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
                                                    {item.stock_out_total ?? item.sold_quantity ?? 0}
                                                </td>
                                                <td className="py-4 whitespace-nowrap text-center text-xs font-black text-blue-700" style={{ paddingLeft: '3rem', paddingRight: '3rem' }}>
                                                    {(() => {
                                                        const totals = getVariantTotals(item);
                                                        if (totals.in === 0 && totals.out === 0) return 'Sin movimientos';
                                                        return `E ${totals.in} / S ${totals.out}`;
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => openStockModal(item)}
                                                            className="text-emerald-600 hover:text-emerald-800 p-2"
                                                            title="Nuevo ingreso"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => onPrintClick(item)}
                                                            className="text-yellow-500 hover:text-yellow-700 p-2"
                                                            title="Imprimir"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                            </svg>
                                                        </button>
                                                        <Link
                                                            to={`/admin/products/${item.id}/edit`}
                                                            className="text-blue-600 hover:text-blue-900 p-2"
                                                            title="Editar"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="text-red-600 hover:text-red-900 p-2"
                                                            title="Eliminar"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {stockModalProduct && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                                    <div className="bg-white rounded-2xl border-4 border-graphite shadow-2xl w-full" style={{ maxWidth: '680px', padding: '2rem' }}>
                                        <div className="flex items-start justify-between" style={{ marginBottom: '1.5rem' }}>
                                            <div>
                                                <h3 className="font-black text-graphite" style={{ fontSize: '1.5rem' }}>Nuevo ingreso</h3>
                                                <p className="text-sm text-gray-500 font-bold" style={{ marginTop: '0.25rem' }}>{stockModalProduct.name}</p>
                                            </div>
                                            <button
                                                onClick={closeStockModal}
                                                className="text-gray-400 hover:text-red-pink"
                                                aria-label="Cerrar"
                                            >
                                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        <label className="block text-sm font-black text-graphite uppercase tracking-wide" style={{ marginBottom: '0.5rem' }}>Cantidad</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={stockModalQty}
                                            onChange={(e) => setStockModalQty(e.target.value)}
                                            className="w-full bg-white border-2 border-graphite rounded-xl text-graphite font-bold focus:outline-none focus:border-teal"
                                            style={{ padding: '0.75rem 1rem', fontSize: '1.125rem' }}
                                            placeholder="0"
                                        />
                                        {stockModalProduct && parseVariants(stockModalProduct.variants).length > 0 && (
                                            <div style={{ marginTop: '1.5rem' }}>
                                                <p className="font-black uppercase text-gray-400" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Selecciona variantes</p>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                                                    {parseVariants(stockModalProduct.variants).map(option => (
                                                        <div key={option.id} style={{ background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: '0.75rem', padding: '1rem' }}>
                                                            <label className="block font-black uppercase text-gray-500" style={{ fontSize: '0.7rem', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{option.name}</label>
                                                            <select
                                                                value={stockModalVariants[option.id] || ''}
                                                                onChange={(e) => setStockModalVariants(prev => ({ ...prev, [option.id]: e.target.value }))}
                                                                className="w-full bg-white border-2 border-graphite rounded-xl font-bold text-graphite focus:outline-none focus:border-teal"
                                                                style={{ padding: '0.65rem 1rem' }}
                                                            >
                                                                <option value="">Seleccione...</option>
                                                                {option.values.map((v: { id: string; name: string }) => (
                                                                    <option key={v.id} value={v.id}>{v.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex" style={{ gap: '1rem', marginTop: '2rem' }}>
                                            <button
                                                onClick={closeStockModal}
                                                disabled={isStockSaving}
                                                className="flex-1 bg-white hover:bg-gray-50 text-graphite font-bold border-2 border-graphite rounded-xl disabled:opacity-50"
                                                style={{ padding: '0.85rem' }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveStock}
                                                disabled={isStockSaving}
                                                className="flex-1 bg-teal hover:bg-teal-600 text-white font-black border-2 border-graphite rounded-xl disabled:opacity-50"
                                                style={{ padding: '0.85rem', fontSize: '1.1rem' }}
                                            >
                                                {isStockSaving ? 'Guardando...' : 'Guardar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Hidden print area */}
                            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                                <div ref={printRef} className="p-4 flex flex-col items-center justify-center bg-white min-w-[300px]">
                                    {selectedProduct && (
                                        <>
                                            <h4 className="font-bold text-lg mb-2 text-center">{selectedProduct.name}</h4>
                                            <Barcode
                                                value={selectedProduct.barcode || '000000000000'}
                                                format="CODE128"
                                                width={2}
                                                height={60}
                                                fontSize={16}
                                                displayValue={true}
                                            />
                                            <p className="mt-2 text-sm text-center max-w-[250px] truncate">{selectedProduct.description}</p>
                                            <p className="text-xl font-bold mt-1">${selectedProduct.price}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }
                <div className="h-12 md:h-16"></div>
            </div>
        </AdminLayout >
    );
}
