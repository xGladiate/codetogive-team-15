'use client';

import React, { useState } from 'react';
import { Package, NewPackage } from '@/types/package';

interface PackageFormProps {
  editingPackage?: Package | null;
  onSubmit: (data: NewPackage) => Promise<boolean> | boolean;
  onCancel: () => void;
}

export const PackageForm: React.FC<PackageFormProps> = ({
  editingPackage,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<NewPackage>({
    name: editingPackage?.name || '',
    description: editingPackage?.description || '',
    picture_url: editingPackage?.picture_url || '',
    type: editingPackage?.type || 'core',
    amount: editingPackage?.amount || 0,
    additionalDescription: ''
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    
    try {
      const result = await onSubmit(formData);
      if (result) {
        onCancel(); // Close form on success
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof NewPackage) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const value = field === 'amount' ? parseInt(e.target.value) || 0 : e.target.value;
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border mb-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Package Category
          </label>
          <select
            value={formData.type}
            onChange={handleInputChange('type')}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="core">Core</option>
            <option value="community">Community</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title*
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={handleInputChange('name')}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (HK$)
          </label>
          <input
            type="number"
            min="0"
            value={formData.amount || ''}
            onChange={handleInputChange('amount')}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image Upload*
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center bg-gray-50">
            <div className="text-blue-500 text-4xl mb-2">📁</div>
            <div className="text-sm font-medium text-gray-700 mb-1">Select Files to Upload</div>
            <div className="text-xs text-gray-500">or drag and drop, Copy and Paste Files</div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Upload the cover image that best represent the package to be added.</p>
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">Or enter image URL:</label>
            <input
              type="url"
              value={formData.picture_url}
              onChange={handleInputChange('picture_url')}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description*
          </label>
          <textarea
            value={formData.description}
            onChange={handleInputChange('description')}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Description
          </label>
          <textarea
            value={formData.additionalDescription || ''}
            onChange={handleInputChange('additionalDescription')}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="The description here would be displayed in the payment section to provide donors with more details about the package (if applicable)"
          />
        </div>

        <div className="md:col-span-2 flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={isSubmitting}
            type="button"
          >
            {isSubmitting ? 'Saving...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
