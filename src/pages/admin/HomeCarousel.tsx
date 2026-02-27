import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';
import api from '../../api';

type TextTone = 'text-white' | 'text-graphite';

type Banner = {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    promoText: string;
    promoLink: string;
    imageUrl: string;
    bgClass: string;
    textClass: TextTone;
};

const defaultBanners: Banner[] = [
    {
        title: 'Telas Premium',
        subtitle: 'Algodón, lino, poliéster y más',
        ctaText: 'Ver Catálogo',
        ctaLink: '#productos',
        promoText: 'Ver Promos',
        promoLink: '#productos',
        imageUrl: '',
        bgClass: 'bg-pink-hot',
        textClass: 'text-white',
    },
    {
        title: 'Uniformes Corporativos',
        subtitle: 'Confección personalizada de alta calidad',
        ctaText: 'Cotizar Ahora',
        ctaLink: '#contacto',
        promoText: 'Promociones',
        promoLink: '#contacto',
        imageUrl: '',
        bgClass: 'bg-teal',
        textClass: 'text-white',
    },
    {
        title: 'Hilos y Fragancias',
        subtitle: 'Todo para tus proyectos y el hogar',
        ctaText: 'Explorar',
        ctaLink: '#productos',
        promoText: 'Promos del Mes',
        promoLink: '#productos',
        imageUrl: '',
        bgClass: 'bg-lime',
        textClass: 'text-graphite',
    },
];

const toneOptions: { label: string; value: TextTone }[] = [
    { label: 'Texto claro', value: 'text-white' },
    { label: 'Texto oscuro', value: 'text-graphite' },
];

const bgOptions = [
    { label: 'Rosado', value: 'bg-pink-hot' },
    { label: 'Teal', value: 'bg-teal' },
    { label: 'Lima', value: 'bg-lime' },
    { label: 'Grafito', value: 'bg-graphite' },
    { label: 'Crema', value: 'bg-yellow-50' },
];

export default function HomeCarousel() {
    const [banners, setBanners] = useState<Banner[]>(defaultBanners);

    useEffect(() => {
        const loadBanners = async () => {
            try {
                const response = await api.get('/home-carousel');
                const serverBanners = response.data?.banners;
                if (Array.isArray(serverBanners) && serverBanners.length > 0) {
                    setBanners(serverBanners);
                }
            } catch (error) {
                console.error('Error loading carousel settings', error);
                toast.error('No se pudo cargar el carrusel.');
            }
        };

        loadBanners();
    }, []);

    const updateBanner = (index: number, updates: Partial<Banner>) => {
        setBanners((prev) => prev.map((banner, i) => (i === index ? { ...banner, ...updates } : banner)));
    };

    const handleImageUpload = (index: number, file?: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            updateBanner(index, { imageUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const addBanner = () => {
        setBanners((prev) => [
            ...prev,
            {
                title: 'Nuevo banner',
                subtitle: 'Describe la promo o colección',
                ctaText: 'Ver más',
                ctaLink: '#productos',
                promoText: 'Promociones',
                promoLink: '#productos',
                imageUrl: '',
                bgClass: 'bg-pink-hot',
                textClass: 'text-white',
            },
        ]);
    };

    const removeBanner = (index: number) => {
        if (banners.length === 1) {
            toast.error('Debe existir al menos un banner.');
            return;
        }
        setBanners((prev) => prev.filter((_, i) => i !== index));
    };

    const saveBanners = async () => {
        try {
            await api.put('/admin/home-carousel', { banners });
            toast.success('Carrusel actualizado.');
        } catch (error) {
            console.error('Error saving carousel settings', error);
            toast.error('No se pudo guardar el carrusel.');
        }
    };

    return (
        <AdminLayout
            title="Gestión de Banners"
            subtitle="Personaliza el carrusel principal de la tienda"
            actions={
                <button
                    type="button"
                    onClick={saveBanners}
                    className="w-full md:w-auto px-8 py-3 bg-teal hover:bg-teal-600 text-white font-black uppercase tracking-widest rounded-xl border-2 border-graphite shadow-[4px_4px_0px_0px_#333] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#333] transition-all flex items-center justify-center gap-3 text-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    Guardar Cambios
                </button>
            }
        >
            <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white">
                <div className="w-full max-w-5xl px-8 py-32 space-y-48">

                    <div className="flex flex-col items-center w-full">
                        {banners.map((banner, index) => (
                            <div
                                key={index}
                                className="w-full flex flex-col items-center py-32 first:pt-0 last:pb-0 relative group"
                            >
                                {/* Stronger Separator Line */}
                                {index > 0 && (
                                    <div className="absolute top-0 left-0 w-full flex items-center gap-8 py-10">
                                        <div className="h-[4px] flex-1 bg-gray-100 rounded-full"></div>
                                        <div className="text-[14px] font-black text-gray-400 uppercase tracking-[1em] italic select-none">NEXT SEGMENT</div>
                                        <div className="h-[4px] flex-1 bg-gray-100 rounded-full"></div>
                                    </div>
                                )}

                                {/* Banner Controls (Top Centered) */}
                                <div className="flex justify-center mb-24">
                                    <div className="flex items-center gap-8 bg-white px-10 py-5 rounded-full border-4 border-graphite shadow-[8px_8px_0px_0px_#333] transition-transform hover:-translate-y-1">
                                        <span className="w-14 h-14 rounded-full bg-teal text-white flex items-center justify-center text-2xl font-black border-4 border-white shadow-xl">
                                            {index + 1}
                                        </span>
                                        <h3 className="text-2xl font-black text-graphite uppercase tracking-tighter italic">Bloque de Banner</h3>
                                        {banners.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeBanner(index)}
                                                className="ml-4 p-4 bg-red-50 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-md group/del"
                                                title="Eliminar este banner"
                                            >
                                                <svg className="w-7 h-7 group-hover/del:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full space-y-32 flex flex-col items-center">
                                    {/* Settings - Centered Stack */}
                                    <div className="w-full max-w-3xl space-y-16">
                                        <div className="grid grid-cols-1 gap-12">
                                            <div className="flex flex-col items-center space-y-6 text-center">
                                                <label className="text-[14px] font-black uppercase tracking-[0.5em] text-gray-500 bg-gray-50 px-6 py-2 rounded-full">TITULAR PRINCIPAL DEL SLIDE</label>
                                                <input
                                                    type="text"
                                                    value={banner.title}
                                                    onChange={(e) => updateBanner(index, { title: e.target.value })}
                                                    className="w-full max-w-2xl bg-white border-b-8 border-teal/40 px-10 py-6 text-3xl md:text-4xl font-black text-graphite focus:border-teal focus:outline-none transition-all placeholder:text-gray-300 text-center uppercase tracking-tighter italic"
                                                    placeholder="ESCRIBE AQUÍ EL TÍTULO..."
                                                />
                                            </div>

                                            <div className="flex flex-col items-center space-y-6 text-center">
                                                <label className="text-[14px] font-black uppercase tracking-[0.5em] text-gray-500 bg-gray-50 px-6 py-2 rounded-full">DESCRIPCIÓN O SUBTÍTULO</label>
                                                <textarea
                                                    value={banner.subtitle}
                                                    onChange={(e) => updateBanner(index, { subtitle: e.target.value })}
                                                    rows={2}
                                                    className="w-full max-w-2xl bg-white border-b-[24px] border-pink-hot/40 px-10 py-5 text-xl font-bold text-gray-600 focus:border-pink-hot focus:outline-none transition-all placeholder:text-gray-300 resize-none text-center leading-relaxed"
                                                    placeholder="Escribe un mensaje corto y potente..."
                                                />
                                            </div>

                                            <div className="flex flex-col items-center space-y-12">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
                                                    {/* Botón Principal */}
                                                    <div className="space-y-6 flex flex-col items-center">
                                                        <label className="text-[13px] font-black uppercase tracking-[0.4em] text-teal px-4 py-1 border-2 border-teal/20 rounded-lg">CAL TO ACTION (BOTÓN)</label>
                                                        <div className="flex flex-col gap-4 w-full">
                                                            <input
                                                                type="text"
                                                                value={banner.ctaText}
                                                                onChange={(e) => updateBanner(index, { ctaText: e.target.value })}
                                                                className="w-full bg-white border-4 border-gray-100 rounded-3xl px-8 py-5 text-lg font-black text-graphite focus:border-teal placeholder:text-gray-300 text-center uppercase tracking-widest shadow-sm"
                                                                placeholder="Texto del Botón"
                                                            />
                                                            <div className="flex flex-col items-center gap-2">
                                                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">URL DE DESTINO</span>
                                                                <input
                                                                    type="text"
                                                                    value={banner.ctaLink}
                                                                    onChange={(e) => updateBanner(index, { ctaLink: e.target.value })}
                                                                    className="w-full bg-gray-50/80 rounded-2xl px-8 py-4 text-sm font-bold text-gray-500 focus:bg-white focus:ring-4 focus:ring-teal/5 transition-all text-center border-2 border-transparent focus:border-teal/20"
                                                                    placeholder="Ej: /productos/coleccion-lujo"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Botón Promo */}
                                                    <div className="space-y-6 flex flex-col items-center">
                                                        <label className="text-[13px] font-black uppercase tracking-[0.4em] text-pink-hot px-4 py-1 border-2 border-pink-hot/20 rounded-lg">ETIQUETA SECUNDARIA</label>
                                                        <div className="flex flex-col gap-4 w-full">
                                                            <input
                                                                type="text"
                                                                value={banner.promoText}
                                                                onChange={(e) => updateBanner(index, { promoText: e.target.value })}
                                                                className="w-full bg-white border-4 border-gray-100 rounded-3xl px-8 py-5 text-lg font-black text-graphite focus:border-pink-hot placeholder:text-gray-300 text-center uppercase tracking-widest shadow-sm"
                                                                placeholder="Texto Promo"
                                                            />
                                                            <div className="flex flex-col items-center gap-2">
                                                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">URL PROMO</span>
                                                                <input
                                                                    type="text"
                                                                    value={banner.promoLink}
                                                                    onChange={(e) => updateBanner(index, { promoLink: e.target.value })}
                                                                    className="w-full bg-gray-50/80 rounded-2xl px-8 py-4 text-sm font-bold text-gray-500 focus:bg-white focus:ring-4 focus:ring-pink-hot/5 transition-all text-center border-2 border-transparent focus:border-pink-hot/20"
                                                                    placeholder="Ej: /promociones"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap justify-center gap-16 w-full pt-10 border-t-4 border-gray-50">
                                                    <div className="space-y-4 text-center">
                                                        <label className="text-[12px] font-black uppercase tracking-[0.4em] text-gray-500">COLOR DEL FONDO</label>
                                                        <div className="p-1 bg-gray-50 rounded-2xl border-2 border-gray-100">
                                                            <select
                                                                value={banner.bgClass}
                                                                onChange={(e) => updateBanner(index, { bgClass: e.target.value })}
                                                                className="bg-white rounded-xl px-10 py-3 text-[14px] font-black text-graphite focus:outline-none cursor-pointer uppercase tracking-[0.2em] shadow-sm"
                                                            >
                                                                {bgOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4 text-center">
                                                        <label className="text-[12px] font-black uppercase tracking-[0.4em] text-gray-500">ESTILO DE TEXTO</label>
                                                        <div className="p-1 bg-gray-50 rounded-2xl border-2 border-gray-100">
                                                            <select
                                                                value={banner.textClass}
                                                                onChange={(e) => updateBanner(index, { textClass: e.target.value as TextTone })}
                                                                className="bg-white rounded-xl px-10 py-3 text-[14px] font-black text-graphite focus:outline-none cursor-pointer uppercase tracking-[0.2em] shadow-sm"
                                                            >
                                                                {toneOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview - Fully Centered Content */}
                                    <div className="w-full space-y-16">
                                        <div className="flex flex-col items-center justify-center space-y-16">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="px-8 py-2 bg-graphite text-white rounded-full text-[14px] font-black uppercase tracking-[1em] italic">VISTA PREVIA REAL</div>
                                                <div className="w-48 h-1.5 bg-teal rounded-full shadow-[0px_4px_10px_rgba(0,194,203,0.3)]"></div>
                                            </div>

                                            <div className={`relative aspect-[16/9] md:aspect-[21/9] rounded-[4rem] overflow-hidden border-4 border-graphite shadow-[20px_20px_0px_0px_rgba(0,0,0,0.05)] ${banner.bgClass} group/preview w-full transition-transform hover:scale-[1.01] duration-700`}>
                                                {banner.imageUrl ? (
                                                    <img src={banner.imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center italic text-gray-400 bg-gray-50/40">
                                                        <div className="flex flex-col items-center gap-6 opacity-20">
                                                            <svg className="w-40 h-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-3xl font-black uppercase tracking-[0.5em]">Sin Imagen</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Content - Force-Centered Layout */}
                                                <div className="absolute inset-0 p-12 md:p-24 flex flex-col items-center justify-center text-center bg-black/5">
                                                    <div className={`max-w-[90%] flex flex-col items-center space-y-10 ${banner.textClass}`}>
                                                        <div className="flex flex-col items-center space-y-8">
                                                            <div className="h-3 w-40 bg-current rounded-full opacity-40"></div>
                                                            <h2 className="text-5xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.8] italic underline decoration-pink-hot/40 underline-offset-[12px] drop-shadow-2xl">
                                                                {banner.title}
                                                            </h2>
                                                        </div>
                                                        <p className="text-xl md:text-3xl font-bold opacity-90 leading-relaxed max-w-5xl drop-shadow-lg">
                                                            {banner.subtitle}
                                                        </p>
                                                        <div className="flex flex-wrap justify-center gap-10 pt-16 scale-[1.2] md:scale-[1.6]">
                                                            <div className="px-12 py-6 bg-white text-graphite font-black uppercase text-[12px] rounded-2xl border-4 border-graphite shadow-[10px_10px_0px_0px_#333]">
                                                                {banner.ctaText}
                                                            </div>
                                                            <div className="px-12 py-6 bg-transparent border-4 border-current font-black uppercase text-[12px] rounded-2xl backdrop-blur-md shadow-xl">
                                                                {banner.promoText}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Upload Overlay */}
                                                <div className="absolute inset-0 bg-graphite/90 backdrop-blur-[12px] opacity-0 group-hover/preview:opacity-100 transition-all duration-700 flex flex-col items-center justify-center cursor-pointer z-30">
                                                    <input
                                                        id={`file-${index}`}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(index, e.target.files?.[0])}
                                                        className="hidden"
                                                    />
                                                    <label
                                                        htmlFor={`file-${index}`}
                                                        className="flex flex-col items-center gap-8 group/upload text-white"
                                                    >
                                                        <div className="w-32 h-32 rounded-full bg-white text-teal flex items-center justify-center shadow-[0px_0px_50px_rgba(0,194,203,0.5)] transition-all group-hover/upload:scale-110 border-8 border-teal rotate-12 group-hover/upload:rotate-0">
                                                            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-3">
                                                            <span className="font-black text-3xl uppercase tracking-[0.4em] bg-teal px-12 py-4 rounded-2xl shadow-2xl skew-x-[-10deg] group-hover/upload:skew-x-0 transition-transform">CAMBIAR DISEÑO</span>
                                                            <span className="text-gray-300 font-bold uppercase tracking-widest text-sm">RECOMENDADO: 3840 x 2160 PX</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-700 w-full max-w-2xl bg-gray-50 p-6 rounded-[2rem] border-2 border-gray-100">
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">DIRECCIÓN DE LA IMAGEN (LINK DIRECTO)</span>
                                                    <input
                                                        type="text"
                                                        value={banner.imageUrl}
                                                        onChange={(e) => updateBanner(index, { imageUrl: e.target.value })}
                                                        className="w-full bg-white border-2 border-gray-200 px-8 py-4 rounded-xl text-[13px] font-bold text-teal focus:border-teal focus:outline-none transition-all text-center tracking-tight"
                                                        placeholder="https://images.unsplash.com/photo-..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex flex-col items-center pt-40 w-full pb-20">
                            <div className="w-96 h-[6px] bg-gray-100 rounded-full mb-24 opacity-50"></div>
                            <button
                                type="button"
                                onClick={addBanner}
                                className="group px-24 py-12 bg-graphite hover:bg-teal text-white font-black uppercase tracking-[0.6em] rounded-2xl shadow-[20px_20px_0px_0px_rgba(33,33,33,0.1)] hover:shadow-[10px_10px_0px_0px_rgba(0,194,203,0.3)] hover:-translate-y-2 hover:-translate-x-2 transition-all flex items-center gap-10 text-xl italic border-4 border-white"
                            >
                                <div className="w-12 h-12 rounded-lg bg-white text-graphite flex items-center justify-center text-4xl group-hover:rotate-180 transition-transform duration-1000">
                                    +
                                </div>
                                <span>Añadir Nuevo Bloque</span>
                            </button>
                        </div>

                        {/* Clean Footer with Version Only */}
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
                </div>
            </div>
        </AdminLayout>
    );
}
