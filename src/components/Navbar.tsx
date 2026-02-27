import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const CustomLogo = ({ className = "w-20 h-20" }: { className?: string }) => (
    <Logo className={className} />
);

interface NavbarProps {
    onOpenCart: () => void;
}

export default function Navbar({ onOpenCart }: NavbarProps) {
    const { cartCount } = useCart();
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // El menú ahora es un dropdown, no bloqueamos el scroll
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const isHome = location.pathname === '/';

    const menuItems = [
        { label: 'Productos', path: isHome ? '#productos' : '/', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', isAnchor: isHome },
        { label: 'Nosotros', path: '/nosotros', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', isAnchor: false },
        { label: 'Contacto', path: isHome ? '#contacto' : '/#contacto', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', isAnchor: isHome },
    ];

    return (
        <nav className="border-b-4 border-graphite py-10 max-md:py-6 safe-mobile-margin md:px-20 lg:px-32 sticky top-0 bg-white z-50 transition-all duration-300">
            <div className="max-w-360 mx-auto flex justify-between items-center relative">
                <Link to="/" className="group" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex items-center gap-4 md:gap-6">
                        <CustomLogo className="w-20 h-20 group-hover:rotate-12 transition-transform duration-300 max-md:w-16 max-md:h-16" />
                        <div className="flex flex-col">
                            <span className="text-3xl max-md:text-xl font-black tracking-tighter text-graphite leading-none">
                                ENTRE LANAS
                            </span>
                            <span className="text-2xl max-md:text-lg font-bold tracking-widest text-pink-hot leading-none">
                                Y FRAGANCIAS
                            </span>
                        </div>
                    </div>
                </Link>

                <div className="flex items-center gap-4 md:gap-8">
                    {/* Desktop Links */}
                    <div className="hidden md:flex gap-8 items-center border-r-2 border-gray-100 pr-8 mr-2">
                        {menuItems.map((item) => (
                            item.isAnchor ? (
                                <a key={item.label} href={item.path} className="text-sm font-bold text-graphite hover:text-pink-hot uppercase tracking-wider">{item.label}</a>
                            ) : (
                                <Link key={item.label} to={item.path} className="text-sm font-bold text-graphite hover:text-pink-hot uppercase tracking-wider">{item.label}</Link>
                            )
                        ))}
                    </div>

                    {/* Desktop User Info */}
                    {user && (
                        <div className="hidden md:flex items-center gap-6">
                            {user.role === 'admin' ? (
                                <Link to="/admin/dashboard" className="text-sm font-bold text-pink-hot border-2 border-pink-hot px-4 py-1 rounded-full transition-colors">
                                    Ir al Panel
                                </Link>
                            ) : (
                                <Link to="/my-orders" className="text-sm font-bold text-gray-500 hover:text-pink-hot transition-colors font-sans">
                                    Mis Pedidos
                                </Link>
                            )}
                            <span className="text-sm font-bold text-graphite hidden lg:inline">Hola, {user.name.split(' ')[0]}</span>
                        </div>
                    )}

                    {/* Cart (Desktop) */}
                    {(user?.role === 'client' || !user) && (
                        <button onClick={onOpenCart} className="relative p-2 text-graphite hover:text-pink-hot transition-colors max-md:hidden">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-pink-hot text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white font-black">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    )}

                    {/* Login/Logout (Desktop) */}
                    <div className="hidden md:block">
                        {user ? (
                            <button onClick={logout} className="text-sm font-bold text-red-500 border-2 border-red-100 rounded-full px-4 py-1 transition-all">Salir</button>
                        ) : (
                            <Link to="/login" className="px-10 py-4 bg-pink-hot text-white font-black rounded-xl border-4 border-graphite shadow-[4px_4px_0px_#333] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none">Ingresar</Link>
                        )}
                    </div>

                    {/* Toggle Móvil (Hambuerguesa) */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="mobile-hamburger"
                        aria-label="Menu"
                    >
                        <span className={`hamburger-bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
                        <span className={`hamburger-bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
                        <span className={`hamburger-bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown (Desplegable) */}
            {isMobileMenuOpen && (
                <div className="mobile-menu-overlay">
                    {/* Items de Navegación */}
                    {menuItems.map((item) => (
                        item.isAnchor ? (
                            <a
                                key={item.label}
                                href={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="mobile-menu-item"
                            >
                                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                                </svg>
                                {item.label}
                            </a>
                        ) : (
                            <Link
                                key={item.label}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="mobile-menu-item"
                            >
                                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
                                </svg>
                                {item.label}
                            </Link>
                        )
                    ))}

                    {/* Carrito Móvil */}
                    {(user?.role === 'client' || !user) && (
                        <button
                            onClick={() => { setIsMobileMenuOpen(false); onOpenCart(); }}
                            className="mobile-cart-btn"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Ver Carrito
                            </div>
                            <span style={{ backgroundColor: '#FF1493', color: 'white', minWidth: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '900' }}>
                                {cartCount}
                            </span>
                        </button>
                    )}

                    {/* Usuario / Admin */}
                    <div className="mobile-user-box">
                        {user ? (
                            <>
                                <div style={{ marginBottom: '10px', paddingLeft: '15px' }}>
                                    <div style={{ fontSize: '9px', color: '#999', fontWeight: '900', textTransform: 'uppercase' }}>Sesión activa</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#333' }}>{user.name}</div>
                                </div>
                                {user.role === 'admin' ? (
                                    <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="mobile-admin-link">
                                        <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                        Volver al Panel
                                    </Link>
                                ) : (
                                    <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="mobile-menu-item" style={{ background: '#f8f8f8' }}>
                                        Mis Pedidos
                                    </Link>
                                )}
                                <button onClick={() => { setIsMobileMenuOpen(false); logout(); }} className="mobile-logout-btn">
                                    Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="mobile-login-btn">
                                Ingresar a mi cuenta
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
