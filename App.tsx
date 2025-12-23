
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LayoutDashboard, Package, FileText, Settings, Plus, LogOut, ChevronRight, ReceiptText, TrendingDown, Users, TrendingUp, Archive, ClipboardList, Truck } from 'lucide-react';
import { AppData, Item, Rental, Quotation, CompanySettings, SystemSettings, InvoiceStyle, Expense } from './types';
import Inventory from './components/Inventory';
import RentalList from './components/RentalList';
import RentalForm from './components/RentalForm';
import SettingsPanel from './components/SettingsPanel';
import InvoiceView from './components/InvoiceView';
import ExpensesManager from './components/ExpensesManager';
import ArchiveList from './components/ArchiveList';
import QuotationList from './components/QuotationList';
import QuotationForm from './components/QuotationForm';
import QuotationView from './components/QuotationView';
import { formatCurrency, calculateRentalUnits } from './utils/calculations';

const DEFAULT_INVOICE_STYLE: InvoiceStyle = {
  companyName: 36,
  customerName: 24,
  customerDetails: 16,
  tableHeader: 12,
  tableBody: 18,
  summaryLabels: 14,
  summaryValues: 20,
  netBalanceValue: 40,
  terms: 10,
  dateFontSize: 16
};

const INITIAL_DATA: AppData = {
  items: [
    { id: '1', name: 'سقالات معدنية', category: 'معدات بناء', ratePerUnit: 150, availableQty: 20 },
    { id: '2', name: 'مولد كهرباء 5KW', category: 'طاقة', ratePerUnit: 500, availableQty: 5 },
    { id: '3', name: 'رافعة شوكية', category: 'ثقيل', ratePerUnit: 1200, availableQty: 2 },
  ],
  rentals: [],
  quotations: [],
  archivedRentals: [],
  expenses: [],
  companySettings: {
    name: 'الشركة العربية للمعدات',
    logo: 'https://picsum.photos/200/200',
    phone: '0500000000',
    address: 'الرياض، المملكة العربية السعودية',
    email: 'info@arabequip.com',
    headerText: 'حلول تأجير المعدات الاحترافية',
    footerText: 'شكرًا لتعاملكم معنا',
    terms: '1. يتم احتساب الأسبوع كاملاً إذا تجاوز التأخير يومين.\n2. العميل مسؤول عن سلامة المعدات.\n3. يتم دفع التأمين مقدماً.'
  },
  systemSettings: {
    currency: 'SAR',
    rentalSystem: 'weekly',
    nextInvoiceNumber: 1001,
    invoiceStyle: DEFAULT_INVOICE_STYLE
  }
};

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('equip_rent_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.systemSettings.invoiceStyle) parsed.systemSettings.invoiceStyle = DEFAULT_INVOICE_STYLE;
      if (!parsed.expenses) parsed.expenses = [];
      if (!parsed.archivedRentals) parsed.archivedRentals = [];
      if (!parsed.quotations) parsed.quotations = [];
      return parsed;
    }
    return INITIAL_DATA;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'rentals' | 'expenses' | 'settings' | 'archive' | 'quotations' | 'permits'>('dashboard');
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [viewingQuotationId, setViewingQuotationId] = useState<string | null>(null);
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [creationMode, setCreationMode] = useState<'quotation' | 'permit'>('quotation');

  useEffect(() => {
    localStorage.setItem('equip_rent_data', JSON.stringify(data));
  }, [data]);

  const viewingInvoice = useMemo(() => {
    return data.rentals.find(r => r.id === viewingInvoiceId) || null;
  }, [data.rentals, viewingInvoiceId]);

  const viewingQuotation = useMemo(() => {
    return data.quotations.find(q => q.id === viewingQuotationId) || null;
  }, [data.quotations, viewingQuotationId]);

  // --- Core Business Logic: Linking Documents ---

  const handleUpdateQuotationStatus = useCallback((id: string, status: 'pending' | 'permit' | 'converted') => {
    setData(prev => {
      const quote = prev.quotations.find(q => q.id === id);
      if (!quote) return prev;

      let newItems = [...prev.items];
      
      // LOGIC: If issuing a permit from a quote, deduct stock now
      if (status === 'permit' && quote.status === 'pending') {
        newItems = prev.items.map(invItem => {
          const quoteItem = quote.items.find(qi => qi.itemId === invItem.id);
          if (quoteItem) {
            const finalQty = Math.max(0, invItem.availableQty - quoteItem.currentQty);
            return { ...invItem, availableQty: finalQty };
          }
          return invItem;
        });
      }

      return {
        ...prev,
        items: newItems,
        quotations: prev.quotations.map(q => q.id === id ? { ...q, status } : q)
      };
    });
    
    if (status === 'permit') {
      alert('تم إصدار إذن الإخراج وخصم الكميات من المخزن تلقائياً بنجاح.');
      setViewingQuotationId(null);
      setActiveTab('permits');
    }
  }, []);

  const handleConvertToContract = useCallback((quote: Quotation) => {
    let rentalId: string = "";
    setData(prev => {
      const nextNum = prev.systemSettings.nextInvoiceNumber;
      rentalId = nextNum.toString();
      
      const rental: Rental = {
        id: rentalId,
        customerName: quote.customerName,
        customerPhone: quote.customerPhone,
        customerAddress: quote.customerAddress,
        startDate: new Date().toISOString(),
        status: 'active',
        items: quote.items.map(item => ({ ...item, startDate: new Date().toISOString() })),
        discountValue: quote.discountValue,
        discountType: quote.discountType,
        securityDeposit: quote.securityDeposit || 0,
        openingBalance: 0,
        payments: [],
        notes: quote.notes || `تحويل آلي من سجل #${quote.id}`
      };

      let updatedItems = [...prev.items];
      
      // STOCK LOGIC: 
      // If it was just a quote (pending), deduct stock now.
      // If it was already a permit, stock was ALREADY deducted, so don't deduct again!
      if (quote.status === 'pending') {
        updatedItems = prev.items.map(invItem => {
          const rentalItem = rental.items.find(ri => ri.itemId === invItem.id);
          if (rentalItem) return { ...invItem, availableQty: Math.max(0, invItem.availableQty - rentalItem.currentQty) };
          return invItem;
        });
      }

      return {
        ...prev,
        items: updatedItems,
        rentals: [rental, ...prev.rentals],
        quotations: prev.quotations.map(q => q.id === quote.id ? { ...q, status: 'converted' } : q),
        systemSettings: { ...prev.systemSettings, nextInvoiceNumber: nextNum + 1 }
      };
    });

    alert('تم تحويل السجل إلى عقد إيجار نشط بنجاح. جاري فتح الفاتورة...');
    setViewingQuotationId(null);
    setViewingInvoiceId(rentalId);
    setActiveTab('rentals');
  }, []);

  const archiveQuotation = useCallback((quote: Quotation) => {
    if(confirm('هل تريد أرشفة هذا السجل؟ تنبيه: إذا كان "إذن إخراج" سيتم إرجاع المواد للمخزن.')) {
      setData(prev => {
        let newItems = [...prev.items];
        // If it was a permit, we give back the items to the inventory
        if (quote.status === 'permit') {
          newItems = prev.items.map(invItem => {
            const quoteItem = quote.items.find(qi => qi.itemId === invItem.id);
            if (quoteItem) return { ...invItem, availableQty: invItem.availableQty + quoteItem.currentQty };
            return invItem;
          });
        }
        return {
          ...prev,
          items: newItems,
          quotations: prev.quotations.filter(q => q.id !== quote.id)
        };
      });
      setViewingQuotationId(null);
    }
  }, []);

  const deleteQuotation = useCallback((id: string) => {
    if(confirm('سيتم حذف السجل نهائياً. هل أنت متأكد؟')) {
      setData(prev => ({
        ...prev,
        quotations: prev.quotations.filter(q => q.id !== id)
      }));
      setViewingQuotationId(null);
    }
  }, []);

  const handleCreateQuotation = useCallback((newQuote: Quotation) => {
    setData(prev => {
      let updatedItems = [...prev.items];
      const finalQuote: Quotation = { 
        ...newQuote, 
        status: (creationMode === 'permit' ? 'permit' : 'pending') as Quotation['status'] 
      };

      // If created as a permit directly, deduct stock immediately
      if (creationMode === 'permit') {
        updatedItems = prev.items.map(invItem => {
          const quoteItem = finalQuote.items.find(qi => qi.itemId === invItem.id);
          if (quoteItem) return { ...invItem, availableQty: Math.max(0, invItem.availableQty - quoteItem.currentQty) };
          return invItem;
        });
      }

      return {
        ...prev,
        items: updatedItems,
        quotations: [finalQuote, ...prev.quotations]
      };
    });

    setShowQuotationForm(false);
    setViewingQuotationId(newQuote.id);
    setActiveTab(creationMode === 'permit' ? 'permits' : 'quotations');
    
    if (creationMode === 'permit') {
      alert('تم إنشاء إذن الإخراج وخصم المواد من المخزن بنجاح.');
    }
  }, [creationMode]);

  const handleCreateRental = useCallback((newRental: Rental) => {
    let finalId: string = "";
    setData(prev => {
      const nextNum = prev.systemSettings.nextInvoiceNumber;
      finalId = nextNum.toString();
      const finalRental = { ...newRental, id: finalId };
      const updatedItems = prev.items.map(invItem => {
        const rentalItem = finalRental.items.find(ri => ri.itemId === invItem.id);
        if (rentalItem) return { ...invItem, availableQty: Math.max(0, invItem.availableQty - rentalItem.currentQty) };
        return invItem;
      });
      return {
        ...prev,
        items: updatedItems,
        rentals: [finalRental, ...prev.rentals],
        systemSettings: { ...prev.systemSettings, nextInvoiceNumber: nextNum + 1 }
      };
    });
    setShowRentalForm(false);
    setViewingInvoiceId(finalId);
    setActiveTab('rentals');
  }, []);

  const updateRentals = useCallback((newRentals: Rental[]) => {
    setData(prev => ({ ...prev, rentals: newRentals }));
  }, []);

  const archiveRental = useCallback((rental: Rental) => {
    setData(prev => {
      const updatedItems = prev.items.map(invItem => {
        const rentalItem = rental.items.find(ri => ri.itemId === invItem.id);
        if (rentalItem) return { ...invItem, availableQty: invItem.availableQty + rentalItem.currentQty };
        return invItem;
      });
      return {
        ...prev,
        items: updatedItems,
        rentals: prev.rentals.filter(r => r.id !== rental.id),
        archivedRentals: [rental, ...prev.archivedRentals]
      };
    });
  }, []);

  const restoreRental = useCallback((rental: Rental) => {
    setData(prev => {
      const updatedItems = prev.items.map(invItem => {
        const rentalItem = rental.items.find(ri => ri.itemId === invItem.id);
        if (rentalItem) return { ...invItem, availableQty: Math.max(0, invItem.availableQty - rentalItem.currentQty) };
        return invItem;
      });
      return {
        ...prev,
        items: updatedItems,
        rentals: [rental, ...prev.rentals],
        archivedRentals: prev.archivedRentals.filter(r => r.id !== rental.id)
      };
    });
  }, []);

  const updateInventoryItems = useCallback((items: Item[]) => {
    setData(prev => ({ ...prev, items }));
  }, []);

  const SidebarItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => { 
        setActiveTab(id); 
        setViewingInvoiceId(null); 
        setViewingQuotationId(null);
        setShowRentalForm(false); 
        setShowQuotationForm(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-bold ${
        activeTab === id ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' : 'text-gray-600 hover:bg-blue-50'
      }`}
    >
      <Icon size={20} />
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-['Tajawal']" dir="rtl">
      {/* Responsive Sidebar */}
      <aside className="w-20 md:w-64 bg-white shadow-xl flex flex-col no-print z-20 border-l border-gray-100 transition-all duration-300">
        <div className="p-4 md:p-6 border-b bg-gradient-to-br from-blue-700 to-blue-900 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shadow-inner"><Package size={24} /></div>
            <h1 className="text-lg font-black truncate hidden md:block">{data.companySettings.name}</h1>
          </div>
        </div>
        <nav className="flex-1 p-2 md:p-4 space-y-1 overflow-y-auto">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="لوحة التحكم" />
          <div className="pt-4 pb-1 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:block">المبيعات</div>
          <SidebarItem id="quotations" icon={ClipboardList} label="عروض الأسعار" />
          <SidebarItem id="permits" icon={Truck} label="أذونات الإخراج" />
          <SidebarItem id="rentals" icon={FileText} label="عقود الإيجار" />
          <div className="pt-4 pb-1 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:block">المخزن والمالية</div>
          <SidebarItem id="inventory" icon={Package} label="المخزن والمواد" />
          <SidebarItem id="expenses" icon={ReceiptText} label="المصاريف" />
          <SidebarItem id="archive" icon={Archive} label="الأرشيف" />
          <div className="pt-4 pb-1 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:block">النظام</div>
          <SidebarItem id="settings" icon={Settings} label="الإعدادات" />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-gray-50">
        <header className="bg-white/80 backdrop-blur-md border-b px-4 md:px-8 py-4 sticky top-0 z-10 flex items-center justify-between no-print shadow-sm">
          <h2 className="text-xl md:text-2xl font-black text-gray-800">
            {activeTab === 'dashboard' && 'نظرة عامة'}
            {activeTab === 'quotations' && 'عروض الأسعار'}
            {activeTab === 'permits' && 'أذونات الإخراج'}
            {activeTab === 'inventory' && 'إدارة المخزون'}
            {activeTab === 'rentals' && 'العقود والفواتير'}
            {activeTab === 'expenses' && 'إدارة المصاريف'}
            {activeTab === 'archive' && 'أرشيف الفواتير'}
            {activeTab === 'settings' && 'الإعدادات'}
          </h2>
          <div className="hidden md:block text-left font-bold text-gray-400 text-xs">
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <div className="p-4 md:p-8">
          {viewingInvoice ? (
            <InvoiceView 
              rental={viewingInvoice} 
              onBack={() => setViewingInvoiceId(null)} 
              companySettings={data.companySettings}
              systemSettings={data.systemSettings}
              onUpdateRentals={updateRentals}
              onArchive={archiveRental}
              allRentals={data.rentals}
              inventoryItems={data.items}
              onUpdateInventoryItems={updateInventoryItems}
            />
          ) : viewingQuotation ? (
            <QuotationView 
              quotation={viewingQuotation}
              onBack={() => setViewingQuotationId(null)}
              companySettings={data.companySettings}
              systemSettings={data.systemSettings}
              onConvertToContract={handleConvertToContract}
              onUpdateStatus={handleUpdateQuotationStatus}
              onArchive={archiveQuotation}
              onDelete={deleteQuotation}
            />
          ) : showRentalForm ? (
            <RentalForm onClose={() => setShowRentalForm(false)} onSave={handleCreateRental} items={data.items} systemSettings={data.systemSettings} />
          ) : showQuotationForm ? (
            <QuotationForm onClose={() => setShowQuotationForm(false)} onSave={handleCreateQuotation} items={data.items} systemSettings={data.systemSettings} />
          ) : (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <DashboardCard icon={FileText} color="blue" label="عقود نشطة" value={data.rentals.filter(r => r.status === 'active').length} />
                    <DashboardCard icon={ClipboardList} color="indigo" label="عروض أسعار" value={data.quotations.filter(q => q.status === 'pending').length} />
                    <DashboardCard icon={Truck} color="orange" label="أذونات إخراج" value={data.quotations.filter(q => q.status === 'permit').length} />
                    <DashboardCard icon={TrendingUp} color="amber" label="إجمالي المستحقات" value={formatCurrency(data.rentals.reduce((sum, r) => {
                      let rentalTotal = 0;
                      r.items.forEach(item => {
                        const units = calculateRentalUnits(new Date(item.startDate), new Date(), data.systemSettings.rentalSystem);
                        rentalTotal += item.currentQty * item.rate * units;
                      });
                      const discount = r.discountType === 'percentage' ? rentalTotal * (r.discountValue / 100) : r.discountValue;
                      const totalDue = (rentalTotal - discount) + (r.openingBalance || 0) + (r.securityDeposit || 0);
                      const totalPaid = (r.payments || []).reduce((ps, p) => ps + p.amount, 0);
                      return sum + Math.max(0, totalDue - totalPaid);
                    }, 0), data.systemSettings.currency)} />
                  </div>
                  <RentalList rentals={data.rentals.slice(0, 5)} onViewInvoice={(r) => setViewingInvoiceId(r.id)} currency={data.systemSettings.currency} onUpdateRentals={updateRentals} onArchive={archiveRental} systemSettings={data.systemSettings} onUpdateInventoryItems={updateInventoryItems} inventoryItems={data.items} />
                </div>
              )}

              {activeTab === 'quotations' && (
                <div className="space-y-4">
                  <SectionHeader title="إدارة عروض الأسعار" subtitle="إنشاء وتحويل عروض الأسعار لعملاء جدد" onAction={() => { setCreationMode('quotation'); setShowQuotationForm(true); }} actionLabel="عرض سعر جديد" actionIcon={Plus} />
                  <QuotationList quotations={data.quotations.filter(q => q.status === 'pending')} onView={(q) => setViewingQuotationId(q.id)} onDelete={deleteQuotation} onArchive={archiveQuotation} currency={data.systemSettings.currency} />
                </div>
              )}

              {activeTab === 'permits' && (
                <div className="space-y-4">
                  <SectionHeader title="أذونات الإخراج" subtitle="إدارة المواد التي خرجت من المستودع بانتظار العقد" onAction={() => { setCreationMode('permit'); setShowQuotationForm(true); }} actionLabel="إضافة إذن إخراج جديد" actionIcon={Plus} />
                  <QuotationList quotations={data.quotations.filter(q => q.status === 'permit')} onView={(q) => setViewingQuotationId(q.id)} onDelete={deleteQuotation} onArchive={archiveQuotation} currency={data.systemSettings.currency} />
                </div>
              )}

              {activeTab === 'inventory' && <Inventory items={data.items} onUpdate={updateInventoryItems} currency={data.systemSettings.currency} />}
              
              {activeTab === 'rentals' && (
                <div className="space-y-4">
                  <SectionHeader title="عقود الإيجار والفواتير" subtitle="متابعة العقود النشطة والتحصيل المالي" onAction={() => setShowRentalForm(true)} actionLabel="عقد مباشر جديد" actionIcon={Plus} />
                  <RentalList rentals={data.rentals} onViewInvoice={(r) => setViewingInvoiceId(r.id)} currency={data.systemSettings.currency} onUpdateRentals={updateRentals} onArchive={archiveRental} systemSettings={data.systemSettings} onUpdateInventoryItems={updateInventoryItems} inventoryItems={data.items} />
                </div>
              )}

              {activeTab === 'archive' && <ArchiveList archivedRentals={data.archivedRentals} onRestore={restoreRental} onDeletePermanently={(id) => setData(prev => ({ ...prev, archivedRentals: prev.archivedRentals.filter(r => r.id !== id) }))} currency={data.systemSettings.currency} systemSettings={data.systemSettings} onViewInvoice={(r) => setViewingInvoiceId(r.id)} />}
              {activeTab === 'expenses' && <ExpensesManager expenses={data.expenses} onUpdate={(exp) => setData(prev => ({ ...prev, expenses: exp }))} currency={data.systemSettings.currency} />}
              {activeTab === 'settings' && <SettingsPanel companySettings={data.companySettings} systemSettings={data.systemSettings} onUpdateCompany={(s) => setData(prev => ({ ...prev, companySettings: s }))} onUpdateSystem={(s) => setData(prev => ({ ...prev, systemSettings: s }))} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// --- Reusable Components ---

const DashboardCard = ({ icon: Icon, color, label, value }: { icon: any, color: string, label: string, value: any }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all group">
      <div className={`p-4 ${colors[color]} rounded-2xl group-hover:scale-110 transition-transform`}><Icon size={24} /></div>
      <div className="overflow-hidden">
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest truncate">{label}</p>
        <p className="text-xl md:text-2xl font-black text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle, onAction, actionLabel, actionIcon: Icon }: { title: string, subtitle: string, onAction?: () => void, actionLabel?: string, actionIcon?: any }) => (
  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
    <div>
      <h3 className="text-lg font-black text-gray-800">{title}</h3>
      <p className="text-gray-400 text-sm font-bold">{subtitle}</p>
    </div>
    {onAction && actionLabel && Icon && (
      <button onClick={onAction} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all font-black active:scale-95">
        <Icon size={20} /> {actionLabel}
      </button>
    )}
  </div>
);

export default App;
