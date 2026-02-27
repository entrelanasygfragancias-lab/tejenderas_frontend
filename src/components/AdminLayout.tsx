import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

interface AdminLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    actions?: ReactNode;
    centerTitle?: boolean;
    titleWrapperClassName?: string;
    mainWrapperClassName?: string;
    headerActions?: ReactNode;
    actionsWrapperClassName?: string;
    titleSectionClassName?: string;
}

export default function AdminLayout({ children, title, subtitle, actions, centerTitle = true, titleWrapperClassName, mainWrapperClassName, headerActions, actionsWrapperClassName, titleSectionClassName }: AdminLayoutProps) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/admin/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', label: 'Dashboard' },
        { path: '/admin/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', label: 'Pedidos Web' },
        { path: '/admin/pos', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', label: 'Punto de Venta' },
        { path: '/admin/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: 'Inventario' },
        { path: '/admin/home-carousel', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Carrusel Home' },
        { path: '/admin/sales-registry', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Registro Ventas' },
        { path: '/admin/contracts', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Contratos' },
        { path: '/admin/catalog', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Gestionar Catálogo' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-pink-hot selection:text-white">

            {/* Header Navigation */}
            <header className="bg-graphite text-white sticky top-0 z-50 border-b border-gray-800">
                <div className="max-w-[98%] mx-auto px-5 md:px-16 lg:px-24 h-16 md:h-20 flex items-center justify-between gap-8">

                    {/* Brand */}
                    <div className="flex items-center gap-6 shrink-0 ml-2 md:ml-12">
                        <div className="flex items-center">
                            <Logo className="w-10 h-10 md:w-14 md:h-14" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-lg md:text-xl font-black tracking-tighter uppercase">ENTRE LANAS</span>
                            <span className="text-[10px] md:text-xs font-bold text-pink-hot tracking-widest uppercase">Y FRAGANCIAS</span>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center justify-center flex-1 gap-2">
                        {menuItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group
                                        ${isActive
                                            ? 'bg-pink-hot text-white shadow-md'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                    </svg>
                                    <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4 shrink-0">
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-tighter"
                            title="Ver Tienda"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10h5V14h4v6h5V10" />
                            </svg>
                            <span className="hidden lg:inline">Ver Tienda</span>
                        </Link>

                        <div className="h-4 w-[1px] bg-gray-700 mx-2 hidden lg:block"></div>

                        {headerActions && <div className="flex items-center">{headerActions}</div>}

                        <div className="h-8 w-[1px] bg-gray-800 mx-2 hidden lg:block"></div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center font-bold text-xs border border-gray-700 transition-colors">
                                {user?.name.charAt(0)}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors font-bold text-xs uppercase tracking-tighter"
                                title="Cerrar Sesión"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="hidden xl:inline">Salir</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Toggle Menu"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={() => setIsMenuOpen(false)}></div>
                    <nav className="relative h-full flex flex-col p-6 overflow-y-auto">
                        {/* Overlay Header - Brand Integrated */}
                        <div className="flex items-center justify-between mb-10 pt-2">
                            <div className="flex items-center gap-4">
                                <Logo className="w-16 h-16" />
                                <div className="flex flex-col leading-none">
                                    <span className="text-xl font-black tracking-tighter text-white uppercase italic">ENTRE LANAS</span>
                                    <span className="text-xs font-bold text-pink-hot tracking-widest uppercase">Y FRAGANCIAS</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="w-12 h-12 flex items-center justify-center text-white/40 hover:text-white"
                            >
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-1">
                            {menuItems.map((item) => {
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`
                                            flex items-center gap-4 p-3 rounded-full text-[13px] font-black uppercase tracking-[0.15em] transition-all duration-300
                                            ${isActive
                                                ? 'bg-pink-hot text-white shadow-2xl shadow-pink-500/40 translate-x-1'
                                                : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                                        `}
                                    >
                                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                            </svg>
                                        </div>
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="pt-8 mt-6 border-t border-white/5 flex flex-col gap-2">
                            <Link
                                to="/"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-4 p-3 text-white/40 hover:text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                            >
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10h5V14h4v6h5V10" />
                                    </svg>
                                </div>
                                Salir a la Tienda
                            </Link>
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-4 p-3 text-red-pink/60 hover:text-red-pink text-[11px] font-black uppercase tracking-widest transition-colors text-left"
                            >
                                <div className="w-6 h-6 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                                Finalizar Gestión
                            </button>
                        </div>
                    </nav>
                </div>
            )}

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col pt-16 md:pt-20 pb-12 md:pb-24 safe-mobile-margin md:px-[2.5%] max-w-[1400px] mx-auto w-full ${mainWrapperClassName || ''}`}>
                <div className="w-full space-y-12">
                    {/* Section Header */}
                    {(title || actions) && (
                        <div className={`flex flex-col gap-6 mb-4 ${centerTitle ? 'items-center text-center' : ''} ${titleSectionClassName || ''}`}>
                            <div className={`space-y-2 ${titleWrapperClassName || ''}`}>
                                {title && (
                                    <h1 className="text-4xl md:text-6xl font-black text-graphite uppercase tracking-tighter leading-tight">
                                        {title}
                                    </h1>
                                )}
                                {subtitle && (
                                    <p className="text-gray-500 font-bold text-lg md:text-xl max-w-2xl mx-auto italic">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            {actions && (
                                <div className={`flex flex-wrap gap-4 justify-center ${actionsWrapperClassName || ''}`}>
                                    {actions}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Viewport content */}
                    <div className="flex-1">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
