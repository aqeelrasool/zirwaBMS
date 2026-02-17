const Store = window.require('electron-store');
const { dialog } = window.require('@electron/remote');
const fs = window.require('fs');

const ordersStore = new Store({
  name: 'orders',
  defaults: {
    orders: []
  }
});

const expensesStore = new Store({
  name: 'expenses',
  defaults: {
    expenses: []
  }
});

const vendorsStore = new Store({
  name: 'vendors',
  defaults: {
    vendors: []
  }
});

const vendorTransactionsStore = new Store({
  name: 'vendor-transactions',
  defaults: {
    transactions: []
  }
});

const fundsStore = new Store({
  name: 'funds',
  defaults: {
    funds: []
  }
});

// Orders
export const getOrders = () => {
  return ordersStore.get('orders');
};

const removeVendorTransactionsByOrder = (orderId) => {
  const transactions = vendorTransactionsStore.get('transactions');
  vendorTransactionsStore.set('transactions', transactions.filter(t => t.orderId !== orderId));
};

const addVendorTransactionsForOrder = (order) => {
  if (!order || !order.expenses) return;
  const transactions = vendorTransactionsStore.get('transactions');
  const newTransactions = [...transactions];
  const vendors = getVendors();

  order.expenses.forEach((expense, index) => {
    if (expense && expense.vendorId) {
      const vendor = vendors.find(v => v.id === expense.vendorId);
      newTransactions.push({
        id: `${order.id}-${expense.id || index}-${Date.now()}`,
        orderId: order.id,
        vendorId: expense.vendorId,
        vendorName: expense.vendorName || vendor?.name || '',
        expenseId: expense.id || null,
        expenseDescription: expense.description,
        amount: Number(expense.amount) || 0,
        status: expense.vendorPaymentStatus || 'paid',
        createdAt: expense.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });

  vendorTransactionsStore.set('transactions', newTransactions);
};

const syncVendorTransactionsForOrder = (order) => {
  if (!order?.id) return;
  removeVendorTransactionsByOrder(order.id);
  addVendorTransactionsForOrder(order);
};

export const addOrder = (order) => {
  const orders = getOrders();
  const newOrder = {
    ...order,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    isCompleted: false
  };
  ordersStore.set('orders', [...orders, newOrder]);
  syncVendorTransactionsForOrder(newOrder);
  return newOrder;
};

export const updateOrder = (id, updates) => {
  const orders = getOrders();
  const updatedOrders = orders.map(order => 
    order.id === id ? { ...order, ...updates, updatedAt: new Date().toISOString() } : order
  );
  ordersStore.set('orders', updatedOrders);
  const updatedOrder = updatedOrders.find(order => order.id === id);
  syncVendorTransactionsForOrder(updatedOrder);
};

export const toggleOrderCompletion = (id) => {
  const orders = getOrders();
  const updatedOrders = orders.map(order => 
    order.id === id ? { ...order, isCompleted: !order.isCompleted, updatedAt: new Date().toISOString() } : order
  );
  ordersStore.set('orders', updatedOrders);
};

export const deleteOrder = (id) => {
  const orders = getOrders();
  ordersStore.set('orders', orders.filter(order => order.id !== id));
  removeVendorTransactionsByOrder(id);
};

// General expenses
export const getExpenses = () => {
  return expensesStore.get('expenses');
};

export const addExpense = (expense) => {
  const expenses = getExpenses();
  const newExpense = {
    ...expense,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  expensesStore.set('expenses', [...expenses, newExpense]);
  return newExpense;
};

export const updateExpense = (id, updates) => {
  const expenses = getExpenses();
  const updatedExpenses = expenses.map(expense => 
    expense.id === id ? { ...expense, ...updates, updatedAt: new Date().toISOString() } : expense
  );
  expensesStore.set('expenses', updatedExpenses);
};

export const deleteExpense = (id) => {
  const expenses = getExpenses();
  expensesStore.set('expenses', expenses.filter(expense => expense.id !== id));
};

// Vendors
export const getVendors = () => {
  return vendorsStore.get('vendors');
};

export const addVendor = (vendor) => {
  const vendors = getVendors();
  const newVendor = {
    ...vendor,
    name: vendor.name || vendor.vendorName || '',
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  vendorsStore.set('vendors', [...vendors, newVendor]);
  return newVendor;
};

export const updateVendor = (id, updates) => {
  const vendors = getVendors();
  const updatedVendors = vendors.map(vendor =>
    vendor.id === id
      ? {
          ...vendor,
          ...updates,
          name: updates.name || updates.vendorName || vendor.name || '',
          updatedAt: new Date().toISOString()
        }
      : vendor
  );
  vendorsStore.set('vendors', updatedVendors);
};

export const deleteVendor = (id) => {
  const vendors = getVendors();
  vendorsStore.set('vendors', vendors.filter(vendor => vendor.id !== id));
  const transactions = vendorTransactionsStore.get('transactions');
  vendorTransactionsStore.set('transactions', transactions.filter(t => t.vendorId !== id));
};

export const getVendorTransactions = (vendorId) => {
  const transactions = vendorTransactionsStore.get('transactions');
  if (!vendorId) return transactions;
  return transactions.filter(t => t.vendorId === vendorId);
};

export const updateVendorTransactionStatus = (transactionId, status) => {
  const transactions = vendorTransactionsStore.get('transactions');
  const updated = transactions.map(transaction =>
    transaction.id === transactionId ? { ...transaction, status, updatedAt: new Date().toISOString() } : transaction
  );
  vendorTransactionsStore.set('transactions', updated);

  const tx = updated.find(t => t.id === transactionId);
  if (!tx) return;

  // Also sync back to the related order expense
  const orders = getOrders();
  const updatedOrders = orders.map(order => {
    if (order.id !== tx.orderId) return order;
    const updatedExpenses = (order.expenses || []).map(expense => {
      // Prefer matching by explicit expenseId if available
      if (tx.expenseId && expense.id === tx.expenseId) {
        return { ...expense, vendorPaymentStatus: status };
      }
      // Fallback matching by vendorId + description + amount
      if (
        !tx.expenseId &&
        expense.vendorId === tx.vendorId &&
        expense.description === tx.expenseDescription &&
        Number(expense.amount) === Number(tx.amount)
      ) {
        return { ...expense, vendorPaymentStatus: status };
      }
      return expense;
    });
    return { ...order, expenses: updatedExpenses, updatedAt: new Date().toISOString() };
  });

  ordersStore.set('orders', updatedOrders);
};

// Owner funds
export const getFunds = () => {
  return fundsStore.get('funds');
};

export const addFundTransaction = (transaction) => {
  const funds = getFunds();
  const newTransaction = {
    ...transaction,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  fundsStore.set('funds', [...funds, newTransaction]);
  return newTransaction;
};

export const updateFundTransaction = (id, updates) => {
  const funds = getFunds();
  const updatedFunds = funds.map(fund =>
    fund.id === id ? { ...fund, ...updates, id: fund.id, updatedAt: new Date().toISOString() } : fund
  );
  fundsStore.set('funds', updatedFunds);
};

export const deleteFundTransaction = (id) => {
  const funds = getFunds();
  fundsStore.set('funds', funds.filter(fund => fund.id !== id));
};

// Database Import/Export Functions
export const exportDatabase = async () => {
  try {
    const orders = getOrders();
    const expenses = getExpenses();
    const vendors = getVendors();
    const vendorTransactions = getVendorTransactions();
    const funds = getFunds();
    
    const databaseData = {
      orders,
      expenses,
      vendors,
      vendorTransactions,
      funds,
      exportedAt: new Date().toISOString(),
      version: '1.1.0'
    };

    const result = await dialog.showSaveDialog({
      title: 'Export Database',
      defaultPath: `tinythreadsbyzirwa-accounts-backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(databaseData, null, 2));
      return { success: true, message: 'Database exported successfully!' };
    }
    return { success: false, message: 'Export cancelled.' };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: 'Failed to export database: ' + error.message };
  }
};

export const importDatabase = async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Import Database',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const databaseData = JSON.parse(fileContent);

      // Validate the imported data structure - more flexible validation
      if (!databaseData.orders || !Array.isArray(databaseData.orders)) {
        return { success: false, message: 'Invalid database file format: Missing or invalid orders data.' };
      }
      
      // Import the new data
      ordersStore.set('orders', databaseData.orders || []);
      expensesStore.set('expenses', databaseData.expenses || []);
      vendorsStore.set('vendors', databaseData.vendors || []);
      vendorTransactionsStore.set('transactions', databaseData.vendorTransactions || []);
      fundsStore.set('funds', databaseData.funds || []);
      
      const importedStats = {
        orders: databaseData.orders?.length || 0,
        expenses: databaseData.expenses?.length || 0,
        vendors: databaseData.vendors?.length || 0,
        vendorTransactions: databaseData.vendorTransactions?.length || 0,
        funds: databaseData.funds?.length || 0
      };

      return { 
        success: true, 
        message: `Database imported successfully! Orders: ${importedStats.orders}, Expenses: ${importedStats.expenses}, Vendors: ${importedStats.vendors}, Vendor Transactions: ${importedStats.vendorTransactions}, Funds: ${importedStats.funds}` 
      };
    }
    return { success: false, message: 'Import cancelled.' };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: 'Failed to import database: ' + error.message };
  }
}; 