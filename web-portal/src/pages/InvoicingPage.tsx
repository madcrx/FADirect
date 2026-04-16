import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Grid,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import type { Arrangement } from '@/types';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  arrangementId: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  lineItems: LineItem[];
  arrangement?: { deceasedName: string };
}

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  priceListItemId?: string;
}

interface PriceItem {
  id: string;
  name: string;
  basePrice: number;
}

export default function InvoicingPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    arrangementId: '',
    dueDate: '',
    notes: '',
    lineItems: [] as LineItem[],
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'card',
    referenceNumber: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesRes, arrangementsRes, priceItemsRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/arrangements'),
        api.get('/price-lists'),
      ]);

      setInvoices(invoicesRes.data.invoices || []);
      setArrangements(arrangementsRes.data.arrangements || []);
      setPriceItems(priceItemsRes.data.items?.filter((i: any) => i.active) || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (invoice?: Invoice) => {
    if (invoice) {
      setSelectedInvoice(invoice);
      setFormData({
        arrangementId: invoice.arrangementId,
        dueDate: invoice.dueDate,
        notes: invoice.notes || '',
        lineItems: invoice.lineItems || [],
      });
    } else {
      setSelectedInvoice(null);
      setFormData({
        arrangementId: '',
        dueDate: '',
        notes: '',
        lineItems: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleAddLineItem = (priceItem?: PriceItem) => {
    const newItem: LineItem = {
      description: priceItem?.name || '',
      quantity: 1,
      unitPrice: priceItem?.basePrice || 0,
      totalPrice: priceItem?.basePrice || 0,
      priceListItemId: priceItem?.id,
    };
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, newItem],
    });
  };

  const handleUpdateLineItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? parseFloat(value) : updatedItems[index].quantity;
      const price = field === 'unitPrice' ? parseFloat(value) : updatedItems[index].unitPrice;
      updatedItems[index].totalPrice = qty * price;
    }

    setFormData({ ...formData, lineItems: updatedItems });
  };

  const handleRemoveLineItem = (index: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    });
  };

  const calculateTotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSaveInvoice = async () => {
    try {
      const data = {
        arrangementId: formData.arrangementId,
        dueDate: formData.dueDate,
        notes: formData.notes,
        lineItems: formData.lineItems,
      };

      if (selectedInvoice) {
        await api.put(`/invoices/${selectedInvoice.id}`, data);
      } else {
        await api.post('/invoices', data);
      }

      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save invoice:', error);
    }
  };

  const handleOpenPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: (invoice.totalAmount - invoice.paidAmount).toString(),
      paymentMethod: 'card',
      referenceNumber: '',
      notes: '',
    });
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;

    try {
      await api.post(`/invoices/${selectedInvoice.id}/payments`, {
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
      });

      await loadData();
      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/invoices/${invoiceId}`);
        await loadData();
      } catch (error) {
        console.error('Failed to delete invoice:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'info';
      case 'sent':
        return 'primary';
      case 'draft':
        return 'default';
      case 'overdue':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Invoicing & Payments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage invoices and track payments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          New Invoice
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Invoice #</strong></TableCell>
                  <TableCell><strong>Arrangement</strong></TableCell>
                  <TableCell align="right"><strong>Total</strong></TableCell>
                  <TableCell align="right"><strong>Paid</strong></TableCell>
                  <TableCell align="right"><strong>Balance</strong></TableCell>
                  <TableCell><strong>Due Date</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" py={4}>
                        No invoices yet. Create your first invoice to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {invoice.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{invoice.arrangement?.deceasedName || 'N/A'}</TableCell>
                      <TableCell align="right">{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(invoice.paidAmount)}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={invoice.paidAmount >= invoice.totalAmount ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {formatCurrency(invoice.totalAmount - invoice.paidAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd/MM/yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status}
                          color={getStatusColor(invoice.status) as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {invoice.paidAmount < invoice.totalAmount && (
                          <IconButton
                            size="small"
                            onClick={() => handleOpenPaymentDialog(invoice)}
                            color="success"
                          >
                            <PaymentIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={() => handleOpenDialog(invoice)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>{selectedInvoice ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={arrangements}
                  getOptionLabel={(option) => option.deceasedName}
                  value={arrangements.find(a => a.id === formData.arrangementId) || null}
                  onChange={(_, value) => setFormData({ ...formData, arrangementId: value?.id || '' })}
                  renderInput={(params) => (
                    <TextField {...params} label="Arrangement" required />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Line Items</Typography>
                <Autocomplete
                  options={priceItems}
                  getOptionLabel={(option) => `${option.name} - ${formatCurrency(option.basePrice)}`}
                  onChange={(_, value) => value && handleAddLineItem(value)}
                  renderInput={(params) => <TextField {...params} label="Add from price list" />}
                  sx={{ width: 300 }}
                />
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem(index, 'description', e.target.value)}
                          />
                        </TableCell>
                        <TableCell align="right" width="100">
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => handleUpdateLineItem(index, 'quantity', e.target.value)}
                          />
                        </TableCell>
                        <TableCell align="right" width="120">
                          <TextField
                            type="number"
                            size="small"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateLineItem(index, 'unitPrice', e.target.value)}
                            InputProps={{ startAdornment: '$' }}
                          />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(item.totalPrice)}</TableCell>
                        <TableCell width="50">
                          <IconButton size="small" onClick={() => handleRemoveLineItem(index)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Button size="small" onClick={() => handleAddLineItem()}>
                          Add Line Item
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Typography variant="h6">
                  Total: {formatCurrency(calculateTotal())}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveInvoice} variant="contained">
            {selectedInvoice ? 'Update' : 'Create'} Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              required
              label="Payment Amount"
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              InputProps={{ startAdornment: '$' }}
            />
            <TextField
              select
              fullWidth
              required
              label="Payment Method"
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
            >
              <MenuItem value="card">Credit/Debit Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Reference Number"
              value={paymentData.referenceNumber}
              onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRecordPayment} variant="contained" color="success">
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
