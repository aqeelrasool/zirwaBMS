import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getVendors,
  addVendor,
  updateVendor,
  deleteVendor,
  getVendorTransactions,
  updateVendorTransactionStatus,
  getOrders,
} from '../store';
import { PlusIcon, TrashIcon, PencilIcon, EyeIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const Vendors = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({ name: '', contactNumber: '' });
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const refreshVendors = () => {
    setVendors(getVendors());
    setOrders(getOrders());
  };

  useEffect(() => {
    refreshVendors();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contactNumber) return;

    if (editingVendorId) {
      updateVendor(editingVendorId, formData);
    } else {
      addVendor(formData);
    }
    setFormData({ name: '', contactNumber: '' });
    setEditingVendorId(null);
    refreshVendors();
  };

  const handleEdit = (vendor) => {
    setEditingVendorId(vendor.id);
    setFormData({
      name: vendor.name || vendor.vendorName || '',
      contactNumber: vendor.contactNumber || '',
    });
  };

  const handleDelete = (vendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor? This will remove their transactions as well.')) {
      deleteVendor(vendorId);
      if (selectedVendor?.id === vendorId) {
        setShowDetails(false);
        setSelectedVendor(null);
      }
      refreshVendors();
    }
  };

  const openVendorDetails = (vendor) => {
    setSelectedVendor(vendor);
    setShowDetails(true);
  };

  const vendorTransactions = useMemo(() => {
    if (!selectedVendor) return [];
    return getVendorTransactions(selectedVendor.id);
  }, [selectedVendor]);

  const ordersById = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      map[order.id] = order;
    });
    return map;
  }, [orders]);

  const vendorTotals = useMemo(() => {
    const totalAssigned = vendorTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalPaid = vendorTransactions
      .filter((tx) => tx.status === 'paid')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalPending = totalAssigned - totalPaid;
    return { totalAssigned, totalPaid, totalPending };
  }, [vendorTransactions]);

  const toggleTransactionStatus = (transaction) => {
    const newStatus = transaction.status === 'paid' ? 'pending' : 'paid';
    updateVendorTransactionStatus(transaction.id, newStatus);
    setSelectedVendor((prev) => (prev ? { ...prev } : prev));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{editingVendorId ? 'Edit Vendor' : 'Add Vendor'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
              <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
            <input
              type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              type="text"
              value={formData.contactNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, contactNumber: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div className="flex items-end space-x-3">
            <button type="submit" className="btn-primary flex items-center space-x-2">
              <PlusIcon className="h-5 w-5" />
              <span>{editingVendorId ? 'Update Vendor' : 'Add Vendor'}</span>
            </button>
            {editingVendorId && (
              <button
                type="button"
                onClick={() => {
                  setEditingVendorId(null);
                  setFormData({ name: '', contactNumber: '' });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Vendor List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-tr from-teal-100 via-green-100 to-cyan-100 text-teal-700 font-bold uppercase tracking-wider border-b-2 border-teal-200 shadow">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-teal-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vendor.name || vendor.vendorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vendor.contactNumber || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => openVendorDetails(vendor)}
                      className="text-green-600 hover:text-green-900"
                      title="View Account"
                    >
                      <EyeIcon className="h-5 w-5 inline" />
                    </button>
                    <button
                      onClick={() => handleEdit(vendor)}
                      className="text-primary-600 hover:text-primary-900"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Details Modal */}
      {showDetails && selectedVendor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedVendor.vendorName || selectedVendor.name}</h2>
                  <p className="text-sm text-gray-500">{selectedVendor.contactNumber}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedVendor(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card rounded-xl shadow-md border border-gray-100 mb-6">
                  <p className="text-sm text-gray-500">Total Assigned</p>
                  <p className="text-2xl font-semibold text-gray-900">PKR {vendorTotals.totalAssigned.toFixed(2)}</p>
                </div>
                <div className="card rounded-xl shadow-md border border-gray-100 mb-6">
                  <p className="text-sm text-gray-500">Total Paid</p>
                  <p className="text-2xl font-semibold text-green-600">PKR {vendorTotals.totalPaid.toFixed(2)}</p>
                </div>
                <div className="card rounded-xl shadow-md border border-gray-100 mb-6">
                  <p className="text-sm text-gray-500">Total Pending</p>
                  <p className="text-2xl font-semibold text-yellow-600">PKR {vendorTotals.totalPending.toFixed(2)}</p>
                </div>
              </div>

              <div className="card rounded-xl shadow-md border border-gray-100 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendorTransactions.map((transaction) => {
                        const order = ordersById[transaction.orderId];
                        return (
                        <tr
  key={transaction.id}
  className={
    `hover:bg-gray-50 transition-colors duration-200 ` +
    (transaction.status === 'paid' ? 'bg-green-50 border-l-4 border-green-300' : transaction.status === 'pending' ? 'bg-red-50 border-l-4 border-red-300' : '')
  }
>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className="text-sm font-medium text-gray-900 cursor-pointer hover:underline"
                              onClick={() => navigate(`/orders/${transaction.orderId}`)}
                            >
                              {transaction.expenseDescription}
                            </div>
                            {order && (
                              <>
                                <div className="text-xs text-gray-500">
                                  Customer: {order.customerName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Order: {order.orderDescription}
                                </div>
                              </>
                            )}
                            <div className="text-xs text-gray-400">Order ID: {transaction.orderId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">PKR {Number(transaction.amount).toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm border transition-all duration-150
                                ${transaction.status === 'paid'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                }`}
                            >
                              {transaction.status === 'paid' ? (
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                              ) : null}
                              {transaction.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => toggleTransactionStatus(transaction)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Mark as {transaction.status === 'paid' ? 'Pending' : 'Paid'}
                            </button>
                          </td>
                        </tr>
                      )})}
                      {vendorTransactions.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                            No transactions found for this vendor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;

