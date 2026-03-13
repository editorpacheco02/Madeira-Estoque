import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Package, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { Product, Movement } from '../types';

interface DashboardProps {
  products: Product[];
  movements: Movement[];
}

export default function Dashboard({ products, movements }: DashboardProps) {
  const totalProducts = products.length;
  const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);
  const lowStockItems = products.filter(p => p.quantity <= p.minQuantity);
  
  const recentMovements = [...movements].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);

  const categoryData = products.reduce((acc: any[], p) => {
    const existing = acc.find(item => item.name === p.category);
    if (existing) {
      existing.value += p.quantity;
    } else {
      acc.push({ name: p.category, value: p.quantity });
    }
    return acc;
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total de Produtos" 
          value={totalProducts} 
          icon={<Package className="w-5 h-5" />}
          color="bg-blue-500"
        />
        <StatCard 
          title="Itens em Estoque" 
          value={totalStock} 
          icon={<ArrowUpRight className="w-5 h-5" />}
          color="bg-emerald-500"
        />
        <StatCard 
          title="Alertas de Estoque" 
          value={lowStockItems.length} 
          icon={<AlertTriangle className="w-5 h-5" />}
          color="bg-amber-500"
        />
        <StatCard 
          title="Movimentações" 
          value={movements.length} 
          icon={<ArrowDownRight className="w-5 h-5" />}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Estoque por Categoria</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Movimentações Recentes</h3>
          <div className="space-y-4">
            {recentMovements.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">Nenhuma movimentação registrada.</p>
            ) : (
              recentMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${m.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {m.type === 'in' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{m.productName}</p>
                      <p className="text-xs text-zinc-500">{new Date(m.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${m.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.type === 'in' ? '+' : '-'}{m.quantity}
                    </p>
                    <p className="text-xs text-zinc-400">{m.reason}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
      <div className={`${color} p-3 rounded-lg text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-zinc-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-zinc-900">{value}</p>
      </div>
    </div>
  );
}
