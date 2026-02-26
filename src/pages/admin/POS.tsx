import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useZxing } from 'react-zxing';
import type { KeyboardEvent } from 'react';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Link } from 'react-router-dom';
import api from '../../api';
import { AxiosError } from 'axios';
import AdminLayout from '../../components/AdminLayout';
import { formatCurrency } from '../../utils/format';

interface VariantValue { id: string; name: string; priceDelta?: string | number; stock?: number }
interface VariantOption { id: string; name: string; values: VariantValue[] }

interface Product {
    id: number;
    barcode: string;
    name: string;
    price: number;
    stock: number;
    variants?: VariantOption[] | string | null;
    attributes?: any[];
    attribute_values?: any[];
}

interface CartItem {
    product: Product;
    quantity: number;
    unitPrice?: number;
    variants?: { option: string; value: string; priceDelta: number }[];
}

export default function POS() {
    const [barcode, setBarcode] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const [variantModal, setVariantModal] = useState<{ product: Product | null; options: VariantOption[]; selected: Record<string, string[]>; quantity: number } | null>(null);
    const [productSelection, setProductSelection] = useState<Product[] | null>(null);
    const [cashTendered, setCashTendered] = useState<string>('');
    const printRef = useRef<HTMLDivElement>(null);
    const [isCartHydrated, setIsCartHydrated] = useState(false);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'Factura POS',
    });
    const [showChargeModal, setShowChargeModal] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('pos_cart_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed?.cart)) setCart(parsed.cart as CartItem[]);
                if (typeof parsed?.paymentMethod === 'string') setPaymentMethod(parsed.paymentMethod);
                if (typeof parsed?.cashTendered === 'string') setCashTendered(parsed.cashTendered);
            }
        } catch {
            // ignore storage errors
        } finally {
            setIsCartHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!isCartHydrated) return;
        try {
            localStorage.setItem(
                'pos_cart_state',
                JSON.stringify({ cart, paymentMethod, cashTendered })
            );
        } catch {
            // ignore storage errors
        }
    }, [cart, paymentMethod, cashTendered, isCartHydrated]);

    const zxingHints = new Map();
    zxingHints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF,
        BarcodeFormat.CODE_93
    ]);
    zxingHints.set(DecodeHintType.TRY_HARDER, true);

    const { ref } = useZxing({
        onDecodeResult(result) {
            handleScannedCode(result.getText());
        },
        onError(error) {
            // While scanning, ZXing may throw NotFound/Checksum/Format exceptions frequently.
            // Those are normal (no code in frame yet) and should not be shown as permission errors.
            const errorName = (error as Error | undefined)?.name || '';
            const errorMessage = (error as Error | undefined)?.message || '';
            const isNonFatalScanError =
                errorName.includes('NotFound') ||
                errorName.includes('Checksum') ||
                errorName.includes('Format') ||
                errorMessage.toLowerCase().includes('notfound') ||
                errorMessage.toLowerCase().includes('checksum') ||
                errorMessage.toLowerCase().includes('format');

            if (isNonFatalScanError) return;

            console.error(error);
            setScanError('No se pudo acceder a la cámara. Revisa permisos del navegador y vuelve a intentar.');
        },
        constraints: {
            video: {
                facingMode: { ideal: 'environment' },
            },
        },
        hints: zxingHints,
        paused: !isScanning,
    });

    const handleScannedCode = (code: string) => {
        const normalized = code?.trim();
        if (!normalized) return;

        setBarcode(normalized);
        setIsScanning(false); // Close scanner after successful scan
        setScanError('');
        lookupProduct(normalized);
    };

    // Focus barcode input on mount
    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

    const total = cart.reduce((sum, item) => sum + ((item.unitPrice ?? item.product.price) * item.quantity), 0);
    const parseMoney = (val: any) => {
        if (val == null) return 0;
        const digits = String(val).replace(/\D/g, '');
        const n = parseInt(digits, 10);
        return isNaN(n) ? 0 : n;
    };
    const formatCashInput = (raw: string) => {
        const digits = raw.replace(/\D/g, '');
        if (!digits) return '';
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const getColorHex = (colorName: string, opacity: number = 1): string | null => {
        const colors: Record<string, string> = {
            'rojo': '239, 68, 68', 'red': '239, 68, 68',
            'azul': '59, 130, 246', 'blue': '59, 130, 246',
            'verde': '34, 197, 94', 'green': '34, 197, 94',
            'amarillo': '234, 179, 8', 'yellow': '234, 179, 8',
            'negro': '0, 0, 0', 'black': '0, 0, 0',
            'blanco': '255, 255, 255', 'white': '255, 255, 255',
            'gris': '156, 163, 175', 'gray': '156, 163, 175',
            'rosa': '236, 72, 153', 'pink': '236, 72, 153',
            'morado': '168, 85, 247', 'purple': '168, 85, 247',
            'naranja': '249, 115, 22', 'orange': '249, 115, 22',
            'cafe': '120, 53, 15', 'brown': '120, 53, 15',
            'celeste': '14, 165, 233', 'sky': '14, 165, 233',
            'beige': '245, 245, 220',
            'crema': '255, 253, 208',
            'dorado': '251, 191, 36',
            'plateado': '209, 213, 223'
        };
        const normalized = colorName.toLowerCase().trim();
        const rgb = colors[normalized];
        if (!rgb) return null;
        if (rgb.startsWith('#')) return rgb; // Fallback for hex
        return `rgba(${rgb}, ${opacity})`;
    };

    const getShapeIcon = (name: string) => {
        const n = name.toLowerCase().trim();
        // Detección ultra-amplia para cualquier variante de nombres geométricos
        if (n.includes('redon') || n.includes('circ') || n.includes('round') || n.includes('esfer') || n.includes('bola') || n.includes('botón') || n.includes('disco')) {
            return (
                <svg className="w-8 h-8 shrink-0 overflow-visible" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                </svg>
            );
        }
        if (n.includes('cuadr') || n.includes('squar') || n.includes('rect') || n.includes('box')) {
            return (
                <svg className="w-8 h-8 shrink-0 overflow-visible" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="2" width="20" height="20" rx="3" />
                </svg>
            );
        }
        if (n.includes('trian') || n.includes('delta')) {
            return (
                <svg className="w-8 h-8 shrink-0 overflow-visible" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 21H22L12 2Z" />
                </svg>
            );
        }
        return null;
    };

    const change = Math.max(0, parseMoney(cashTendered) - total);

    const lookupProduct = async (codeOverride?: string) => {
        const codeToSearch = codeOverride || barcode;
        if (!codeToSearch?.trim()) return;
        setError('');

        try {
            const response = await api.post('/admin/sales/lookup', { barcode: codeToSearch.trim() });
            const products = response.data as any[];

            if (products.length > 1) {
                setProductSelection(products);
                setBarcode('');
                return;
            }

            const productData = products[0];
            processProductLookup(productData);
            setBarcode('');
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            setError(error.response?.data?.message || 'Producto no encontrado');
            setBarcode('');
        }
    };

    const processProductLookup = (productData: any) => {
        const attributes = productData.attributes || [];
        const options: VariantOption[] = attributes.map((attr: any) => ({
            id: attr.id.toString(),
            name: attr.name,
            values: (productData.attribute_values || [])
                .filter((v: any) => v.attribute_id === attr.id)
                .map((v: any) => ({
                    id: v.id.toString(),
                    name: v.name,
                    priceDelta: v.pivot?.price_delta || 0,
                    stock: v.pivot?.stock || 0
                }))
        })).filter((o: any) => o.values.length > 0);

        if (options.length > 0) {
            setVariantModal({ product: productData, options, selected: {}, quantity: 1 });
        } else {
            // Always add as a separate line - no merging
            setCart(prev => [...prev.filter(item => item.product.id !== -1), { product: productData as Product, quantity: 1 }]);
        }
    };

    const handleBarcodeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            lookupProduct();
        }
    };

    const updateQuantity = (index: number, delta: number) => {
        const newCart = [...cart];
        const item = newCart[index];
        const newQty = item.quantity + delta;

        if (newQty <= 0) {
            newCart.splice(index, 1);
        } else if (newQty <= item.product.stock) {
            item.quantity = newQty;
        }

        setCart(newCart);
    };

    const removeItem = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const confirmVariantSelection = () => {
        if (!variantModal?.product) return setVariantModal(null);
        const { product, options, selected, quantity } = variantModal;

        const parse = (v: any) => {
            if (v == null) return 0;
            const s = String(v).trim().replace(',', '.');
            const n = parseFloat(s);
            return isNaN(n) ? 0 : n;
        };

        const basePrice = (() => {
            const p: any = product.price as any;
            if (typeof p === 'number') return p;
            const s = String(p ?? '').trim().replace(',', '.');
            const n = parseFloat(s);
            return isNaN(n) ? 0 : n;
        })();

        // Filter out options where no selection was made
        const activeOptionsWithSelections = options
            .map(opt => {
                const selectionArr = (selected[opt.id] as any) || [];
                return {
                    opt,
                    selectedValues: selectionArr
                        .map((id: any) => opt.values.find(v => String(v.id) === String(id)))
                        .filter(Boolean) as any[]
                };
            })
            .filter(item => item.selectedValues.length > 0);

        if (activeOptionsWithSelections.length === 0) {
            setError('Selecciona al menos una variable');
            return;
        }

        // Cartesian product to generate all combinations
        const generateCombinations = (index: number): any[][] => {
            if (index === activeOptionsWithSelections.length) return [[]];
            const result: any[][] = [];
            const currentItem = activeOptionsWithSelections[index];
            const remaining = generateCombinations(index + 1);

            for (const val of currentItem.selectedValues) {
                for (const comb of remaining) {
                    result.push([{ option: currentItem.opt.name, value: val.name, priceDelta: parse(val.priceDelta) }, ...comb]);
                }
            }
            return result;
        };

        const combinations = generateCombinations(0);

        const newCartItems = combinations.map(combo => {
            const totalDelta = combo.reduce((sum, v) => sum + v.priceDelta, 0);
            return {
                product,
                quantity: quantity || 1,
                unitPrice: basePrice + totalDelta,
                variants: combo
            };
        });

        setCart(prev => [...prev, ...newCartItems]);
        setVariantModal(null);
        setBarcode('');
    };

    const processSale = async () => {
        if (cart.length === 0) {
            setError('El carrito está vacío');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await api.post('/admin/sales', {
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    ...(item.unitPrice != null ? { unit_price: item.unitPrice } : {}),
                    ...(item.variants ? { variants: item.variants } : {}),
                })),
                payment_method: paymentMethod,
                ...(paymentMethod === 'cash' ? { cash_received: parseMoney(cashTendered), cash_change: change } : {}),
            });

            setSuccess('¡Venta registrada exitosamente!');
            setCart([]);
            setPaymentMethod('cash');
            setCashTendered('');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);

            // Focus back to barcode input
            barcodeInputRef.current?.focus();
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            setError(error.response?.data?.message || 'Error al procesar la venta');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChargeClick = () => {
        if (paymentMethod === 'cash') {
            setShowChargeModal(true);
        } else {
            processSale();
        }
    };

    return (
        <AdminLayout
            title="Punto de Venta"
            subtitle="Registrar ventas"
            titleWrapperClassName="translate-x-6 md:translate-x-12"
        >
            <div className="flex flex-col items-center w-full">
                <div className="h-6 md:h-8"></div>
                <div className="w-[90%] md:w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-12 mx-auto">
                    {/* Left: Barcode Scanner & Cart */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Barcode Input */}
                        <div className="bg-white rounded-md md:rounded-lg border-4 border-graphite shadow-xl" style={{ padding: '32px' }}>
                            <label className="block text-lg font-black text-graphite mb-4 uppercase tracking-wide">
                                Escanear Código de Barras
                            </label>
                            <div className="flex flex-col md:flex-row gap-4">
                                <input
                                    ref={barcodeInputRef}
                                    type="text"
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    onKeyDown={handleBarcodeKeyDown}
                                    className="flex-1 px-4 py-4 md:px-6 md:py-6 bg-white border-4 border-graphite rounded-2xl text-graphite text-xl md:text-3xl placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-lime focus:shadow-md transition-all font-mono font-bold"
                                    placeholder="Escanea o ingresa el código..."
                                    autoFocus
                                />
                                <div className="flex gap-2 md:gap-4">
                                    <button
                                        onClick={() => lookupProduct()}
                                        className="flex-1 md:flex-none px-6 py-4 md:px-10 md:py-6 bg-lime hover:bg-lime/80 text-graphite font-black uppercase tracking-widest rounded-2xl border-4 border-graphite shadow-md hover:translate-y-[-2px] hover:shadow-lg transition-all text-lg md:text-xl"
                                    >
                                        Agregar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setScanError('');
                                            setIsScanning(true);
                                        }}
                                        className="px-6 py-4 md:px-6 md:py-6 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl border-4 border-graphite shadow-md hover:translate-y-[-2px] hover:shadow-lg transition-all"
                                        title="Usar Cámara"
                                    >
                                        📷
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Camera Modal */}
                        {isScanning && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                                <div className="bg-white rounded-3xl p-6 w-full max-w-lg relative">
                                    <button
                                        onClick={() => {
                                            setScanError('');
                                            setIsScanning(false);
                                        }}
                                        className="absolute top-4 right-4 text-gray-500 hover:text-red-pink"
                                    >
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <h3 className="text-2xl font-black text-graphite mb-4 text-center">Escaneando...</h3>
                                    {scanError && (
                                        <div className="mb-4 bg-red-pink/10 border-2 border-red-pink text-red-pink px-4 py-3 rounded-xl font-bold text-sm">
                                            {scanError}
                                        </div>
                                    )}
                                    <div className="rounded-2xl overflow-hidden border-4 border-graphite bg-black aspect-video relative">
                                        <video ref={ref} className="w-full h-full object-cover" autoPlay muted playsInline />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-64 h-32 border-4 border-red-pink/50 rounded-xl"></div>
                                        </div>
                                    </div>
                                    <p className="text-center mt-4 text-gray-500 font-bold">Apunta el código de barras a la cámara</p>
                                </div>
                            </div>
                        )}

                        {showChargeModal && paymentMethod === 'cash' && (
                            <div className="fixed inset-0 z-50 bg-black/80 p-8">
                                <div className="relative h-full flex items-center justify-center">
                                    <button
                                        onClick={() => setShowChargeModal(false)}
                                        className="absolute top-6 right-6 text-white/80 hover:text-white"
                                        aria-label="Cerrar"
                                    >
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <div className="bg-white rounded-3xl py-16 px-12 w-full max-w-xl max-h-[85vh] overflow-auto border-4 border-graphite shadow-2xl space-y-10">
                                        <h3 className="text-5xl font-black text-graphite mb-10 text-center tracking-widest uppercase">Confirmar cobro</h3>
                                        <div className="mt-2 p-8 bg-gray-50 rounded-2xl border-2 border-graphite space-y-6 text-2xl">
                                            <div className="flex justify-between pb-4 border-b-2 border-gray-200">
                                                <span className="font-bold text-gray-600">Total</span>
                                                <span className="font-black">{formatCurrency(total)}</span>
                                            </div>
                                            <div className="flex justify-between pb-4 border-b-2 border-gray-200">
                                                <span className="font-bold text-gray-600">Efectivo</span>
                                                <span className="font-black">{formatCurrency(parseMoney(cashTendered))}</span>
                                            </div>
                                            <div className="mt-2 p-6 bg-teal/10 rounded-2xl border-2 border-teal flex items-baseline justify-between shadow-inner">
                                                <span className="font-black text-graphite tracking-wide">Cambio</span>
                                                <span className="text-6xl font-black text-teal">{formatCurrency(change)}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 mt-12">
                                            <button
                                                onClick={() => setShowChargeModal(false)}
                                                className="py-4 bg-white hover:bg-gray-50 text-graphite font-bold text-lg border-2 border-graphite rounded-xl"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => { setShowChargeModal(false); processSale(); }}
                                                disabled={parseMoney(cashTendered) < total}
                                                className="py-4 bg-pink-hot hover:bg-pink-600 text-white font-black text-lg border-2 border-graphite rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Confirmar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {variantModal && variantModal.product && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" style={{ padding: '1rem' }}>
                                <div className="bg-white rounded-3xl w-full relative border-4 border-graphite" style={{ maxWidth: '900px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                                    <button
                                        onClick={() => setVariantModal(null)}
                                        className="absolute text-gray-500 hover:text-red-pink"
                                        style={{ top: '1.25rem', right: '1.25rem' }}
                                    >
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                    <h3 className="font-black text-graphite text-center" style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Seleccionar opciones</h3>
                                    <p className="text-center text-gray-600 font-bold" style={{ marginBottom: '1.5rem' }}>{variantModal.product.name}</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {variantModal.options.map((opt, optIndex) => {
                                            const cardColors = [
                                                { bg: '#dbeafe', border: '#3b82f6', labelColor: '#1d4ed8' },
                                                { bg: '#fce7f3', border: '#ec4899', labelColor: '#be185d' },
                                                { bg: '#d1fae5', border: '#10b981', labelColor: '#047857' },
                                                { bg: '#fef3c7', border: '#f59e0b', labelColor: '#b45309' },
                                            ];
                                            const cardColor = cardColors[optIndex % cardColors.length];
                                            return (
                                                <div key={opt.id} style={{ background: cardColor.bg, border: `3px solid ${cardColor.border}`, borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                                    <label className="block font-black uppercase" style={{ fontSize: '1rem', letterSpacing: '0.15em', color: cardColor.labelColor, marginBottom: '1rem' }}>{opt.name}</label>
                                                    <div className="flex flex-wrap gap-4">
                                                        {opt.values.map(v => {
                                                            const isSelected = (variantModal.selected[opt.id] || []).includes(v.id);
                                                            const noStock = (v.stock ?? 0) <= 0;
                                                            const colorBg = getColorHex(v.name, isSelected ? 1 : 0.25);
                                                            const colorText = getColorHex(v.name, 1);
                                                            const shapeIcon = getShapeIcon(v.name);

                                                            const nameLow = v.name.toLowerCase().trim();
                                                            const isRound = nameLow.includes('redon') || nameLow.includes('circ') || nameLow.includes('round') || nameLow.includes('esfer') || nameLow.includes('bola') || nameLow.includes('botón') || nameLow.includes('disco');
                                                            const isTriangle = nameLow.includes('trian') || nameLow.includes('delta');
                                                            const isSquare = nameLow.includes('cuad') || nameLow.includes('squar') || nameLow.includes('rect') || nameLow.includes('box');
                                                            const isStar = nameLow.includes('estre') || nameLow.includes('star');
                                                            const isHeart = nameLow.includes('cora') || nameLow.includes('heart');

                                                            return (
                                                                <button
                                                                    key={v.id}
                                                                    disabled={noStock && !isSelected}
                                                                    onClick={() => {
                                                                        setVariantModal(vm => {
                                                                            if (!vm) return vm;
                                                                            const current = vm.selected[opt.id] || [];
                                                                            const newSelected = { ...vm.selected };
                                                                            if (current.includes(v.id)) {
                                                                                newSelected[opt.id] = current.filter(id => id !== v.id);
                                                                            } else {
                                                                                newSelected[opt.id] = [...current, v.id];
                                                                            }
                                                                            return { ...vm, selected: newSelected };
                                                                        });
                                                                    }}
                                                                    style={{
                                                                        backgroundColor: isSelected ? undefined : (colorBg || cardColor.bg),
                                                                        borderColor: isSelected ? undefined : (colorText || cardColor.border),
                                                                        color: colorText && !isSelected ? colorText : undefined,
                                                                        borderRadius: isRound ? '50%' : isTriangle ? '0' : '12px',
                                                                        aspectRatio: isRound || isTriangle || isSquare || isStar || isHeart ? '1/1' : undefined,
                                                                        clipPath: isTriangle ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none'
                                                                    }}
                                                                    className={`group relative px-4 py-2.5 border-2 font-black uppercase tracking-wider transition-all flex items-center justify-between gap-3 shadow-sm hover:shadow-md active:scale-95 ${isRound || isTriangle || isSquare || isStar || isHeart
                                                                        ? 'w-[95px] h-[95px] flex-col !justify-center p-3 text-[8px]'
                                                                        : 'min-w-[150px] h-[60px] flex-row rounded-2xl text-[10px]'
                                                                        } ${isSelected
                                                                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-200/50 scale-105 z-10'
                                                                            : noStock
                                                                                ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed opacity-40'
                                                                                : 'text-graphite'
                                                                        }`}
                                                                >
                                                                    <div className={`flex items-center gap-2 overflow-hidden ${isRound || isTriangle || isSquare || isStar || isHeart ? 'flex-col text-center' : 'flex-row'}`}>
                                                                        {shapeIcon && (
                                                                            <div className={`${isSelected ? 'text-white' : 'text-current'} opacity-90 shrink-0`}>
                                                                                {shapeIcon}
                                                                            </div>
                                                                        )}
                                                                        {!shapeIcon && colorText && !isSelected && (
                                                                            <div
                                                                                className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0"
                                                                                style={{ backgroundColor: colorText }}
                                                                            />
                                                                        )}
                                                                        <span className={`leading-tight font-black ${isRound || isTriangle || isSquare || isStar || isHeart ? 'max-w-[70px] truncate' : 'truncate'}`}>{v.name}</span>
                                                                    </div>

                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-xl font-black text-graphite">
                                                                            {variantModal?.product?.price == 0 && variantModal?.product?.attribute_values && variantModal?.product?.attribute_values.length > 0 ? (
                                                                                <span className="text-[10px] font-bold text-indigo-400 mr-1 italic uppercase tracking-tighter">Desde</span>
                                                                            ) : null}
                                                                            {formatCurrency((variantModal?.product?.price ?? 0) > 0 ? (variantModal?.product?.price ?? 0) : (v.priceDelta || 0))}
                                                                        </span>
                                                                        <div className="flex items-center gap-1.5 mt-1">
                                                                            <div className={`w-2 h-2 rounded-full ${parseInt(String(v.stock)) > 0 ? 'bg-teal animate-pulse' : 'bg-red-pink'}`} />
                                                                            <span className="text-[10px] font-black text-graphite/40 uppercase tracking-widest">Stock: {v.stock ?? 0}</span>
                                                                        </div>
                                                                    </div>

                                                                    {isSelected && (
                                                                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-pink-hot text-white rounded-full flex items-center justify-center border-4 border-white shadow-md animate-in zoom-in duration-200">
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" /></svg>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 p-3 bg-gray-50 rounded-xl border-2 border-graphite">
                                        {(() => {
                                            const activeOptions = variantModal.options.filter(opt => (variantModal.selected[opt.id] || []).length > 0);
                                            const totalCombinations = activeOptions.length === 0 ? 0 : activeOptions.reduce((acc, opt) => acc * variantModal.selected[opt.id].length, 1);

                                            return (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-gray-600">Items a agregar:</span>
                                                    <span className="text-lg font-black text-pink-hot">{totalCombinations}</span>
                                                    <span className="text-xs text-gray-400 ml-2 italic">(Cada combinación se verá como una fila aparte)</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex items-center justify-between gap-6 py-4 border-t border-gray-100 mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">CANTIDAD</span>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setVariantModal(vm => vm ? ({ ...vm, quantity: Math.max(1, vm.quantity - 1) }) : vm)}
                                                    className="w-10 h-10 bg-gray-100 rounded-xl font-bold border-2 border-gray-200"
                                                >-</button>
                                                <span className="text-xl font-black w-8 text-center">{variantModal.quantity}</span>
                                                <button
                                                    onClick={() => setVariantModal(vm => vm ? ({ ...vm, quantity: vm.quantity + 1 }) : vm)}
                                                    className="w-10 h-10 bg-gray-100 rounded-xl font-bold border-2 border-gray-200"
                                                >+</button>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 flex-1">
                                            <button
                                                onClick={() => setVariantModal(null)}
                                                className="flex-1 py-3 px-4 bg-white hover:bg-gray-50 text-gray-600 font-bold border-2 border-gray-300 rounded-xl transition-colors uppercase tracking-wide text-xs"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={confirmVariantSelection}
                                                className="flex-1 py-3 px-4 bg-teal hover:bg-teal-600 text-white font-black border-2 border-graphite rounded-xl uppercase tracking-wide text-xs shadow-[4px_4px_0px_0px_#31473E] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                            >
                                                Agregar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Product Selection Modal (if multiple products share same barcode) */}
                        {productSelection && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
                                <div className="bg-white rounded-3xl border-4 border-graphite shadow-2xl w-full" style={{ maxWidth: '900px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                                    <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                                        <h3 className="font-black text-graphite uppercase tracking-tighter" style={{ fontSize: '1.75rem' }}>Múltiples coincidencias</h3>
                                        <button onClick={() => setProductSelection(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    <p className="text-gray-500 font-bold text-lg" style={{ marginBottom: '1.5rem' }}>Se encontraron varios productos con este código. Selecciona uno:</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                        {productSelection.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    processProductLookup(p);
                                                    setProductSelection(null);
                                                }}
                                                className="flex flex-col border-4 border-gray-100 rounded-2xl hover:border-pink-hot hover:bg-pink-hot/5 transition-all text-left group"
                                                style={{ padding: '1.25rem' }}
                                            >
                                                <span className="font-black text-graphite text-lg group-hover:text-pink-hot">{p.name}</span>
                                                <span className="text-sm text-gray-500 font-mono">{p.barcode}</span>
                                                <div className="flex justify-between items-center" style={{ marginTop: '0.75rem' }}>
                                                    <span className="text-teal font-black">{formatCurrency(p.price)}</span>
                                                    <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded text-gray-500 uppercase tracking-widest">Stock: {p.stock}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="bg-red-pink/10 border-4 border-red-pink text-red-pink px-6 py-4 rounded-2xl font-black text-xl flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-lime/20 border-4 border-lime text-graphite px-6 py-4 rounded-2xl font-black text-xl flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {success}
                            </div>
                        )}

                        {/* Cart Items */}
                        <div className="bg-white rounded-md md:rounded-lg border-4 border-graphite shadow-xl" style={{ padding: '32px' }}>
                            <div className="p-9 md:p-10 border-b-8 border-black bg-graphite">
                                <h2 className="text-3xl font-black text-white uppercase tracking-wider">Carrito ({cart.length} productos)</h2>
                            </div>

                            {cart.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-dashed border-gray-300">
                                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 font-bold text-2xl">Escanea un producto para comenzar</p>
                                </div>
                            ) : (
                                <div className="divide-y-4 divide-gray-100">
                                    {cart.map((item, index) => (
                                        <div key={item.product.id + '-' + index} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 hover:bg-lime/10 transition-colors">
                                            <div className="flex-1">
                                                <h3 className="text-graphite font-black text-xl md:text-2xl mb-1">{item.product.name}</h3>
                                                <p className="text-gray-500 text-base md:text-lg font-mono font-bold">{item.product.barcode}</p>
                                                {item.variants && item.variants.length > 0 && (
                                                    <ul className="mt-1 text-sm text-gray-600 list-disc ml-4">
                                                        {item.variants.map((v, i) => (
                                                            <li key={i}>
                                                                {v.option}: {v.value} ({formatCurrency(v.priceDelta)})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => updateQuantity(index, -1)}
                                                        className="w-10 h-10 md:w-12 md:h-12 bg-white hover:bg-gray-100 text-graphite rounded-xl flex items-center justify-center transition border-4 border-gray-200 hover:border-graphite font-black text-xl md:text-2xl"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-12 md:w-16 text-center text-graphite font-black text-2xl md:text-3xl">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(index, 1)}
                                                        className="w-10 h-10 md:w-12 md:h-12 bg-white hover:bg-gray-100 text-graphite rounded-xl flex items-center justify-center transition border-4 border-gray-200 hover:border-graphite font-black text-xl md:text-2xl"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <div className="w-auto md:w-32 text-right">
                                                    <p className="text-teal font-black text-2xl md:text-3xl">{formatCurrency((item.unitPrice ?? item.product.price) * item.quantity)}</p>
                                                    <p className="text-gray-400 text-xs md:text-sm font-bold">{formatCurrency(item.unitPrice ?? item.product.price)} c/u</p>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="text-gray-300 hover:text-red-pink p-2 md:p-3 transition-colors border-2 border-transparent hover:border-red-pink rounded-xl"
                                                >
                                                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Payment Panel */}
                    <div className="space-y-6">
                        {/* Total */}
                        <div className="bg-graphite text-white rounded-md md:rounded-lg border-4 border-black shadow-xl relative overflow-hidden" style={{ padding: '32px' }}>
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-32 h-32 text-pink-hot" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 6v12M8 10h8M8 14h8" stroke="currentColor" strokeWidth="2" fill="none" />
                                </svg>
                            </div>
                            <p className="text-pink-hot text-sm font-black uppercase tracking-widest mb-2 relative z-10">Total a Pagar</p>
                            <p className="text-5xl font-black relative z-10">{formatCurrency(total)}</p>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white rounded-md md:rounded-lg border-4 border-graphite shadow-xl" style={{ padding: '32px' }}>
                            <p className="text-graphite text-sm font-black uppercase tracking-wide mb-4">Método de Pago</p>
                            <div className="space-y-3">
                                {[
                                    { value: 'cash', label: 'Efectivo', icon: '💵' },
                                    { value: 'card', label: 'Tarjeta', icon: '💳' },
                                    { value: 'transfer', label: 'Transferencia', icon: '📱' },
                                ].map(method => (
                                    <button
                                        key={method.value}
                                        onClick={() => setPaymentMethod(method.value)}
                                        className={`w-full px-4 py-3 rounded-xl text-left transition-all border-2 flex items-center gap-3 font-bold ${paymentMethod === method.value
                                            ? 'bg-teal text-white border-graphite shadow-[4px_4px_0px_0px_#333] translate-x-[-2px] translate-y-[-2px]'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-teal hover:text-teal'
                                            }`}
                                    >
                                        <span className="text-xl">{method.icon}</span>
                                        <span className="font-bold uppercase tracking-wide">{method.label}</span>
                                    </button>
                                ))}
                            </div>

                            {paymentMethod === 'cash' && (
                                <div className="mt-6 space-y-4">
                                    <label className="block text-graphite text-sm font-black uppercase tracking-wide">Valor Entregado por el cliente</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="\\d*"
                                            value={cashTendered}
                                            onChange={(e) => {
                                                const raw = e.target.value || '';
                                                setCashTendered(formatCashInput(raw));
                                            }}
                                            className="w-full pl-4 pr-4 py-4 bg-white border-2 border-graphite rounded-xl text-graphite font-bold focus:outline-none focus:border-teal"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Complete Sale Button */}
                        <div className="flex flex-col gap-6 pt-12">
                            <div className="flex gap-4">
                                <button
                                    onClick={handleChargeClick}
                                    disabled={isLoading || cart.length === 0 || (paymentMethod === 'cash' && parseMoney(cashTendered) < total)}
                                    className="flex-1 py-5 px-6 bg-pink-hot hover:bg-pink-600 text-white text-xl font-black uppercase tracking-widest rounded-3xl border-4 border-graphite shadow-[8px_8px_0px_0px_#333] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    {isLoading ? 'Procesando...' : 'Cobrar'}
                                </button>
                                <button
                                    onClick={handlePrint}
                                    disabled={cart.length === 0}
                                    className="px-6 py-5 bg-white hover:bg-gray-50 text-graphite text-xl font-black uppercase tracking-widest rounded-3xl border-4 border-graphite transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    title="Imprimir factura"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Imprimir
                                </button>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => {
                                        setCart([]);
                                        setCashTendered('');
                                        setPaymentMethod('cash');
                                        try {
                                            localStorage.removeItem('pos_cart_state');
                                        } catch {
                                            // ignore storage errors
                                        }
                                    }}
                                    className="flex-1 py-4 px-4 bg-white hover:bg-red-50 text-red-pink font-black border-4 border-red-pink rounded-2xl transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(239,71,111,0.2)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Vaciar Carrito
                                </button>
                                <Link
                                    to="/admin/sales-registry"
                                    className="flex-1 py-4 px-4 bg-white hover:bg-gray-100 text-graphite font-black border-4 border-graphite rounded-2xl transition-all text-center uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                    Historial
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="h-12 md:h-16"></div>
                {/* Hidden print area */}
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <div ref={printRef} className="p-6 bg-white min-w-[320px] text-graphite">
                        <div className="mb-4 rounded-xl border-2 border-graphite overflow-hidden">
                            <div className="bg-pink-hot text-white px-4 py-3 flex items-center gap-3">
                                <img src="/logo_original.png" alt="Logo" className="h-8 w-8 object-contain bg-white rounded" />
                                <div>
                                    <h2 className="text-xl font-black leading-none uppercase">Entre Lanas y Fragancias</h2>
                                    <p className="text-xs opacity-90 font-bold mt-1">NIT 20421751 - 2</p>
                                    <p className="text-xs opacity-90">Carrera 11 # 6-08, Barrio el Rosario, Chía</p>
                                    <p className="text-xs opacity-90">Tel: 312 457 8081 - 314 461 6230</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-xs opacity-90">{new Date().toLocaleDateString()}</p>
                                    <p className="text-xs opacity-90">{new Date().toLocaleTimeString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-b py-2 text-sm">
                            {cart.map((item, idx) => (
                                <div key={idx} className="mb-2">
                                    <div className="flex justify-between font-bold">
                                        <span>{item.product.name}</span>
                                        <span>{formatCurrency(item.unitPrice ?? item.product.price)}</span>
                                    </div>
                                    {item.variants && item.variants.length > 0 && (
                                        <ul className="ml-3 list-disc">
                                            {item.variants.map((v, i) => (
                                                <li key={i}>{v.option}: {v.value} ({formatCurrency(v.priceDelta)})</li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-xs">x{item.quantity}</span>
                                        <span className="text-xs">Subtotal: {formatCurrency((item.unitPrice ?? item.product.price) * item.quantity)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-sm">
                            <div className="flex justify-between">
                                <span>Total</span>
                                <span className="font-black">{formatCurrency(total)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Método</span>
                                <span className="font-bold uppercase">{paymentMethod}</span>
                            </div>
                            {paymentMethod === 'cash' && (
                                <>
                                    <div className="flex justify-between">
                                        <span>Efectivo</span>
                                        <span>{formatCurrency(parseMoney(cashTendered))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Cambio</span>
                                        <span className="font-black">{formatCurrency(change)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
