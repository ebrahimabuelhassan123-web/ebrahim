
export type Currency = 'SAR' | 'EGP';
export type RentalSystem = 'weekly' | 'monthly';

export interface Item {
  id: string;
  name: string;
  category: string;
  ratePerUnit: number; // Rate for the selected system (weekly/monthly)
  availableQty: number;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
}

export interface ReturnLog {
  id: string;
  itemId: string;
  itemName: string;
  qty: number;
  date: string;
}

export interface RentalItem {
  id: string;
  itemId: string;
  name: string;
  originalQty: number;
  returnedQty: number;
  currentQty: number;
  rate: number;
  startDate: string;
}

export interface InvoiceStyle {
  companyName: number;
  customerName: number;
  customerDetails: number;
  tableHeader: number;
  tableBody: number;
  summaryLabels: number;
  summaryValues: number;
  netBalanceValue: number;
  terms: number;
  dateFontSize: number;
}

export interface Quotation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: RentalItem[];
  date: string;
  notes: string;
  discountValue: number;
  discountType: 'fixed' | 'percentage';
  securityDeposit: number;
  status: 'pending' | 'permit' | 'converted'; // Added 'permit'
}

export interface Rental {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: RentalItem[];
  returnLogs?: ReturnLog[]; // History of returns
  startDate: string;
  status: 'active' | 'closed';
  discountValue: number;
  discountType: 'fixed' | 'percentage';
  securityDeposit: number;
  openingBalance: number;
  payments: Payment[];
  notes: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface CompanySettings {
  name: string;
  logo: string;
  phone: string;
  address: string;
  email: string;
  headerText: string;
  footerText: string;
  terms: string;
}

export interface SystemSettings {
  currency: Currency;
  rentalSystem: RentalSystem;
  nextInvoiceNumber: number;
  invoiceStyle: InvoiceStyle;
}

export interface AppData {
  items: Item[];
  rentals: Rental[];
  quotations: Quotation[];
  archivedRentals: Rental[];
  expenses: Expense[];
  companySettings: CompanySettings;
  systemSettings: SystemSettings;
}
