
import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';

export function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />;
      case 'search':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Search Module</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'results':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Search Results</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'alerts':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Price Alerts</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'trends':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Price Trends</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'exports':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Data Exports</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'marketplaces':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Marketplaces</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'ai-estimator':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">AI Price Estimator</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
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
