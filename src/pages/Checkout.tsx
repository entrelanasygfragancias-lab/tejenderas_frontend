import { useState, useEffect, type FormEvent, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';
import { getStorageUrl } from '../utils/imageUrl';

export default function Checkout() {
    const { cart, cartTotal, clearCart } = useCart();
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
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Logo className="w-32 h-32 mb-6" />
                <h2 className="text-3xl font-black text-graphite mb-4 uppercase tracking-tighter">Tu carrito está vacío</h2>
                <button
                    onClick={() => navigate('/')}
                    className="px-10 py-4 bg-pink-hot text-white font-black rounded-2xl uppercase tracking-widest hover:bg-graphite transition-all shadow-lg"
                >
                    Volver a la tienda
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex justify-center relative overflow-hidden">
            {/* Animated Background Icons */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
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

            <div className="w-full max-w-2xl relative z-10">
                {/* Header with Logo */}
                <div className="flex flex-col items-center gap-4 mb-10 text-center">
                    <Logo className="w-24 h-24 shadow-[6px_6px_0px_0px_rgba(254,97,150,1)] rounded-full p-2 border-4 border-graphite" />
                    <div>
                        <h1 className="text-4xl font-black text-graphite uppercase tracking-tighter leading-none">Finalizar Compra</h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-2">Completa tus datos para el envío</p>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => navigate('/')}
                        className="absolute -top-32 left-0 md:-left-20 bg-white hover:bg-pink-hot hover:text-white text-graphite font-black p-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center border-2 border-graphite"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. Shipping Details */}
                        <div className="bg-white p-8 rounded-4xl shadow-2xl border-4 border-graphite relative overflow-hidden group hover:border-pink-hot transition-colors duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal rounded-full filter blur-[60px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>

                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <h2 className="text-2xl font-black text-graphite uppercase tracking-wide flex items-center gap-3">
                                    <span className="w-10 h-10 bg-teal text-white rounded-xl flex items-center justify-center text-lg shadow-[4px_4px_0px_0px_rgba(51,51,51,1)]">1</span>
                                    Datos de Envío
                                </h2>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Dirección Principal</label>
                                        <input
                                            type="text"
                                            name="shipping_address"
                                            value={formData.shipping_address}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-pink-hot focus:ring-0 outline-none transition font-bold text-graphite placeholder-gray-300 bg-gray-50/50"
                                            placeholder="Ej: Calle 123 # 45-67"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Detalles (Torre, Apto, Barrio)</label>
                                        <input
                                            type="text"
                                            name="address_details"
                                            value={formData.address_details}
                                            onChange={handleChange}
                                            className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-pink-hot focus:ring-0 outline-none transition font-bold text-graphite placeholder-gray-300 bg-gray-50/50"
                                            placeholder="Ej: Torre 2 Apto 405, Barrio El Recreo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ciudad</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-pink-hot focus:ring-0 outline-none transition font-bold text-graphite placeholder-gray-300 bg-gray-50/50"
                                            placeholder="Ej: Bogotá"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Departamento</label>
                                        <input
                                            type="text"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-pink-hot focus:ring-0 outline-none transition font-bold text-graphite placeholder-gray-300 bg-gray-50/50"
                                            placeholder="Ej: Cundinamarca"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Teléfono de Contacto</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-pink-hot focus:ring-0 outline-none transition font-bold text-graphite placeholder-gray-300 bg-gray-50/50"
                                            placeholder="Ej: 300 123 4567"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Order Summary */}
                        <div className="bg-white p-8 rounded-4xl shadow-2xl border-4 border-graphite relative overflow-hidden group hover:border-lime transition-colors duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-lime rounded-full filter blur-[60px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>

                            <h2 className="text-2xl font-black text-graphite mb-6 uppercase tracking-wide flex items-center gap-3 relative z-10">
                                <span className="w-10 h-10 bg-lime text-graphite rounded-xl flex items-center justify-center text-lg shadow-[4px_4px_0px_0px_rgba(51,51,51,1)]">2</span>
                                Resumen del Pedido
                            </h2>

                            <div className="space-y-5 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                {cart.items.map((item) => (
                                    <div key={item.id} className="flex gap-4 items-center bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0 border-2 border-gray-200">
                                            {item.product.image ? (
                                                <img src={getStorageUrl(item.product.image) || ''} alt={item.product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-graphite text-base leading-snug line-clamp-2">{item.product.name}</h4>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-gray-500 font-black uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-full border border-gray-200">x{item.quantity}</span>
                                                <span className="font-black text-pink-hot text-base">${(parseFloat(item.product.price) * item.quantity).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-graphite p-6 rounded-2xl space-y-2 relative z-10 text-white shadow-lg">
                                <div className="flex justify-between text-gray-300 font-medium text-sm">
                                    <span>Subtotal</span>
                                    <span>${cartTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-300 font-medium text-sm">
                                    <span>Envío (Fijo)</span>
                                    <span>${shippingCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black pt-3 border-t border-gray-700 mt-2">
                                    <span>Total</span>
                                    <span className="text-lime">${total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Payment */}
                        <div className="bg-white p-8 rounded-4xl shadow-2xl border-4 border-graphite relative overflow-hidden group hover:border-pink-hot transition-colors duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-hot rounded-full filter blur-[60px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>

                            <h2 className="text-2xl font-black text-graphite mb-8 uppercase tracking-wide flex items-center gap-3 relative z-10">
                                <span className="w-10 h-10 bg-pink-hot text-white rounded-xl flex items-center justify-center text-lg shadow-[4px_4px_0px_0px_rgba(51,51,51,1)]">3</span>
                                Pago
                            </h2>

                            <div className="flex flex-col items-center mb-8 relative z-10">
                                <p className="text-gray-500 font-bold mb-6 text-center max-w-sm text-sm uppercase tracking-wider">
                                    Escanea el QR para pagar
                                </p>

                                <div className="w-56 h-56 bg-white border-4 border-graphite rounded-3xl flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_rgba(51,51,51,1)] p-4 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                                    <img
                                        src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Bancolombia-Ahorros-123456789"
                                        alt="Pago QR"
                                        className="w-full h-full object-contain opacity-90"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-graphite text-lg">Bancolombia Ahorros</p>
                                    <p className="text-xl font-black text-pink-hot tracking-widest bg-pink-50 px-4 py-1 rounded-lg mt-1 inline-block">123-456789-00</p>
                                </div>
                            </div>

                            <div className="border-t-2 border-gray-100 pt-8 relative z-10">
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Subir Comprobante (Requerido)</label>

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-4 border-dashed border-gray-200 rounded-3xl p-8 hover:bg-gray-50 hover:border-pink-hot transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group bg-white"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept="image/*,.pdf"
                                    />
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-pink-hot group-hover:text-white transition-all text-gray-400 shadow-sm group-hover:scale-110 duration-300">
                                        {paymentProof ? (
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-lg text-graphite group-hover:text-pink-hot transition">
                                            {paymentProof ? paymentProof.name : 'Seleccionar Archivo'}
                                        </p>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">JPG, PNG o PDF</p>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r font-bold text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !paymentProof}
                                className="w-full py-5 bg-teal hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl border-4 border-graphite shadow-[8px_8px_0px_0px_rgba(51,51,51,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-10 text-xl"
                            >
                                {isLoading ? 'Procesando...' : `Confirmar Pedido ($${total.toLocaleString()})`}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
