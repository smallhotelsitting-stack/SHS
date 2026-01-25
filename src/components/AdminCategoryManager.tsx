import React, { useState } from 'react';
import { X, Plus, Edit2, AlertCircle } from 'lucide-react';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (categoryName: string) => Promise<void>;
  existingCategories: string[];
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  existingCategories,
}: CreateCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInput = (name: string): string => {
    if (!name.trim()) {
      return 'Category name cannot be empty';
    }
    if (name.length > 20) {
      return 'Category name must be 20 characters or less';
    }
    if (existingCategories.some((cat) => cat.toLowerCase() === name.toLowerCase())) {
      return 'This category already exists';
    }
    const sanitized = name.replace(/<[^>]*>/g, '').trim();
    if (sanitized !== name) {
      return 'Category name contains invalid characters';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateInput(categoryName);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(categoryName);
      setCategoryName('');
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Create New Category</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Vehicles, Equipment, Services"
              maxLength={20}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={loading}
            />
            <div className="text-xs text-neutral-500 mt-1">
              {categoryName.length}/20 characters
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !categoryName.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AdminCategoryButtonProps {
  onOpenCreateModal: () => void;
  isAdmin: boolean;
}

export function AdminCategoryButton({ onOpenCreateModal, isAdmin }: AdminCategoryButtonProps) {
  if (!isAdmin) return null;

  return (
    <button
      onClick={onOpenCreateModal}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-200 transition-colors"
      title="Add new category"
    >
      <Plus size={16} />
      Add Category
    </button>
  );
}

interface CategoryPillProps {
  name: string;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  isAdmin: boolean;
}

export function CategoryPill({
  name,
  isSelected,
  onClick,
  onEdit,
  isAdmin,
}: CategoryPillProps) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <button
      className={`relative group inline-flex items-center px-6 py-3 rounded-full font-medium transition-all border-2 ${
        isSelected
          ? 'bg-primary-600 text-white border-primary-600 shadow-md'
          : 'bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-300'
      }`}
      onClick={onClick}
    >
      <span>{name}</span>

      {isAdmin && (
        <button
          onMouseEnter={() => setShowEdit(true)}
          onMouseLeave={() => setShowEdit(false)}
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className="ml-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edit form"
        >
          <Edit2 size={16} />
        </button>
      )}
    </button>
  );
}
