import { useState } from 'react';
import { StoreProvider, useStore } from '@/store';
import { Sidebar, TopBar } from '@/components/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { AllocationPage } from '@/pages/AllocationPage';
import { PickingPage } from '@/pages/PickingPage';
import { PackingPage } from '@/pages/PackingPage';
import { ExceptionsPage } from '@/pages/ExceptionsPage';
import { DispatchPage } from '@/pages/DispatchPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SimulatorPage } from '@/pages/SimulatorPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Zap, X } from 'lucide-react';
import { classNames } from '@/lib/utils';

function DemoModeBar() {
  const { triggerDemoEvent, demoLog } = useStore();
  const [showLog, setShowLog] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white shrink-0">
        <Zap className="w-4 h-4 shrink-0" />
        <span className="text-xs font-semibold">Demo Mode Active</span>
        <span className="text-[10px] text-white/80 hidden sm:inline">— Simulate live warehouse events</span>
        <button
          onClick={() => triggerDemoEvent()}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors text-xs font-semibold"
        >
          <Zap className="w-3.5 h-3.5" /> Trigger Event
        </button>
        {demoLog.length > 0 && (
          <button
            onClick={() => setShowLog(!showLog)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium"
          >
            Event Log ({demoLog.length})
          </button>
        )}
      </div>
      {showLog && demoLog.length > 0 && (
        <div className="absolute bottom-4 right-4 z-30 w-80 max-h-64 overflow-y-auto card shadow-panel p-3 animate-scale-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-700">Event Log</span>
            <button onClick={() => setShowLog(false)} className="text-ink-400 hover:text-ink-600"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="space-y-1.5">
            {demoLog.map((log, i) => (
              <div key={i} className="text-[10px] text-ink-500 p-1.5 rounded bg-ink-50 border border-ink-100">{log}</div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function AppContent() {
  const { page } = useStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'orders': return <OrdersPage />;
      case 'inventory': return <InventoryPage />;
      case 'allocation': return <AllocationPage />;
      case 'picking': return <PickingPage />;
      case 'packing': return <PackingPage />;
      case 'exceptions': return <ExceptionsPage />;
      case 'dispatch': return <DispatchPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'simulator': return <SimulatorPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-100">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <TopBar onMenuClick={() => setMobileNavOpen(true)} />
        <DemoModeBar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
