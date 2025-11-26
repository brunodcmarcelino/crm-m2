import { useState, useEffect } from 'react';
import { Eye, X, ArrowRight, Clock, DollarSign, CheckCircle, Download, Search, Filter } from 'lucide-react';
import { getOrders, updateOrder, getBudgets, updateBudget, createCashEntry } from '../utils/api.tsx';
import jsPDF from 'jspdf';
import logoImage from 'figma:asset/a6528df6fceb432f58f491627260b49e7c794f21.png';

interface OrderItem {
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

interface Order {
  id: string;
  order_number: string;
  budget_number?: string;
  client_name: string;
  description?: string;
  items: OrderItem[];
  price: number;
  total?: number;
  status: 'budget' | 'approved' | 'in_production' | 'completed' | 'delivered';
  due_date: string;
  created_at: string;
  payments: Payment[];
  notes?: string;
  history?: { status: string; date: string }[];
}

export function Orders() {
  const [allItems, setAllItems] = useState<Order[]>([]);
  const [filteredItems, setFilteredItems] = useState<Order[]>([]);
  const [viewItem, setViewItem] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'pix' as Payment['method'],
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [allItems, searchTerm, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, budgetsData] = await Promise.all([
        getOrders(),
        getBudgets(),
      ]);

      // Combine orders and budgets into a single list
      const combinedItems = [
        ...ordersData.map((order: any) => ({
          ...order,
          price: order.price || order.total || 0,
          payments: order.payments || [],
        })),
        ...budgetsData.map((budget: any) => ({
          ...budget,
          order_number: budget.budget_number,
          price: budget.total,
          items: budget.items || [],
          payments: budget.payments || [],
          description: budget.notes,
        })),
      ];

      setAllItems(combinedItems);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = allItems;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    setFilteredItems(filtered);
  };

  const statusColumns: { status: Order['status']; label: string; color: string; bgColor: string }[] = [
    { status: 'budget', label: 'Orçamento', color: 'border-gray-300', bgColor: 'bg-gray-50' },
    { status: 'approved', label: 'Aprovado', color: 'border-blue-300', bgColor: 'bg-blue-50' },
    { status: 'in_production', label: 'Em Produção', color: 'border-yellow-300', bgColor: 'bg-yellow-50' },
    { status: 'completed', label: 'Concluído', color: 'border-purple-300', bgColor: 'bg-purple-50' },
    { status: 'delivered', label: 'Entregue', color: 'border-green-300', bgColor: 'bg-green-50' },
  ];

  const handleStatusChange = async (item: Order, newStatus: Order['status']) => {
    const statusNames = {
      budget: 'Orçamento',
      approved: 'Aprovado',
      in_production: 'Em Produção',
      completed: 'Concluído',
      delivered: 'Entregue',
    };

    try {
      const updatedItem = {
        ...item,
        status: newStatus,
        history: [
          ...(item.history || []),
          {
            status: statusNames[newStatus],
            date: new Date().toISOString().split('T')[0],
          },
        ],
      };

      // Update based on whether it's from budgets or orders
      if (item.budget_number || item.order_number.startsWith('ORC-')) {
        await updateBudget(item.id, updatedItem);
      } else {
        await updateOrder(item.id, updatedItem);
      }

      await loadData();
      setViewItem(updatedItem);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const handleAddPayment = async () => {
    if (!viewItem || paymentForm.amount <= 0) {
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

      const updatedItem = {
        ...viewItem,
        payments: [...viewItem.payments, newPayment],
      };

      // Create cash entry automatically
      await createCashEntry({
        type: 'income',
        amount: paymentForm.amount,
        description: `Pagamento - ${viewItem.order_number} - ${viewItem.client_name}`,
        date: paymentForm.date,
        order_id: viewItem.id,
      });

      // Update based on whether it's from budgets or orders
      if (viewItem.budget_number || viewItem.order_number.startsWith('ORC-')) {
        await updateBudget(viewItem.id, updatedItem);
      } else {
        await updateOrder(viewItem.id, updatedItem);
      }

      await loadData();
      setViewItem(updatedItem);
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

  const calculatePaidAmount = (item: Order) => {
    return item.payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const calculatePaidPercentage = (item: Order) => {
    const paid = calculatePaidAmount(item);
    return (paid / item.price) * 100;
  };

  const getPaymentStatus = (item: Order) => {
    const percentage = calculatePaidPercentage(item);
    if (percentage >= 100) return { label: 'Pago 100%', color: 'text-green-600 bg-green-50' };
    if (percentage > 0) return { label: `Pago ${percentage.toFixed(0)}%`, color: 'text-yellow-600 bg-yellow-50' };
    return { label: 'Não Pago', color: 'text-red-600 bg-red-50' };
  };

  const paymentMethodLabels = {
    pix: 'PIX',
    cash: 'Dinheiro',
    card: 'Cartão',
    transfer: 'Transferência',
  };

  const generatePDF = (item: Order) => {
    const doc = new jsPDF();

    // Add logo
    const img = new Image();
    img.src = logoImage;
    doc.addImage(img, 'PNG', 15, 10, 40, 30);

    // Company info
    doc.setFontSize(16);
    doc.text('M2 CORTES & ARTE', 105, 20, { align: 'center' });

    // Order/Budget number and date
    doc.setFontSize(12);
    doc.text(`${item.order_number.startsWith('ORC-') ? 'Orçamento' : 'Pedido'}: ${item.order_number}`, 15, 50);
    doc.text(`Data: ${new Date(item.created_at).toLocaleDateString('pt-BR')}`, 15, 57);
    doc.text(`Entrega: ${new Date(item.due_date).toLocaleDateString('pt-BR')}`, 15, 64);

    // Client info
    doc.text(`Cliente: ${item.client_name}`, 15, 75);

    // Items table
    doc.setFontSize(10);
    doc.text('Item', 15, 90);
    doc.text('Qtd', 120, 90);
    doc.text('Valor Unit.', 140, 90);
    doc.text('Total', 175, 90);
    
    doc.line(15, 92, 195, 92);

    let yPos = 100;
    item.items.forEach((orderItem) => {
      doc.text(orderItem.name, 15, yPos);
      doc.text(orderItem.quantity.toString(), 120, yPos);
      doc.text(`R$ ${orderItem.unitPrice.toFixed(2)}`, 140, yPos);
      doc.text(`R$ ${orderItem.total.toFixed(2)}`, 175, yPos);
      yPos += 7;
    });

    doc.line(15, yPos, 195, yPos);
    yPos += 7;

    // Total
    doc.setFontSize(12);
    doc.text(`Total: R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 175, yPos, { align: 'right' });

    // Notes
    if (item.notes || item.description) {
      yPos += 15;
      doc.setFontSize(10);
      doc.text('Observações:', 15, yPos);
      doc.text(item.notes || item.description || '', 15, yPos + 7, { maxWidth: 180 });
    }

    // Payment status
    if (item.payments && item.payments.length > 0) {
      yPos += 25;
      doc.text('Pagamentos:', 15, yPos);
      yPos += 7;
      item.payments.forEach((payment) => {
        doc.text(
          `${new Date(payment.date).toLocaleDateString('pt-BR')} - R$ ${payment.amount.toFixed(2)} (${payment.method})`,
          15,
          yPos
        );
        yPos += 7;
      });
    }

    // Save PDF
    doc.save(`${item.order_number}-${item.client_name}.pdf`);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-gray-900 mb-1">Pedidos / Produção</h1>
            <p className="text-gray-600">Acompanhe o fluxo de produção</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Lista
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos os Status</option>
            <option value="budget">Orçamento</option>
            <option value="approved">Aprovado</option>
            <option value="in_production">Em Produção</option>
            <option value="completed">Concluído</option>
            <option value="delivered">Entregue</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando dados...</div>
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((column) => {
            const columnItems = filteredItems.filter((item) => item.status === column.status);

            return (
              <div key={column.status} className="flex-shrink-0 w-80">
                <div className={`rounded-lg border-2 ${column.color} ${column.bgColor} p-4 mb-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-gray-900">{column.label}</h3>
                    <span className="px-3 py-1 bg-white rounded-full text-gray-700">
                      {columnItems.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  {columnItems.map((item) => {
                    const paymentStatus = getPaymentStatus(item);
                    const paidPercentage = calculatePaidPercentage(item);

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setViewItem(item)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-purple-600">{item.order_number}</span>
                          <span className={`px-2 py-1 rounded text-xs ${paymentStatus.color}`}>
                            {paymentStatus.label}
                          </span>
                        </div>

                        <h4 className="text-gray-900 mb-1">{item.client_name}</h4>
                        {item.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(item.due_date).toLocaleDateString('pt-BR')}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Valor</span>
                            <span className="text-gray-900">
                              R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          {paidPercentage > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(paidPercentage, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {columnItems.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Nenhum item nesta coluna
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600">Número</th>
                  <th className="px-4 py-3 text-left text-gray-600">Cliente</th>
                  <th className="px-4 py-3 text-left text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-gray-600">Entrega</th>
                  <th className="px-4 py-3 text-right text-gray-600">Valor</th>
                  <th className="px-4 py-3 text-center text-gray-600">Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const paymentStatus = getPaymentStatus(item);
                  const statusConfig = statusColumns.find((s) => s.status === item.status);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setViewItem(item)}
                    >
                      <td className="px-4 py-3 text-purple-600">{item.order_number}</td>
                      <td className="px-4 py-3 text-gray-900">{item.client_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs ${statusConfig?.bgColor} border ${statusConfig?.color}`}>
                          {statusConfig?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(item.due_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={`px-2 py-1 rounded text-xs ${paymentStatus.color}`}>
                            {paymentStatus.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-500">Nenhum item encontrado</div>
            )}
          </div>
        </div>
      )}

      {/* View Item Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-gray-900">{viewItem.order_number}</h2>
                <p className="text-gray-600">{viewItem.client_name}</p>
              </div>
              <button onClick={() => setViewItem(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Status Atual</span>
                <span className={`px-4 py-2 rounded-full text-white ${
                  statusColumns.find((s) => s.status === viewItem.status)?.color.replace('border-', 'bg-').replace('-300', '-500')
                }`}>
                  {statusColumns.find((s) => s.status === viewItem.status)?.label}
                </span>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-gray-900 mb-3">Itens</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-600">Item</th>
                        <th className="px-4 py-3 text-center text-gray-600">Qtd</th>
                        <th className="px-4 py-3 text-right text-gray-600">Valor Unit.</th>
                        <th className="px-4 py-3 text-right text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewItem.items.map((orderItem, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-gray-900">{orderItem.name}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{orderItem.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            R$ {orderItem.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            R$ {orderItem.total.toFixed(2)}
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
                          R$ {viewItem.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Control */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900">Controle de Pagamento</h3>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <DollarSign className="w-4 h-4" />
                    Adicionar Pagamento
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 mb-1">Valor Total</p>
                    <p className="text-xl text-gray-900">
                      R$ {viewItem.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Valor Pago</p>
                    <p className="text-xl text-green-600">
                      R$ {calculatePaidAmount(viewItem).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Restante</p>
                    <p className="text-xl text-red-600">
                      R$ {(viewItem.price - calculatePaidAmount(viewItem)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(calculatePaidPercentage(viewItem), 100)}%` }}
                  />
                </div>

                {viewItem.payments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-gray-700 mb-2">Histórico de Pagamentos</h4>
                    {viewItem.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-gray-900">
                              R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {paymentMethodLabels[payment.method]} - {new Date(payment.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div>
                <h3 className="text-gray-900 mb-3">Avançar Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {viewItem.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(viewItem, 'approved')}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Aprovado
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {viewItem.status !== 'in_production' && (
                    <button
                      onClick={() => handleStatusChange(viewItem, 'in_production')}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Em Produção
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {viewItem.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(viewItem, 'completed')}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Concluído
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {viewItem.status !== 'delivered' && (
                    <button
                      onClick={() => handleStatusChange(viewItem, 'delivered')}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Entregue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Download PDF */}
              <div>
                <button
                  onClick={() => generatePDF(viewItem)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setViewItem(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && viewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-gray-900">Adicionar Pagamento</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">
                  Valor <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Restante: R$ {(viewItem.price - calculatePaidAmount(viewItem)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Forma de Pagamento</label>
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

              <div>
                <label className="block text-gray-700 mb-2">Data</label>
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
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
