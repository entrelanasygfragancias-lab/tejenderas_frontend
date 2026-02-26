import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { getStorageUrl } from '../utils/imageUrl';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleCheckout = () => {
        // Implement checkout logic here or navigate to checkout page
        // For now, we'll just simulate a process or navigate if we had a page
        // But per plan, we might do a simple checkout here or a separate page.
        // Let's create a Checkout page later. For now, just navigate there.
        navigate('/checkout');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-99999 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slideInRight border-l-8 border-graphite">
                <div className="p-6 bg-graphite text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute -right-12 -top-12 w-32 h-32 bg-pink-hot rounded-full opacity-20"></div>
                    <div className="absolute -left-10 bottom-0 w-24 h-24 bg-teal rounded-full opacity-20"></div>
                    <div className="relative">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/70">Tu carrito</p>
                        <h2 className="text-2xl font-black uppercase tracking-widest">Resumen de compra</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-pink-hot transition relative">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/60">
                    {cart?.items && cart.items.length > 0 ? (
                        cart.items.map((item) => (
                            <div key={item.id} className="flex gap-4 rounded-2xl bg-white p-4 border-2 border-gray-100 shadow-sm">
                                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                                    {item.product.image ? (
                                        <img
                                            src={getStorageUrl(item.product.image) || ''}
                                            alt={item.product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-graphite text-base leading-snug line-clamp-2">{item.product.name}</h3>
                                    <p className="text-pink-hot font-black text-lg">${parseFloat(String(item.unit_price || item.product.price)).toLocaleString()}</p>

                                    {item.variants && item.variants.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {item.variants.map((v, i) => (
                                                <span key={i} className="text-[10px] font-black uppercase tracking-tighter bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                                                    {v.option}: {v.value}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mt-3">
                                        <button
                                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                            className="w-10 h-10 rounded-full bg-white text-graphite font-black hover:bg-graphite hover:text-white border-2 border-graphite shadow-[2px_2px_0px_0px_rgba(51,51,51,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition"
                                        >-</button>
                                        <span className="font-black w-10 text-center text-graphite bg-gray-50 border-2 border-gray-200 rounded-full py-1">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-10 h-10 rounded-full bg-lime text-graphite font-black hover:bg-graphite hover:text-white border-2 border-graphite shadow-[2px_2px_0px_0px_rgba(51,51,51,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition"
                                        >+</button>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="ml-auto text-red-500 hover:text-red-700 text-sm font-black uppercase tracking-wider"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 text-gray-400">
                            <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            <p className="font-bold text-xl">Tu carrito está vacío</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t-4 border-graphite">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-base font-bold text-gray-500 uppercase tracking-widest">Subtotal</span>
                        <span className="text-xl font-black text-graphite">${cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-base font-bold text-gray-500 uppercase tracking-widest">Envío fijo</span>
                        <span className="text-xl font-black text-graphite">$15,000</span>
                    </div>
                    <div className="flex justify-between items-center mb-6 pt-4 border-t-2 border-gray-200">
                        <span className="text-xl font-black text-graphite uppercase tracking-widest">Total</span>
                        <span className="text-3xl font-black text-pink-hot">${(cartTotal + 15000).toLocaleString()}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={!cart?.items?.length}
                        className="w-full py-4 bg-teal hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl border-4 border-graphite shadow-[6px_6px_0px_0px_rgba(51,51,51,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Proceder al Pago
                    </button>
                </div>
            </div>
        </div>
    );
}
