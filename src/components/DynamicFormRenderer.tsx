import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { FormField } from './FormBuilder';

interface FormErrors {
  [fieldId: string]: string;
}

interface DynamicFormRendererProps {
  fields: FormField[];
  onSubmit: (formData: Record<string, any>) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
}

export function DynamicFormRenderer({
  fields,
  onSubmit,
  isLoading = false,
  submitButtonText = 'Submit',
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');

  const validateField = (field: FormField, value: any): string => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (field.type === 'text' && value) {
      if (field.minLength && value.length < field.minLength) {
        return `${field.label} must be at least ${field.minLength} characters`;
      }
      if (field.maxLength && value.length > field.maxLength) {
        return `${field.label} must be at most ${field.maxLength} characters`;
      }
    }

    if (field.type === 'number' && value) {
      const num = parseFloat(value);
      if (field.min !== undefined && num < field.min) {
        return `${field.label} must be at least ${field.min}`;
      }
      if (field.max !== undefined && num > field.max) {
        return `${field.label} must be at most ${field.max}`;
      }
    }

    if (field.type === 'textarea' && value) {
      if (field.maxLength && value.length > field.maxLength) {
        return `${field.label} must be at most ${field.maxLength} characters`;
      }
    }

    if (field.type === 'date' && value) {
      const selectedDate = new Date(value);
      if (isNaN(selectedDate.getTime())) {
        return `${field.label} is not a valid date`;
      }
    }

    return '';
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    fields.forEach((field) => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitError('');
    try {
      await onSubmit(formData);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <label className="block text-sm font-medium text-neutral-900">
            {field.label}
            {field.required && <span className="text-red-600 ml-1">*</span>}
          </label>

          {field.type === 'text' && (
            <input
              type="text"
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              maxLength={field.maxLength}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors[field.id] ? 'border-red-600 focus:ring-red-500' : 'border-neutral-300'
              }`}
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              maxLength={field.maxLength}
              disabled={isLoading}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${
                errors[field.id] ? 'border-red-600 focus:ring-red-500' : 'border-neutral-300'
              }`}
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              min={field.min}
              max={field.max}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors[field.id] ? 'border-red-600 focus:ring-red-500' : 'border-neutral-300'
              }`}
            />
          )}

          {field.type === 'date' && (
            <input
              type="date"
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors[field.id] ? 'border-red-600 focus:ring-red-500' : 'border-neutral-300'
              }`}
            />
          )}

          {field.type === 'dropdown' && (
            <select
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors[field.id] ? 'border-red-600 focus:ring-red-500' : 'border-neutral-300'
              }`}
            >
              <option value="">Select an option...</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          {field.type === 'radio' && (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={formData[field.id] === option}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    disabled={isLoading}
                    className="rounded-full"
                  />
                  <span className="text-sm text-neutral-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {field.type === 'checkbox' && (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={option}
                    checked={(formData[field.id] || []).includes(option)}
                    onChange={(e) => {
                      const current = formData[field.id] || [];
                      const updated = e.target.checked
                        ? [...current, option]
                        : current.filter((item: string) => item !== option);
                      handleFieldChange(field.id, updated);
                    }}
                    disabled={isLoading}
                    className="rounded"
                  />
                  <span className="text-sm text-neutral-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {field.type === 'file' && (
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
              <input
                type="file"
                accept={field.accept}
                multiple={field.multiple}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (field.maxFiles && files.length > field.maxFiles) {
                    setErrors((prev) => ({
                      ...prev,
                      [field.id]: `Maximum ${field.maxFiles} files allowed`,
                    }));
                    return;
                  }
                  handleFieldChange(field.id, field.multiple ? files : files[0]);
                }}
                disabled={isLoading}
                className="hidden"
                id={field.id}
              />
              <label htmlFor={field.id} className="cursor-pointer">
                <p className="text-sm text-neutral-600">Click to upload</p>
                {field.accept && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Accepted: {field.accept}
                  </p>
                )}
              </label>
              {(formData[field.id] || field.multiple ? [] : []).length > 0 && (
                <div className="mt-2 text-xs text-green-600">
                  {field.multiple
                    ? `${formData[field.id]?.length || 0} file(s) selected`
                    : 'File selected'}
                </div>
              )}
            </div>
          )}

          {errors[field.id] && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
              <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-600">{errors[field.id]}</p>
            </div>
          )}

          {field.type === 'textarea' && field.maxLength && (
            <p className="text-xs text-neutral-500 text-right">
              {(formData[field.id] || '').length}/{field.maxLength}
            </p>
          )}
        </div>
      ))}

      {submitError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Submitting...' : submitButtonText}
      </button>
    </form>
  );
}
