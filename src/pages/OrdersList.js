import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, deleteOrder, toggleOrderCompletion, getVendors } from '../store';
import { PencilIcon, TrashIcon, EyeIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadOrders();
    setVendors(getVendors());
  }, []);

  const loadOrders = () => {
    const allOrders = getOrders();
    setOrders(allOrders);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteOrder(id);
      loadOrders();
    }
  };

  const handleToggleCompletion = (id) => {
    toggleOrderCompletion(id);
    loadOrders();
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const calculateOrderReceivable = (order) => {
    const totalPayments = order.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const grandTotal = Number(order.orderTotal) + Number(order.receivedDeliveryCharges);
    return grandTotal - totalPayments;
  };

  const calculateOrderProfit = (order) => {
    const totalExpenses = order.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0) + 
                         Number(order.paidDeliveryCharges);
    const grandTotal = Number(order.orderTotal) + Number(order.receivedDeliveryCharges);
    return grandTotal - totalExpenses;
  };

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerPhone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Link to="/orders/new" className="btn-primary">
          New Order
        </Link>
      </div>

      <div className="card">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            className="input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-tr from-indigo-100 via-sky-100 to-teal-100 text-indigo-800 font-bold uppercase shadow tracking-wider text-sm border-b-2 border-indigo-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receivable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit/Loss
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const profit = calculateOrderProfit(order);
                return (
                  <tr key={order.id} className={`hover:bg-indigo-50 ${order.isCompleted ? 'bg-green-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleCompletion(order.id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.isCompleted
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {order.isCompleted ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Completed
                          </>
                        ) : (
                          'Pending'
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">PKR {calculateOrderReceivable(order).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        PKR {profit.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        <EyeIcon className="h-5 w-5 inline" />
                      </button>
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        <PencilIcon className="h-5 w-5 inline" />
                      </Link>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Information */}
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-base font-medium">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-base font-medium">{selectedOrder.customerPhone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Order Description</p>
                      <p className="text-base font-medium">{selectedOrder.orderDescription}</p>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Total:</span>
                      <span className="font-medium">PKR {Number(selectedOrder.orderTotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Charges Received:</span>
                      <span className="font-medium">PKR {Number(selectedOrder.receivedDeliveryCharges).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-900 font-medium">Grand Total:</span>
                      <span className="font-medium">PKR {(Number(selectedOrder.orderTotal) + Number(selectedOrder.receivedDeliveryCharges)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses */}
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses</h3>
                  <div className="space-y-2">
                    {(selectedOrder.expenses || []).map(expense => (
                      <div key={expense.id} className="space-y-1 border border-gray-100 rounded-md p-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{expense.description}</span>
                          <span className="font-medium">PKR {Number(expense.amount).toFixed(2)}</span>
                        </div>
                        {expense.vendorId && (
                          <div className="text-xs text-gray-500 flex justify-between">
                            <span>Vendor: {expense.vendorName || vendors.find(v => v.id === expense.vendorId)?.vendorName || 'N/A'}</span>
                            <span>Status: <span className={expense.vendorPaymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}>{expense.vendorPaymentStatus || 'paid'}</span></span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Paid Delivery Charges:</span>
                      <span className="font-medium">PKR {Number(selectedOrder.paidDeliveryCharges).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-900 font-medium">Total Expenses:</span>
                      <span className="font-medium">PKR {(((selectedOrder.expenses || []).reduce((sum, exp) => sum + Number(exp.amount), 0)) + Number(selectedOrder.paidDeliveryCharges)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payments */}
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payments</h3>
                  <div className="space-y-2">
                    {(selectedOrder.payments || []).map(payment => (
                      <div key={payment.id} className="flex justify-between">
                        <span className="text-gray-600">{new Date(payment.date).toLocaleDateString()}</span>
                        <span className="font-medium">PKR {Number(payment.amount).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-900 font-medium">Total Payments:</span>
                      <span className="font-medium">PKR {(selectedOrder.payments || []).reduce((sum, pay) => sum + Number(pay.amount), 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Final Summary */}
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Final Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Receivable:</span>
                      <span className="font-medium">PKR {calculateOrderReceivable(selectedOrder).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-900 font-medium">Net Profit/Loss:</span>
                      <span className={`font-medium ${calculateOrderProfit(selectedOrder) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        PKR {calculateOrderProfit(selectedOrder).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersList; 