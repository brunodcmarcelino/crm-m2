import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Filter, X, Calendar } from 'lucide-react';
import { getCashEntries, createCashEntry, deleteCashEntry } from '../utils/api.tsx';

interface CashEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  order_id?: string;
}

export function Cash() {
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
    month: '',
    year: '',
  });
  const [formData, setFormData] = useState({
    type: 'income' as CashEntry['type'],
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    order_id: '',
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await getCashEntries();
      setEntries(data);
    } catch (error) {
      console.error('Error loading cash entries:', error);
      alert('Erro ao carregar entradas do caixa');
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    // Filter by type
    if (filterType !== 'all' && entry.type !== filterType) {
      return false;
    }

    const entryDate = new Date(entry.date);
    
    // Filter by specific date range
    if (dateFilter.startDate && dateFilter.endDate) {
      const start = new Date(dateFilter.startDate);
      const end = new Date(dateFilter.endDate);
      if (entryDate < start || entryDate > end) {
        return false;
      }
    }
    
    // Filter by month
    if (dateFilter.month) {
      const [year, month] = dateFilter.month.split('-');
      if (entryDate.getFullYear() !== parseInt(year) || entryDate.getMonth() !== parseInt(month) - 1) {
        return false;
      }
    }
    
    // Filter by year
    if (dateFilter.year) {
      if (entryDate.getFullYear() !== parseInt(dateFilter.year)) {
        return false;
      }
    }

    return true;
  });

  const filteredIncome = filteredEntries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const filteredExpense = filteredEntries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const filteredBalance = filteredIncome - filteredExpense;

  const clearDateFilters = () => {
    setDateFilter({
      startDate: '',
      endDate: '',
      month: '',
      year: '',
    });
  };

  const handleCreateEntry = async () => {
    if (!formData.description || formData.amount <= 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await createCashEntry({
        type: formData.type,
        amount: formData.amount,
        description: formData.description,
        date: formData.date,
        order_id: formData.order_id || undefined,
      });
      await loadEntries();
      setShowModal(false);
      setFormData({
        type: 'income',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        order_id: '',
      });
    } catch (error) {
      console.error('Error creating cash entry:', error);
      alert('Erro ao criar entrada');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta entrada?')) {
      try {
        await deleteCashEntry(id);
        await loadEntries();
      } catch (error) {
        console.error('Error deleting cash entry:', error);
        alert('Erro ao excluir entrada');
      }
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-gray-900 mb-1">Caixa</h1>
            <p className="text-gray-600">Controle de entradas e saídas</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Entrada
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600">Total de Entradas</p>
              <p className="text-2xl text-green-600">
                R$ {filteredIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-gray-600">Total de Saídas</p>
              <p className="text-2xl text-red-600">
                R$ {filteredExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600">Saldo Geral</p>
              <p className={`text-2xl ${filteredBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                R$ {filteredBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Saídas
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-900">Filtros de Data</h3>
            {(dateFilter.startDate || dateFilter.endDate || dateFilter.month || dateFilter.year) && (
              <button
                onClick={clearDateFilters}
                className="text-purple-600 hover:text-purple-700 text-sm"
              >
                Limpar Filtros
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Data Inicial</label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value, month: '', year: '' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Data Final</label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value, month: '', year: '' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Mês</label>
              <input
                type="month"
                value={dateFilter.month}
                onChange={(e) => setDateFilter({ ...dateFilter, month: e.target.value, startDate: '', endDate: '', year: '' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2 text-sm">Ano</label>
              <select
                value={dateFilter.year}
                onChange={(e) => setDateFilter({ ...dateFilter, year: e.target.value, startDate: '', endDate: '', month: '' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todos os anos</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
          </div>

          {(dateFilter.startDate || dateFilter.endDate || dateFilter.month || dateFilter.year) && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">
                {dateFilter.startDate && dateFilter.endDate && (
                  <>Mostrando de {new Date(dateFilter.startDate).toLocaleDateString('pt-BR')} até {new Date(dateFilter.endDate).toLocaleDateString('pt-BR')}</>
                )}
                {dateFilter.month && (
                  <>Mostrando mês de {new Date(dateFilter.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</>
                )}
                {dateFilter.year && !dateFilter.month && (
                  <>Mostrando ano de {dateFilter.year}</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-gray-600">Data</th>
              <th className="px-6 py-3 text-left text-gray-600">Tipo</th>
              <th className="px-6 py-3 text-left text-gray-600">Descrição</th>
              <th className="px-6 py-3 text-right text-gray-600">Valor</th>
              <th className="px-6 py-3 text-right text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-700">
                  {new Date(entry.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white ${
                      entry.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {entry.type === 'income' ? (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Entrada
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4" />
                        Saída
                      </>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-900">{entry.description}</td>
                <td
                  className={`px-6 py-4 text-right ${
                    entry.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {entry.type === 'income' ? '+' : '-'} R${' '}
                  {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-gray-900">Nova Entrada no Caixa</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      formData.type === 'income'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Entrada
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      formData.type === 'expense'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5" />
                    Saída
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Valor <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Descrição da movimentação"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Pedido Vinculado (Opcional)</label>
                <input
                  type="text"
                  value={formData.order_id}
                  onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="PED-00123"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEntry}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Criar Entrada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}