import React, { useState, useEffect } from 'react';
import { getOrders, getExpenses, getFunds } from '../store';
import { Link } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalReceivables: 0,
    totalProfit: 0,
    totalExpenses: 0,
    totalSales: 0,
    cashInHand: 0,
    totalOwnerDeposits: 0,
    totalOwnerWithdrawals: 0,
    recentOrders: [],
    totalPayables: 0
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = () => {
    setLoading(true);
    const orders = getOrders();
    const expenses = getExpenses();
    const funds = getFunds();

    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => {
      const grandTotal = Number(order.orderTotal) + Number(order.receivedDeliveryCharges);
      return sum + grandTotal;
    }, 0);

    const totalReceivables = orders.reduce((sum, order) => {
      const totalPayments = order.payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
      const grandTotal = Number(order.orderTotal) + Number(order.receivedDeliveryCharges);
      return sum + (grandTotal - totalPayments);
    }, 0);

    // Calculate total payments received
    const totalPaymentsReceived = orders.reduce((sum, order) => {
      const totalPayments = order.payments.reduce((pSum, p) => pSum + Number(p.amount), 0);
      return sum + totalPayments;
    }, 0);

    // === LOGIC CHANGE ===
    // totalExpenses, totalProfit, etc. should always count ALL expenses regardless of paid status.
    const totalOrderExpenses = orders.reduce((sum, order) => {
      const orderExpenses = order.expenses.reduce((eSum, e) => eSum + Number(e.amount), 0);
      return sum + orderExpenses + Number(order.paidDeliveryCharges);
    }, 0);

    const totalGeneralExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const totalExpenses = totalOrderExpenses + totalGeneralExpenses;

    const totalOwnerDeposits = funds
      .filter((fund) => fund.type === 'deposit')
      .reduce((sum, fund) => sum + Number(fund.amount), 0);

    const totalOwnerWithdrawals = funds
      .filter((fund) => fund.type === 'withdraw')
      .reduce((sum, fund) => sum + Number(fund.amount), 0);

    // === LOGIC CHANGE ===
    // cashInHand metric should only include paid vendor expenses (exclude pending)
    const paidOrderExpenses = orders.reduce((sum, order) => {
      const paidExpenses = order.expenses
        .filter((e) => !e.vendorId || e.vendorPaymentStatus === 'paid')
        .reduce((eSum, e) => eSum + Number(e.amount), 0);
      return sum + paidExpenses + Number(order.paidDeliveryCharges);
    }, 0);
    const paidGeneralExpenses = totalGeneralExpenses; // General expenses are always considered paid
    const paidTotalExpenses = paidOrderExpenses + paidGeneralExpenses;

    const cashInHand = totalPaymentsReceived + totalOwnerDeposits - totalOwnerWithdrawals - paidTotalExpenses;
    const totalProfit = totalSales - totalExpenses;

    // Calculate payables (pending vendor expenses only)
    const totalPayables = orders.reduce((sum, order) => {
      return (
        sum +
        order.expenses
          .filter(e => e.vendorId && e.vendorPaymentStatus !== 'paid')
          .reduce((s, e) => s + Number(e.amount), 0)
      );
    }, 0);

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
      .slice(0, 5);

    setMetrics({
      totalOrders,
      totalReceivables,
      totalProfit,
      totalExpenses,
      totalSales,
      cashInHand,
      totalOwnerDeposits,
      totalOwnerWithdrawals,
      recentOrders,
      totalPayables
    });
    setLoading(false);
  };

  const MetricCard = ({ title, value, icon: Icon, trend, trendValue, gradient, textColor, unit='PKR' }) => (
    <div className={`rounded-2xl shadow-xl p-6 bg-gradient-to-tr ${gradient} hover:scale-105 transition-transform duration-300 cursor-pointer`}>
      <div className="flex items-center">
        <div className="p-3 rounded-full backdrop-blur bg-white/25 flex items-center justify-center">
          <Icon className="h-8 w-8" />
        </div>
        <div className="ml-4">
          <p className={`text-sm font-semibold uppercase ${textColor} drop-shadow-sm tracking-widest`}>{title}</p>
          <p className={`text-2xl font-black drop-shadow-lg ${textColor}`}>{unit} {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-200' : 'text-red-200'}`}>
              {trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              {trendValue}%
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders}
          icon={ClipboardDocumentListIcon}
          gradient="from-indigo-400 to-blue-500"
          textColor="text-white"
          unit="Orders"
        />
        <MetricCard
          title="Total Sales"
          value={metrics.totalSales}
          icon={ShoppingCartIcon}
          gradient="from-blue-400 to-teal-500"
          textColor="text-white"
        />
        <MetricCard
          title="Total Receivables"
          value={metrics.totalReceivables}
          icon={CurrencyDollarIcon}
          gradient="from-sky-400 to-fuchsia-400"
          textColor="text-white"
        />
        <MetricCard
          title="Total Expenses"
          value={metrics.totalExpenses}
          icon={CurrencyDollarIcon}
          gradient="from-rose-400 to-amber-400"
          textColor="text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Profit"
          value={metrics.totalProfit}
          icon={CurrencyDollarIcon}
          trend={metrics.totalProfit >= 0 ? 'up' : 'down'}
          trendValue={Math.abs((metrics.totalProfit / (metrics.totalExpenses || 1)) * 100).toFixed(1)}
          gradient="from-green-400 to-emerald-500"
          textColor="text-white"
        />
        <MetricCard
          title="Owner Funds Added"
          value={metrics.totalOwnerDeposits}
          icon={CurrencyDollarIcon}
          gradient="from-purple-500 to-violet-500"
          textColor="text-white"
        />
        <MetricCard
          title="Owner Funds Withdrawn"
          value={metrics.totalOwnerWithdrawals}
          icon={CurrencyDollarIcon}
          gradient="from-rose-600 to-yellow-400"
          textColor="text-white"
        />
        <MetricCard
          title="Total Payables"
          value={metrics.totalPayables || 0}
          icon={CurrencyDollarIcon}
          gradient="from-amber-400 to-yellow-300"
          textColor="text-white"
          theme="yellow"
        />
        <MetricCard
          title="Cash in Hand"
          value={metrics.cashInHand}
          icon={BanknotesIcon}
          trend={metrics.cashInHand >= 0 ? 'up' : 'down'}
          trendValue={Math.abs((metrics.cashInHand / (metrics.totalExpenses || 1)) * 100).toFixed(1)}
          gradient="from-cyan-400 to-teal-500"
          textColor="text-white"
        />
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
          <Link to="/orders" className="text-primary-600 hover:text-primary-900">
            View all orders
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receivable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit/Loss
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
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
                    <div className="text-sm text-gray-900">PKR {order.receivable.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      PKR {order.profit.toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 