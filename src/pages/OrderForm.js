import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrders, addOrder, updateOrder, getVendors } from '../store';
import { PlusIcon, XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';

function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    orderDescription: '',
    orderDate: new Date().toISOString().split('T')[0],
    orderTotal: 0,
    receivedDeliveryCharges: 0,
    paidDeliveryCharges: 0,
    expenses: [],
    payments: []
  });

  const [vendors, setVendors] = useState([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, vendorId: '', vendorPaymentStatus: 'paid' });
  const [newPayment, setNewPayment] = useState({ date: new Date().toISOString().split('T')[0], amount: 0 });
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [editPaymentId, setEditPaymentId] = useState(null);

  useEffect(() => {
    setVendors(getVendors());
    if (isEditing) {
      const orders = getOrders();
      const order = orders.find(o => o.id === id);
      if (order) {
        setFormData({
          ...order,
          expenses: (order.expenses || []).map(exp => ({
            ...exp,
            id: exp.id || `${Date.now()}-${Math.random()}`
          })),
          payments: order.payments || []
        });
      }
    }
  }, [id, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddExpense = () => {
    if (newExpense.description && newExpense.amount > 0) {
      const selectedVendor = vendors.find(v => v.id === newExpense.vendorId);
      setFormData(prev => ({
        ...prev,
        expenses: [
          ...prev.expenses,
          {
            ...newExpense,
            amount: Number(newExpense.amount),
            id: Date.now().toString(),
            vendorName: selectedVendor?.vendorName || selectedVendor?.name || ''
          }
        ]
      }));
      setNewExpense({ description: '', amount: 0, vendorId: '', vendorPaymentStatus: 'paid' });
    }
  };

  const handleRemoveExpense = (expenseId) => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== expenseId)
    }));
  };

  const handleAddPayment = () => {
    if (newPayment.amount > 0) {
      setFormData(prev => ({
        ...prev,
        payments: [...prev.payments, { ...newPayment, id: Date.now() }]
      }));
      setNewPayment({ date: new Date().toISOString().split('T')[0], amount: 0 });
    }
  };

  const handleRemovePayment = (paymentId) => {
    setFormData(prev => ({
      ...prev,
      payments: prev.payments.filter(p => p.id !== paymentId)
    }));
  };

  const calculateReceivable = () => {
    const totalPayments = formData.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const grandTotal = Number(formData.orderTotal) + Number(formData.receivedDeliveryCharges);
    return grandTotal - totalPayments;
  };

  const calculateProfit = () => {
    const totalExpenses = formData.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0) +
      Number(formData.paidDeliveryCharges);
    const grandTotal = Number(formData.orderTotal) + Number(formData.receivedDeliveryCharges);
    return grandTotal - totalExpenses;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const orderData = {
      ...formData,
      orderTotal: Number(formData.orderTotal),
      receivedDeliveryCharges: Number(formData.receivedDeliveryCharges),
      paidDeliveryCharges: Number(formData.paidDeliveryCharges),
      expenses: formData.expenses.map(exp => ({
        ...exp,
        amount: Number(exp.amount),
        vendorPaymentStatus: exp.vendorPaymentStatus || 'paid'
      })),
      payments: formData.payments.map(pay => ({
        ...pay,
        amount: Number(pay.amount)
      })),
      receivable: calculateReceivable(),
      profit: calculateProfit()
    };

    if (isEditing) {
      updateOrder(id, orderData);
    } else {
      addOrder(orderData);
    }
    navigate('/orders');
  };

  // Expense Editing Logic
  const handleEditExpense = (expense) => {
    setEditExpenseId(expense.id);
    setNewExpense({
      description: expense.description,
      amount: expense.amount,
      vendorId: expense.vendorId || '',
      vendorPaymentStatus: expense.vendorPaymentStatus || 'paid',
    });
  };
  const handleUpdateExpense = () => {
    setFormData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === editExpenseId ? { ...e, ...newExpense, amount: Number(newExpense.amount) } : e)
    }));
    setEditExpenseId(null);
    setNewExpense({ description: '', amount: 0, vendorId: '', vendorPaymentStatus: 'paid' });
  };
  // Payment Editing Logic
  const handleEditPayment = (payment) => {
    setEditPaymentId(payment.id);
    setNewPayment({ date: payment.date, amount: payment.amount });
  };
  const handleUpdatePayment = () => {
    setFormData(prev => ({
      ...prev,
      payments: prev.payments.map(p => p.id === editPaymentId ? { ...p, ...newPayment, amount: Number(newPayment.amount) } : p)
    }));
    setEditPaymentId(null);
    setNewPayment({ date: new Date().toISOString().split('T')[0], amount: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {isEditing ? 'Edit Order' : 'New Order'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Order Description</label>
            <textarea
              name="orderDescription"
              value={formData.orderDescription}
              onChange={handleInputChange}
              className="input-field"
              rows="3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Order Date</label>
              <input
                type="date"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Order Total Amount</label>
              <input
                type="number"
                name="orderTotal"
                value={formData.orderTotal}
                onChange={handleInputChange}
                className="input-field"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Received Delivery Charges</label>
              <input
                type="number"
                name="receivedDeliveryCharges"
                value={formData.receivedDeliveryCharges}
                onChange={handleInputChange}
                className="input-field"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Paid Delivery Charges</label>
              <input
                type="number"
                name="paidDeliveryCharges"
                value={formData.paidDeliveryCharges}
                onChange={handleInputChange}
                className="input-field"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Expenses</h2>
          <div className="space-y-4">
            {formData.expenses.map(expense => (
              <div key={expense.id} className={`space-y-2 border border-gray-100 rounded-lg p-4 ${editExpenseId === expense.id ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center space-x-4">
                  {editExpenseId === expense.id ? (
                    <>
                      <input
                        type="text"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                        className="input-field"
                      />
                      <input
                        type="number"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                        className="input-field"
                        min="0"
                        step="0.01"
                      />
                      <select
                        value={newExpense.vendorId}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, vendorId: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Select Vendor (optional)</option>
                        {vendors.map(vendor => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.vendorName || vendor.name || vendor.contactNumber}
                          </option>
                        ))}
                      </select>
                      <input
                        type="checkbox"
                        checked={newExpense.vendorPaymentStatus === 'paid'}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, vendorPaymentStatus: e.target.checked ? 'paid' : 'pending' }))}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={handleUpdateExpense}
                        className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold mr-2 shadow hover:bg-green-200"
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditExpenseId(null);
                          setNewExpense({ description: '', amount: 0, vendorId: '', vendorPaymentStatus: 'paid' });
                        }}
                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold shadow hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={expense.description}
                        readOnly
                        className="input-field"
                      />
                      <input
                        type="number"
                        value={expense.amount}
                        readOnly
                        className="input-field"
                      />
                      <span>Vendor: {expense.vendorName || vendors.find(v => v.id === expense.vendorId)?.vendorName || vendors.find(v => v.id === expense.vendorId)?.name || 'N/A'}</span>
                      <span>Status: <span className={expense.vendorPaymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}>{expense.vendorPaymentStatus || 'paid'}</span></span>
                      <button
                        type="button"
                        onClick={() => handleEditExpense(expense)}
                        className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold mr-2 shadow hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExpense(expense.id)}
                        className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold shadow hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Expense description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="w-32">
                <input
                  type="number"
                  placeholder="Amount"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex-1">
                <select
                  value={newExpense.vendorId}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, vendorId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select Vendor (optional)</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.vendorName || vendor.name || vendor.contactNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32 flex items-center">
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={newExpense.vendorPaymentStatus === 'paid'}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, vendorPaymentStatus: e.target.checked ? 'paid' : 'pending' }))}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span>{newExpense.vendorPaymentStatus === 'paid' ? 'Paid' : 'Pending'}</span>
                </label>
              </div>
              <button
                type="button"
                onClick={handleAddExpense}
                className="text-primary-600 hover:text-primary-900"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Payments Section */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payments</h2>
          <div className="space-y-4">
            {formData.payments.map(payment => (
              <div key={payment.id} className={`flex items-center space-x-4 ${editPaymentId === payment.id ? 'bg-blue-50' : ''}`}>
                <div className="flex-1">
                  <input
                    type="date"
                    value={payment.date}
                    readOnly
                    className="input-field"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    value={payment.amount}
                    readOnly
                    className="input-field"
                  />
                </div>
                {editPaymentId === payment.id ? (
                  <>
                    <input
                      type="date"
                      value={newPayment.date}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, date: e.target.value }))}
                      className="input-field"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                      className="input-field"
                      min="0"
                      step="0.01"
                    />
                    <button
                      type="button"
                      onClick={handleUpdatePayment}
                      className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold mr-2 shadow hover:bg-green-200"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditPaymentId(null);
                        setNewPayment({ date: new Date().toISOString().split('T')[0], amount: 0 });
                      }}
                      className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold shadow hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEditPayment(payment)}
                      className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold mr-2 shadow hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePayment(payment.id)}
                      className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-semibold shadow hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, date: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="w-32">
                <input
                  type="number"
                  placeholder="Amount"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPayment}
                className="text-primary-600 hover:text-primary-900"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Total:</span>
              <span className="font-medium">PKR {Number(formData.orderTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Charges Received:</span>
              <span className="font-medium">PKR {Number(formData.receivedDeliveryCharges).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-900 font-medium">Grand Total:</span>
              <span className="font-medium">PKR {(Number(formData.orderTotal) + Number(formData.receivedDeliveryCharges)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Expenses:</span>
              <span className="font-medium">PKR {(formData.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0) + Number(formData.paidDeliveryCharges)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Payments:</span>
              <span className="font-medium">PKR {formData.payments.reduce((sum, pay) => sum + Number(pay.amount), 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Receivable:</span>
              <span className="font-medium">PKR {calculateReceivable().toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-900 font-medium">Net Profit:</span>
              <span className={`font-medium ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                PKR {calculateProfit().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            {isEditing ? 'Update Order' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default OrderForm; 