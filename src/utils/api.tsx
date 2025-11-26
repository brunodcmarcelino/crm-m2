import { projectId, publicAnonKey } from './supabase/info.tsx';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-23c01016`;

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${publicAnonKey}`,
};

// ========== CLIENTS ==========

export async function getClients() {
  const response = await fetch(`${API_URL}/clients`, { headers });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function createClient(client: any) {
  const response = await fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers,
    body: JSON.stringify(client),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function updateClient(id: string, client: any) {
  const response = await fetch(`${API_URL}/clients/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(client),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function deleteClient(id: string) {
  const response = await fetch(`${API_URL}/clients/${id}`, {
    method: 'DELETE',
    headers,
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
}

// ========== BUDGETS ==========

export async function getBudgets() {
  const response = await fetch(`${API_URL}/budgets`, { headers });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function createBudget(budget: any) {
  const response = await fetch(`${API_URL}/budgets`, {
    method: 'POST',
    headers,
    body: JSON.stringify(budget),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function updateBudget(id: string, budget: any) {
  const response = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(budget),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function deleteBudget(id: string) {
  const response = await fetch(`${API_URL}/budgets/${id}`, {
    method: 'DELETE',
    headers,
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
}

// ========== ORDERS ==========

export async function getOrders() {
  const response = await fetch(`${API_URL}/orders`, { headers });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function createOrder(order: any) {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(order),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function updateOrder(id: string, order: any) {
  const response = await fetch(`${API_URL}/orders/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(order),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function deleteOrder(id: string) {
  const response = await fetch(`${API_URL}/orders/${id}`, {
    method: 'DELETE',
    headers,
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
}

// ========== CASH ==========

export async function getCashEntries() {
  const response = await fetch(`${API_URL}/cash`, { headers });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function createCashEntry(entry: any) {
  const response = await fetch(`${API_URL}/cash`, {
    method: 'POST',
    headers,
    body: JSON.stringify(entry),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function deleteCashEntry(id: string) {
  const response = await fetch(`${API_URL}/cash/${id}`, {
    method: 'DELETE',
    headers,
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
}

// ========== SETTINGS ==========

export async function getSettings() {
  const response = await fetch(`${API_URL}/settings`, { headers });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

export async function updateSettings(settings: any) {
  const response = await fetch(`${API_URL}/settings`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(settings),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}
