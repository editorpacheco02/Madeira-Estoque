import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Movements from './components/Movements';
import { Product, Movement, View } from './types';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  LogOut, 
  Menu, 
  X,
  Boxes,
  RefreshCw,
  Settings as SettingsIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SettingsView from './components/Settings';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          fetchData();
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchData();
      } else {
        setProducts([]);
        setMovements([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    setIsSyncing(true);
    try {
      // Fetch Products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (productsError) {
        console.error('Erro ao buscar produtos:', productsError);
      } else {
        // Map snake_case to camelCase
        const mappedProducts: Product[] = (productsData || []).map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          quantity: p.quantity,
          minQuantity: p.min_quantity || p.minQuantity,
          price: p.price,
          createdAt: p.created_at || p.createdAt
        }));
        setProducts(mappedProducts);
      }

      // Fetch Movements
      const { data: movementsData, error: movementsError } = await supabase
        .from('movements')
        .select('*')
        .order('date', { ascending: false });

      if (movementsError) {
        console.error('Erro ao buscar movimentações:', movementsError);
      } else {
        // Map snake_case to camelCase
        const mappedMovements: Movement[] = (movementsData || []).map(m => ({
          id: m.id,
          productId: m.product_id || m.productId,
          productName: m.product_name || m.productName,
          type: m.type,
          quantity: m.quantity,
          reason: m.reason,
          date: m.date || m.created_at,
          userId: m.user_id || m.userId
        }));
        setMovements(mappedMovements);
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const addProduct = async (p: Omit<Product, 'id' | 'createdAt'>) => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{ 
          name: p.name,
          sku: p.sku,
          category: p.category,
          quantity: p.quantity,
          min_quantity: p.minQuantity,
          price: p.price,
          user_id: session?.user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const mapped: Product = {
          id: data.id,
          name: data.name,
          sku: data.sku,
          category: data.category,
          quantity: data.quantity,
          minQuantity: data.min_quantity,
          price: data.price,
          createdAt: data.created_at
        };
        setProducts(prev => [...prev, mapped]);
      }
    } catch (error: any) {
      alert('Erro ao adicionar produto: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateStock = async (id: string, type: 'in' | 'out', quantity: number, reason: string) => {
    setIsSyncing(true);
    try {
      const product = products.find(p => p.id === id);
      if (!product) return;

      const newQty = type === 'in' ? product.quantity + quantity : product.quantity - quantity;
      
      // 1. Update Product
      const { error: productError } = await supabase
        .from('products')
        .update({ quantity: Math.max(0, newQty) })
        .eq('id', id);

      if (productError) throw productError;

      // 2. Record Movement
      const { data: movementData, error: movementError } = await supabase
        .from('movements')
        .insert([{
          product_id: id,
          product_name: product.name,
          type,
          quantity,
          reason,
          user_id: session?.user.id
        }])
        .select()
        .single();

      if (movementError) throw movementError;

      // Update local state
      setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: Math.max(0, newQty) } : p));
      if (movementData) {
        const mapped: Movement = {
          id: movementData.id,
          productId: movementData.product_id,
          productName: movementData.product_name,
          type: movementData.type,
          quantity: movementData.quantity,
          reason: movementData.reason,
          date: movementData.date,
          userId: movementData.user_id
        };
        setMovements(prev => [mapped, ...prev]);
      }
    } catch (error: any) {
      alert('Erro ao atualizar estoque: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error: any) {
      alert('Erro ao excluir produto: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'inventory', label: 'Estoque', icon: <Package className="w-5 h-5" /> },
    { id: 'movements', label: 'Histórico', icon: <History className="w-5 h-5" /> },
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-zinc-200 sticky top-0 h-screen">
        <div className="p-6 border-b border-zinc-100 flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg">
            <Boxes className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl text-zinc-900 tracking-tight">EstoquePro</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                currentView === item.id 
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Usuário</p>
            <p className="text-sm font-medium text-zinc-900 truncate">{session.user.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-zinc-200 z-40 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="text-emerald-600 w-6 h-6" />
          <span className="font-bold text-lg">EstoquePro</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg"
        >
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="text-emerald-600 w-6 h-6" />
                  <span className="font-bold text-lg">EstoquePro</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-zinc-400">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as View);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      currentView === item.id 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-zinc-500 hover:bg-zinc-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-zinc-100">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Sair
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 max-w-7xl mx-auto w-full">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">
              {navItems.find(i => i.id === currentView)?.label}
            </h2>
            <p className="text-zinc-500">
              {currentView === 'dashboard' && 'Visão geral do seu estoque e movimentações.'}
              {currentView === 'inventory' && 'Gerencie seus produtos e níveis de estoque.'}
              {currentView === 'movements' && 'Acompanhe todas as entradas e saídas.'}
              {currentView === 'settings' && 'Configure sua conexão com o banco de dados.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSyncing && (
              <span className="text-xs text-zinc-400 animate-pulse flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando...
              </span>
            )}
            <button 
              onClick={fetchData}
              disabled={isSyncing}
              className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
              title="Sincronizar dados"
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentView === 'dashboard' && <Dashboard products={products} movements={movements} />}
          {currentView === 'inventory' && (
            <Inventory 
              products={products} 
              onAddProduct={addProduct} 
              onUpdateStock={updateStock}
              onDeleteProduct={deleteProduct}
            />
          )}
          {currentView === 'movements' && <Movements movements={movements} />}
          {currentView === 'settings' && <SettingsView />}
        </motion.div>
      </main>
    </div>
  );
}
