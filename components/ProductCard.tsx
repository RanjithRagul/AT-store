import React from 'react';
import { Plus, Check } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAdd = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    addToCart(product);
  };

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="group flex flex-col gap-3 cursor-pointer">
      {/* Thumbnail Area */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
        />
        
        {/* Overlays */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <span className="bg-slate-900/90 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Sold Out
            </span>
          </div>
        )}
        
        {isLowStock && !isOutOfStock && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
               {product.stock} left
            </span>
          </div>
        )}
      </div>

      {/* Details Area */}
      <div className="flex flex-col pr-2">
        <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h3>
        
        <div className="text-sm text-slate-500 flex items-center gap-1">
          <span>{product.category}</span>
          {product.description && (
             <>
               <span>•</span>
               <span className="truncate max-w-[150px]">{product.description}</span>
             </>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-slate-900 font-bold">
            ${product.price.toFixed(2)}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAdd();
            }}
            disabled={isOutOfStock}
            className={`p-1.5 rounded-full transition-all duration-200
              ${isOutOfStock 
                ? 'bg-slate-100 text-slate-400 opacity-0' 
                : 'bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white opacity-0 group-hover:opacity-100'
              }`}
            title="Add to cart"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;