import { useState, useEffect, type FormEvent, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';
import { getStorageUrl } from '../utils/imageUrl';
import './Checkout.css';

export default function Checkout() {
    const { cart, cartTotal, clearCart, clearCartWithMessage } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        shipping_address: user?.address || '',
        address_details: '', // New field for apartment/tower details
        city: user?.city || '',
        department: user?.department || '',
        phone: user?.phone || '',
    });

    const [paymentProof, setPaymentProof] = useState<File | null>(null);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                shipping_address: user.address || '',
                city: user.city || '',
                department: user.department || '',
                phone: user.phone || '',
            }));
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPaymentProof(e.target.files[0]);
        }
    };

    const shippingCost = 15000;
    const total = cartTotal + shippingCost;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!paymentProof) {
            setError('Por favor sube el comprobante de pago.');
            return;
        }

        setIsLoading(true);

        // Concatenate address details
        const finalAddress = formData.address_details
            ? `${formData.shipping_address} (${formData.address_details})`
            : formData.shipping_address;

        const data = new FormData();
        data.append('shipping_address', finalAddress);
        data.append('city', formData.city);
        data.append('department', formData.department);
        data.append('phone', formData.phone);
        if (paymentProof) {
            data.append('payment_proof', paymentProof);
        }

        try {
            await api.post('/orders', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            await clearCart();
            toast.success('¡Pedido creado exitosamente!');
            navigate('/my-orders');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al procesar el pedido.');
            toast.error('Error al procesar el pedido.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!cart || cart.items.length === 0) {
        return (
            <div className="empty-cart">
                <Logo className="empty-cart-logo" />
                <h2 className="empty-cart-title">Tu carrito está vacío</h2>
                <button
                    onClick={() => navigate('/')}
                    className="empty-cart-button"
                >
                    Volver a la tienda
                </button>
            </div>
        );
    }

    return (
        <>
        <div className="checkout-container">
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

            <div className="checkout-content">
                {/* Header with Logo */}
                <div className="checkout-header">
                    <Logo className="checkout-logo" />
                    <div>
                        <h1 className="checkout-title">Finalizar Compra</h1>
                        <p className="checkout-subtitle">Completa tus datos para el envío</p>
                    </div>
                </div>

                <div className="back-button-container">
                    <button
                        onClick={() => navigate('/')}
                        className="back-button"
                    >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="checkout-form">

                        {/* 1. Shipping Details */}
                        <div className="checkout-card shipping">
                            <div className="card-header">
                                <h2 className="card-title">
                                    <span className="card-number">1</span>
                                    Datos de Envío
                                </h2>
                            </div>

                            <div className="form-content">
                                <div className="form-grid">
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Dirección Principal</label>
                                        <input
                                            type="text"
                                            name="shipping_address"
                                            value={formData.shipping_address}
                                            onChange={handleChange}
                                            required
                                            className="form-input"
                                            placeholder="Ej: Calle 123 # 45-67"
                                        />
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Detalles (Torre, Apto, Barrio)</label>
                                        <input
                                            type="text"
                                            name="address_details"
                                            value={formData.address_details}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="Ej: Torre 2 Apto 405, Barrio El Recreo"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Ciudad</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                            className="form-input"
                                            placeholder="Ej: Bogotá"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Departamento</label>
                                        <input
                                            type="text"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            required
                                            className="form-input"
                                            placeholder="Ej: Cundinamarca"
                                        />
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Teléfono de Contacto</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            className="form-input"
                                            placeholder="Ej: 300 123 4567"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Order Summary */}
                        <div className="checkout-card summary">
                            <div className="checkout-header">
                                <h2 className="card-title">
                                    <span className="card-number summary">2</span>
                                    Resumen del Pedido
                                </h2>
                                {/* Button to clear cart if prices are wrong */}
                                <button
                                    onClick={() => {
                                        clearCartWithMessage();
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        padding: '8px 16px',
                                        backgroundColor: '#ff4d8d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    🔄 Limpiar Carrito
                                </button>
                            </div>

                            <div className="order-items">
                                {cart.items.map((item) => {
                                    // Calculate price like in OrderController
                                    let itemPrice = item.unit_price ? parseFloat(String(item.unit_price)) : 0;
                                    
                                    // If unit_price is available, use it (this should be the correct price from backend)
                                    if (itemPrice && itemPrice > 0) {
                                        // Using unit_price from CartItem - this is the correct price!
                                    } else if (item.product.price) {
                                        itemPrice = parseFloat(String(item.product.price));
                                        // Using product.price
                                    } else if (item.product.base_price) {
                                        // Calculate from base_price + markup
                                        const basePrice = parseFloat(String(item.product.base_price)) || 0;
                                        const markup = parseFloat(String(item.product.markup)) || 0;
                                        const markupType = item.product.markup_type || 'percentage';
                                        
                                        if (markupType === 'percentage') {
                                            itemPrice = basePrice * (1 + markup / 100);
                                        } else {
                                            itemPrice = basePrice + markup;
                                        }
                                        
                                        // Add priceDelta from variants if available
                                        if (item.variants && Array.isArray(item.variants)) {
                                            const priceDelta = item.variants.reduce((total: number, variant: any) => {
                                                return total + (parseFloat(String(variant.priceDelta)) || 0);
                                            }, 0);
                                            itemPrice += priceDelta;
                                        }
                                    }
                                    
                                    // If still 0, the product has no pricing data configured
                                    if (!itemPrice) {
                                        itemPrice = 0;
                                    }
                                    
                                    return (
                                    <div key={item.id} className="order-item">
                                        <div className="item-image">
                                            {item.product.image ? (
                                                <img src={getStorageUrl(item.product.image) || ''} alt={item.product.name} />
                                            ) : (
                                                <div className="placeholder">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="item-details">
                                            <h4 className="item-name">{item.product.name}</h4>
                                            <div className="item-meta">
                                                <span className="item-quantity">x{item.quantity}</span>
                                                <span className="item-price">
                                                    ${(Number(itemPrice) * item.quantity).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>

                            <div className="order-total">
                                <div className="total-row">
                                    <span>Subtotal</span>
                                    <span>${cartTotal.toLocaleString()}</span>
                                </div>
                                <div className="total-row">
                                    <span>Envío (Fijo)</span>
                                    <span>${shippingCost.toLocaleString()}</span>
                                </div>
                                <div className="total-row final">
                                    <span>Total</span>
                                    <span className="amount">${total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Payment */}
                        <div className="checkout-card payment">
                            <h2 className="card-title">
                                <span className="card-number payment">3</span>
                                Pago
                            </h2>

                            <div className="payment-qr">
                                <p className="payment-text">
                                    Escanea el QR para pagar
                                </p>

                                <div className="qr-container">
                                    <img
                                        src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Bancolombia-Ahorros-123456789"
                                        alt="Pago QR"
                                    />
                                </div>
                                <div className="payment-info">
                                    <p className="payment-bank">Bancolombia Ahorros</p>
                                    <p className="payment-account">123-456789-00</p>
                                </div>
                            </div>

                            <div className="file-upload-section">
                                <label className="file-upload-label">Subir Comprobante (Requerido)</label>

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="file-upload-area"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf"
                                    />
                                    <div className="file-upload-icon">
                                        {paymentProof ? (
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        )}
                                    </div>
                                    <div className="file-upload-text">
                                        <p className="file-upload-name">
                                            {paymentProof ? paymentProof.name : 'Seleccionar Archivo'}
                                        </p>
                                        <p className="file-upload-hint">JPG, PNG o PDF</p>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !paymentProof}
                                className="submit-button"
                            >
                                {isLoading ? 'Procesando...' : `Confirmar Pedido ($${total.toLocaleString()})`}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}
