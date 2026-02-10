import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { HomeIcon, ClipboardDocumentListIcon, PlusCircleIcon, ChartBarIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, UsersIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { exportDatabase, importDatabase } from './store';
import logoImg from './images/logo_img.png';

// Import pages (we'll create these next)
import OrdersList from './pages/OrdersList';
import OrderForm from './pages/OrderForm';
import ExpensesList from './pages/ExpensesList';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import VendorDetails from './pages/VendorDetails';
import Funds from './pages/Funds';

function App() {
  const [importExportMessage, setImportExportMessage] = useState('');

  const handleExport = async () => {
    const result = await exportDatabase();
    setImportExportMessage(result.message);
    setTimeout(() => setImportExportMessage(''), 3000);
  };

  const handleImport = async () => {
    if (window.confirm('This will replace all current data. Are you sure you want to continue?')) {
      const result = await importDatabase();
      setImportExportMessage(result.message);
      setTimeout(() => setImportExportMessage(''), 3000);
      // Reload the page to refresh all data
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-br from-indigo-200 via-blue-100 via-pink-100 to-amber-100 backdrop-blur-md shadow-2xl text-black font-semibold tracking-wider" style={{ borderRight: '4px solid rgb(247, 206, 225)' }}>
        <div className="flex flex-col h-full">
          <div className="flex flex-col items-center justify-center py-8">
            <img src={logoImg} alt="Tiny Threads by Zirwa Logo" className="w-24 h-24 rounded-2xl shadow-md mx-auto" />
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            <Link to="/" className="flex items-center px-4 py-2 text-black rounded-lg hover:bg-indigo-600/70 transition duration-300">
              <HomeIcon className="w-6 h-6 mr-3" />
              Dashboard
            </Link>
            <Link to="/orders" className="flex items-center px-4 py-2 text-black rounded-lg hover:bg-indigo-600/70 transition duration-300">
              <ClipboardDocumentListIcon className="w-6 h-6 mr-3" />
              Orders
            </Link>
            <Link to="/orders/new" className="flex items-center px-4 py-2 text-black rounded-lg hover:bg-indigo-600/70 transition duration-300">
              <PlusCircleIcon className="w-6 h-6 mr-3" />
              New Order
            </Link>
            <Link to="/expenses" className="flex items-center px-4 py-2 text-black rounded-lg hover:bg-indigo-600/70 transition duration-300">
              <ChartBarIcon className="w-6 h-6 mr-3" />
              Expenses
            </Link>
            <Link to="/vendors" className="flex items-center px-4 py-2 text-black rounded-lg hover:bg-indigo-600/70 transition duration-300">
              <UsersIcon className="w-6 h-6 mr-3" />
              Vendors
            </Link>
            <Link to="/funds" className="flex items-center px-4 py-2 text-black rounded-lg hover:bg-indigo-600/70 transition duration-300">
              <CurrencyDollarIcon className="w-6 h-6 mr-3" />
              Owner Funds
            </Link>
            
            {/* Database Management Section */}
            <div className="pt-4 border-t border-indigo-600/40">
              <h3 className="px-4 py-2 text-black uppercase tracking-wider">
                Database Management
              </h3>
              <button
                onClick={handleExport}
                className="flex items-center w-full px-4 py-2 text-black rounded-lg hover:bg-indigo-600/70 transition duration-300"
              >
                <ArrowDownTrayIcon className="w-6 h-6 mr-3" />
                Export Database
              </button>
              <button
                onClick={handleImport}
                className="flex items-center w-full px-4 py-2 text-black rounded-lg hover:bg-indigo-600/70 transition duration-300"
              >
                <ArrowUpTrayIcon className="w-6 h-6 mr-3" />
                Import Database
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          {/* Import/Export Message */}
          {importExportMessage && (
            <div className={`mb-4 p-4 rounded-md ${
              importExportMessage.includes('successfully') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {importExportMessage}
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/orders/new" element={<OrderForm />} />
            <Route path="/orders/:id" element={<OrderForm />} />
            <Route path="/expenses" element={<ExpensesList />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/vendors/:id" element={<VendorDetails />} />
            <Route path="/funds" element={<Funds />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App; 