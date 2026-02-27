import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { getStorageUrl } from '../utils/imageUrl';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: string;
    product?: {
        name: string;
        image?: string;
    }
}

interface Order {
    id: number;
    created_at: string;
    status: string;
    total: string;
    shipping_cost: string;
    shipping_address: string;
    city: string;
    department: string;
    phone: string;
    payment_proof?: string;
    shipping_date?: string | null;
    items: OrderItem[];
}

export default function MyOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gray-50 pt-24 md:pt-32 pb-16 safe-mobile-margin font-sans relative overflow-hidden">
                {/* Animated Background Icons */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden hidden md:block">
                    {/* Top Left - Yarn */}
                    <div className="absolute top-10 left-10 opacity-10 animate-float text-pink-hot">
                        <svg className="w-32 h-32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                    </div>
                    {/* Top Right - Perfume */}
                    <div className="absolute top-20 right-20 opacity-10 animate-float-delayed text-teal">
                        <svg className="w-40 h-40" viewBox="0 0 24 24" fill="currentColor"><path d="M13 5V3h2V1H9v2h2v2H4v17h16V5h-7zm0 15h-2v-4h2v4zm-2-6h2v-3h-2v3z" /></svg>
                    </div>
                    {/* Bottom Left - Perfume */}
                    <div className="absolute bottom-20 left-20 opacity-10 animate-float-slow text-lime">
                        <svg className="w-36 h-36" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56c1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" /></svg>
                    </div>
                    {/* Bottom Right - Yarn */}
                    <div className="absolute bottom-10 right-10 opacity-10 animate-float text-graphite">
                        <svg className="w-28 h-28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 safe-mobile-margin md:px-8 flex flex-col items-center">
                    <div className="flex flex-col items-center justify-center relative mb-24 md:mb-32 no-print gap-4 w-full">
                        <div className="h-10 md:h-10"></div>
                        {/* Desktop Back Button - Positioned relative to container but improved */}
                        <div className="absolute left-4 hidden md:block">
                            <button
                                onClick={() => navigate('/')}
                                className="bg-white hover:bg-pink-hot hover:text-white text-graphite font-black py-4 px-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center gap-3 border-2 border-graphite"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                <span className="uppercase tracking-widest text-sm">Volver</span>
                            </button>
                        </div>

                        {/* Mobile Back Button - Sticky or visible at top */}
                        <div className="w-full flex md:hidden justify-between mb-4">
                            <button
                                onClick={() => navigate('/')}
                                className="bg-white p-3 rounded-2xl border-2 border-graphite shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                            <span className="text-xs font-black uppercase tracking-widest text-gray-800">Mis pedidos</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black text-graphite uppercase tracking-tighter text-center bg-white/90 backdrop-blur-md px-10 md:px-20 py-4 md:py-6 rounded-full border-4 border-white shadow-xl ring-4 ring-pink-hot/20">Mis Pedidos</h1>
                    </div>

                    {!isLoading && orders.length > 0 && (
                        <div className="h-16 md:h-24"></div>
                    )}
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin w-16 h-16 border-8 border-pink-hot border-t-transparent rounded-full"></div>
                        </div>
                    ) : orders.length > 0 ? (
                        <>
                            {/* Mobile list */}
                            <div className="md:hidden bg-white rounded-3xl shadow-xl border-4 border-graphite overflow-hidden max-w-5xl w-full mx-auto">
                                <div className="px-5 py-5 border-b-2 border-gray-100 bg-gray-50/60">
                                    <h2 className="text-xl font-black text-graphite uppercase tracking-tight">Resumen de pedidos</h2>
                                    <p className="text-gray-500 text-sm font-medium">Consulta el estado y abre la factura detallada.</p>
                                </div>
                                <ul className="divide-y divide-gray-100">
                                    {orders.map((order) => (
                                        <li key={order.id} className="p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="font-black text-graphite">Pedido #{order.id.toString().padStart(6, '0')}</div>
                                                    <div className="text-xs text-gray-400 font-bold">{new Date(order.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <span className={`shrink-0 inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                        order.status === 'completed' ? 'bg-teal/10 text-teal border-teal/20' :
                                                            order.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                    {order.status === 'pending' ? 'Pendiente' :
                                                        order.status === 'confirmed' ? 'Confirmado' :
                                                            order.status === 'completed' ? 'Completado' :
                                                                order.status === 'rejected' ? 'Rechazado' : order.status}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-gray-500">
                                                <div className="bg-gray-50 rounded-xl p-2">Envío: {order.shipping_date ? new Date(order.shipping_date).toLocaleDateString() : 'Por definir'}</div>
                                                <div className="bg-gray-50 rounded-xl p-2 text-right">Total: <span className="text-graphite">${parseFloat(order.total).toLocaleString()}</span></div>
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-pink-50 text-pink-hot border-2 border-pink-200 hover:bg-pink-hot hover:text-white transition-all text-xs font-black uppercase tracking-widest"
                                                    title="Ver factura"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    Factura
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Desktop/tablet table */}
                            <div className="hidden md:block bg-white rounded-4xl shadow-xl border-4 border-graphite overflow-hidden max-w-5xl w-full mx-auto">
                                <div className="px-6 md:px-8 py-6 border-b-2 border-gray-100 bg-gray-50/60">
                                    <h2 className="text-2xl md:text-3xl font-black text-graphite uppercase tracking-tight">Resumen de pedidos</h2>
                                    <p className="text-gray-500 font-medium">Consulta el estado y abre la factura detallada.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[640px]">
                                        <thead className="bg-white">
                                            <tr className="text-left text-xs font-black uppercase tracking-widest text-gray-400 border-b-2 border-gray-100">
                                                <th className="py-4 px-6">Pedido</th>
                                                <th className="py-4 px-6">Estado</th>
                                                <th className="py-4 px-6">Fecha de envío</th>
                                                <th className="py-4 px-6 text-right">Valor</th>
                                                <th className="py-4 px-6 text-center">Factura</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {orders.map((order) => (
                                                <tr key={order.id} className="text-sm font-bold text-graphite hover:bg-gray-50/70 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="font-black text-graphite">Pedido #{order.id.toString().padStart(6, '0')}</div>
                                                        <div className="text-xs text-gray-400 font-bold">{new Date(order.created_at).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                order.status === 'completed' ? 'bg-teal/10 text-teal border-teal/20' :
                                                                    order.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                        'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                            {order.status === 'pending' ? 'Pendiente' :
                                                                order.status === 'confirmed' ? 'Confirmado' :
                                                                    order.status === 'completed' ? 'Completado' :
                                                                        order.status === 'rejected' ? 'Rechazado' : order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-500">
                                                        {order.shipping_date ? new Date(order.shipping_date).toLocaleDateString() : 'Por definir'}
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-black text-graphite">
                                                        ${parseFloat(order.total).toLocaleString()}
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-pink-50 text-pink-hot border-2 border-pink-200 hover:bg-pink-hot hover:text-white transition-all"
                                                            title="Ver factura"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-4xl shadow-xl border-4 border-gray-100 max-w-2xl mx-auto">
                            <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-hot">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            </div>
                            <h2 className="text-3xl font-black text-graphite mb-2 uppercase tracking-tight">Aún no tienes pedidos</h2>
                            <p className="text-gray-500 mb-8 font-medium">¡Explora nuestro catálogo y encuentra lo que te inspira!</p>
                            <button
                                onClick={() => navigate('/')}
                                className="px-8 py-4 bg-teal text-white font-black uppercase tracking-widest rounded-2xl hover:bg-graphite transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                            >
                                Ver Productos
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 px-3 md:px-6 py-6 md:py-10">
                    <div className="absolute inset-0" onClick={() => setSelectedOrder(null)}></div>
                    <div className="relative bg-white rounded-t-3xl md:rounded-4xl shadow-2xl border-4 border-graphite w-full max-w-2xl md:mx-auto overflow-hidden max-h-[85vh]">
                        <div className="bg-graphite text-white p-4 md:p-5 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <Logo className="w-10 h-10 rounded-xl p-1.5" />
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-white/70">Factura</p>
                                    <p className="font-black text-lg">Pedido #{selectedOrder!.id.toString().padStart(6, '0')}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-pink-hot transition-all flex items-center justify-center"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-4 md:p-6 space-y-5 overflow-y-auto">
                            <div className="flex flex-wrap justify-between gap-4">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Cliente</p>
                                    <p className="font-black text-graphite text-lg">{user?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Estado</p>
                                    <p className="font-black text-graphite">
                                        {selectedOrder!.status === 'pending' ? 'Pendiente' :
                                            selectedOrder!.status === 'confirmed' ? 'Confirmado' :
                                                selectedOrder!.status === 'completed' ? 'Completado' :
                                                    selectedOrder!.status === 'rejected' ? 'Rechazado' : selectedOrder!.status}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Envío</p>
                                    <p className="font-black text-graphite">{selectedOrder!.shipping_date ? new Date(selectedOrder!.shipping_date).toLocaleDateString() : 'Por definir'}</p>
                                </div>
                            </div>
                            <div className="rounded-3xl border-2 border-gray-100 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr className="text-xs font-black uppercase tracking-widest text-gray-400">
                                            <th className="py-3 px-4 text-left">Producto</th>
                                            <th className="py-3 px-4 text-center">Cant.</th>
                                            <th className="py-3 px-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder!.items.map((item) => (
                                            <tr key={item.id} className="border-t border-gray-100 text-sm font-bold text-graphite">
                                                <td className="py-3 px-4">{item.product?.name || 'Producto'}</td>
                                                <td className="py-3 px-4 text-center">{item.quantity}</td>
                                                <td className="py-3 px-4 text-right">${(parseFloat(item.price) * item.quantity).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between items-center bg-teal/5 p-4 rounded-2xl border border-teal/10">
                                <span className="text-teal text-sm font-black uppercase tracking-widest">Total Pagado</span>
                                <span className="text-3xl font-black text-teal tracking-tighter">${parseFloat(selectedOrder!.total).toLocaleString()}</span>
                            </div>
                            {selectedOrder!.payment_proof && (
                                <a
                                    href={getStorageUrl(selectedOrder!.payment_proof) || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-pink-hot font-black uppercase tracking-widest text-xs"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    Ver comprobante de pago
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
