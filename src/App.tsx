import { useState } from 'react';
import { Home, Users, FileText, Package, DollarSign, Settings } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Clients } from './components/Clients';
import { Budgets } from './components/Budgets';
import { Orders } from './components/Orders';
import { Cash } from './components/Cash';
import { SettingsPage } from './components/SettingsPage';
import logoImage from 'figma:asset/a6528df6fceb432f58f491627260b49e7c794f21.png';

type Page = 'dashboard' | 'clients' | 'budgets' | 'orders' | 'cash' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const navigation = [
    { id: 'dashboard' as Page, name: 'Dashboard', icon: Home },
    { id: 'clients' as Page, name: 'Clientes', icon: Users },
    { id: 'budgets' as Page, name: 'Orçamentos', icon: FileText },
    { id: 'orders' as Page, name: 'Pedidos', icon: Package },
    { id: 'cash' as Page, name: 'Caixa', icon: DollarSign },
    { id: 'settings' as Page, name: 'Configurações', icon: Settings },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <Clients />;
      case 'budgets':
        return <Budgets />;
      case 'orders':
        return <Orders />;
      case 'cash':
        return <Cash />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="M2 Cortes e Artes" className="w-12 h-12 rounded-lg object-cover" />
            <div>
              <h1 className="text-gray-900">M2 Cortes e Artes</h1>
              <p className="text-xs text-gray-500">CRM Profissional</p>
            </div>
          </div>
        </div>

        <nav className="px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
}