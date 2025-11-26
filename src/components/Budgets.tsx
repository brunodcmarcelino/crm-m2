import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, X, ArrowRight, Clock, CheckCircle, Download, DollarSign } from 'lucide-react';
import { getBudgets, createBudget, updateBudget, deleteBudget, getSettings, updateSettings, getClients, createCashEntry } from '../utils/api.tsx';
import jsPDF from 'jspdf';
import logoImage from 'figma:asset/a6528df6fceb432f58f491627260b49e7c794f21.png';

interface BudgetItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Payment {
  id: string;
  amount: number;
  method: 'pix' | 'cash' | 'card' | 'transfer';
  date: string;
}

interface Budget {
  id: string;
  budget_number: string;
  client_id: string;
  client_name: string;
  items: BudgetItem[];
  total: number;
  due_date: string;
  status: 'budget' | 'approved' | 'in_production' | 'completed' | 'delivered';
  notes?: string;
  created_at: string;
  history: { status: string; date: string }[];
  payments?: Payment[];
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  address?: string;
}

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewBudget, setViewBudget] = useState<Budget | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [budgetCounter, setBudgetCounter] = useState(125);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    due_date: '',
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'pix' as Payment['method'],
    date: new Date().toISOString().split('T')[0],
  });

  const [items, setItems] = useState<BudgetItem[]>([
    { name: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsData, settingsData, clientsData] = await Promise.all([
        getBudgets(),
        getSettings(),
        getClients()
      ]);
      setBudgets(budgetsData);
      setBudgetCounter(settingsData.budgetStartNumber || 125);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filteredBudgets = budgets.filter(
    (budget) =>
      budget.budget_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData({ ...formData, client_id: clientId, client_name: client.name });
    }
  };

  const calculatePaidAmount = (budget: Budget) => {
    return budget.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  };

  const calculatePaidPercentage = (budget: Budget) => {
    const paid = calculatePaidAmount(budget);
    return (paid / budget.total) * 100;
  };

  const handleAddPayment = async () => {
    if (!viewBudget || paymentForm.amount <= 0) {
      alert('Preencha o valor do pagamento');
      return;
    }

    try {
      const newPayment: Payment = {
        id: Date.now().toString(),
        amount: paymentForm.amount,
        method: paymentForm.method,
        date: paymentForm.date,
      };

      const updatedBudget = {
        ...viewBudget,
        payments: [...(viewBudget.payments || []), newPayment],
      };

      // Create cash entry automatically
      await createCashEntry({
        type: 'income',
        amount: paymentForm.amount,
        description: `Pagamento - ${viewBudget.budget_number} - ${viewBudget.client_name}`,
        date: paymentForm.date,
        order_id: viewBudget.id,
      });

      await updateBudget(viewBudget.id, updatedBudget);
      await loadData();
      setViewBudget(updatedBudget);
      setShowPaymentModal(false);
      setPaymentForm({
        amount: 0,
        method: 'pix',
        date: new Date().toISOString().split('T')[0],
      });
      alert('Pagamento adicionado e entrada no caixa criada!');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Erro ao adicionar pagamento');
    }
  };

  const generatePDF = (budget: Budget) => {
    const doc = new jsPDF();

    // Add logo
    const img = new Image();
    img.src = logoImage;
    doc.addImage(img, 'PNG', 15, 10, 40, 30);

    // Company info
    doc.setFontSize(16);
    doc.text('M2 CORTES & ARTE', 105, 20, { align: 'center' });

    // Budget number and date
    doc.setFontSize(12);
    doc.text(`Orçamento: ${budget.budget_number}`, 15, 50);
    doc.text(`Data: ${new Date(budget.created_at).toLocaleDateString('pt-BR')}`, 15, 57);
    doc.text(`Entrega: ${new Date(budget.due_date).toLocaleDateString('pt-BR')}`, 15, 64);

    // Client info
    doc.text(`Cliente: ${budget.client_name}`, 15, 75);

    // Items table
    doc.setFontSize(10);
    doc.text('Item', 15, 90);
    doc.text('Qtd', 120, 90);
    doc.text('Valor Unit.', 140, 90);
    doc.text('Total', 175, 90);
    
    doc.line(15, 92, 195, 92);

    let yPos = 100;
    budget.items.forEach((item) => {
      doc.text(item.name, 15, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`R$ ${item.unitPrice.toFixed(2)}`, 140, yPos);
      doc.text(`R$ ${item.total.toFixed(2)}`, 175, yPos);
      yPos += 7;
    });

    doc.line(15, yPos, 195, yPos);
    yPos += 7;

    // Total
    doc.setFontSize(12);
    doc.text(`Total: R$ ${budget.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 175, yPos, { align: 'right' });

    // Notes
    if (budget.notes) {
      yPos += 15;
      doc.setFontSize(10);
      doc.text('Observações:', 15, yPos);
      doc.text(budget.notes, 15, yPos + 7, { maxWidth: 180 });
    }

    // Payment status
    if (budget.payments && budget.payments.length > 0) {
      yPos += 25;
      doc.text('Pagamentos:', 15, yPos);
      yPos += 7;
      budget.payments.forEach((payment) => {
        doc.text(
          `${new Date(payment.date).toLocaleDateString('pt-BR')} - R$ ${payment.amount.toFixed(2)} (${payment.method})`,
          15,
          yPos
        );
        yPos += 7;
      });
    }

    // Save PDF
    doc.save(`${budget.budget_number}-${budget.client_name}.pdf`);
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof BudgetItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }

    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCreateBudget = async () => {
    if (!formData.client_name || items.length === 0 || items.some((i) => !i.name)) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const newBudget = {
        budget_number: `ORC-${budgetCounter.toString().padStart(5, '0')}`,
        client_id: Date.now().toString(),
        client_name: formData.client_name,
        items: items,
        total: calculateTotal(),
        due_date: formData.due_date,
        status: 'budget' as Budget['status'],
        notes: formData.notes,
        history: [
          {
            status: 'Orçamento criado',
            date: new Date().toISOString().split('T')[0],
          },
        ],
      };

      await createBudget(newBudget);
      await updateSettings({ budgetStartNumber: budgetCounter + 1 });
      await loadData();
      setShowCreateModal(false);
      setFormData({ client_name: '', due_date: '', notes: '' });
      setItems([{ name: '', quantity: 1, unitPrice: 0, total: 0 }]);
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Erro ao criar orçamento');
    }
  };

  const handleStatusChange = async (budget: Budget, newStatus: Budget['status']) => {
    const statusNames = {
      budget: 'Orçamento',
      approved: 'Aprovado',
      in_production: 'Em Produção',
      completed: 'Concluído',
      delivered: 'Entregue',
    };

    try {
      const updatedBudget = {
        ...budget,
        status: newStatus,
        history: [
          ...budget.history,
          {
            status: statusNames[newStatus],
            date: new Date().toISOString().split('T')[0],
          },
        ],
      };

      await updateBudget(budget.id, updatedBudget);
      await loadData();
      setViewBudget(updatedBudget);
    } catch (error) {
      console.error('Error updating budget status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const statusConfig = {
    budget: { label: 'Orçamento', color: 'bg-gray-500' },
    approved: { label: 'Aprovado', color: 'bg-blue-500' },
    in_production: { label: 'Em Produção', color: 'bg-yellow-500' },
    completed: { label: 'Concluído', color: 'bg-purple-500' },
    delivered: { label: 'Entregue', color: 'bg-green-500' },
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-gray-900 mb-1">Orçamentos</h1>
            <p className="text-gray-600">Gerencie seus orçamentos</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Orçamento
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando orçamentos...</div>
      ) : filteredBudgets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhum orçamento encontrado</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBudgets.map((budget) => (
            <div
              key={budget.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setViewBudget(budget)}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-purple-600">{budget.budget_number}</span>
                <span
                  className={`px-3 py-1 rounded-full text-white text-xs ${
                    statusConfig[budget.status].color
                  }`}
                >
                  {statusConfig[budget.status].label}
                </span>
              </div>

              <h3 className="text-gray-900 mb-2">{budget.client_name}</h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Entrega: {new Date(budget.due_date).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="text-gray-900">
                    R$ {budget.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-gray-900">Novo Orçamento</h2>
                <p className="text-gray-600">
                  Número: ORC-{budgetCounter.toString().padStart(5, '0')}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Data Prevista de Entrega</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-gray-700">
                    Itens do Orçamento <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={handleAddItem}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Nome do item"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Qtd"
                        min="1"
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Valor Unit."
                        step="0.01"
                        min="0"
                      />
                      <div className="w-32 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                        R$ {item.total.toFixed(2)}
                      </div>
                      {items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                  <div className="text-right">
                    <p className="text-gray-600 mb-1">Total do Orçamento</p>
                    <p className="text-2xl text-purple-600">
                      R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Informações adicionais sobre o orçamento"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateBudget}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Criar Orçamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Budget Modal */}
      {viewBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-gray-900">{viewBudget.budget_number}</h2>
                <p className="text-gray-600">{viewBudget.client_name}</p>
              </div>
              <button
                onClick={() => setViewBudget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Status Atual</span>
                <span
                  className={`px-4 py-2 rounded-full text-white ${
                    statusConfig[viewBudget.status].color
                  }`}
                >
                  {statusConfig[viewBudget.status].label}
                </span>
              </div>

              <div>
                <h3 className="text-gray-900 mb-3">Itens do Orçamento</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-600">Item</th>
                        <th className="px-4 py-3 text-center text-gray-600">Quantidade</th>
                        <th className="px-4 py-3 text-right text-gray-600">Valor Unit.</th>
                        <th className="px-4 py-3 text-right text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewBudget.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            R$ {item.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            R$ {item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right text-gray-900">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right text-purple-600">
                          R${' '}
                          {viewBudget.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {viewBudget.notes && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-gray-700">{viewBudget.notes}</p>
                </div>
              )}

              <div>
                <h3 className="text-gray-900 mb-3">Histórico de Status</h3>
                <div className="space-y-2">
                  {viewBudget.history.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{entry.status}</span>
                      <span className="text-gray-500">
                        - {new Date(entry.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-gray-900 mb-3">Avançar Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {viewBudget.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(viewBudget, 'approved')}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Aprovado
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {viewBudget.status !== 'in_production' && (
                    <button
                      onClick={() => handleStatusChange(viewBudget, 'in_production')}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Em Produção
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {viewBudget.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(viewBudget, 'completed')}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Concluído
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {viewBudget.status !== 'delivered' && (
                    <button
                      onClick={() => handleStatusChange(viewBudget, 'delivered')}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Entregue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-gray-900 mb-3">Pagamentos</h3>
                <div className="space-y-2">
                  {viewBudget.payments && viewBudget.payments.map((payment, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">
                        {new Date(payment.date).toLocaleDateString('pt-BR')} - R$ {payment.amount.toFixed(2)} ({payment.method})
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <DollarSign className="w-4 h-4" />
                    Adicionar Pagamento
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => generatePDF(viewBudget)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setViewBudget(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-gray-900">Adicionar Pagamento</h2>
                <p className="text-gray-600">
                  Orçamento: {viewBudget?.budget_number}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Valor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Valor do pagamento"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Método de Pagamento</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as Payment['method'] })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="pix">PIX</option>
                    <option value="cash">Dinheiro</option>
                    <option value="card">Cartão</option>
                    <option value="transfer">Transferência</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Data do Pagamento</label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Adicionar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}