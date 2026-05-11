import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Alert,
  MenuItem,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';

interface FormTemplateEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: FormTemplateData) => Promise<void>;
  initialData?: FormTemplateData;
  mode: 'create' | 'edit';
}

export interface FormTemplateData {
  name: string;
  description: string;
  formType: string;
  templateData: {
    sections: FormSection[];
  };
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helperText?: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'select', label: 'Dropdown' },
];

const FORM_TYPES = [
  { value: 'pre_arrangement', label: 'Pre-Arrangement Form' },
  { value: 'incident_report', label: 'Incident Report' },
  { value: 'expense_claim', label: 'Expense Claim' },
  { value: 'leave_request', label: 'Leave Request' },
  { value: 'maintenance_log', label: 'Maintenance Log' },
  { value: 'customer_feedback', label: 'Customer Feedback' },
  { value: 'custom', label: 'Custom Form' },
];

export default function FormTemplateEditor({
  open,
  onClose,
  onSave,
  initialData,
  mode,
}: FormTemplateEditorProps) {
  const [template, setTemplate] = useState<FormTemplateData>({
    name: '',
    description: '',
    formType: 'custom',
    templateData: {
      sections: [
        {
          id: 'section_1',
          title: 'Section 1',
          fields: [
            {
              name: 'field_1',
              label: 'Field 1',
              type: 'text',
              required: false,
            },
          ],
        },
      ],
    },
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTemplate(initialData);
    }
  }, [initialData]);

  const handleSave = async () => {
    if (!template.name || !template.formType) {
      setError('Name and Form Type are required');
      return;
    }

    if (template.templateData.sections.length === 0) {
      setError('At least one section is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave(template);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: `Section ${template.templateData.sections.length + 1}`,
      fields: [
        {
          name: `field_${Date.now()}`,
          label: 'New Field',
          type: 'text',
          required: false,
        },
      ],
    };

    setTemplate({
      ...template,
      templateData: {
        sections: [...template.templateData.sections, newSection],
      },
    });
  };

  const removeSection = (sectionId: string) => {
    setTemplate({
      ...template,
      templateData: {
        sections: template.templateData.sections.filter((s) => s.id !== sectionId),
      },
    });
  };

  const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
    setTemplate({
      ...template,
      templateData: {
        sections: template.templateData.sections.map((s) =>
          s.id === sectionId ? { ...s, ...updates } : s
        ),
      },
    });
  };

  const addField = (sectionId: string) => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
    };

    setTemplate({
      ...template,
      templateData: {
        sections: template.templateData.sections.map((s) =>
          s.id === sectionId
            ? { ...s, fields: [...s.fields, newField] }
            : s
        ),
      },
    });
  };

  const removeField = (sectionId: string, fieldIndex: number) => {
    setTemplate({
      ...template,
      templateData: {
        sections: template.templateData.sections.map((s) =>
          s.id === sectionId
            ? { ...s, fields: s.fields.filter((_, i) => i !== fieldIndex) }
            : s
        ),
      },
    });
  };

  const updateField = (
    sectionId: string,
    fieldIndex: number,
    updates: Partial<FormField>
  ) => {
    setTemplate({
      ...template,
      templateData: {
        sections: template.templateData.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                fields: s.fields.map((f, i) =>
                  i === fieldIndex ? { ...f, ...updates } : f
                ),
              }
            : s
        ),
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Create New Form Template' : 'Edit Form Template'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {mode === 'edit' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Editing will create a new version. The current version will be archived.
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Template Name"
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              required
              placeholder="e.g., Pre-Arrangement Form, Incident Report"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Form Type"
              value={template.formType}
              onChange={(e) => setTemplate({ ...template, formType: e.target.value })}
              required
            >
              {FORM_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={template.description}
              onChange={(e) =>
                setTemplate({ ...template, description: e.target.value })
              }
              multiline
              rows={2}
              placeholder="Brief description of what this form is used for"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Form Sections</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addSection}
              variant="outlined"
              size="small"
            >
              Add Section
            </Button>
          </Box>

          {template.templateData.sections.map((section, sectionIndex) => (
            <Paper key={section.id} sx={{ p: 2, mb: 2 }} variant="outlined">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <TextField
                  size="small"
                  label="Section Title"
                  value={section.title}
                  onChange={(e) =>
                    updateSection(section.id, { title: e.target.value })
                  }
                  sx={{ flex: 1, mr: 1 }}
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeSection(section.id)}
                  disabled={template.templateData.sections.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Fields
              </Typography>

              {section.fields.map((field, fieldIndex) => (
                <Paper
                  key={fieldIndex}
                  sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}
                  variant="outlined"
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Field Name"
                        value={field.name}
                        onChange={(e) =>
                          updateField(section.id, fieldIndex, {
                            name: e.target.value,
                          })
                        }
                        helperText="Internal identifier (no spaces)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Field Label"
                        value={field.label}
                        onChange={(e) =>
                          updateField(section.id, fieldIndex, {
                            label: e.target.value,
                          })
                        }
                        helperText="Display label for users"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        size="small"
                        label="Field Type"
                        value={field.type}
                        onChange={(e) =>
                          updateField(section.id, fieldIndex, {
                            type: e.target.value,
                          })
                        }
                      >
                        {FIELD_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          fullWidth
                          select
                          size="small"
                          label="Required"
                          value={field.required ? 'true' : 'false'}
                          onChange={(e) =>
                            updateField(section.id, fieldIndex, {
                              required: e.target.value === 'true',
                            })
                          }
                        >
                          <MenuItem value="false">Optional</MenuItem>
                          <MenuItem value="true">Required</MenuItem>
                        </TextField>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeField(section.id, fieldIndex)}
                          disabled={section.fields.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                    {(field.type === 'radio' ||
                      field.type === 'select') && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Options (comma-separated)"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) =>
                            updateField(section.id, fieldIndex, {
                              options: e.target.value
                                .split(',')
                                .map((o) => o.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={() => addField(section.id)}
                size="small"
                sx={{ mt: 1 }}
              >
                Add Field
              </Button>
            </Paper>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Save New Version'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
