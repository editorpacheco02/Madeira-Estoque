import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { Movement } from '../types';

interface MovementsProps {
  movements: Movement[];
}

export default function Movements({ movements }: MovementsProps) {
  const sortedMovements = [...movements].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-400" />
            Histórico de Movimentações
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-bottom border-zinc-200">
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Data</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Produto</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Tipo</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600 text-center">Quantidade</th>
                <th className="px-6 py-4 text-sm font-semibold text-zinc-600">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sortedMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              ) : (
                sortedMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {new Date(m.date).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-zinc-900">{m.productName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        m.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {m.type === 'in' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {m.type === 'in' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">
                      {m.type === 'in' ? '+' : '-'}{m.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {m.reason || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
