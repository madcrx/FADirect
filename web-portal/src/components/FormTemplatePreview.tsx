import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Grid,
  FormControl,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  MenuItem,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import { Visibility as PreviewIcon } from '@mui/icons-material';

interface FormTemplatePreviewProps {
  open: boolean;
  onClose: () => void;
  template: {
    name: string;
    description: string;
    templateData: {
      sections: Array<{
        id: string;
        title: string;
        fields: Array<{
          name: string;
          label: string;
          type: string;
          required?: boolean;
          options?: string[];
          placeholder?: string;
          helperText?: string;
        }>;
      }>;
    };
  };
}

export default function FormTemplatePreview({
  open,
  onClose,
  template,
}: FormTemplatePreviewProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const renderField = (field: any, sectionId: string) => {
    const fieldKey = `${sectionId}_${field.name}`;
    const value = formData[fieldKey] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <TextField
            fullWidth
            label={field.label}
            type={field.type}
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            helperText={field.helperText}
            size="small"
          />
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            helperText={field.helperText}
            multiline
            rows={3}
            size="small"
          />
        );

      case 'number':
        return (
          <TextField
            fullWidth
            label={field.label}
            type="number"
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            helperText={field.helperText}
            size="small"
          />
        );

      case 'date':
        return (
          <TextField
            fullWidth
            label={field.label}
            type="date"
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            required={field.required}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        );

      case 'time':
        return (
          <TextField
            fullWidth
            label={field.label}
            type="time"
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            required={field.required}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        );

      case 'datetime':
        return (
          <TextField
            fullWidth
            label={field.label}
            type="datetime-local"
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            required={field.required}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleChange(fieldKey, e.target.checked)}
              />
            }
            label={field.label + (field.required ? ' *' : '')}
          />
        );

      case 'radio':
        return (
          <FormControl component="fieldset">
            <FormLabel component="legend">
              {field.label}
              {field.required && ' *'}
            </FormLabel>
            <RadioGroup
              value={value}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
            >
              {field.options?.map((option: string) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'select':
        return (
          <TextField
            fullWidth
            select
            label={field.label}
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            required={field.required}
            helperText={field.helperText}
            size="small"
          >
            {field.options?.map((option: string) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        );

      default:
        return (
          <TextField
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleChange(fieldKey, e.target.value)}
            required={field.required}
            size="small"
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PreviewIcon />
          Form Preview: {template.name}
        </Box>
        {template.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {template.description}
          </Typography>
        )}
        <Chip
          label="Preview Mode - No Data Will Be Saved"
          size="small"
          color="info"
          sx={{ mt: 1 }}
        />
      </DialogTitle>
      <DialogContent dividers>
        <Box>
          {template.templateData.sections.map((section, sectionIndex) => (
            <Paper
              key={section.id}
              sx={{ p: 3, mb: sectionIndex < template.templateData.sections.length - 1 ? 3 : 0 }}
              variant="outlined"
            >
              <Typography variant="h6" gutterBottom fontWeight="bold">
                {section.title}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {section.fields.map((field, fieldIndex) => (
                  <Grid
                    item
                    xs={12}
                    sm={
                      field.type === 'textarea' ||
                      field.type === 'radio' ||
                      field.type === 'checkbox'
                        ? 12
                        : 6
                    }
                    key={`${section.id}_${field.name}_${fieldIndex}`}
                  >
                    {renderField(field, section.id)}
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close Preview</Button>
        <Button
          variant="contained"
          disabled
          sx={{ cursor: 'not-allowed' }}
        >
          Submit (Preview Only)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
