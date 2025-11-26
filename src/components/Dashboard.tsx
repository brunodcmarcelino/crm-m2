import { Users, FileText, Package, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { getClients, getBudgets, getOrders, getCashEntries } from '../utils/api.tsx';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    monthlyBudgets: 0,
    orders: {
      budget: 0,
      approved: 0,
      inProduction: 0,
      completed: 0,
      delivered: 0,
    },
    pendingItems: 0,
    financial: {
      income: 0,
      expenses: 0,
      balance: 0,
    },
    weeklyData: [] as { day: string; value: number }[],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [clients, budgets, orders, cashEntries] = await Promise.all([
        getClients(),
        getBudgets(),
        getOrders(),
        getCashEntries(),
      ]);

      // Calculate current month budgets
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyBudgets = budgets.filter((b: any) => {
        const budgetDate = new Date(b.created_at);
        return budgetDate.getMonth() === currentMonth && budgetDate.getFullYear() === currentYear;
      }).length;

      // Count budgets + orders by status (combining both)
      const allItems = [...budgets, ...orders];
      const ordersByStatus = {
        budget: allItems.filter((o: any) => o.status === 'budget').length,
        approved: allItems.filter((o: any) => o.status === 'approved').length,
        inProduction: allItems.filter((o: any) => o.status === 'in_production').length,
        completed: allItems.filter((o: any) => o.status === 'completed').length,
        delivered: allItems.filter((o: any) => o.status === 'delivered').length,
      };

      // Calculate pending items (orders + budgets not delivered)
      const pendingItems = allItems.filter((o: any) => o.status !== 'delivered').length;

      // Calculate financial data
      const income = cashEntries
        .filter((e: any) => e.type === 'income')
        .reduce((sum: number, e: any) => sum + e.amount, 0);
      const expenses = cashEntries
        .filter((e: any) => e.type === 'expense')
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      // Calculate weekly data (last 7 days - full week)
      const weeklyData = [];
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = dayNames[date.getDay()];
        
        // Sum income from cash entries on this day
        const dayIncome = cashEntries
          .filter((e: any) => {
            const entryDate = new Date(e.date);
            return (
              e.type === 'income' &&
              entryDate.toDateString() === date.toDateString()
            );
          })
          .reduce((sum: number, e: any) => sum + e.amount, 0);
        
        weeklyData.push({ day: dayName, value: dayIncome });
      }

      setStats({
        totalClients: clients.length,
        monthlyBudgets,
        orders: ordersByStatus,
        pendingItems,
        financial: {
          income,
          expenses,
          balance: income - expenses,
        },
        weeklyData,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      name: 'Total de Clientes',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Orçamentos do Mês',
      value: stats.monthlyBudgets,
      icon: FileText,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Itens Pendentes',
      value: stats.pendingItems,
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      name: 'Saldo do Mês',
      value: `R$ ${stats.financial.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  const orderStatus = [
    { name: 'Orçamento', count: stats.orders.budget, color: 'bg-gray-500' },
    { name: 'Aprovado', count: stats.orders.approved, color: 'bg-blue-500' },
    { name: 'Em Produção', count: stats.orders.inProduction, color: 'bg-yellow-500' },
    { name: 'Concluído', count: stats.orders.completed, color: 'bg-purple-500' },
    { name: 'Entregue', count: stats.orders.delivered, color: 'bg-green-500' },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-1">Dashboard Geral</h1>
        <p className="text-gray-600">Visão geral do seu negócio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
              <p className="text-gray-600 mb-1">{stat.name}</p>
              <p className={`text-2xl ${stat.textColor}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Order Status */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-6">Status dos Pedidos</h2>
          <div className="space-y-4">
            {orderStatus.map((status) => (
              <div key={status.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                  <span className="text-gray-700">{status.name}</span>
                </div>
                <span className="text-gray-900">{status.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900">Faturamento Semanal</h2>
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-5 h-5" />
              <span>+12%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-gray-900 mb-6">Resumo Financeiro</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-gray-600 mb-1">Entradas</p>
            <p className="text-2xl text-green-600">
              R$ {stats.financial.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <p className="text-gray-600 mb-1">Saídas</p>
            <p className="text-2xl text-red-600">
              R$ {stats.financial.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-gray-600 mb-1">Saldo</p>
            <p className="text-2xl text-blue-600">
              R$ {stats.financial.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}