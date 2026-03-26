import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import InvoicePDF from '../components/InvoicePDF';
import { useAuth } from '../context/AuthContext';
import { getStorageUrl } from '../utils/imageUrl';
import './MyOrders.css';

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
        console.log('=== MyOrders Component Mounted ===');
        console.log('User authenticated:', !!user);
        console.log('User data:', user);
        console.log('User token:', localStorage.getItem('token'));
        
        if (user) {
            fetchOrders();
        } else {
            console.log('No user found, redirecting to login');
            navigate('/login');
        }
    }, [user, navigate]);

    const fetchOrders = async () => {
        try {
            console.log('=== FETCHING ORDERS ===');
            const response = await api.get('/orders');
            console.log('Orders API response status:', response.status);
            console.log('Orders data received:', response.data);
            console.log('Orders data length:', response.data?.length);
            
            if (response.data && response.data.length > 0) {
                console.log('First order structure:', response.data[0]);
                console.log('First order items:', response.data[0].items);
                console.log('First order total type:', typeof response.data[0].total);
                console.log('First order total value:', response.data[0].total);
            } else {
                console.log('No orders data received');
            }
            
            setOrders(response.data);
        } catch (error: any) {
            console.error('=== ERROR FETCHING ORDERS ===');
            console.error('Error details:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="my-orders-container safe-mobile-margin">
                {/* Animated Background Icons */}
                <div className="animated-bg">
                    {/* Top Left - Yarn */}
                    <div className="bg-icon top-left text-pink-hot">
                        <svg className="w-32 h-32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                    </div>
                    {/* Top Right - Perfume */}
                    <div className="bg-icon top-right text-teal">
                        <svg className="w-40 h-40" viewBox="0 0 24 24" fill="currentColor"><path d="M13 5V3h2V1H9v2h2v2H4v17h16V5h-7zm0 15h-2v-4h2v4zm-2-6h2v-3h-2v3z" /></svg>
                    </div>
                    {/* Bottom Left - Perfume */}
                    <div className="bg-icon bottom-left text-lime">
                        <svg className="w-36 h-36" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56c1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" /></svg>
                    </div>
                    {/* Bottom Right - Yarn */}
                    <div className="bg-icon bottom-right text-graphite">
                        <svg className="w-28 h-28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                    </div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="header-section">
                        <div className="header-spacer"></div>
                        {/* Desktop Back Button */}
                        <div className="desktop-back">
                            <button
                                onClick={() => navigate('/')}
                                className="back-button"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                <span>Volver</span>
                            </button>
                        </div>

                        {/* Mobile Back Button */}
                        <div className="mobile-header">
                            <button
                                onClick={() => navigate('/')}
                                className="back-button mobile"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                            <span className="mobile-title">Mis pedidos</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : orders.length > 0 ? (
                        <>
                            {/* Mobile list */}
                            <div className="orders-container mobile-list">
                                <div className="orders-header">
                                    <h2>Resumen de pedidos</h2>
                                    <p>Consulta el estado y abre la factura detallada.</p>
                                </div>
                                <div className="mobile-list-content">
                                    {orders.map((order) => (
                                        <div key={order.id} className="mobile-list-item">
                                            <div className="mobile-item-header">
                                                <div className="mobile-item-info">
                                                    <div className="mobile-order-number">Pedido #{order.id.toString().padStart(6, '0')}</div>
                                                    <div className="mobile-order-date">{new Date(order.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <span className={`mobile-order-status status-${order.status}`}>
                                                    {order.status === 'pending' ? 'Pendiente' :
                                                        order.status === 'confirmed' ? 'Confirmado' :
                                                            order.status === 'completed' ? 'Completado' :
                                                                order.status === 'rejected' ? 'Rechazado' : order.status}
                                                </span>
                                            </div>
                                            <div className="mobile-order-details">
                                                <div className="mobile-detail-item">
                                                    Envío: {order.shipping_date ? new Date(order.shipping_date).toLocaleDateString() : 'Por definir'}
                                                </div>
                                                <div className="mobile-detail-item total">
                                                    Total: <span className="total-amount">
                                                        {(() => {
                                                            const total = order.total;
                                                            console.log('Order total for order', order.id, ':', total, typeof total);
                                                            
                                                            // Try to get total from order, fallback to calculating from items
                                                            if (total !== null && total !== undefined && total !== '') {
                                                                const parsedTotal = parseFloat(total);
                                                                if (!isNaN(parsedTotal)) {
                                                                    return `$${parsedTotal.toLocaleString()}`;
                                                                }
                                                            }
                                                            
                                                            // Fallback: calculate from items
                                                            if (order.items && order.items.length > 0) {
                                                                console.log('=== DEBUG ORDER', order.id, '===');
                                                                const calculatedTotal = order.items.reduce((sum, item) => {
                                                                    console.log('--- Item Debug ---');
                                                                    console.log('Full item object:', item);
                                                                    console.log('Item name:', item.product?.name || 'No name');
                                                                    console.log('Item price (raw):', item.price);
                                                                    console.log('Item price type:', typeof item.price);
                                                                    console.log('Item quantity:', item.quantity);
                                                                    console.log('Full product object:', item.product);
                                                                    console.log('Is promo?', item.product?.name?.toLowerCase().includes('promo'));
                                                                    
                                                                    let itemPrice = item.price || 0;
                                                                    
                                                                    // If price is null/0, we can't calculate without product pricing data
                                                                    if (!itemPrice) {
                                                                        console.log('Item price is null/0 and no pricing data available');
                                                                        itemPrice = 0;
                                                                    }
                                                                    
                                                                    const itemQuantity = item.quantity || 1;
                                                                    const itemTotal = parseFloat(String(itemPrice)) * itemQuantity;
                                                                    console.log('Final item price:', itemPrice);
                                                                    console.log('Calculated item total:', itemTotal);
                                                                    console.log('------------------');
                                                                    return sum + itemTotal;
                                                                }, 0);
                                                                console.log('=== FINAL TOTAL FOR ORDER', order.id, ':', calculatedTotal, '===');
                                                                return `$${calculatedTotal.toLocaleString()}`;
                                                            }
                                                            
                                                            return '$0 (no data)';
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mobile-order-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="mobile-invoice-button"
                                                    title="Ver factura"
                                                >
                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    Factura
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Desktop/tablet table */}
                            <div className="orders-container desktop-table">
                                <div className="orders-header">
                                    <h2>Resumen de pedidos</h2>
                                    <p>Consulta el estado y abre la factura detallada.</p>
                                </div>
                                <div className="table-wrapper">
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>Pedido</th>
                                                <th>Estado</th>
                                                <th>Fecha de envío</th>
                                                <th>Valor</th>
                                                <th>Factura</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td>
                                                        <div className="table-order-number">Pedido #{order.id.toString().padStart(6, '0')}</div>
                                                        <div className="table-order-date">{new Date(order.created_at).toLocaleDateString()}</div>
                                                    </td>
                                                    <td>
                                                        <span className={`invoice-status-badge status-${order.status}`}>
                                                            {order.status === 'pending' ? 'Pendiente' :
                                                                order.status === 'confirmed' ? 'Confirmado' :
                                                                    order.status === 'completed' ? 'Completado' :
                                                                        order.status === 'rejected' ? 'Rechazado' : order.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {order.shipping_date ? new Date(order.shipping_date).toLocaleDateString() : 'Por definir'}
                                                    </td>
                                                    <td className="table-total">
                                                        {(() => {
                                                            const total = order.total;
                                                            console.log('Desktop order total for order', order.id, ':', total, typeof total);
                                                            
                                                            // Try to get total from order, fallback to calculating from items
                                                            if (total !== null && total !== undefined && total !== '') {
                                                                const parsedTotal = parseFloat(total);
                                                                if (!isNaN(parsedTotal)) {
                                                                    return `$${parsedTotal.toLocaleString()}`;
                                                                }
                                                            }
                                                            
                                                            // Fallback: calculate from items
                                                            if (order.items && order.items.length > 0) {
                                                                const calculatedTotal = order.items.reduce((sum, item) => {
                                                                    const itemPrice = item.price || 0;
                                                                    const itemQuantity = item.quantity || 1;
                                                                    return sum + (parseFloat(String(itemPrice)) * itemQuantity);
                                                                }, 0);
                                                                console.log('Desktop calculated total from items for order', order.id, ':', calculatedTotal);
                                                                return `$${calculatedTotal.toLocaleString()}`;
                                                            }
                                                            
                                                            return '$0 (no data)';
                                                        })()}
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="table-invoice-button"
                                                            title="Ver factura"
                                                        >
                                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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
                        <div className="empty-state">
                            <div className="empty-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            </div>
                            <h2 className="empty-title">Aún no tienes pedidos</h2>
                            <p className="empty-description">¡Explora nuestro catálogo y encuentra lo que te inspira!</p>
                            <button
                                onClick={() => navigate('/')}
                                className="empty-action-button"
                            >
                                Ver Productos
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {selectedOrder && (
                <div className="invoice-modal-overlay">
                    <div className="invoice-modal-backdrop" onClick={() => setSelectedOrder(null)}></div>
                    <div className="invoice-modal">
                        {/* Header profesional con branding de la app */}
                        <div className="invoice-header">
                            <div className="invoice-header-logo">
                                <div className="invoice-logo-icon">E</div>
                                <div className="invoice-header-info">
                                    <h3>Factura Comercial</h3>
                                    <h4>Pedido #{selectedOrder.id.toString().padStart(6, '0')}</h4>
                                </div>
                            </div>
                            <div className="invoice-header-actions">
                                <InvoicePDF order={selectedOrder} user={user} />
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrder(null)}
                                    className="invoice-close-button"
                                >
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        {/* Contenido de la factura con diseño profesional */}
                        <div className="invoice-content">
                            {/* Información del cliente y pedido */}
                            <div className="invoice-sections-grid">
                                <div className="invoice-section-card customer">
                                    <h3 className="invoice-section-title">Datos del Cliente</h3>
                                    <div className="invoice-info-grid">
                                        <div className="invoice-info-row">
                                            <span className="invoice-info-label">Nombre:</span>
                                            <span className="invoice-info-value">{user?.name || 'N/A'}</span>
                                        </div>
                                        <div className="invoice-info-row">
                                            <span className="invoice-info-label">Email:</span>
                                            <span className="invoice-info-value">{user?.email || 'N/A'}</span>
                                        </div>
                                        <div className="invoice-info-row">
                                            <span className="invoice-info-label">Teléfono:</span>
                                            <span className="invoice-info-value">{user?.phone || selectedOrder.phone || 'N/A'}</span>
                                        </div>
                                        <div className="invoice-info-row">
                                            <span className="invoice-info-label">Dirección:</span>
                                            <span className="invoice-info-value">{user?.address || selectedOrder.shipping_address || 'N/A'}</span>
                                        </div>
                                        <div className="invoice-info-row">
                                            <span className="invoice-info-label">Ciudad:</span>
                                            <span className="invoice-info-value">{user?.city || selectedOrder.city || 'N/A'}, {user?.department || selectedOrder.department || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="invoice-section-card order">
                                    <h3 className="invoice-section-title">Datos del Pedido</h3>
                                    <div className="invoice-info-grid">
                                        <div className="invoice-info-row">
                                            <span className="invoice-info-label">Fecha:</span>
                                            <span className="invoice-info-value">{new Date(selectedOrder.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                        <div className="invoice-info-row">
                                            <span className="invoice-info-label">Estado:</span>
                                            <span className="invoice-info-value">
                                                <span className={`invoice-status-badge status-${selectedOrder.status}`}>
                                                    {selectedOrder.status === 'pending' ? 'Pendiente' :
                                                     selectedOrder.status === 'confirmed' ? 'Confirmado' :
                                                     selectedOrder.status === 'completed' ? 'Completado' :
                                                     selectedOrder.status === 'rejected' ? 'Rechazado' : selectedOrder.status}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="invoice-info-row">
                                            <span className="invoice-info-label">Fecha de envío:</span>
                                            <span className="invoice-info-value">
                                                {selectedOrder.shipping_date ? new Date(selectedOrder.shipping_date).toLocaleDateString('es-CO') : 'Por definir'}
                                            </span>
                                        </div>
                                        <div className="invoice-info-row">
                                            <span className="invoice-info-label">Costo de envío:</span>
                                            <span className="invoice-info-value">${(selectedOrder.shipping_cost ? parseFloat(selectedOrder.shipping_cost) : 0).toLocaleString('es-CO')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla de productos profesional */}
                            <div className="invoice-table-section">
                                <h3 className="invoice-table-title">Detalle de Productos</h3>
                                <div className="table-wrapper">
                                    <table className="invoice-table">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Cantidad</th>
                                                <th>Precio Unit.</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.product?.name || item.product_name}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>${(item.price ? parseFloat(item.price) : 0).toLocaleString('es-CO')}</td>
                                                    <td>${((item.price ? parseFloat(item.price) : 0) * item.quantity).toLocaleString('es-CO')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Resumen de totales */}
                            <div className="invoice-totals-section">
                                <div className="invoice-totals-card">
                                    <h4 className="invoice-totals-title">Resumen de Compra</h4>
                                    <div className="invoice-total-row subtotal">
                                        <span>Subtotal:</span>
                                        <span>${((selectedOrder.total ? parseFloat(selectedOrder.total) : 0) - (selectedOrder.shipping_cost ? parseFloat(selectedOrder.shipping_cost) : 0)).toLocaleString('es-CO')}</span>
                                    </div>
                                    <div className="invoice-total-row shipping">
                                        <span>Envío:</span>
                                        <span>${(selectedOrder.shipping_cost ? parseFloat(selectedOrder.shipping_cost) : 0).toLocaleString('es-CO')}</span>
                                    </div>
                                    <div className="invoice-total-row final">
                                        <span>TOTAL:</span>
                                        <span className="amount">${(selectedOrder.total ? parseFloat(selectedOrder.total) : 0).toLocaleString('es-CO')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Comprobante de pago */}
                            {selectedOrder.payment_proof && (
                                <div className="invoice-payment-section">
                                    <div className="invoice-payment-content">
                                        <div className="invoice-payment-info">
                                            <h4>Comprobante de Pago</h4>
                                            <p>Haz clic para ver el comprobante de pago adjunto</p>
                                        </div>
                                        <a
                                            href={getStorageUrl(selectedOrder.payment_proof) || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="invoice-payment-link"
                                        >
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Ver Comprobante
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Información de contacto */}
                            <div className="invoice-contact-section">
                                <h3 className="invoice-contact-title">Información de Contacto</h3>
                                <div className="invoice-contact-grid">
                                    <div className="invoice-contact-item">
                                        <div className="invoice-contact-icon address">📍</div>
                                        <div className="invoice-contact-details">
                                            <h4>Dirección</h4>
                                            <p>Carrera 11# 6-08, Barrio el Rosario, Chía</p>
                                        </div>
                                    </div>
                                    <div className="invoice-contact-item">
                                        <div className="invoice-contact-icon phone">📞</div>
                                        <div className="invoice-contact-details">
                                            <h4>Teléfonos</h4>
                                            <p>+57 312 457 8081 - 314 461 6230</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer informativo */}
                            <div className="invoice-footer">
                                <div className="invoice-footer-branding">
                                    <div className="invoice-footer-logo">E</div>
                                    <div className="invoice-footer-company">
                                        <h4>ENTRE LANAS</h4>
                                        <p>Y FRAGANCIAS</p>
                                    </div>
                                </div>
                                <p className="invoice-footer-message">
                                    Gracias por tu compra en Entre Lanas y Fragancias
                                </p>
                                <p className="invoice-footer-legal">
                                    Esta factura es un documento válido para tu referencia • NIT 20421751 - 2
                                </p>
                                <div className="invoice-footer-copyright">
                                    <span>© 2026 Entre Lanas y Fragancias</span>
                                    <span>Todos los derechos reservados</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
