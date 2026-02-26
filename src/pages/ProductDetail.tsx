import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { formatCurrency } from '../utils/format';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { getStorageUrl } from '../utils/imageUrl';

interface AttributeValue {
  id: number;
  name: string;
  price_delta: string | number;
  image: string | null;
  attribute_id: number;
}

interface Attribute {
  id: number;
  name: string;
  values: AttributeValue[];
}

interface Product {
  id: number;
  name: string;
  barcode: string;
  description?: string | null;
  price: number;
  image?: string | null;
  attributes: Attribute[];
  attribute_values: AttributeValue[];
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/admin/products/${id}`);
        setProduct(data);

        // Set default selections
        const initialSelected: Record<number, number> = {};
        data.attributes?.forEach((attr: Attribute) => {
          const firstVal = data.attribute_values.find((bv: AttributeValue) => bv.attribute_id === attr.id);
          if (firstVal) {
            initialSelected[attr.id] = firstVal.id;
          }
        });
        setSelected(initialSelected);
      } catch (e) {
        setError('No se pudo cargar el producto');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const deltas = useMemo(() => {
    if (!product) return 0;
    return Object.values(selected).reduce((sum, valId) => {
      const val = product.attribute_values.find(v => v.id === valId);
      if (!val) return sum;
      const delta = parseFloat(String(val.price_delta || '0').replace(',', '.'));
      return sum + (isNaN(delta) ? 0 : delta);
    }, 0);
  }, [product, selected]);

  const finalPrice = useMemo(() => {
    const base = product?.price ?? 0;
    return base + deltas;
  }, [product?.price, deltas]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      const selectedVariants = Object.entries(selected).map(([attrId, valId]) => {
        const attr = product.attributes.find(a => a.id === Number(attrId));
        const val = product.attribute_values.find(v => v.id === valId);
        return {
          option: attr?.name || 'Opción',
          value: val?.name || 'Valor',
          priceDelta: parseFloat(String(val?.price_delta || '0').replace(',', '.'))
        };
      });

      await addToCart(product.id, 1, finalPrice, selectedVariants);
      toast.success('¡Producto agregado al carrito!');
    } catch (error) {
      toast.error('Error al agregar al carrito');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-graphite font-bold">Cargando...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-red-600 font-bold">{error || 'Producto no encontrado'}</p>
      </div>
    );
  }

  const imageUrl = getStorageUrl(product.image);
  const selectedVariantImage = Object.values(selected).reduce<string | null>((acc, valId) => {
    if (acc) return acc;
    const val = product.attribute_values.find(v => v.id === valId);
    return getStorageUrl(val?.image);
  }, null);

  const displayImage = selectedVariantImage || imageUrl;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-4">
        <Link to="/" className="text-pink-hot font-bold transition-all hover:translate-x-1">← Volver</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border-4 border-graphite rounded-2xl overflow-hidden bg-white shadow-[12px_12px_0px_0px_#333] flex items-center justify-center aspect-square">
          {displayImage ? (
            <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400 font-bold text-lg uppercase tracking-widest">Sin imagen</div>
          )}
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-black text-graphite mb-2 uppercase tracking-tight leading-none">{product.name}</h1>
            <p className="text-gray-500 font-mono text-sm">{product.barcode}</p>
          </div>

          {product.description && (
            <div className="border-l-4 border-pink-hot pl-4 py-1">
              <p className="text-graphite leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.attributes && product.attributes.length > 0 && (
            <div className="space-y-4 pt-4 border-t-2 border-dashed border-gray-200">
              {product.attributes.map((attr) => {
                const attrValues = product.attribute_values.filter(v => v.attribute_id === attr.id);
                if (attrValues.length === 0) return null;
                return (
                  <div key={attr.id} className="space-y-2">
                    <label className="block text-xs font-black text-graphite uppercase tracking-widest">{attr.name}</label>
                    <div className="flex flex-wrap gap-2">
                      {attrValues.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelected(prev => ({ ...prev, [attr.id]: v.id }))}
                          className={`px-4 py-2 border-2 rounded-xl font-bold transition-all ${selected[attr.id] === v.id ? 'bg-pink-hot text-white border-pink-hot shadow-[2px_2px_0px_0px_#333]' : 'bg-white text-graphite border-graphite hover:border-pink-hot/50 hover:bg-pink-hot/5'}`}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-6 border-t-4 border-pink-hot">
            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-500 font-bold uppercase text-xs">Precio Final</span>
              <span className="text-4xl font-black text-graphite">{formatCurrency(finalPrice)}</span>
            </div>
            <button
              onClick={handleAddToCart}
              className="w-full py-4 bg-teal hover:bg-teal-600 text-white font-black text-xl rounded-2xl border-4 border-graphite shadow-[8px_8px_0px_0px_#333] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-2 active:translate-y-2">
              AGREGAR AL CARRITO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
