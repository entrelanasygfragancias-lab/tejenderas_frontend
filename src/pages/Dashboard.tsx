import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api';

export default function Dashboard() {
    const { isAdmin } = useAuth();
    const [adminNotifications, setAdminNotifications] = useState<{ id: number; message: string; created_at: string; is_read: boolean }[]>([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!isAdmin) return;
            try {
                const response = await api.get('/admin/notifications');
                setAdminNotifications(response.data);
            } catch (error) {
                console.error('Error fetching admin notifications:', error);
            }
        };

        fetchNotifications();
    }, [isAdmin]);

    const headerActions = (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                className="relative w-11 h-11 rounded-full bg-pink-hot text-white border-2 border-graphite shadow-[3px_3px_0px_0px_rgba(51,51,51,1)] hover:bg-graphite hover:text-pink-hot hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" /></svg>
                {adminNotifications.some((notification) => !notification.is_read) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lime border-2 border-graphite"></span>
                )}
            </button>

            {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-96 max-w-[90vw] bg-white border-2 border-graphite rounded-3xl shadow-[6px_6px_0px_0px_rgba(51,51,51,1)] p-5 z-10">
                    {adminNotifications.length > 0 ? (
                        <div className="space-y-4">
                            <p className="text-xs font-black uppercase tracking-widest text-pink-hot">Notificaciones</p>
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                                {adminNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`rounded-2xl border-2 p-4 ${notification.is_read ? 'border-gray-200 bg-gray-50' : 'border-pink-hot bg-pink-50'}`}
                                    >
                                        <p className={`text-sm font-black uppercase tracking-widest ${notification.is_read ? 'text-gray-400' : 'text-pink-hot'}`}>
                                            {notification.is_read ? 'Vista' : 'Nueva'}
                                        </p>
                                        <p className="text-base font-black text-graphite mt-1">{notification.message}</p>
                                        <p className="text-xs font-bold text-gray-500 mt-2">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </p>
                                        <div className="flex flex-wrap gap-3 pt-3">
                                            <Link
                                                to="/admin/orders"
                                                className="px-4 py-2 bg-graphite text-white font-black uppercase tracking-widest rounded-2xl border-2 border-graphite shadow-[2px_2px_0px_0px_rgba(51,51,51,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all text-xs"
                                            >
                                                Ver pedidos
                                            </Link>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await api.patch(`/admin/notifications/${notification.id}`);
                                                        setAdminNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
                                                    } catch (error) {
                                                        console.error('Error marking notification as read:', error);
                                                    }
                                                }}
                                                className={`px-4 py-2 font-black uppercase tracking-widest rounded-2xl border-2 transition-all text-xs ${notification.is_read ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-pink-50 text-pink-hot border-pink-hot hover:bg-pink-100'}`}
                                                disabled={notification.is_read}
                                            >
                                                {notification.is_read ? 'Visto' : 'Marcar como visto'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-400">
                            <p className="text-sm font-bold uppercase tracking-widest">Sin notificaciones</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <AdminLayout
            title="Panel de Control"
            subtitle="Bienvenido al centro administrativo de Entre Lanas y Fragancias"
            headerActions={headerActions}
        >
            {/* Espaciador manual para asegurar separación */}
            <div style={{ height: '4rem' }} className="w-full hidden md:block"></div>
            <div style={{ height: '2rem' }} className="w-full md:hidden"></div>

            {/* Cards Grid con estilo inline para diagnóstico */}
            <div className="flex justify-center w-full" style={{ paddingTop: '2rem' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 w-full max-w-6xl">
                    {isAdmin && (
                        <>
                            <Link
                                to="/admin/products"
                                className="group bg-white rounded-xl border-4 border-graphite p-8 lg:p-10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col justify-between min-h-[240px] lg:min-h-[300px]"
                            >
                                <div className="absolute top-0 right-0 p-6 lg:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <svg className="w-24 h-24 lg:w-36 lg:h-36 text-teal" fill="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                </div>
                                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-teal rounded-2xl border-4 border-graphite flex items-center justify-center mb-6 shadow-md">
                                    <svg className="w-8 h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-3xl lg:text-4xl font-black text-graphite mb-2 uppercase tracking-tighter leading-none group-hover:text-teal transition-colors">Productos</h3>
                                    <p className="text-lg lg:text-xl text-gray-500 font-medium leading-relaxed">Inventario general</p>
                                </div>
                            </Link>

                            <Link
                                to="/admin/pos"
                                className="group bg-white rounded-xl border-4 border-graphite p-8 lg:p-10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col justify-between min-h-[240px] lg:min-h-[300px]"
                            >
                                <div className="absolute top-0 right-0 p-6 lg:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <svg className="w-24 h-24 lg:w-36 lg:h-36 text-lime" fill="currentColor" viewBox="0 0 24 24"><path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-lime rounded-2xl border-4 border-graphite flex items-center justify-center mb-6 shadow-md">
                                    <svg className="w-8 h-8 lg:w-10 lg:h-10 text-graphite" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-3xl lg:text-4xl font-black text-graphite mb-2 uppercase tracking-tighter leading-none group-hover:text-lime-dark transition-colors">Ventas</h3>
                                    <p className="text-lg lg:text-xl text-gray-500 font-medium leading-relaxed">Facturación POS</p>
                                </div>
                            </Link>

                            <Link
                                to="/admin/contracts"
                                className="group bg-white rounded-xl border-4 border-graphite p-8 lg:p-10 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col justify-between min-h-[240px] lg:min-h-[300px]"
                            >
                                <div className="absolute top-0 right-0 p-6 lg:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <svg className="w-24 h-24 lg:w-36 lg:h-36 text-pink-hot" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-pink-hot rounded-2xl border-4 border-graphite flex items-center justify-center mb-6 shadow-md">
                                    <svg className="w-8 h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-3xl lg:text-4xl font-black text-graphite mb-2 uppercase tracking-tighter leading-none group-hover:text-pink-hot transition-colors">Contratos</h3>
                                    <p className="text-lg lg:text-xl text-gray-500 font-medium leading-relaxed">Servicios especiales</p>
                                </div>
                            </Link>
                        </>
                    )}

                    {!isAdmin && (
                        <div className="bg-white rounded-xl border-8 border-dashed border-gray-100 p-8 lg:p-12 flex flex-col items-center justify-center text-center min-h-[280px]">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl lg:text-3xl font-bold text-gray-300 mb-2">Mi Perfil</h3>
                            <p className="text-lg text-gray-300">Pronto podrás ver tu historial de compras.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
