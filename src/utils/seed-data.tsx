import { createClient, createBudget, createOrder, createCashEntry, updateSettings } from './api.tsx';

export async function seedInitialData() {
  try {
    // Seed clients
    const client1 = await createClient({
      name: 'João Silva',
      phone: '(11) 98765-4321',
      email: 'joao@email.com',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 123 - São Paulo, SP',
      notes: 'Cliente VIP',
    });

    const client2 = await createClient({
      name: 'Maria Santos',
      phone: '(11) 91234-5678',
      email: 'maria@email.com',
      address: 'Av. Paulista, 456 - São Paulo, SP',
    });

    const client3 = await createClient({
      name: 'Carlos Oliveira',
      phone: '(11) 99876-5432',
      email: 'carlos@empresa.com',
      cpf: '987.654.321-00',
    });

    // Seed budgets
    await createBudget({
      budget_number: 'ORC-00123',
      client_id: client1.id,
      client_name: 'João Silva',
      items: [
        { name: 'Corte a laser - MDF 3mm', quantity: 10, unitPrice: 25.0, total: 250.0 },
        { name: 'Impressão banner 1x2m', quantity: 2, unitPrice: 45.0, total: 90.0 },
      ],
      total: 340.0,
      due_date: '2024-12-30',
      status: 'budget',
      notes: 'Cliente solicitou urgência',
      history: [{ status: 'Orçamento criado', date: '2024-11-20' }],
    });

    await createBudget({
      budget_number: 'ORC-00124',
      client_id: client2.id,
      client_name: 'Maria Santos',
      items: [{ name: 'Placa de ACM', quantity: 1, unitPrice: 380.0, total: 380.0 }],
      total: 380.0,
      due_date: '2024-12-28',
      status: 'approved',
      history: [
        { status: 'Orçamento criado', date: '2024-11-22' },
        { status: 'Aprovado', date: '2024-11-23' },
      ],
    });

    // Seed orders
    await createOrder({
      order_number: 'PED-00101',
      client_name: 'João Silva',
      description: 'Cortes em MDF + Banner',
      items: [
        { name: 'Corte a laser - MDF 3mm', quantity: 10, unitPrice: 25.0, total: 250.0 },
        { name: 'Impressão banner 1x2m', quantity: 2, unitPrice: 45.0, total: 90.0 },
      ],
      price: 340.0,
      status: 'budget',
      due_date: '2024-12-30',
      payments: [],
    });

    await createOrder({
      order_number: 'PED-00102',
      client_name: 'Maria Santos',
      description: 'Placa de ACM',
      items: [{ name: 'Placa de ACM', quantity: 1, unitPrice: 380.0, total: 380.0 }],
      price: 380.0,
      status: 'approved',
      due_date: '2024-12-28',
      payments: [
        {
          id: '1',
          amount: 190.0,
          method: 'pix',
          date: '2024-11-22',
        },
      ],
    });

    await createOrder({
      order_number: 'PED-00103',
      client_name: 'Carlos Oliveira',
      description: 'Adesivos personalizados',
      items: [{ name: 'Adesivos vinil', quantity: 100, unitPrice: 3.5, total: 350.0 }],
      price: 350.0,
      status: 'in_production',
      due_date: '2024-12-27',
      payments: [
        {
          id: '2',
          amount: 350.0,
          method: 'card',
          date: '2024-11-18',
        },
      ],
    });

    await createOrder({
      order_number: 'PED-00104',
      client_name: 'Ana Costa',
      description: 'Letra caixa em ACM',
      items: [{ name: 'Letra caixa 30cm', quantity: 5, unitPrice: 85.0, total: 425.0 }],
      price: 425.0,
      status: 'completed',
      due_date: '2024-12-26',
      payments: [
        {
          id: '3',
          amount: 425.0,
          method: 'transfer',
          date: '2024-11-15',
        },
      ],
    });

    // Seed cash entries
    await createCashEntry({
      type: 'income',
      amount: 340.0,
      description: 'Pagamento - Pedido PED-00101',
      date: '2024-11-20',
      order_id: '1',
    });

    await createCashEntry({
      type: 'income',
      amount: 380.0,
      description: 'Pagamento - Pedido PED-00102',
      date: '2024-11-22',
      order_id: '2',
    });

    await createCashEntry({
      type: 'expense',
      amount: 150.0,
      description: 'Compra de material - Acrílico',
      date: '2024-11-21',
    });

    await createCashEntry({
      type: 'expense',
      amount: 80.0,
      description: 'Manutenção máquina laser',
      date: '2024-11-19',
    });

    await createCashEntry({
      type: 'income',
      amount: 425.0,
      description: 'Pagamento - Pedido PED-00104',
      date: '2024-11-23',
      order_id: '4',
    });

    // Set initial settings
    await updateSettings({
      budgetStartNumber: 125,
      orderStartNumber: 105,
    });

    console.log('Dados de exemplo criados com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error);
    return false;
  }
}
