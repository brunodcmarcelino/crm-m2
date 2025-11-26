import { useState, useEffect } from 'react';
import { Save, Upload, Sun, Moon } from 'lucide-react';
import { getSettings, updateSettings } from '../utils/api.tsx';

export function SettingsPage() {
  const [settings, setSettings] = useState({
    budgetStartNumber: 125,
    orderStartNumber: 105,
    companyLogo: '',
    theme: 'light' as 'light' | 'dark',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings({ ...settings, ...data });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings(settings);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao salvar configurações');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-1">Configurações</h1>
        <p className="text-gray-600">Personalize o sistema</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Company Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-6">Informações da Empresa</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Logo da Empresa</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">M2</span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Upload className="w-5 h-5" />
                  Upload Nova Logo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Nome da Empresa</label>
              <input
                type="text"
                value="M2 Cortes e Artes"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                readOnly
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Descrição</label>
              <input
                type="text"
                value="Especializado em cortes a laser, impressão e comunicação visual"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Numbering Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-6">Numeração Automática</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Próximo Número de Orçamento</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.budgetStartNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      budgetStartNumber: parseInt(e.target.value) || 0,
                    })
                  }
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                />
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  ORC-{settings.budgetStartNumber.toString().padStart(5, '0')}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Formato: ORC-XXXXX (exemplo: ORC-00125)
              </p>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Próximo Número de Pedido</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.orderStartNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      orderStartNumber: parseInt(e.target.value) || 0,
                    })
                  }
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                />
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  PED-{settings.orderStartNumber.toString().padStart(5, '0')}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Formato: PED-XXXXX (exemplo: PED-00105)
              </p>
            </div>
          </div>
        </div>

        {/* Theme Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-6">Aparência</h2>

          <div>
            <label className="block text-gray-700 mb-2">Tema</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSettings({ ...settings, theme: 'light' })}
                className={`flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors ${
                  settings.theme === 'light'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span>Claro</span>
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: 'dark' })}
                className={`flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors ${
                  settings.theme === 'dark'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span>Escuro</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Tema escuro em desenvolvimento
            </p>
          </div>
        </div>

        {/* Database Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-6">Banco de Dados</h2>

          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-gray-900 mb-2">Estrutura do Supabase</h3>
              <p className="text-gray-700 mb-3">
                O sistema está preparado para integração com as seguintes tabelas:
              </p>
              <ul className="space-y-1 text-gray-700">
                <li>• <strong>clients</strong> - Cadastro de clientes</li>
                <li>• <strong>budgets</strong> - Orçamentos criados</li>
                <li>• <strong>orders</strong> - Pedidos e produção</li>
                <li>• <strong>payments</strong> - Controle de pagamentos</li>
                <li>• <strong>cash</strong> - Fluxo de caixa</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-gray-900 mb-2">Status da Conexão</h3>
              <p className="text-gray-700">
                Sistema funcionando com dados locais. Conecte ao Supabase para persistência de dados em nuvem.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}