import { useState, useEffect, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import { motion, AnimatePresence } from 'framer-motion';
import 'swiper/swiper-bundle.css';
import toast from 'react-hot-toast';

import api from '../api';
import { useCart } from '../context/CartContext';
import { getStorageUrl } from '../utils/imageUrl';
import CartDrawer from '../components/CartDrawer';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Componente para Modal Informativo
const InfoModal = ({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: React.ReactNode }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-graphite/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white w-full max-w-2xl rounded-xl border-4 border-graphite shadow-[12px_12px_0px_0px_#333] p-8 md:p-12 overflow-hidden"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 md:w-12 md:h-12 bg-gray-100 hover:bg-pink-hot hover:text-white rounded-lg flex items-center justify-center transition-all border-2 border-transparent hover:border-graphite group"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="space-y-6">
                        <h3 className="text-3xl md:text-5xl font-black text-graphite uppercase tracking-tighter leading-none">
                            {title}
                        </h3>
                        <div className="h-2 w-20 bg-pink-hot rounded-full"></div>
                        <div className="text-lg md:text-xl text-gray-600 font-bold leading-relaxed">
                            {content}
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full py-4 md:py-5 bg-graphite text-white font-black uppercase tracking-widest rounded-xl border-4 border-graphite shadow-[5px_5px_0px_0px_#FF4D8D] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all mt-6 md:mt-8"
                        >
                            Entendido
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

interface AttributeValuePivot {
    id: number;
    name: string;
    attribute_id: number;
    image?: string | null;
    price_delta?: number;
    attribute?: { id: number; name: string };
    pivot?: {
        price_delta?: number;
        image?: string | null;
        base_price?: number;
        markup?: number;
        stock?: number;
    };
}

interface Product {
    id: number;
    name: string;
    price: number;
    description: string;
    image?: string | null;
    category?: string;
    category_id?: number;
    subcategory_id?: number;
    brand?: string;
    subcategory?: string;
    is_promo?: boolean;
    is_combo?: boolean;
    stock?: number;
    images?: string[];
    attribute_values?: AttributeValuePivot[];
    category_obj?: { id: number; name: string; slug: string };
    key?: string; // Add key property to Product interface
}

interface HeroBanner {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    promoText: string;
    promoLink: string;
    imageUrl: string;
    bgClass: string;
    textClass: string;
}

// Using centralized getStorageUrl for all image paths
const storageUrl = getStorageUrl;


// Sub-component for Product Image Carousel to handle Swiper properly
const ProductImageCarousel = ({ item, isPromoSection = false }: { item: { name: string, images?: string[], image?: string | null }, isPromoSection?: boolean }) => {
    const [swiper, setSwiper] = useState<any>(null);

    return (
        <div className="w-full h-full relative group/inner-swiper">
            {item.images && Array.isArray(item.images) && item.images.length > 0 ? (
                <>
                    <Swiper
                        modules={[Navigation, Pagination, Autoplay]}
                        nested={true}
                        loop={item.images.length > 1}
                        autoplay={item.images.length > 1 ? {
                            delay: 3000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true
                        } : false}
                        onSwiper={setSwiper}
                        pagination={item.images.length > 1 ? { clickable: true, dynamicBullets: true } : false}
                        className="w-full h-full"
                    >
                        {item.images.map((img, i) => (
                            <SwiperSlide key={i}>
                                <img
                                    src={storageUrl(img) || ''}
                                    alt={`${item.name} ${i + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {item.images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); swiper?.slidePrev(); }}
                                className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-graphite shadow-lg hover:bg-pink-hot hover:text-white transition-all transform active:scale-90 border-2 border-gray-100 ${isPromoSection ? 'opacity-100' : 'opacity-0 group-hover/inner-swiper:opacity-100'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); swiper?.slideNext(); }}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-graphite shadow-lg hover:bg-pink-hot hover:text-white transition-all transform active:scale-90 border-2 border-gray-100 ${isPromoSection ? 'opacity-100' : 'opacity-0 group-hover/inner-swiper:opacity-100'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </>
                    )}
                </>
            ) : (
                <img
                    src={storageUrl(item.image) || ''}
                    alt={item.name}
                    className="w-full h-full object-cover transform group-hover/card:scale-105 transition duration-700"
                />
            )}
        </div>
    );
};

// CustomLogo removed as it's now internal to Navbar/Footer

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

interface DisplayItem {
    key: string;
    productId: number;
    name: string;
    variantName?: string;
    description: string;
    price: number;
    image: string | null;
    category_id?: number;
    subcategory_id?: number;
    category?: string;
    is_promo?: boolean;
    is_combo?: boolean;
    stock?: number;
    brand?: string;
    subcategory?: string;
    images?: string[];
    attribute_id?: number;
    attribute_value_id?: number;
}


export default function Home() {
    const [products, setProducts] = useState<Product[]>([]);
    const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedDbCategoryId, setSelectedDbCategoryId] = useState<number | null>(null);
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeInfoModal, setActiveInfoModal] = useState<'shipping' | 'payment' | 'quality' | null>(null);
    const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isSubcategoryDropdownOpen, setIsSubcategoryDropdownOpen] = useState(false);

    const { addToCart } = useCart();

    const handleAddToCart = async (item: DisplayItem) => {
        try {
            let itemVariants: any[] = [];
            if (item.attribute_id && item.attribute_value_id) {
                const parts = item.variantName?.split(': ') || [];
                itemVariants = [{
                    option: parts[0] || 'Opción',
                    value: parts[1] || item.variantName || 'Selección',
                    priceDelta: 0
                }];
            }
            await addToCart(item.productId, 1, item.price, itemVariants);
            toast.success('¡Producto agregado al carrito!');
        } catch (error) {
            toast.error('Error al agregar producto');
        }
    };

    const handleRedirectToProduct = (item: DisplayItem) => {
        // 1. Change to 'Todo' filter to show the grid
        setSelectedCategory('all');

        // 2. Clear other filters but keep search for the specific item
        setSelectedDbCategoryId(null);
        setSelectedSubcategoryId('all');
        setSearchQuery(item.name);

        // 3. Scroll to the products section with a clearer ID
        setTimeout(() => {
            const section = document.getElementById('filtros-home');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    };


    useEffect(() => {
        fetchProducts();
        fetchCategories();
        loadHeroBanners();
    }, []);

    // Cerrar dropdowns al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.group') && !target.closest('[data-dropdown]')) {
                setIsCategoryDropdownOpen(false);
                setIsSubcategoryDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories-public');
            setDbCategories(response.data);
            // Default to first category if available and not promos
            if (response.data.length > 0) {
                const hasPromos = products.some(p => p.is_promo || p.is_combo);
                if (!hasPromos) {
                    setSelectedCategory(`cat-${response.data[0].id}`);
                }
            }
        } catch {
            console.log('No categories');
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            const prods = response.data.map((p: any) => ({
                ...p,
                // When the API uses eager loading, `category` is the relation object
                category_obj: typeof p.category === 'object' && p.category ? p.category : null,
                // Keep category as string for backward compat
                category: typeof p.category === 'string' ? p.category : (p.category?.slug || p.category?.name || null),
            }));
            setProducts(prods);
        } catch {
            console.log('No products');
        }
    };

    const defaultHeroBanners: HeroBanner[] = [
        {
            title: 'Telas Premium',
            subtitle: 'Algodón, lino, poliéster y más',
            ctaText: 'Ver Catálogo',
            ctaLink: '#productos',
            promoText: 'Ver Promos',
            promoLink: '#promociones',
            imageUrl: '',
            bgClass: 'bg-pink-hot',
            textClass: 'text-white'
        },
        {
            title: 'Uniformes Corporativos',
            subtitle: 'Confección personalizada de alta calidad',
            ctaText: 'Cotizar Ahora',
            ctaLink: '#contacto',
            promoText: 'Promociones',
            promoLink: '#promociones',
            imageUrl: '',
            bgClass: 'bg-teal',
            textClass: 'text-white'
        },
        {
            title: 'Hilos y Fragancias',
            subtitle: 'Todo para tus proyectos y el hogar',
            ctaText: 'Explorar',
            ctaLink: '#productos',
            promoText: 'Promos del Mes',
            promoLink: '#promociones',
            imageUrl: '',
            bgClass: 'bg-lime',
            textClass: 'text-graphite'
        }
    ];

    const loadHeroBanners = async () => {
        try {
            const response = await api.get('/home-carousel');
            const serverBanners = response.data?.banners as HeroBanner[] | undefined;
            if (Array.isArray(serverBanners) && serverBanners.length > 0) {
                setHeroBanners(serverBanners);
                return;
            }
            setHeroBanners(defaultHeroBanners);
        } catch {
            setHeroBanners(defaultHeroBanners);
        }
    };

    const categories = [
        { name: 'Telas por Metro', desc: 'Algodón, lino, poliéster', filter: 'Telas por Metro' },
        { name: 'Hilos y Lanas', desc: 'Para bordar y tejer', filter: 'Hilos y Lanas' },
        { name: 'Uniformes', desc: 'Corporativos', filter: 'Uniformes' },
        { name: 'Fragancias', desc: 'Esencias y aromas únicos', filter: 'Fragancias' },
    ];

    const handleCategoryClick = (catName: string) => {
        // Find category by name to get its ID
        const cat = dbCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        if (cat) {
            setSelectedDbCategoryId(cat.id);
            setSelectedSubcategoryId('all');
            setSelectedCategory(`cat-${cat.id}`);

            // Scroll to products
            setTimeout(() => {
                const section = document.getElementById('filtros-home');
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            // Fallback to text search if category not found in DB
            setSearchQuery(catName);
            setTimeout(() => {
                const section = document.getElementById('filtros-home');
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };


    const getProductImages = (imagesData: any): string[] => {
        if (!imagesData) return [];
        if (Array.isArray(imagesData)) return imagesData;
        try {
            const parsed = typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData;
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    // Build display items: expand products with variants into individual cards

    const displayItems: DisplayItem[] = useMemo(() => {
        return products.flatMap(product => {
            const attrs = product.attribute_values || [];
            if (attrs.length > 0) {
                // Each variant becomes its own display card
                return attrs.map(av => ({
                    key: `${product.id}-var-${av.id}`,
                    productId: product.id,
                    name: product.name,
                    variantName: av.attribute ? `${av.attribute.name}: ${av.name}` : av.name,
                    description: product.description,
                    price: av.pivot?.price_delta || product.price,
                    image: storageUrl(av.pivot?.image || av.image) || storageUrl(product.image),
                    category_id: product.category_id,
                    subcategory_id: product.subcategory_id,
                    category: product.category,
                    is_promo: product.is_promo,
                    is_combo: product.is_combo,
                    stock: av.pivot?.stock ?? 0,
                    brand: product.brand,
                    subcategory: product.subcategory,
                    images: getProductImages(product.images),
                    attribute_id: av.attribute_id ? Number(av.attribute_id) : (av.attribute?.id ? Number(av.attribute.id) : undefined),
                    attribute_value_id: av.id ? Number(av.id) : undefined
                }));
            }
            // No variants — show as single item
            return [{
                key: `prod-${product.id}`,
                productId: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                image: storageUrl(product.image),
                category_id: product.category_id,
                subcategory_id: product.subcategory_id,
                category: product.category,
                is_promo: product.is_promo,
                is_combo: product.is_combo,
                stock: product.stock,
                brand: product.brand,
                subcategory: product.subcategory,
                images: getProductImages(product.images),
            }];
        });
    }, [products]);

    const matchesSearch = (item: DisplayItem, query: string) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return item.name.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.variantName?.toLowerCase().includes(q);
    };

    const promoItems = useMemo(() => {
        return displayItems.filter(item => (item.is_promo || item.is_combo) && matchesSearch(item, searchQuery));
    }, [displayItems, searchQuery]);

    const filteredDisplayItems = useMemo(() => {
        return displayItems.filter(item => {
            // 1. Search Query Check - ALWAYS APPLY
            if (!matchesSearch(item, searchQuery)) return false;

            // 2. Category Filter
            // Only apply category/subcategory filters if selectedCategory is not 'all'
            // and the item is not a promo (promos are handled separately)
            if (selectedCategory !== 'all' && !(item.is_promo || item.is_combo)) {
                if (selectedDbCategoryId && Number(item.category_id) !== Number(selectedDbCategoryId)) return false;
                if (selectedSubcategoryId !== 'all' && Number(item.subcategory_id) !== Number(selectedSubcategoryId)) return false;
            }

            // Exclude promo items from the main filtered list if they are not being searched for specifically
            // and if a category filter is active (to prevent promos from showing up in specific category lists unless they match the category)
            // If no category filter is active, promos should still be excluded from the main list as they have their own section.
            if ((item.is_promo || item.is_combo) && !searchQuery) {
                return false;
            }

            return true;
        });
    }, [displayItems, selectedCategory, selectedDbCategoryId, selectedSubcategoryId, searchQuery]);


    return (
        <div className="min-h-screen bg-white text-graphite font-sans selection:bg-pink-hot selection:text-white">
            {/* Top Bar */}
            <div className="bg-graphite text-white text-center py-3 text-sm max-md:text-xs font-bold tracking-widest uppercase w-full">
                Envíos a todo el país 🇨🇴 | ¡Pregunta por nuestra Promo del mes!
            </div>

            <Navbar onOpenCart={() => setIsCartOpen(true)} />

            {/* Hero Carousel */}
            <section className="border-b-8 border-graphite">
                <Swiper
                    modules={[Autoplay, Navigation, Pagination, EffectFade]}
                    spaceBetween={0}
                    slidesPerView={1}
                    effect="fade"
                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                    pagination={{ clickable: true }}
                    navigation={true}
                    className="min-h-[85vh] max-md:min-h-[55vh] w-full"
                >
                    {heroBanners.map((banner, i) => (
                        <SwiperSlide key={i}>
                            <div className={`w-full min-h-[85vh] max-md:min-h-[55vh] ${banner.bgClass} flex items-center justify-center relative overflow-hidden py-32 max-md:py-12`}>
                                {banner.imageUrl && (
                                    <div
                                        className="absolute inset-0 bg-center bg-cover"
                                        style={{ backgroundImage: `url(${storageUrl(banner.imageUrl)})` }}
                                    ></div>
                                )}
                                <div className="absolute inset-0 bg-graphite/40"></div>
                                <div className="absolute inset-0 opacity-20">
                                    <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
                                </div>
                                <div className="text-center z-10 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center">
                                    <h2 className={`text-6xl md:text-8xl max-md:text-3xl font-black mb-16 max-md:mb-8 ${banner.textClass} tracking-tighter leading-none drop-shadow-lg`}>
                                        {banner.title.toUpperCase()}
                                    </h2>
                                    <p className={`text-2xl md:text-4xl max-md:text-base font-bold mb-16 max-md:mb-6 ${banner.textClass} opacity-90 max-w-5xl mx-auto leading-tight`}>
                                        {banner.subtitle}
                                    </p>
                                    <div className="flex flex-col md:flex-row items-center gap-6 max-md:gap-3">
                                        <a
                                            href="#productos"
                                            className="inline-flex items-center justify-center px-12 py-5 md:px-20 md:py-7 rounded-full font-black uppercase tracking-widest text-sm md:text-xl border-4 border-graphite shadow-[6px_6px_0px_0px_rgba(51,51,51,1)] md:shadow-[10px_10px_0px_0px_rgba(51,51,51,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition-all cursor-pointer bg-white text-graphite transform hover:scale-105 min-w-[200px] md:min-w-[280px]"
                                        >
                                            {banner.ctaText}
                                        </a>
                                        <a
                                            href="#promociones"
                                            className="inline-flex items-center justify-center px-10 py-4 md:px-16 md:py-6 rounded-full font-black uppercase tracking-widest text-xs md:text-lg border-4 border-white/70 text-white hover:bg-white/20 transition-all cursor-pointer min-w-[180px] md:min-w-[220px]"
                                        >
                                            {banner.promoText}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </section>

            {/* Categories */}
            <section style={{ paddingTop: '30px', paddingBottom: '30px' }} className="px-6 md:px-12 border-b-8 border-graphite bg-yellow-50 hidden md:block">
                <div className="max-w-360 mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 max-md:gap-6 lg:gap-10 justify-items-center">
                        {categories.map((cat, i) => (
                            <button
                                key={i}
                                onClick={() => handleCategoryClick(cat.name)}
                                className="group bg-white px-8 py-14 max-md:px-8 max-md:py-10 rounded-[2.5rem] border-4 border-graphite shadow-[10px_10px_0px_0px_rgba(51,51,51,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-300 text-center w-full flex flex-col items-center justify-center cursor-pointer"
                            >
                                <h3 className="text-2xl lg:text-3xl max-md:text-xl font-black text-graphite mb-3 group-hover:text-pink-hot uppercase tracking-tight transition-colors">{cat.name}</h3>
                                <p className="text-lg max-md:text-base text-gray-500 font-bold opacity-80">{cat.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Products */}
            <section id="productos" className="pt-[80px] pb-32 md:pt-[120px] md:pb-48 lg:pt-80 lg:pb-80 max-md:pt-24 max-md:pb-24 px-4 md:px-24 lg:px-32 bg-teal text-white w-full flex flex-col items-center overflow-hidden">
                <div className="max-w-7xl w-full flex flex-col items-center">
                    <div className="text-center flex flex-col items-center mb-0">
                        <span className="bg-lime text-graphite px-8 py-3 max-md:px-5 max-md:py-2 rounded-2xl text-xl max-md:text-sm font-black uppercase tracking-widest mb-20 max-md:mb-8 inline-block border-4 border-graphite shadow-[6px_6px_0px_0px_rgba(51,51,51,0.5)]">Nuestros Favoritos</span>
                        <h2 className="text-7xl md:text-8xl max-md:text-4xl font-black mb-0 tracking-tighter text-center leading-none">PRODUCTOS<br /><span className="text-pink-hot">DESTACADOS</span></h2>
                    </div>

                    {/* REDUCED SPACER ON MOBILE */}
                    <div className="w-full h-8 md:h-32 lg:h-12"></div>

                    {/* Main Layout: Hierarchical Pill Filters */}
                    {/* Main Layout: Horizontal Dropdown Filters */}
                    <div className="w-full flex flex-col gap-12 items-center">

                        {/* Search Bar Row - COMPACT ON MOBILE */}
                        <div className="w-full max-w-xl group/search relative px-4 md:px-10 lg:px-20">
                            <div className={`w-full flex items-center bg-white/20 border-4 md:border-[6px] border-white/60 rounded-2xl md:rounded-3xl px-4 py-2 md:px-8 md:py-4 transition-all focus-within:bg-white focus-within:border-lime focus-within:shadow-2xl group-hover/search:border-white/80`}>
                                <svg className={`w-5 h-5 md:w-7 md:h-7 mr-3 md:mr-4 transition-colors ${searchQuery ? 'text-lime' : 'text-white/80'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="BUSCAR PRODUCTOS..."
                                    className="bg-transparent border-none outline-none w-full text-sm md:text-xl font-black uppercase tracking-widest text-white focus:text-graphite placeholder:text-white/70 transition-colors"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="ml-2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-graphite/10 flex items-center justify-center hover:bg-pink-hot hover:text-white transition-all text-graphite/40"
                                    >
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Promotions Area - NOW ALWAYS VISIBLE UNLESS SEARCHING NO PROMOS */}
                        {promoItems.length > 0 && (
                            <div id="promociones" className="w-full py-0 text-center flex flex-col items-center overflow-hidden">
                                <div className="max-w-4xl w-full px-6 text-center">
                                    <h3 className="text-3xl md:text-6xl font-black text-white mb-0 uppercase tracking-tighter leading-none">
                                        ✨ OFERTAS QUE<br /><span className="text-lime text-2xl md:text-5xl">ENAMORAN</span>
                                    </h3>
                                </div>

                                {/* PHYSICAL SPACER - TAILWIND V4 COMPATIBLE */}
                                <div className="w-full h-12 md:h-24"></div>

                                <div className="w-full relative group/swiper max-w-[1400px]">
                                    <Swiper
                                        modules={[Autoplay, Navigation, Pagination]}
                                        spaceBetween={30}
                                        slidesPerView={1}
                                        centeredSlides={true}
                                        autoplay={{ delay: 6000, disableOnInteraction: false }}
                                        navigation={true}
                                        pagination={{ clickable: true }}
                                        breakpoints={{
                                            1024: { slidesPerView: 1.2, spaceBetween: 50 }
                                        }}
                                        className="promos-swiper pb-24! px-4!"
                                    >
                                        {promoItems.map((item, index) => (
                                            <SwiperSlide key={item.key}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 30 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="bg-white rounded-4xl md:rounded-[3rem] p-6 md:p-12 shadow-2xl border-4 border-transparent hover:border-lime group flex flex-col md:flex-row gap-8 md:gap-14 items-center justify-center transition-all duration-500 mx-auto max-w-[95%] md:max-w-none min-h-[420px] md:min-h-[420px]"
                                                >
                                                    <div className="w-full md:w-[50%] aspect-square md:aspect-4/3 bg-white rounded-3xl md:rounded-[2.5rem] overflow-hidden border-2 border-gray-100 relative shine-effect shrink-0">
                                                        <ProductImageCarousel item={item} isPromoSection={true} />
                                                        <div className="absolute top-4 left-4 z-30 pointer-events-none">
                                                            <span className="bg-pink-hot text-white text-[10px] md:text-xs font-black px-4 py-1.5 rounded-full border-2 border-white shadow-lg animate-pulse uppercase tracking-widest">OFERTA</span>
                                                        </div>
                                                    </div>

                                                    <div className="w-full md:w-[40%] text-center md:text-left min-w-0 flex flex-col justify-center py-2 md:py-4">
                                                        <span className="text-pink-hot font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] mb-2 block">PROMOCIÓN DEL MES</span>
                                                        <h3 className="text-lg md:text-xl lg:text-3xl font-black text-graphite mb-1 uppercase tracking-tight leading-tight group-hover:text-pink-hot transition-colors wrap-break-word max-w-full md:max-w-[280px] lg:max-w-md">{item.name}</h3>
                                                        {item.variantName && (
                                                            <div className="mb-3">
                                                                <span className="bg-graphite text-white text-[9px] md:text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">{item.variantName}</span>
                                                            </div>
                                                        )}
                                                        <p className="text-gray-500 text-[11px] md:text-xs font-medium mb-4 md:mb-6 line-clamp-3 md:line-clamp-4 leading-relaxed max-w-full md:max-w-[240px] lg:max-w-sm">{item.description}</p>

                                                        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-5 mt-auto border-t-2 border-gray-50 pt-4 md:pt-5">
                                                            <div className="flex flex-col items-center md:items-start shrink-0">
                                                                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest line-through">Antes $ {Math.round(item.price * 1.2).toLocaleString()}</span>
                                                                <span className="text-xl md:text-2xl lg:text-3xl font-black text-graphite leading-none">$ {Number(item.price).toLocaleString()}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRedirectToProduct(item)}
                                                                className="w-full md:w-auto px-5 py-2.5 md:px-6 md:py-3 bg-lime text-graphite rounded-xl font-black uppercase tracking-widest text-[10px] md:text-[11px] border-2 md:border-4 border-graphite shadow-[3px_3px_0px_0px_rgba(51,51,51,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-300 btn-shine-effect shrink-0"
                                                            >
                                                                ¡LO QUIERO!
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>
                            </div>
                        )}

                        {/* Filters & Search Bar Container */}
                        <div
                            id="filtros-home"
                            className="filters-container"
                        >
                            {/* Filters Buttons Row - ALWAYS VISIBLE BELOW PROMOS */}
                            <div className="filters-row">

                                {/* Absolute Small Clear Button - NOW INSET MORE */}
                                {(selectedDbCategoryId || selectedSubcategoryId !== 'all' || searchQuery) && (
                                    <button
                                        onClick={() => {
                                            setSelectedCategory('all');
                                            setSelectedDbCategoryId(null);
                                            setSelectedSubcategoryId('all');
                                            setSearchQuery('');
                                        }}
                                        className="clear-filters-btn"
                                        title="Limpiar filtros"
                                    >
                                        <svg className="w-4 h-4 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}

                                {/* Dropdown: Categories */}
                                <div className="category-dropdown-wrapper">
                                    <button 
                                        className={`category-dropdown-btn ${selectedDbCategoryId ? 'selected' : ''}`}
                                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                        onTouchStart={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                    >
                                        <div className="flex flex-col items-start text-left min-w-0">
                                            <span className="text-sm md:text-xl truncate leading-none w-full text-center">
                                                {selectedDbCategoryId ? dbCategories.find(c => Number(c.id) === Number(selectedDbCategoryId))?.name : 'Categorías 📦'}
                                            </span>
                                        </div>
                                        <svg className="w-4 h-4 md:w-5 md:h-5 ml-2 md:ml-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    <div className={`category-dropdown ${isCategoryDropdownOpen ? 'open' : ''}`}>
                                        <button
                                            onClick={() => {
                                                setSelectedDbCategoryId(null);
                                                setSelectedSubcategoryId('all');
                                                setIsCategoryDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-6 py-4 md:px-12 md:py-8 text-sm md:text-xl font-bold uppercase tracking-widest text-white/60 hover:bg-lime hover:text-graphite transition-colors"
                                        >
                                            Todo el Catálogo
                                        </button>
                                        {dbCategories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    setSelectedDbCategoryId(Number(cat.id));
                                                    setSelectedSubcategoryId('all');
                                                    setIsCategoryDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-6 py-4 md:px-12 md:py-8 text-sm md:text-xl font-bold uppercase tracking-widest text-white/60 hover:bg-lime hover:text-graphite transition-colors"
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dropdown: Subcategories */}
                                {selectedDbCategoryId && (
                                    <div className="relative group/dd flex-1 md:flex-initial min-w-[120px] md:min-w-[180px]">
                                        <button 
                                            className={`w-full px-4 py-4 md:px-12 md:py-6 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-between border-4 ${selectedSubcategoryId !== 'all'
                                                ? 'bg-teal-light border-white text-graphite shadow-xl'
                                                : 'bg-white/5 border-white/20 text-white/50 hover:border-white/40 shadow-lg'
                                                }`}
                                            onClick={() => setIsSubcategoryDropdownOpen(!isSubcategoryDropdownOpen)}
                                            onTouchStart={() => setIsSubcategoryDropdownOpen(!isSubcategoryDropdownOpen)}
                                        >
                                            <div className="flex flex-col items-start text-left min-w-0">
                                                <span className="text-xs md:text-xl truncate leading-none w-full">
                                                    {selectedSubcategoryId !== 'all' ? dbCategories.find(c => c.id === selectedDbCategoryId)?.subcategories?.find(s => s.id === selectedSubcategoryId)?.name : 'Subcat.'}
                                                </span>
                                            </div>
                                            <svg className="w-3 h-3 md:w-5 md:h-5 ml-2 md:ml-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                        <div className={`absolute top-full left-0 mt-2 w-full bg-[#1a1a1a] border-2 border-white/10 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 z-60 max-h-96 overflow-y-auto ${isSubcategoryDropdownOpen || 'group-hover/dd:opacity-100 group-hover/dd:translate-y-0 group-hover/dd:pointer-events-auto' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                                            <button
                                                onClick={() => {
                                                    setSelectedSubcategoryId('all');
                                                    setIsSubcategoryDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-6 py-4 md:px-12 md:py-8 text-sm md:text-xl font-bold uppercase tracking-widest text-white/60 hover:bg-teal-light hover:text-graphite transition-colors"
                                            >
                                                Ver Todo
                                            </button>
                                            {dbCategories.find(c => c.id === selectedDbCategoryId)?.subcategories?.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => {
                                                        setSelectedSubcategoryId(sub.id);
                                                        setIsSubcategoryDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-6 py-4 md:px-12 md:py-8 text-sm md:text-xl font-bold uppercase tracking-widest text-white/60 hover:bg-teal-light hover:text-graphite transition-colors"
                                                >
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* LARGE VISIBLE SPACER - REDUCED ON MOBILE AS REQUESTED */}
                    <div className="w-full h-12 md:h-24 lg:h-32"></div>

                    {/* Product List Section - CENTERED ARCHITECTURE FOR PREMIUM FEEL */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-20 w-full min-h-[400px] product-grid-padding">
                        {filteredDisplayItems.length === 0 ? (
                            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <span className="text-7xl">🔍</span>
                                <p className="text-3xl font-black text-white/70 uppercase tracking-widest">No hay productos en esta selección</p>
                                <p className="text-lg font-bold text-white/40">Intenta cambiar los filtros para ver más opciones.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filteredDisplayItems.map((item, index) => (
                                    <motion.div
                                        layout
                                        key={item.key}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                        transition={{
                                            duration: 0.4,
                                            delay: index * 0.05,
                                            type: 'spring',
                                            stiffness: 260,
                                            damping: 20
                                        }}
                                        whileHover={{
                                            y: -15,
                                            scale: 1.05,
                                            rotate: 1,
                                            transition: {
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 10
                                            }
                                        }}
                                        className="group"
                                    >
                                        <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-4 md:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] border-4 border-transparent hover:border-lime transition duration-500 flex flex-col h-full relative overflow-hidden group/card">
                                            <div className="aspect-square bg-white rounded-2xl overflow-hidden mb-4 relative flex items-center justify-center border-2 border-gray-100 group-hover/card:border-lime/30 transition-colors">
                                                <ProductImageCarousel item={item} />

                                                {item.is_promo && (
                                                    <div className="absolute top-3 left-3 z-30 pointer-events-none">
                                                        <span className="bg-pink-hot text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-lg uppercase tracking-wider animate-pulse">PROMO</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col grow">
                                                <h3 className="text-sm md:text-lg font-black text-graphite line-clamp-1 leading-tight mb-1 uppercase group-hover/card:text-pink-hot transition-colors">{item.name}</h3>
                                                {item.variantName && (
                                                    <div className="mb-2">
                                                        <span className="bg-pink-hot/10 text-pink-hot text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-md border border-pink-hot/20 uppercase tracking-wider">{item.variantName}</span>
                                                    </div>
                                                )}
                                                <p className="text-[10px] md:text-sm text-gray-500 font-bold uppercase tracking-widest mb-4 line-clamp-1">{item.brand || 'Tejenderas'}</p>

                                                <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 font-black line-through uppercase tracking-tighter">Antes $ {Math.round(item.price * 1.2).toLocaleString()}</span>
                                                        <span className="text-base md:text-2xl font-black text-graphite">$ {Number(item.price).toLocaleString()}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddToCart(item)}
                                                        className="w-10 h-10 md:w-14 md:h-14 bg-lime text-graphite rounded-xl flex items-center justify-center border-4 border-graphite shadow-[3px_3px_0px_0px_rgba(51,51,51,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-300"
                                                        title="Agregar al carrito"
                                                    >
                                                        <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </section>

            {/* SPACER: Visual separation before next section */}
            <div className="w-full h-32 md:h-48 bg-teal border-b-8 border-graphite"></div>

            {/* Features */}
            <section className="py-24 max-md:py-12 px-6 md:px-12 bg-lime w-full flex justify-center">
                <div className="max-w-7xl w-full flex flex-col items-center">
                    <div className="flex flex-wrap justify-center gap-12 md:gap-24 w-full">
                        {[
                            { id: 'shipping' as const, title: 'Envíos Nacionales', desc: 'Interrapidísimo', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
                            { id: 'payment' as const, title: 'Pago Seguro', desc: 'Transferencia QR', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                            { id: 'quality' as const, title: 'Productos de Calidad', desc: 'Selección Premium', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 013.138-3.138z' },
                        ].map((f, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveInfoModal(f.id)}
                                className="flex flex-col items-center gap-6 p-8 md:p-12 rounded-[2.5rem] border-4 border-graphite bg-white shadow-[12px_12px_0_0_rgba(51,51,51,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] transition duration-300 text-center w-80 max-md:w-full cursor-pointer hover:border-pink-hot"
                            >
                                <div className="w-20 h-20 bg-pink-hot text-white rounded-full flex items-center justify-center shrink-0 border-4 border-graphite">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={f.icon} />
                                    </svg>
                                </div>
                                <div className="">
                                    <h3 className="font-black text-graphite text-xl md:text-2xl mb-1 uppercase tracking-tight">{f.title}</h3>
                                    <p className="text-gray-500 font-bold">{f.desc}</p>
                                    <span className="text-pink-hot text-[10px] font-black uppercase tracking-widest mt-4 block">+ Información</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Modales Informativos */}
            <InfoModal
                isOpen={activeInfoModal === 'shipping'}
                onClose={() => setActiveInfoModal(null)}
                title="Envíos Nacionales"
                content={
                    <div className="space-y-4">
                        <p>Realizamos envíos a <strong>todo el territorio colombiano</strong> a través de nuestra transportadora oficial <strong>Interrapidísimo</strong>.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Costo de envío:</strong> El valor varía según la ciudad o ubicación destino configurada en tu pedido.</li>
                            <li><strong>Gestión de Guía:</strong> Una vez despachado tu pedido, el administrador agregará el número de guía oficial.</li>
                            <li><strong>Rastreo:</strong> Podrás consultar el estado de tu paquete en tiempo real usando el número de guía asignado.</li>
                        </ul>
                        <p className="bg-lime/20 p-4 rounded-2xl border-2 border-dashed border-graphite text-sm font-bold">
                            Recibirás notificaciones sobre el estado de tu despacho en tu panel de usuario.
                        </p>
                    </div>
                }
            />

            <InfoModal
                isOpen={activeInfoModal === 'payment'}
                onClose={() => setActiveInfoModal(null)}
                title="Pago Seguro"
                content={
                    <div className="space-y-4">
                        <p>Actualmente manejamos exclusivamente pagos mediante <strong>código QR (llave)</strong> para garantizar transacciones rápidas y seguras.</p>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li><strong>Escanear QR:</strong> Utiliza tu aplicación bancaria para escanear el QR mostrado al finalizar la compra.</li>
                            <li><strong>Realizar Pago:</strong> Efectúa la transferencia por el valor total de tu pedido.</li>
                            <li><strong>Enviar Comprobante:</strong> Sube la imagen del comprobante de pago en el detalle de tu orden.</li>
                            <li><strong>Verificación Manual:</strong> El administrador validará el ingreso del dinero en el sistema.</li>
                        </ol>
                        <div className="bg-pink-hot/10 p-5 rounded-2xl border-2 border-pink-hot/30 text-sm">
                            <p className="font-bold text-pink-hot mb-1 uppercase tracking-tighter">Importante:</p>
                            <p>El pedido solo será enviado tras la verificación exitosa. En caso de no reflejarse el pago, la orden pasará a estado <strong>"Rechazado por pago"</strong>.</p>
                        </div>
                    </div>
                }
            />

            <InfoModal
                isOpen={activeInfoModal === 'quality'}
                onClose={() => setActiveInfoModal(null)}
                title="Calidad Garantizada"
                content={
                    <div className="space-y-4">
                        <p>En <strong>Entre Lanas y Fragancias</strong>, cada producto en nuestra tienda virtual pasa por un riguroso proceso de selección manual.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Selección Curada:</strong> Elegimos hilos, lanas y fragancias que cumplen con altos estándares de textura y aroma.</li>
                            <li><strong>Presentación Impecable:</strong> Nos aseguramos de que cada artículo esté bien presentado y listo para su uso.</li>
                            <li><strong>Confiabilidad:</strong> Trabajamos para ofrecerte productos que inspiren tus proyectos y cumplan tus expectativas reales.</li>
                        </ul>
                        <p className="text-center font-black text-graphite uppercase tracking-widest bg-gray-100 py-3 rounded-full border-2 border-graphite mt-4">
                            Productos de calidad entre telas y fragancias
                        </p>
                    </div>
                }
            />

            {/* SPACER 2: Between Features and Footer */}
            <div className="w-full h-24 md:h-32 bg-lime"></div>

            <Footer />

            {/* Cart Drawer */}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}

