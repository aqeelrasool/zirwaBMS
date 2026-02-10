import React, { useState, useEffect } from 'react';
import Pagination from '../components/Pagination';
import { getExpenses, addExpense, deleteExpense } from '../store';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const PAGE_SIZE = 10;

function ExpensesList() {
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const allExpenses = getExpenses();
    setExpenses(allExpenses);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addExpense({
      ...formData,
      amount: Number(formData.amount)
    });
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowForm(false);
    loadExpenses();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
      loadExpenses();
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedExpenses = filteredExpenses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5 inline mr-2" />
          New Expense
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
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
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Add Expense
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search expenses..."
            className="input-field"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-tr from-amber-100 via-yellow-100 to-fuchsia-100 text-amber-800 font-bold uppercase tracking-wider border-b-2 border-yellow-300 shadow">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-amber-50 ring-1 ring-amber-50 rounded-xl border-yellow-100">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expense.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">PKR {expense.amount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600 hover:text-red-900 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                      <TrashIcon className="h-5 w-5 inline transition-transform duration-200 hover:scale-110" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedExpenses.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={safePage}
          totalItems={filteredExpenses.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel="expenses"
        />

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Total Expenses</span>
            <span className="text-lg font-semibold text-gray-900">PKR {totalExpenses.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpensesList; 