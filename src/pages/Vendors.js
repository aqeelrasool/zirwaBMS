import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getVendors,
  addVendor,
  updateVendor,
  deleteVendor,
} from '../store';
import { PlusIcon, TrashIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState({ name: '', contactNumber: '' });
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const refreshVendors = () => {
    setVendors(getVendors());
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
      refreshVendors();
    }
  };

  const totalPages = Math.max(1, Math.ceil(vendors.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedVendors = useMemo(
    () => vendors.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [vendors, safePage]
  );

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

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
              {paginatedVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-teal-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vendor.name || vendor.vendorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vendor.contactNumber || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link
                      to={`/vendors/${vendor.id}`}
                      className="text-green-600 hover:text-green-900"
                      title="View Account"
                    >
                      <EyeIcon className="h-5 w-5 inline" />
                    </Link>
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
              {paginatedVendors.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                    No vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={safePage}
          totalItems={vendors.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel="vendors"
        />
      </div>
    </div>
  );
};

export default Vendors;
