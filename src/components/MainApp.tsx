
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Search } from '@/pages/Search';
import { SearchTest } from '@/pages/SearchTest';
import { Results } from '@/pages/Results';
import { Alerts } from '@/pages/Alerts';
import { Trends } from '@/pages/Trends';
import { Exports } from '@/pages/Exports';
import { Marketplaces } from '@/pages/Marketplaces';
import { Settings } from '@/pages/Settings';
import { Admin } from '@/pages/Admin';

export function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />;
      case 'search':
        return <Search />;
      case 'search-test':
        return <SearchTest />;
      case 'results':
        return <Results />;
      case 'alerts':
        return <Alerts />;
      case 'trends':
        return <Trends />;
      case 'exports':
        return <Exports />;
      case 'marketplaces':
        return <Marketplaces />;
      case 'ai-estimator':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">AI Price Estimator</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'settings':
        return <Settings />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
