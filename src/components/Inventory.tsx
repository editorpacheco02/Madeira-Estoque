import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface InventoryProps {
  products: Product[];
  onAddProduct: (p: Omit<Product, 'id' | 'createdAt'>) => void;
  onUpdateStock: (id: string, type: 'in' | 'out', quantity: number, reason: string) => void;
  onDeleteProduct: (id: string) => void;
}

export default function Inventory({ products, onAddProduct, onUpdateStock, onDeleteProduct }: InventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<{ id: string; type: 'in' | 'out' } | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Buscar por nome ou SKU..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-bottom border-zinc-200">
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Produto</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">SKU</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Categoria</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 text-center">Estoque</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900">{p.name}</span>
                        <span className="text-xs text-zinc-500">R$ {p.price.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 font-mono text-sm">{p.sku}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-xs font-medium uppercase">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold ${p.quantity <= p.minQuantity ? 'text-red-600' : 'text-zinc-900'}`}>
                          {p.quantity}
                        </span>
                        {p.quantity <= p.minQuantity && (
                          <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                            <AlertCircle className="w-3 h-3" /> Estoque Baixo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setShowStockModal({ id: p.id, type: 'in' })}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Entrada"
                        >
                          <ArrowUpCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setShowStockModal({ id: p.id, type: 'out' })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Saída"
                        >
                          <ArrowDownCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddProductModal 
          onClose={() => setShowAddModal(false)} 
          onSubmit={(p) => {
            onAddProduct(p);
            setShowAddModal(false);
          }} 
        />
      )}

      {showStockModal && (
        <StockUpdateModal 
          type={showStockModal.type}
          onClose={() => setShowStockModal(null)}
          onSubmit={(qty, reason) => {
            onUpdateStock(showStockModal.id, showStockModal.type, qty, reason);
            setShowStockModal(null);
          }}
        />
      )}
    </div>
  );
}

function AddProductModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (p: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    minQuantity: 5,
    price: 0
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Novo Produto</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nome</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">SKU</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Categoria</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Qtd Inicial</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Qtd Mínima</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.minQuantity}
                onChange={e => setFormData({...formData, minQuantity: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Preço</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.price}
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button onClick={() => onSubmit(formData)} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Salvar</button>
        </div>
      </div>
    </div>
  );
}

function StockUpdateModal({ type, onClose, onSubmit }: { type: 'in' | 'out', onClose: () => void, onSubmit: (qty: number, reason: string) => void }) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">{type === 'in' ? 'Entrada de Estoque' : 'Saída de Estoque'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Quantidade</label>
            <input 
              type="number" 
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Motivo / Observação</label>
            <textarea 
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
              placeholder="Ex: Reposição de estoque, Venda, Perda..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
          <button 
            onClick={() => onSubmit(qty, reason)} 
            className={`flex-1 py-2 text-white rounded-lg transition-colors ${type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
