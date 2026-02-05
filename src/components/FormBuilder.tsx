import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'file';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: string[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
}

export interface FormSchema {
  categoryName: string;
  fields: FormField[];
}

interface FormBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  initialSchema?: FormSchema;
  onSubmit: (schema: FormSchema) => Promise<void>;
}

const FIELD_TYPES: Array<{ value: FormFieldType; label: string }> = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'file', label: 'File Upload' },
];

function DraggableField({
  field,
  onUpdate,
  onDelete,
}: {
  field: FormField;
  index: number;
  onUpdate: (updatedField: FormField) => void;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateField = (updates: Partial<FormField>) => {
    onUpdate({ ...field, ...updates });
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 space-y-3">
      <div className="flex items-center gap-3">
        <GripVertical size={18} className="text-neutral-400 cursor-grab" />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-left font-medium text-neutral-900 hover:text-primary-600"
        >
          {field.label || `${field.type} field`}
        </button>
        <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
          {FIELD_TYPES.find((f) => f.value === field.type)?.label}
        </span>
        <button onClick={onDelete} className="text-red-600 hover:bg-red-50 p-2 rounded">
          <Trash2 size={18} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 border-t border-neutral-200 pt-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              placeholder="Field label"
            />
          </div>

          {['text', 'textarea', 'number'].includes(field.type) && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateField({ placeholder: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Help Text (Optional)
            </label>
            <input
              type="text"
              value={field.helpText || ''}
              onChange={(e) => updateField({ helpText: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              placeholder="Guidance to help users fill this field"
            />
          </div>

          {field.type === 'textarea' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Max Length
              </label>
              <input
                type="number"
                value={field.maxLength || 500}
                onChange={(e) => updateField({ maxLength: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
          )}

          {field.type === 'number' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Min Value
                  </label>
                  <input
                    type="number"
                    value={field.min ?? ''}
                    onChange={(e) =>
                      updateField({
                        min: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Max Value
                  </label>
                  <input
                    type="number"
                    value={field.max ?? ''}
                    onChange={(e) =>
                      updateField({
                        max: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {['dropdown', 'checkbox', 'radio'].includes(field.type) && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Options (one per line)
              </label>
              <textarea
                value={(field.options || []).join('\n')}
                onChange={(e) =>
                  updateField({
                    options: e.target.value
                      .split('\n')
                      .map((o) => o.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono"
                rows={4}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}

          {field.type === 'file' && (
            <>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.multiple || false}
                    onChange={(e) => updateField({ multiple: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-neutral-700">Allow multiple files</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Max Files
                  </label>
                  <input
                    type="number"
                    value={field.maxFiles || 1}
                    onChange={(e) =>
                      updateField({ maxFiles: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Accepted Types
                  </label>
                  <input
                    type="text"
                    value={field.accept || ''}
                    onChange={(e) => updateField({ accept: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                    placeholder="image/*,.pdf"
                  />
                </div>
              </div>
            </>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => updateField({ required: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-neutral-700">Required field</span>
          </label>
        </div>
      )}
    </div>
  );
}

function FormPreview({ schema }: { schema: FormSchema }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-neutral-900">Form Preview</h3>
      <div className="border border-neutral-200 rounded-lg p-6 bg-white space-y-4">
        {schema.fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-600 ml-1">*</span>}
            </label>
            {field.helpText && (
              <p className="text-xs text-neutral-500 mb-2">{field.helpText}</p>
            )}

            {field.type === 'text' && (
              <input
                type="text"
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                disabled
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                rows={4}
                disabled
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                disabled
              />
            )}

            {field.type === 'date' && (
              <input type="date" className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm" disabled />
            )}

            {field.type === 'dropdown' && (
              <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm" disabled>
                <option>Select an option...</option>
                {field.options?.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === 'radio' && (
              <div className="space-y-2">
                {field.options?.map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input type="radio" disabled className="rounded-full" />
                    <span className="text-sm text-neutral-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'checkbox' && (
              <div className="space-y-2">
                {field.options?.map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input type="checkbox" disabled className="rounded" />
                    <span className="text-sm text-neutral-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'file' && (
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept={field.accept}
                  multiple={field.multiple}
                  className="hidden"
                  disabled
                />
                <p className="text-sm text-neutral-500">Upload file</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormBuilder({
  isOpen,
  onClose,
  categoryName,
  initialSchema,
  onSubmit,
}: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialSchema?.fields || []);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: '',
      required: type !== 'checkbox' && type !== 'radio',
    };
    setFields([...fields, newField]);
    setError('');
  };

  const updateField = (index: number, updatedField: FormField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };

  const deleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (fields.length === 0) {
      setError('Add at least one field to the form');
      return;
    }

    const schema: FormSchema = {
      categoryName,
      fields,
    };

    setLoading(true);
    try {
      await onSubmit(schema);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form schema');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const schema: FormSchema = { categoryName, fields };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Form Builder: {categoryName}
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900">Form Fields</h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-lg text-sm hover:bg-neutral-200"
              >
                <Eye size={16} />
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>

            {showPreview && <FormPreview schema={schema} />}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <DraggableField
                  key={field.id}
                  field={field}
                  index={index}
                  onUpdate={(updated) => updateField(index, updated)}
                  onDelete={() => deleteField(index)}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-neutral-900 text-sm mb-3">Add Field</h3>
              {FIELD_TYPES.map((fieldType) => (
                <button
                  key={fieldType.value}
                  onClick={() => addField(fieldType.value)}
                  disabled={loading}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm bg-white border border-neutral-200 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-colors disabled:opacity-50"
                >
                  <Plus size={16} />
                  {fieldType.label}
                </button>
              ))}
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-primary-900">
              <p className="font-medium mb-2">Fields: {fields.length}</p>
              <p className="text-xs opacity-75">
                {fields.filter((f) => f.required).length} required
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || fields.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            <Check size={18} />
            {loading ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>
    </div>
  );
}
