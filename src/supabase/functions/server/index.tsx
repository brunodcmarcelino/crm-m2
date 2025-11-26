import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ========== CLIENTS ==========

app.get('/make-server-23c01016/clients', async (c) => {
  try {
    const clients = await kv.getByPrefix('client:');
    return c.json({ success: true, data: clients });
  } catch (error) {
    console.log('Error fetching clients:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post('/make-server-23c01016/clients', async (c) => {
  try {
    const body = await c.req.json();
    const clientId = `client:${Date.now()}`;
    const client = {
      id: clientId,
      ...body,
      created_at: new Date().toISOString(),
    };
    await kv.set(clientId, client);
    return c.json({ success: true, data: client });
  } catch (error) {
    console.log('Error creating client:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put('/make-server-23c01016/clients/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ success: false, error: 'Client not found' }, 404);
    }
    const updated = { ...existing, ...body };
    await kv.set(id, updated);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.log('Error updating client:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete('/make-server-23c01016/clients/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(id);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting client:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ========== BUDGETS ==========

app.get('/make-server-23c01016/budgets', async (c) => {
  try {
    const budgets = await kv.getByPrefix('budget:');
    return c.json({ success: true, data: budgets });
  } catch (error) {
    console.log('Error fetching budgets:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post('/make-server-23c01016/budgets', async (c) => {
  try {
    const body = await c.req.json();
    const budgetId = `budget:${Date.now()}`;
    const budget = {
      id: budgetId,
      ...body,
      created_at: new Date().toISOString(),
    };
    await kv.set(budgetId, budget);
    return c.json({ success: true, data: budget });
  } catch (error) {
    console.log('Error creating budget:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put('/make-server-23c01016/budgets/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ success: false, error: 'Budget not found' }, 404);
    }
    const updated = { ...existing, ...body };
    await kv.set(id, updated);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.log('Error updating budget:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete('/make-server-23c01016/budgets/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(id);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting budget:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ========== ORDERS ==========

app.get('/make-server-23c01016/orders', async (c) => {
  try {
    const orders = await kv.getByPrefix('order:');
    return c.json({ success: true, data: orders });
  } catch (error) {
    console.log('Error fetching orders:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post('/make-server-23c01016/orders', async (c) => {
  try {
    const body = await c.req.json();
    const orderId = `order:${Date.now()}`;
    const order = {
      id: orderId,
      ...body,
      created_at: new Date().toISOString(),
    };
    await kv.set(orderId, order);
    return c.json({ success: true, data: order });
  } catch (error) {
    console.log('Error creating order:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put('/make-server-23c01016/orders/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const existing = await kv.get(id);
    if (!existing) {
      return c.json({ success: false, error: 'Order not found' }, 404);
    }
    const updated = { ...existing, ...body };
    await kv.set(id, updated);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.log('Error updating order:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete('/make-server-23c01016/orders/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(id);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting order:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ========== CASH ==========

app.get('/make-server-23c01016/cash', async (c) => {
  try {
    const entries = await kv.getByPrefix('cash:');
    return c.json({ success: true, data: entries });
  } catch (error) {
    console.log('Error fetching cash entries:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.post('/make-server-23c01016/cash', async (c) => {
  try {
    const body = await c.req.json();
    const entryId = `cash:${Date.now()}`;
    const entry = {
      id: entryId,
      ...body,
      created_at: new Date().toISOString(),
    };
    await kv.set(entryId, entry);
    return c.json({ success: true, data: entry });
  } catch (error) {
    console.log('Error creating cash entry:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.delete('/make-server-23c01016/cash/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(id);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting cash entry:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ========== SETTINGS ==========

app.get('/make-server-23c01016/settings', async (c) => {
  try {
    const settings = await kv.get('settings');
    return c.json({
      success: true,
      data: settings || {
        budgetStartNumber: 125,
        orderStartNumber: 105,
      },
    });
  } catch (error) {
    console.log('Error fetching settings:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

app.put('/make-server-23c01016/settings', async (c) => {
  try {
    const body = await c.req.json();
    await kv.set('settings', body);
    return c.json({ success: true, data: body });
  } catch (error) {
    console.log('Error updating settings:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
