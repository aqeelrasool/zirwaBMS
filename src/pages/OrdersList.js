import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, deleteOrder, toggleOrderCompletion, getVendors } from '../store';
import { PencilIcon, TrashIcon, EyeIcon, XMarkIcon, CheckCircleIcon, PrinterIcon } from '@heroicons/react/24/outline';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 15;

function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
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

  const calculateOrderReceivable = (order) => {
    const totalPayments = order.payments.reduce((sum, pay) => sum + Number(pay.amount), 0);
    const grandTotal = Number(order.orderTotal) + Number(order.receivedDeliveryCharges);
    return grandTotal - totalPayments;
  };

  const calculateOrderProfit = (order) => {
    const totalExpenses = order.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
      + Number(order.paidDeliveryCharges);
    const grandTotal = Number(order.orderTotal) + Number(order.receivedDeliveryCharges);
    return grandTotal - totalExpenses;
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const generateInvoiceHTML = (order) => {
    const totalPayments = (order.payments || []).reduce((sum, pay) => sum + Number(pay.amount), 0);
    const grandTotal = Number(order.orderTotal) + Number(order.receivedDeliveryCharges);
    const receivable = grandTotal - totalPayments;
    const totalExpenses = (order.expenses || []).reduce((sum, exp) => sum + Number(exp.amount), 0) + Number(order.paidDeliveryCharges);
    const profit = grandTotal - totalExpenses;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #333;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            color: #1f2937;
          }
          .header .invoice-title {
            font-size: 18px;
            margin-top: 5px;
          }
          .invoice-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .customer-info {
            margin-bottom: 20px;
          }
          .customer-info h3 {
            margin-top: 0;
            margin-bottom: 5px;
            font-size: 14px;
            color: #555;
          }
          .customer-info p {
            margin: 3px 0;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          td {
            background-color: #fafafa;
          }
          .amount-col {
            text-align: right;
          }
          .summary {
            margin: 20px 0;
            font-size: 13px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
          }
          .summary-row.total {
            font-weight: bold;
            font-size: 15px;
            border-bottom: 2px solid #333;
            padding-top: 10px;
          }
          .summary-row.final {
            font-weight: bold;
            font-size: 16px;
            border-bottom: 2px solid #333;
            color: ${profit >= 0 ? '#059669' : '#dc2626'};
          }
          .payment-section {
            margin: 20px 0;
            font-size: 13px;
          }
          .payment-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          @media print {
            body { margin: 0; }
            .container { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Tiny Threads By Zirwa</h1>
            <div class="invoice-title">INVOICE</div>
          </div>

          <div class="invoice-meta">
            <div>
              <strong>Invoice No:</strong> ${order.id.substring(0, 8)}<br>
              <strong>Date:</strong> ${new Date(order.createdAt || order.orderDate).toLocaleDateString()}
            </div>
            <div>
              <strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}
            </div>
          </div>

          <div class="customer-info">
            <h3>CUSTOMER INFO</h3>
            <p><strong>Name:</strong> ${order.customerName}</p>
            <p><strong>Phone:</strong> ${order.customerPhone}</p>
            <p><strong>Description:</strong> ${order.orderDescription}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="amount-col">Price</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(item => `
                <tr>
                  <td>${item.itemName}</td>
                  <td class="amount-col">PKR ${Number(item.itemPrice).toFixed(2)}</td>
                </tr>
              `).join('')}
              ${order.items && order.items.length > 0 ? '' : '<tr><td colspan="2"><em>No items listed</em></td></tr>'}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal (Items):</span>
              <span>PKR ${((order.items || []).reduce((sum, item) => sum + Number(item.itemPrice), 0)).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Order Total:</span>
              <span>PKR ${Number(order.orderTotal).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Delivery Charges:</span>
              <span>PKR ${Number(order.receivedDeliveryCharges).toFixed(2)}</span>
            </div>
            <div class="summary-row total">
              <span>Grand Total:</span>
              <span>PKR ${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div class="payment-section">
            <h3>PAYMENTS RECEIVED</h3>
            ${(order.payments && order.payments.length > 0) ? `
              ${(order.payments || []).map(payment => `
                <div class="payment-item">
                  <span>${new Date(payment.date).toLocaleDateString()}</span>
                  <span>PKR ${Number(payment.amount).toFixed(2)}</span>
                </div>
              `).join('')}
              <div class="payment-item" style="border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px; font-weight: bold;">
                <span>Total Paid:</span>
                <span>PKR ${totalPayments.toFixed(2)}</span>
              </div>
            ` : '<div class="payment-item"><em>No payments recorded</em></div>'}
          </div>

          <div class="summary">
            <div class="summary-row">
              <span>Pending Amount:</span>
              <span>PKR ${receivable.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintInvoice = async (order) => {
    try {
      // Create a temporary container for the invoice
      const invoiceHTML = generateInvoiceHTML(order);
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = invoiceHTML;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm';
      tempContainer.style.height = '297mm';
      document.body.appendChild(tempContainer);

      // Try to use html2pdf if available
      const html2pdf = window.html2pdf?.default || window.html2pdf;
      
      if (html2pdf) {
        const filename = `Invoice_${order.customerName.replace(/\s+/g, '_')}_${new Date(order.orderDate).toLocaleDateString().replace(/\//g, '-')}.pdf`;
        
        const opt = {
          margin: [10, 10, 10, 10],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };

        await html2pdf().set(opt).from(tempContainer).save();
      } else {
        // Fallback: Show message and offer print option
        alert('PDF library not loaded. The invoice will open in print dialog. You can save as PDF from your browser print settings (Ctrl+P or Cmd+P).');
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

      // Clean up
      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice: ' + error.message);
    }
  };

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      || order.customerPhone.includes(searchTerm);

    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'completed' && order.isCompleted)
      || (statusFilter === 'pending' && !order.isCompleted);

    return matchSearch && matchStatus;
  }), [orders, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Link to="/orders/new" className="btn-primary">
          New Order
        </Link>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            className="input-field md:max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            {[
              { label: 'All', value: 'all' },
              { label: 'Completed', value: 'completed' },
              { label: 'Pending', value: 'pending' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 text-sm font-medium ${statusFilter === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
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
              {paginatedOrders.map((order) => {
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
                      <button
                        onClick={() => handlePrintInvoice(order)}
                        className="text-green-600 hover:text-green-900 mr-4"
                        title="Print Invoice"
                      >
                        <PrinterIcon className="h-5 w-5 inline" />
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
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={safePage}
          totalItems={filteredOrders.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel="orders"
        />
      </div>

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

                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses</h3>
                  <div className="space-y-2">
                    {(selectedOrder.expenses || []).map((expense) => (
                      <div key={expense.id} className="space-y-1 border border-gray-100 rounded-md p-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{expense.description}</span>
                          <span className="font-medium">PKR {Number(expense.amount).toFixed(2)}</span>
                        </div>
                        {expense.vendorId && (
                          <div className="text-xs text-gray-500 flex justify-between">
                            <span>Vendor: {expense.vendorName || vendors.find((v) => v.id === expense.vendorId)?.vendorName || 'N/A'}</span>
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

                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payments</h3>
                  <div className="space-y-2">
                    {(selectedOrder.payments || []).map((payment) => (
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
