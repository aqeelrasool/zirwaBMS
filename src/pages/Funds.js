import React, { useEffect, useState } from 'react';
import { getFunds, addFundTransaction, updateFundTransaction, deleteFundTransaction } from '../store';
import { PlusIcon, ArrowsUpDownIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const Funds = () => {
  const [funds, setFunds] = useState([]);
  const [formData, setFormData] = useState({
    type: 'deposit',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [editFundId, setEditFundId] = useState(null);

  const refreshFunds = () => {
    setFunds(getFunds());
  };

  useEffect(() => {
    refreshFunds();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    // Use chosen date (as yyyy-MM-dd) at 00:00 local time
    let createdAt = formData.date ? new Date(formData.date + 'T00:00:00').toISOString() : new Date().toISOString();

    if (editFundId) {
      updateFundTransaction(editFundId, {
        ...formData,
        amount: Number(formData.amount),
        createdAt
      });
      setEditFundId(null);
    } else {
      addFundTransaction({
        ...formData,
        amount: Number(formData.amount),
        createdAt
      });
    }
    setFormData({ type: 'deposit', description: '', amount: '', date: new Date().toISOString().slice(0, 10) });
    refreshFunds();
  };

  const totalDeposits = funds
    .filter((fund) => fund.type === 'deposit')
    .reduce((sum, fund) => sum + Number(fund.amount), 0);

  const totalWithdrawals = funds
    .filter((fund) => fund.type === 'withdraw')
    .reduce((sum, fund) => sum + Number(fund.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Owner Funds</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Funds Added</p>
          <p className="text-2xl font-semibold text-green-600">PKR {totalDeposits.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Funds Withdrawn</p>
          <p className="text-2xl font-semibold text-red-600">PKR {totalWithdrawals.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Net Owner Funds</p>
          <p className="text-2xl font-semibold text-gray-900">
            PKR {(totalDeposits - totalWithdrawals).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Add Owner Funds Transaction</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
              className="input-field"
            >
              <option value="deposit">Funds Added</option>
              <option value="withdraw">Funds Withdrawn</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              className="input-field"
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div className="flex items-end space-x-3">
            <button type="submit" className="btn-primary flex items-center space-x-2">
              <PlusIcon className="h-5 w-5" />
              <span>Add Transaction</span>
            </button>
            <button
              type="button"
              onClick={() => { setFormData({ type: 'deposit', description: '', amount: '', date: new Date().toISOString().slice(0, 10) }); setEditFundId(null); }}
              className="btn-secondary"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Funds History</h2>
            <p className="text-sm text-gray-500">Track funds added or withdrawn by the owner.</p>
          </div>
          <ArrowsUpDownIcon className="h-6 w-6 text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-tr from-purple-100 via-indigo-100 to-blue-100 text-purple-700 uppercase shadow border-b-2 border-purple-200 font-bold">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {funds.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No fund transactions recorded yet.
                  </td>
                </tr>
              )}
              {funds.map((fund) => (
                <tr key={fund.id} className={`hover:bg-violet-50 ring-1 ring-purple-50 ${fund.id % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fund.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        fund.type === 'deposit'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {fund.type === 'deposit' ? 'Funds Added' : 'Funds Withdrawn'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">PKR {Number(fund.amount).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(fund.createdAt).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                    <button
                      className="text-primary-600 hover:text-primary-900"
                      onClick={() => {
                        setEditFundId(fund.id);
                        setFormData({
                          type: fund.type,
                          description: fund.description,
                          amount: fund.amount.toString(),
                          date: fund.createdAt ? new Date(fund.createdAt).toISOString().slice(0,10) : new Date().toISOString().slice(0,10)
                        });
                      }}
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => {
                        if (window.confirm('Delete this fund transaction?')) {
                          deleteFundTransaction(fund.id);
                          refreshFunds();
                          if(editFundId === fund.id){ setEditFundId(null); setFormData({ type: 'deposit', description: '', amount: '', date: new Date().toISOString().slice(0,10) }); }
                        }
                      }}
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Funds;

