import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/mockBackend';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, AlertTriangle, ShoppingBag, Smartphone, QrCode } from 'lucide-react';

const Checkout = () => {
  const { items, cartTotal, clearCart, syncStock } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState<string[]>([]);

  // UPI Payment State
  const [upiId, setUpiId] = useState('');

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <ShoppingBag className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 hover:underline">
          Go back to shopping
        </button>
      </div>
    );
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Basic UPI Validation
    if (!upiId.includes('@')) {
        setError("Please enter a valid UPI ID (e.g., user@bank)");
        return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate backend interaction
      const result = await mockBackend.checkout(user.id, items);

      if (result.success) {
        setSuccess(true);
        clearCart();
      } else {
        // Concurrency handling: Backend says some items are gone!
        setError(result.message);
        if (result.outOfStockItems) {
            setOutOfStockItems(result.outOfStockItems);
            // Automatically clean up cart for user after short delay or immediately
            syncStock(result.outOfStockItems); 
        }
      }
    } catch (err) {
      setError("An unexpected system error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-lg text-center border border-green-100">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
        <p className="text-slate-500 mb-6">Your order has been placed successfully via UPI.</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Order Summary */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-start">
                 <div className="flex gap-3">
                   <div className="w-16 h-16 bg-slate-100 rounded-md overflow-hidden">
                     <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover"/>
                   </div>
                   <div>
                     <p className="font-medium text-slate-900 line-clamp-1">{item.name}</p>
                     <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                     {outOfStockItems.includes(item.id) && (
                         <span className="text-xs text-red-600 font-bold">Removed: Out of Stock</span>
                     )}
                   </div>
                 </div>
                 <p className="font-medium text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between items-center">
             <span className="font-bold text-lg">Total</span>
             <span className="font-bold text-2xl text-indigo-600">${cartTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">UPI Payment</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          
          {error && (
            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg mb-6 border border-indigo-100">
             <div className="bg-indigo-100 p-2 rounded-full">
                <QrCode className="w-6 h-6 text-indigo-600" />
             </div>
             <div>
                <h3 className="font-semibold text-indigo-900">Unified Payments Interface</h3>
                <p className="text-xs text-indigo-700">Pay securely using any UPI app</p>
             </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Enter UPI ID</label>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="username@bank / mobile@app"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                />
                <Smartphone className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 mt-1 ml-1">Examples: 9876543210@paytm, john@oksbi</p>
            </div>
            
            <button 
              type="submit" 
              disabled={isProcessing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex justify-center items-center gap-2 mt-4"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Pay ${cartTotal.toFixed(2)}
                </>
              )}
            </button>
            <p className="text-xs text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Payments are secure and encrypted.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;