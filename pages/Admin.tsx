import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { mockBackend } from '../services/mockBackend';
import { generateProductDescription } from '../services/geminiService';
import { Trash2, Edit2, Plus, Sparkles, Loader2, Save, X } from 'lucide-react';

const Admin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Product Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    category: '',
    description: ''
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  const refresh = async () => {
    setLoading(true);
    const data = await mockBackend.getProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleGenerateDescription = async () => {
    if (!newProduct.name || !newProduct.category) {
      alert('Please enter a name and category first.');
      return;
    }
    setIsGeneratingAI(true);
    const desc = await generateProductDescription(newProduct.name, newProduct.category);
    setNewProduct(prev => ({ ...prev, description: desc }));
    setIsGeneratingAI(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    
    await mockBackend.addProduct({
      name: newProduct.name!,
      description: newProduct.description || '',
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      category: newProduct.category || 'General',
    });
    
    setIsAdding(false);
    setNewProduct({ name: '', price: 0, stock: 0, category: '', description: '' });
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this product?')) {
      await mockBackend.deleteProduct(id);
      refresh();
    }
  };

  const startEdit = (product: Product) => {
    setEditId(product.id);
    setEditPrice(product.price);
  };

  const saveEdit = async (id: string) => {
    await mockBackend.updatePrice(id, editPrice);
    setEditId(null);
    refresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Add Product Modal/Form Area */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">New Product</h2>
              <button onClick={() => setIsAdding(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700">Price</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700">Stock</label>
                  <input 
                    type="number" 
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                    value={newProduct.stock}
                    onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="block text-sm font-medium text-slate-700">Description</label>
                   <button 
                    type="button" 
                    onClick={handleGenerateDescription}
                    className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline"
                    disabled={isGeneratingAI}
                   >
                     {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                     Generate with AI
                   </button>
                </div>
                <textarea 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                  rows={3}
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Product List Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600"/></td></tr>
              ) : products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-md object-cover" src={product.imageUrl} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{product.name}</div>
                        <div className="text-sm text-slate-500">{product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.stock} left
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {editId === product.id ? (
                      <div className="flex items-center gap-2">
                         <input 
                           type="number" 
                           className="w-20 border rounded px-1"
                           value={editPrice}
                           onChange={(e) => setEditPrice(parseFloat(e.target.value))}
                         />
                         <button onClick={() => saveEdit(product.id)} className="text-green-600"><Save className="w-4 h-4"/></button>
                         <button onClick={() => setEditId(null)} className="text-red-600"><X className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      `$${product.price.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editId !== product.id && (
                      <div className="flex justify-end gap-3">
                        <button onClick={() => startEdit(product)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;