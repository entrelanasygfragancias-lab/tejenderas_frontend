import { useState, useEffect } from 'react';
import api from '../../api';
import Logo from '../../components/Logo';
import AdminLayout from '../../components/AdminLayout';
import { getStorageUrl } from '../../utils/imageUrl';

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

interface User {
    id: number;
    name: string;
    email: string;
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
    user: User;
}

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
    const [shippingDates, setShippingDates] = useState<Record<number, string>>({});
    const [historyQuery, setHistoryQuery] = useState('');
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/admin/orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching admin orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPayment = async (orderId: number) => {
        try {
            setUpdatingOrderId(orderId);
            await api.patch(`/admin/orders/${orderId}/status`, {
                status: 'confirmed',
                shipping_date: shippingDates[orderId] || null,
            });
            await fetchOrders();
        } catch (error) {
            console.error('Error confirming order payment:', error);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleMarkCompleted = async (orderId: number) => {
        try {
            setUpdatingOrderId(orderId);
            await api.patch(`/admin/orders/${orderId}/status`, { status: 'completed' });
            await fetchOrders();
        } catch (error) {
            console.error('Error completing order:', error);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleRejectOrder = async (orderId: number) => {
        if (!window.confirm('¿Estás seguro de que deseas rechazar este pedido?')) return;
        try {
            setUpdatingOrderId(orderId);
            await api.patch(`/admin/orders/${orderId}/status`, { status: 'rejected' });
            await fetchOrders();
        } catch (error) {
            console.error('Error rejecting order:', error);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const filteredOrders = selectedStatus === 'all'
        ? orders.filter(order => order.status !== 'completed')
        : orders.filter(order => order.status === selectedStatus);
    const completedOrders = orders.filter(order => order.status === 'completed');
    const filteredHistory = completedOrders.filter((order) => {
        const query = historyQuery.trim().toLowerCase();
        if (!query) return true;
        return (
            order.user.name.toLowerCase().includes(query) ||
            order.id.toString().includes(query) ||
            order.user.email.toLowerCase().includes(query)
        );
    });

    return (
        <AdminLayout
            title="Gestión de Pedidos"
            subtitle="Revisa y procesa las compras realizadas por tus clientes"
            actions={
                <div className="flex flex-wrap gap-3 bg-white p-2 rounded-2xl border-2 border-gray-100 shadow-sm w-full md:w-auto justify-center">
                    {['all', 'pending', 'confirmed', 'completed', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${selectedStatus === status
                                ? 'bg-graphite text-white shadow-md'
                                : 'text-gray-400 hover:text-graphite hover:bg-gray-50'
                                }`}
                        >
                            {status === 'all' ? 'Todos' :
                                status === 'pending' ? 'Pendientes' :
                                    status === 'confirmed' ? 'Confirmados' :
                                        status === 'completed' ? 'Entregados' : 'Rechazados'}
                        </button>
                    ))}
                </div>
            }
        >
            <div className="flex flex-col items-center w-full">
                <div className="h-10 md:h-16"></div>
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-12 h-12 border-4 border-pink-hot border-t-transparent rounded-full"></div>
                    </div>
                ) : selectedStatus !== 'completed' && filteredOrders.length > 0 ? (
                    <div className="w-[95%] md:w-full max-w-6xl grid grid-cols-1 gap-4 md:gap-12 mx-auto">
                        {filteredOrders.map((order) => (
                            <div key={order.id} style={{ padding: '32px' }} className="bg-white rounded-md shadow-lg md:shadow-xl border-2 md:border-4 border-graphite transition-all duration-300">
                                <div className="rounded-md overflow-hidden border border-gray-200">
                                    {/* Header */}
                                    <div className="bg-white px-6 py-5 md:px-8 md:py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 border-b-2 border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white p-2 rounded-xl border border-gray-200">
                                                <Logo className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl md:text-4xl font-black text-graphite flex items-center gap-3 pr-4">
                                                    Pedido #{order.id}
                                                    <span className={`px-3 py-1 md:px-5 md:py-2 rounded-full text-xs md:text-base font-black uppercase tracking-widest border ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                            order.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                order.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                    'bg-gray-100 text-gray-700 border-gray-200'
                                                        }`}>
                                                        {order.status === 'pending' ? 'Pendiente' :
                                                            order.status === 'confirmed' ? 'Confirmado' :
                                                                order.status === 'completed' ? 'Completado' :
                                                                    order.status === 'rejected' ? 'Rechazado' : order.status}
                                                    </span>
                                                </h3>
                                                <p className="text-gray-400 text-base md:text-lg font-bold mt-2">
                                                    {new Date(order.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl md:text-5xl font-black text-teal tracking-tighter">${parseFloat(order.total).toLocaleString()}</p>
                                            <p className="text-xs md:text-base text-gray-400 font-bold uppercase tracking-widest">Total con envío</p>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="px-6 py-6 md:px-8 md:py-8 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-12">
                                        {/* Customer Info */}
                                        <div className="lg:col-span-1 space-y-6">
                                            <h4 className="text-xl md:text-base font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 pr-4">Información del Cliente</h4>
                                            <div className="space-y-2">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold shrink-0">
                                                        {order.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-graphite text-base md:text-lg">{order.user.name}</p>
                                                        <p className="text-sm md:text-lg text-gray-500 break-all">{order.user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-3 md:p-6 rounded-2xl border border-gray-100 text-sm md:text-lg space-y-4">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                        <span className="font-medium">{order.phone}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2 text-gray-600">
                                                        <svg className="w-5 h-5 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        <span className="font-medium">
                                                            {order.shipping_address}<br />
                                                            {order.city}, {order.department}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {order.shipping_date && (
                                                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3 md:p-4">
                                                    <p className="text-xs font-black uppercase tracking-widest text-blue-600">Fecha de envío</p>
                                                    <p className="text-base md:text-lg font-black text-graphite mt-1">
                                                        {new Date(order.shipping_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}

                                            {order.payment_proof && (
                                                <div className="pt-4">
                                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3 pr-4">Comprobante de Pago</h4>
                                                    <a
                                                        href={getStorageUrl(order.payment_proof) || '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block w-full bg-pink-50 hover:bg-pink-100 text-pink-hot font-black text-center py-2 md:py-3 rounded-xl border border-pink-200 transition-colors uppercase tracking-wide text-xs"
                                                    >
                                                        Ver Imagen
                                                    </a>
                                                    {order.status === 'pending' && (
                                                        <div className="mt-3 space-y-2">
                                                            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400">Fecha de envío</label>
                                                            <input
                                                                type="date"
                                                                value={shippingDates[order.id] ?? ''}
                                                                onChange={(event) =>
                                                                    setShippingDates((prev) => ({
                                                                        ...prev,
                                                                        [order.id]: event.target.value,
                                                                    }))
                                                                }
                                                                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs font-bold text-graphite focus:border-blue-500 focus:outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                    {order.shipping_date && (
                                                        <p className="mt-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                                            Envío: {new Date(order.shipping_date).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                    {order.status === 'pending' && (
                                                        <div className="flex flex-col gap-2 mt-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleConfirmPayment(order.id)}
                                                                disabled={updatingOrderId === order.id}
                                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-center py-2 md:py-3 rounded-xl border-2 border-graphite transition-colors uppercase tracking-wide text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                                                            >
                                                                {updatingOrderId === order.id ? 'Confirmando...' : 'Confirmar pago'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRejectOrder(order.id)}
                                                                disabled={updatingOrderId === order.id}
                                                                className="w-full bg-red-500 hover:bg-red-600 text-white font-black text-center py-2 md:py-3 rounded-xl border-2 border-graphite transition-colors uppercase tracking-wide text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                                                            >
                                                                {updatingOrderId === order.id ? 'Actualizando...' : 'Rechazar pedido'}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {order.status === 'confirmed' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMarkCompleted(order.id)}
                                                            disabled={updatingOrderId === order.id}
                                                            className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-center py-2 md:py-3 rounded-xl border-2 border-graphite transition-colors uppercase tracking-wide text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                                                        >
                                                            {updatingOrderId === order.id ? 'Actualizando...' : 'Marcar como entregado'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Items Table */}
                                        <div className="lg:col-span-2">
                                            <h4 className="text-base font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 pr-4">Detalle del Pedido</h4>
                                            <div className="overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0">
                                                <table className="w-full min-w-[320px] md:min-w-[500px]">
                                                    <thead>
                                                        <tr className="text-left text-sm md:text-base text-gray-400 font-black uppercase tracking-widest">
                                                            <th className="pb-3 w-[40%] md:w-auto">Producto</th>
                                                            <th className="pb-3 text-center">Cant.</th>
                                                            <th className="pb-3 text-right">Precio</th>
                                                            <th className="pb-3 text-right">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {order.items.map((item) => (
                                                            <tr key={item.id} className="text-base md:text-lg">
                                                                <td className="py-3 md:py-5 font-bold text-graphite max-w-[140px] md:max-w-none truncate">{item.product?.name || item.product_name}</td>
                                                                <td className="py-3 md:py-5 text-center font-medium text-gray-500">{item.quantity}</td>
                                                                <td className="py-3 md:py-5 text-right font-medium text-gray-500 whitespace-nowrap">${parseFloat(item.price).toLocaleString()}</td>
                                                                <td className="py-3 md:py-5 text-right font-black text-graphite whitespace-nowrap">${(parseFloat(item.price) * item.quantity).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="border-t-2 border-gray-100">
                                                        <tr>
                                                            <td colSpan={3} className="pt-4 text-right text-xs md:text-base font-bold uppercase tracking-widest text-gray-400">Subtotal</td>
                                                            <td className="pt-4 text-right font-bold text-gray-600 text-sm md:text-base whitespace-nowrap">${(parseFloat(order.total) - parseFloat(order.shipping_cost)).toLocaleString()}</td>
                                                        </tr>
                                                        <tr>
                                                            <td colSpan={3} className="pt-2 text-right text-xs md:text-base font-bold uppercase tracking-widest text-gray-400">Envío</td>
                                                            <td className="pt-2 text-right font-bold text-gray-600 text-sm md:text-base whitespace-nowrap">${parseFloat(order.shipping_cost).toLocaleString()}</td>
                                                        </tr>
                                                        <tr>
                                                            <td colSpan={3} className="pt-4 text-right text-sm md:text-base font-black uppercase tracking-widest text-graphite">Total</td>
                                                            <td className="pt-4 text-right font-black text-teal text-xl md:text-2xl whitespace-nowrap">${parseFloat(order.total).toLocaleString()}</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : selectedStatus !== 'completed' ? (
                    <div className="w-[90%] md:w-full max-w-5xl bg-white rounded-[3rem] border-8 border-dashed border-gray-200 p-20 text-center mx-auto">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <h3 className="text-3xl font-black text-gray-300 mb-2 uppercase tracking-tight">No hay pedidos</h3>
                        <p className="text-gray-400 font-medium">No se han encontrado pedidos con el filtro seleccionado.</p>
                    </div>
                ) : null}
                {selectedStatus !== 'completed' && (
                    <div className="h-8 md:h-12"></div>
                )}
                <div className="w-[95%] md:w-full max-w-6xl mt-16 md:mt-20 mb-10 md:mb-12">
                    <div style={{ padding: '32px' }} className="bg-white rounded-md shadow-lg md:shadow-xl border-2 md:border-4 border-graphite">
                        <div className="rounded-md overflow-hidden border border-gray-200 pb-8">
                            <div className="px-6 py-5 md:px-8 md:py-6 border-b-2 border-gray-100 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <h3 className="text-xl md:text-3xl font-black text-graphite uppercase tracking-tight">Historial de pedidos completados</h3>
                                    <p className="text-gray-500 text-sm md:text-base font-medium">Solo pedidos entregados y cerrados.</p>
                                </div>
                                <div className="w-full md:w-64">
                                    <input
                                        type="text"
                                        value={historyQuery}
                                        onChange={(event) => setHistoryQuery(event.target.value)}
                                        placeholder="Buscar por cliente o #"
                                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm font-bold text-graphite focus:border-pink-hot focus:outline-none"
                                    />
                                </div>
                            </div>
                            {filteredHistory.length > 0 ? (
                                <div className="overflow-x-auto -mx-3 md:mx-0 px-8 md:px-6">
                                    <table className="w-full min-w-[320px] md:min-w-[700px]">
                                        <thead>
                                            <tr className="text-left text-xs md:text-sm text-gray-400 font-black uppercase tracking-widest">
                                                <th className="py-4 px-5">Pedido</th>
                                                <th className="py-4 px-5 hidden md:table-cell">Cliente</th>
                                                <th className="py-4 px-5 hidden md:table-cell">Fecha</th>
                                                <th className="py-4 px-5 text-right hidden md:table-cell">Total</th>
                                                <th className="py-4 px-5 hidden md:table-cell">Envío</th>
                                                <th className="py-4 px-5 text-right">Detalle</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredHistory.map((order) => (
                                                <tr key={order.id} className="text-sm md:text-base">
                                                    <td className="py-4 px-5 font-black text-graphite">
                                                        <div className="md:hidden space-y-2">
                                                            <p className="text-base font-black text-graphite">Pedido #{order.id}</p>
                                                            <div className="space-y-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                                                                <p className="text-gray-600 normal-case font-bold">{order.user.name}</p>
                                                                <p className="text-gray-500">Fecha: {new Date(order.created_at).toLocaleDateString()}</p>
                                                                <p className="text-graphite">Total: ${parseFloat(order.total).toLocaleString()}</p>
                                                                <p className="text-gray-500">Envío: {order.shipping_date ? new Date(order.shipping_date).toLocaleDateString() : 'Entregado'}</p>
                                                            </div>
                                                        </div>
                                                        <span className="hidden md:inline">#{order.id}</span>
                                                    </td>
                                                    <td className="py-4 px-5 font-bold text-gray-600 truncate max-w-[160px] md:max-w-none hidden md:table-cell">{order.user.name}</td>
                                                    <td className="py-4 px-5 text-gray-500 hidden md:table-cell">{new Date(order.created_at).toLocaleDateString()}</td>
                                                    <td className="py-4 px-5 text-right font-black text-graphite whitespace-nowrap hidden md:table-cell">${parseFloat(order.total).toLocaleString()}</td>
                                                    <td className="py-4 px-5 text-gray-500 hidden md:table-cell">{order.shipping_date ? new Date(order.shipping_date).toLocaleDateString() : 'Entregado'}</td>
                                                    <td className="py-4 px-5 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedHistoryOrder(order)}
                                                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-full border-2 border-pink-hot bg-pink-hot text-white text-xs font-black uppercase tracking-widest hover:bg-graphite hover:border-graphite transition-colors"
                                                        >
                                                            Ver
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-4 py-10 pb-14 text-center text-gray-400 font-bold">No hay resultados para la búsqueda.</div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Integrated Footer Area */}
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
            {selectedHistoryOrder && (() => {
                const order = selectedHistoryOrder;
                return (
                    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 px-3 md:px-6 py-6 md:py-10">
                        <div className="absolute inset-0" onClick={() => setSelectedHistoryOrder(null)}></div>
                        <div className="relative bg-white rounded-md shadow-2xl border-4 border-graphite w-full max-w-3xl md:mx-auto max-h-[85vh]" style={{ padding: '32px' }}>
                            <div className="rounded-md overflow-hidden border border-gray-200">
                                <div className="bg-graphite text-white p-4 md:p-5 flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <Logo className="w-10 h-10 rounded-xl p-1.5" />
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-white/70">Historial</p>
                                            <p className="font-black text-lg">Pedido #{order.id}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedHistoryOrder(null)}
                                        className="text-white bg-pink-hot/80 hover:bg-pink-hot border-2 border-white/60 rounded-full p-1 transition"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="p-5 md:p-7 space-y-6 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Cliente</p>
                                            <p className="font-black text-graphite">{order.user.name}</p>
                                            <p className="text-sm text-gray-500 break-all">{order.user.email}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2">
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Fecha</p>
                                            <p className="font-black text-graphite">{new Date(order.created_at).toLocaleDateString()}</p>
                                            <p className="text-sm text-gray-500">Envío: {order.shipping_date ? new Date(order.shipping_date).toLocaleDateString() : 'Entregado'}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2">
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total</p>
                                            <p className="font-black text-teal text-2xl">${parseFloat(order.total).toLocaleString()}</p>
                                            <p className="text-sm text-gray-500">Envío: ${parseFloat(order.shipping_cost).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4">Detalle del pedido</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[320px]">
                                                <thead>
                                                    <tr className="text-left text-xs text-gray-400 font-black uppercase tracking-widest">
                                                        <th className="pb-2">Producto</th>
                                                        <th className="pb-2 text-center">Cant.</th>
                                                        <th className="pb-2 text-right">Precio</th>
                                                        <th className="pb-2 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {order.items.map((item) => (
                                                        <tr key={item.id} className="text-sm">
                                                            <td className="py-2 font-bold text-graphite">{item.product?.name || item.product_name}</td>
                                                            <td className="py-2 text-center text-gray-500">{item.quantity}</td>
                                                            <td className="py-2 text-right text-gray-500 whitespace-nowrap">${parseFloat(item.price).toLocaleString()}</td>
                                                            <td className="py-2 text-right font-black text-graphite whitespace-nowrap">${(parseFloat(item.price) * item.quantity).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </AdminLayout>
    );
}
