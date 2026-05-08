import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Tag
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

const ProductModal = ({ productId, storeOwnerId, isOpen, onClose }) => {
  const { token, API } = useAuth();
  const { isDark } = useTheme();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (isOpen && storeOwnerId) {
      loadProduct();
    }
  }, [isOpen, productId, storeOwnerId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      // Buscar produtos da loja
      const response = await axios.get(
        `${API}/catalog/${storeOwnerId}/products`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Se tem productId específico, busca ele, senão pega o primeiro
      const products = response.data.products || [];
      const productData = productId 
        ? products.find(p => p.id === productId)
        : products[0];
      
      setProduct(productData);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      
      await axios.post(
        `${API}/cart/add`,
        {
          product_id: product.id,
          quantity: quantity,
          store_owner_id: storeOwnerId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('✅ Produto adicionado ao carrinho!', {
        description: `${quantity}x ${product.name}`
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.detail || 'Erro ao adicionar ao carrinho');
    } finally {
      setAddingToCart(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`relative w-full sm:max-w-lg sm:mx-4 max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-[#2A3618]' : 'bg-white'
        } rounded-t-2xl sm:rounded-2xl`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
              isDark ? 'border-[#005B9C]' : 'border-[#005B9C]'
            }`}></div>
          </div>
        ) : product ? (
          <>
            {/* Header */}
            <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b backdrop-blur-sm bg-opacity-90 ${
              isDark ? 'border-[#556B2F] bg-[#2A3618]' : 'border-gray-200 bg-white'
            }`}>
              <div className="flex items-center gap-2">
                <ShoppingCart className={isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'} size={24} />
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                  Detalhes do Produto
                </h3>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-full ${
                  isDark ? 'hover:bg-[#556B2F]' : 'hover:bg-gray-100'
                }`}
              >
                <X className={isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'} size={20} />
              </button>
            </div>

            {/* Product Image */}
            {product.images?.[0] && (
              <div className="relative w-full aspect-square bg-gray-100">
                <img 
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.discount_percentage > 0 && (
                  <Badge className="absolute top-4 left-4 bg-red-500 text-white font-bold">
                    -{product.discount_percentage}%
                  </Badge>
                )}
              </div>
            )}

            {/* Product Info */}
            <div className="p-4 space-y-4">
              {/* Title and Price */}
              <div>
                <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                  {product.name}
                </h2>
                <div className="flex items-center gap-3">
                  {product.discount_percentage > 0 ? (
                    <>
                      <span className={`text-2xl font-bold ${isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'}`}>
                        R$ {product.discounted_price?.toFixed(2)}
                      </span>
                      <span className={`text-sm line-through ${isDark ? 'text-[#E5C34A]' : 'text-gray-500'}`}>
                        R$ {product.price?.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className={`text-2xl font-bold ${isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'}`}>
                      R$ {product.price?.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              {product.category && (
                <div className="flex items-center gap-2">
                  <Tag size={16} className={isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'} />
                  <span className={`text-sm ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                    {product.category}
                  </span>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div>
                  <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                    Descrição
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}`}>
                    {product.description}
                  </p>
                </div>
              )}

              {/* Stock */}
              {product.stock !== undefined && (
                <div className={`flex items-center gap-2 ${
                  product.stock > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    product.stock > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {product.stock > 0 ? `${product.stock} disponíveis` : 'Esgotado'}
                  </span>
                </div>
              )}

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div>
                  <label className={`text-sm font-semibold mb-2 block ${
                    isDark ? 'text-white' : 'text-[#333333]'
                  }`}>
                    Quantidade
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className={`p-2 rounded-full ${
                        isDark
                          ? 'bg-[#556B2F] hover:bg-[#6B8239] disabled:opacity-50'
                          : 'bg-gray-200 hover:bg-gray-300 disabled:opacity-50'
                      }`}
                    >
                      <Minus size={16} className={isDark ? 'text-white' : 'text-gray-700'} />
                    </button>
                    
                    <span className={`text-xl font-bold min-w-[40px] text-center ${
                      isDark ? 'text-white' : 'text-[#333333]'
                    }`}>
                      {quantity}
                    </span>
                    
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className={`p-2 rounded-full ${
                        isDark
                          ? 'bg-[#556B2F] hover:bg-[#6B8239] disabled:opacity-50'
                          : 'bg-gray-200 hover:bg-gray-300 disabled:opacity-50'
                      }`}
                    >
                      <Plus size={16} className={isDark ? 'text-white' : 'text-gray-700'} />
                    </button>
                  </div>
                </div>
              )}

              {/* Total */}
              {product.stock > 0 && (
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark ? 'bg-[#3F5123]' : 'bg-gray-100'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#333333]'}`}>
                    Total:
                  </span>
                  <span className={`text-xl font-bold ${
                    isDark ? 'text-[#005B9C]' : 'text-[#005B9C]'
                  }`}>
                    R$ {((product.discounted_price || product.price) * quantity).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock <= 0}
                className={`w-full ${
                  isDark
                    ? 'bg-[#005B9C] text-[#2A3618] hover:bg-[#E5C34A]'
                    : 'bg-[#005B9C] text-white hover:bg-[#005B9C]'
                } disabled:opacity-50`}
              >
                {addingToCart ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adicionando...
                  </>
                ) : product.stock <= 0 ? (
                  'Produto Esgotado'
                ) : (
                  <>
                    <ShoppingCart size={20} className="mr-2" />
                    Adicionar ao Carrinho
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className={isDark ? 'text-[#E5C34A]' : 'text-[#005B9C]'}>
              Produto não encontrado
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductModal;
