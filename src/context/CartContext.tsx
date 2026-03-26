import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

interface Product {
    id: number;
    name: string;
    price: string | number | null;
    description: string;
    image: string | null;
    base_price?: number;
    markup?: number;
    markup_type?: string;
}

interface CartItemVariant {
    option: string;
    value: string;
    priceDelta: number;
}

interface CartItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: string | number;
    variants: CartItemVariant[] | null;
    product: Product;
}

interface Cart {
    id: number;
    user_id: number;
    items: CartItem[];
}

interface CartContextType {
    cart: Cart | null;
    isLoading: boolean;
    addToCart: (productId: number, quantity: number, unitPrice?: number, variants?: CartItemVariant[]) => Promise<void>;
    updateQuantity: (itemId: number, quantity: number) => Promise<void>;
    removeFromCart: (itemId: number) => Promise<void>;
    clearCart: () => Promise<void>;
    clearCartWithMessage: () => Promise<void>;
    cartCount: number;
    cartTotal: number;
    fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<Cart | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    const fetchCart = async () => {
        if (!user) {
            setCart(null);
            return;
        }

        try {
            const response = await api.get('/cart');
            setCart(response.data);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [user]);

    const addToCart = async (productId: number, quantity: number, unitPrice?: number, variants?: CartItemVariant[]) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await api.post('/cart', {
                product_id: productId,
                quantity,
                unit_price: unitPrice,
                variants: variants
            });
            setCart(response.data);
        } catch (error) {
            console.error('Error adding to cart:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuantity = async (itemId: number, quantity: number) => {
        if (!user || !cart) return;

        // 1. Optimistic Update
        const originalCart = { ...cart }; // Create a shallow copy to revert on error
        const updatedItems = cart.items.map(item =>
            item.id === itemId ? { ...item, quantity } : item
        );
        const updatedCart = { ...cart, items: updatedItems };

        setCart(updatedCart); // Update UI immediately

        try {
            // 2. Background API Call
            // We do NOT await this promise to block the UI, but we catch errors to revert
            await api.put(`/cart/${itemId}`, { quantity });

            // Optionally, we could fetchCart here to ensure sync, 
            // but for speed we rely on the optimistic update.
            // A background revalidation could be debounced if strictly necessary.
        } catch (error) {
            console.error('Error updating quantity:', error);
            setCart(originalCart); // Revert to original state on failure
            // toast.error('Error updating quantity'); // Optional: Add toast if you have it imported
        }
    };

    const removeFromCart = async (itemId: number) => {
        if (!user) return;
        try {
            await api.delete(`/cart/${itemId}`);
            await fetchCart();
        } catch (error) {
            console.error('Error removing from cart:', error);
            throw error;
        }
    };

    const clearCart = async () => {
        if (!user) return;
        try {
            await api.delete('/cart');
            setCart(null); // Or fetch empty cart
            await fetchCart();
            console.log('Cart cleared - please add items again to apply price fixes');
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw error;
        }
    };

    // Add function to clear cart and show message
    const clearCartWithMessage = async () => {
        if (!user) return;
        if (confirm('El carrito contiene datos antiguos. ¿Deseas limpiarlo y agregar los productos nuevamente para aplicar las correcciones de precios?')) {
            await clearCart();
            alert('Carrito limpiado. Por favor agrega los productos nuevamente para ver los precios correctos.');
        }
    };

    const cartCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

    const cartTotal = cart?.items?.reduce((total, item) => {
        // Try unit_price first, then product price, then calculate from base_price + markup
        let price = item.unit_price ? parseFloat(String(item.unit_price)) : 0;
        
        // If unit_price is available, use it (this should be the correct price from backend)
        if (price && price > 0) {
            // Using unit_price from CartItem - this is the correct price!
        } else if (item.product.price) {
            price = parseFloat(String(item.product.price));
            // Using product.price
        }
        
        // If still no price, try to calculate from base_price + markup
        if (!price && item.product.base_price) {
            const basePrice = parseFloat(String(item.product.base_price)) || 0;
            const markup = parseFloat(String(item.product.markup)) || 0;
            const markupType = item.product.markup_type || 'percentage';
            
            if (markupType === 'percentage') {
                price = basePrice * (1 + markup / 100);
            } else {
                price = basePrice + markup;
            }
            
            // Add priceDelta from variants if available
            if (item.variants && Array.isArray(item.variants)) {
                const priceDelta = item.variants.reduce((total: number, variant: any) => {
                    return total + (parseFloat(String(variant.priceDelta)) || 0);
                }, 0);
                price += priceDelta;
            }
        }
        
        // If still 0, the product has no pricing data configured
        if (!price) {
            price = 0;
        }
        
        return total + (item.quantity * price);
    }, 0) || 0;

    return (
        <CartContext.Provider value={{
            cart,
            isLoading,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            clearCartWithMessage,
            cartCount,
            cartTotal,
            fetchCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
