import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getVendors,
  getVendorTransactions,
  updateVendorTransactionStatus,
  getOrders,
} from '../store';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const currentVendor = getVendors().find((v) => v.id === id);
    setVendor(currentVendor || null);
    setOrders(getOrders());
  }, [id, refreshKey]);

  const vendorTransactions = useMemo(() => {
    if (!vendor) return [];
    return getVendorTransactions(vendor.id);
  }, [vendor, refreshKey]);

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
    setRefreshKey((prev) => prev + 1);
  };

  const totalPages = Math.max(1, Math.ceil(vendorTransactions.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTransactions = vendorTransactions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  if (!vendor) {
    return (
      <div className="card">
        <p className="text-gray-600 mb-4">Vendor not found.</p>
        <Link to="/vendors" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Vendors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{vendor.vendorName || vendor.name}</h1>
          <p className="text-sm text-gray-500">{vendor.contactNumber}</p>
        </div>
        <Link to="/vendors" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card rounded-xl shadow-md border border-gray-100">
          <p className="text-sm text-gray-500">Total Assigned</p>
          <p className="text-2xl font-semibold text-gray-900">PKR {vendorTotals.totalAssigned.toFixed(2)}</p>
        </div>
        <div className="card rounded-xl shadow-md border border-gray-100">
          <p className="text-sm text-gray-500">Total Paid</p>
          <p className="text-2xl font-semibold text-green-600">PKR {vendorTotals.totalPaid.toFixed(2)}</p>
        </div>
        <div className="card rounded-xl shadow-md border border-gray-100">
          <p className="text-sm text-gray-500">Total Pending</p>
          <p className="text-2xl font-semibold text-yellow-600">PKR {vendorTotals.totalPending.toFixed(2)}</p>
        </div>
      </div>

      <div className="card rounded-xl shadow-md border border-gray-100">
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
              {paginatedTransactions.map((transaction) => {
                const order = ordersById[transaction.orderId];
                return (
                  <tr
                    key={transaction.id}
                    className={
                      `hover:bg-gray-50 transition-colors duration-200 ${
                        transaction.status === 'paid'
                          ? 'bg-green-50 border-l-4 border-green-300'
                          : transaction.status === 'pending'
                            ? 'bg-red-50 border-l-4 border-red-300'
                            : ''
                      }`
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
                          <div className="text-xs text-gray-500">Customer: {order.customerName}</div>
                          <div className="text-xs text-gray-500">Order: {order.orderDescription}</div>
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
                        {transaction.status === 'paid' ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : null}
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
                );
              })}
              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No transactions found for this vendor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={safePage}
          totalItems={vendorTransactions.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel="transactions"
        />
      </div>
    </div>
  );
}

export default VendorDetails;
