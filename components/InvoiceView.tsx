
import React, { useState } from 'react';
import { Rental, CompanySettings, SystemSettings, Payment, Item, RentalItem, ReturnLog } from '../types';
import { 
  ArrowLeft, Printer, Mail, Phone, MapPin, Plus, DollarSign, 
  FileText, X, RotateCcw, Info, CheckCircle, PackagePlus, 
  CheckSquare, Percent, Tag, Archive, ShieldCheck
} from 'lucide-react';
import { calculateRentalUnits, formatCurrency } from '../utils/calculations';

interface Props {
  rental: Rental;
  onBack: () => void;
  companySettings: CompanySettings;
  systemSettings: SystemSettings;
  onUpdateRentals: (rentals: Rental[]) => void;
  onArchive: (rental: Rental) => void;
  allRentals: Rental[];
  inventoryItems: Item[];
  onUpdateInventoryItems: (items: Item[]) => void;
}

const InvoiceView: React.FC<Props> = ({ 
  rental, 
  onBack, 
  companySettings, 
  systemSettings, 
  onUpdateRentals, 
  onArchive,
  allRentals,
  inventoryItems,
  onUpdateInventoryItems
}) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const now = new Date();
  const unitLabel = systemSettings.rentalSystem === 'weekly' ? 'أسبوع' : 'شهر';
  const style = systemSettings.invoiceStyle;

  let rentalSubtotal = 0;
  const itemsInRent = rental.items.filter(i => i.currentQty > 0);
  const returnLogs = rental.returnLogs || [];

  rental.items.forEach(item => {
    const units = calculateRentalUnits(new Date(item.startDate), now, systemSettings.rentalSystem);
    rentalSubtotal += item.currentQty * item.rate * units;
  });

  const discount = rental.discountType === 'percentage' 
    ? rentalSubtotal * (rental.discountValue / 100) 
    : rental.discountValue;
  
  const roundedSubtotal = Math.round(rentalSubtotal);
  const roundedDiscount = Math.round(discount);
  const currentRentalDue = roundedSubtotal - roundedDiscount;
  const openingBalance = Math.round(rental.openingBalance || 0);
  const securityDeposit = Math.round(rental.securityDeposit || 0);
  const totalDue = currentRentalDue + openingBalance + securityDeposit;
  
  const payments = rental.payments || [];
  const totalPaid = Math.round(payments.reduce((sum, p) => sum + p.amount, 0));
  const remainingAmount = totalDue - totalPaid;

  const handleUpdate = (updatedRental: Rental) => {
    const updatedRentals = allRentals.map(r => r.id === rental.id ? updatedRental : r);
    onUpdateRentals(updatedRentals);
  };

  const handleAddPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Math.round(Number(formData.get('amount')));
    if (amount <= 0) return;
    const newPayment: Payment = { id: Date.now().toString(), amount, date: new Date().toISOString() };
    handleUpdate({ ...rental, payments: [...(rental.payments || []), newPayment] });
    setShowPaymentForm(false);
  };

  const handleReturnItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemId = formData.get('itemId') as string;
    const qty = Math.round(Number(formData.get('qty')));
    
    const targetItem = rental.items.find(it => it.id === itemId);
    if (!targetItem) return;

    const returnAmount = Math.min(qty, targetItem.currentQty);
    
    const updatedInventory = inventoryItems.map(invItem => {
      if (invItem.id === targetItem.itemId) {
        return { ...invItem, availableQty: invItem.availableQty + returnAmount };
      }
      return invItem;
    });
    onUpdateInventoryItems(updatedInventory);

    const newReturnLog: ReturnLog = {
      id: Date.now().toString(),
      itemId: targetItem.itemId,
      itemName: targetItem.name,
      qty: returnAmount,
      date: new Date().toISOString()
    };

    const updatedItems = rental.items.map(it => {
      if (it.id === itemId) {
        return {
          ...it,
          returnedQty: it.returnedQty + returnAmount,
          currentQty: it.currentQty - returnAmount
        };
      }
      return it;
    });

    handleUpdate({ 
      ...rental, 
      items: updatedItems,
      returnLogs: [...(rental.returnLogs || []), newReturnLog]
    });
    setShowReturnForm(false);
  };

  const handleAddItem = (inventoryItem: Item, qty: number) => {
    const updatedInventory = inventoryItems.map(invItem => {
      if (invItem.id === inventoryItem.id) {
        return { ...invItem, availableQty: Math.max(0, invItem.availableQty - qty) };
      }
      return invItem;
    });
    onUpdateInventoryItems(updatedInventory);

    const newItem: RentalItem = {
      id: Math.random().toString(36).substr(2, 9),
      itemId: inventoryItem.id,
      name: inventoryItem.name,
      originalQty: qty,
      returnedQty: 0,
      currentQty: qty,
      rate: inventoryItem.ratePerUnit,
      startDate: new Date().toISOString()
    };

    handleUpdate({ ...rental, items: [...rental.items, newItem] });
    setShowAddItemForm(false);
  };

  const handleApplyDiscount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const val = Number(formData.get('discountValue'));
    const type = formData.get('discountType') as 'fixed' | 'percentage';
    
    handleUpdate({ 
      ...rental, 
      discountValue: val,
      discountType: type
    });
    setShowDiscountForm(false);
  };

  const handleCloseInvoice = () => {
    handleUpdate({ ...rental, status: 'closed' });
    setShowCloseConfirm(false);
  };

  const handleArchiveInvoice = () => {
    onArchive(rental);
    onBack();
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="no-print flex flex-wrap gap-4 justify-between items-center mb-6">
        <div className="flex flex-wrap gap-2">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-all">
            <ArrowLeft size={18} /> العودة
          </button>
          <button onClick={() => setShowDetails(!showDetails)} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm transition-all ${showDetails ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'}`}>
            <Info size={18} /> {showDetails ? 'إخفاء التفاصيل' : 'تفاصيل أكثر'}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowArchiveConfirm(true)} className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl border border-amber-100 hover:bg-amber-100 transition-all">
            <Archive size={18} /> نقل للأرشيف
          </button>
          
          {rental.status === 'active' && (
            <>
              <button onClick={() => setShowAddItemForm(true)} className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl border border-purple-200 hover:bg-purple-100">
                <PackagePlus size={18} /> إضافة مواد
              </button>
              <button onClick={() => setShowReturnForm(true)} className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-200 hover:bg-orange-100">
                <RotateCcw size={18} /> إرجاع مواد
              </button>
              <button onClick={() => setShowDiscountForm(true)} className="flex items-center gap-2 bg-pink-50 text-pink-700 px-4 py-2 rounded-xl border border-pink-200 hover:bg-pink-100">
                <Tag size={18} /> عمل خصم
              </button>
              <button onClick={() => setShowCloseConfirm(true)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl border border-red-700 hover:bg-red-700 shadow-sm transition-all">
                <CheckSquare size={18} /> إنهاء الفاتورة
              </button>
            </>
          )}
          <button onClick={() => setShowPaymentForm(true)} className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200 hover:bg-green-100">
            <Plus size={18} /> دفعة مالية
          </button>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-lg transition-all">
            <Printer size={18} /> طباعة (A4)
          </button>
        </div>
      </div>

      <div className="bg-white shadow-2xl mx-auto p-12 print:p-8 min-h-[29.7cm] w-[21cm] text-gray-800 relative overflow-hidden flex flex-col">
        {rental.status === 'closed' && (
          <div className="absolute top-10 -right-10 bg-red-600 text-white py-2 px-16 rotate-45 font-black uppercase text-sm shadow-lg no-print z-50">
            مغلقة / منتهية
          </div>
        )}

        <div className="flex justify-between items-start border-b-4 border-blue-600 pb-6 mb-2">
          <div>
            <h1 className="font-black text-blue-900 mb-1" style={{ fontSize: `${style.companyName}px` }}>{companySettings.name}</h1>
            <p className="text-gray-500 text-sm max-w-xs">{companySettings.headerText}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <img src={companySettings.logo} alt="logo" className="h-20 w-auto mb-2 object-contain" />
            <div className="space-y-0.5 text-xs">
              <p className="flex items-center justify-end gap-2">{companySettings.phone} <Phone size={12} className="text-blue-600" /></p>
              <p className="flex items-center justify-end gap-2">{companySettings.email} <Mail size={12} className="text-blue-600" /></p>
              <p className="flex items-center justify-end gap-2">{companySettings.address} <MapPin size={12} className="text-blue-600" /></p>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
           <h2 className="text-2xl font-black text-blue-900 border-b-2 border-blue-100 inline-block px-8 py-1">عقد إيجار معدات</h2>
           <p className="text-[10px] text-gray-400 font-bold">RENTAL CONTRACT AGREEMENT</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl mb-6 border">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase font-bold text-gray-400">بيانات العميل</p>
              <h3 className="font-black text-gray-800" style={{ fontSize: `${style.customerName}px` }}>{rental.customerName}</h3>
              <p className="text-gray-600 font-medium" style={{ fontSize: `${style.customerDetails}px` }}>{rental.customerPhone}</p>
              {rental.customerAddress && (
                <p className="text-gray-500 flex items-center gap-1 mt-1" style={{ fontSize: `${style.customerDetails * 0.8}px` }}>
                  <MapPin size={16} className="text-blue-500" /> {rental.customerAddress}
                </p>
              )}
            </div>
            <div className="text-left space-y-2">
              <div className="bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm inline-block">
                <span className="text-[10px] font-bold text-gray-400 ml-2">رقم العقد:</span>
                <span className="text-lg font-black text-blue-900">#{rental.id}</span>
              </div>
              <div className="flex gap-2">
                <div className="bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm text-center">
                  <p className="text-[9px] font-bold text-gray-400">تاريخ البدء</p>
                  <p className="font-bold" style={{ fontSize: `${style.dateFontSize}px` }}>{new Date(rental.startDate).toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-sm text-center bg-blue-50/30">
                  <p className="text-[9px] font-bold text-blue-400">تاريخ الطباعة</p>
                  <p className="font-bold" style={{ fontSize: `${style.dateFontSize}px` }}>{now.toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow">
          {itemsInRent.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold bg-blue-900 text-white px-4 py-1 rounded-t-lg">
                المواد المستأجرة حالياً
              </h3>
              <table className="w-full text-right border-x border-b border-gray-200 rounded-b-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-gray-200" style={{ fontSize: `${style.tableHeader}px` }}>
                    <th className="p-3">المادة</th>
                    <th className="p-3 text-center">الكمية</th>
                    <th className="p-3">السعر/{unitLabel}</th>
                    <th className="p-3">المدة</th>
                    <th className="p-3">المجموع</th>
                  </tr>
                </thead>
                <tbody className="font-bold" style={{ fontSize: `${style.tableBody}px` }}>
                  {itemsInRent.map(item => {
                     const itemStart = new Date(item.startDate);
                     const units = calculateRentalUnits(itemStart, now, systemSettings.rentalSystem);
                     const lineTotal = item.currentQty * item.rate * units;
                     return (
                       <tr key={item.id} className="border-t border-gray-100">
                         <td className="p-3">{item.name}</td>
                         <td className="p-3 text-center">{item.currentQty}</td>
                         <td className="p-3 font-normal">{formatCurrency(item.rate, systemSettings.currency)}</td>
                         <td className="p-3 font-normal">{units} {unitLabel}</td>
                         <td className="p-3 text-blue-700 font-black">{formatCurrency(lineTotal, systemSettings.currency)}</td>
                       </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {returnLogs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold bg-orange-100 text-orange-900 px-4 py-1 rounded-t-lg border-x border-t border-orange-200">
                سجل إرجاع المواد (المرتجع)
              </h3>
              <table className="w-full text-right border border-orange-200">
                <thead>
                  <tr className="bg-orange-50/50 text-xs font-bold border-b border-orange-100">
                    <th className="p-2">المادة</th>
                    <th className="p-2 text-center">الكمية المرتجعة</th>
                    <th className="p-2 text-center">تاريخ الإرجاع</th>
                    <th className="p-2 text-left">الحالة</th>
                  </tr>
                </thead>
                <tbody className="font-bold" style={{ fontSize: `${style.tableBody * 0.9}px` }}>
                  {returnLogs.map(log => (
                    <tr key={log.id} className="border-t border-orange-50 bg-white">
                      <td className="p-2 text-gray-800">{log.itemName}</td>
                      <td className="p-2 text-center text-orange-700">{log.qty}</td>
                      <td className="p-2 text-center text-gray-500 font-normal">{new Date(log.date).toLocaleString('ar-EG')}</td>
                      <td className="p-2 text-left">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">تم الإرجاع</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {payments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold bg-green-100 text-green-900 px-4 py-1 rounded-t-lg border-x border-t border-green-200">
                سجل الدفعات والمقبوضات
              </h3>
              <table className="w-full text-right border border-green-200">
                <tbody className="font-bold">
                  {payments.map(p => (
                    <tr key={p.id} className="border-t border-green-50 bg-white">
                      <td className="p-2 text-gray-500 font-normal" style={{ fontSize: `${style.dateFontSize * 0.8}px` }}>{new Date(p.date).toLocaleString('ar-EG')}</td>
                      <td className="p-2 font-black text-green-800" style={{ fontSize: `${style.tableBody}px` }}>{formatCurrency(p.amount, systemSettings.currency)}</td>
                      <td className="p-2 text-left">
                        <span className="text-green-600 font-bold flex items-center gap-1 justify-end text-xs"><CheckCircle size={14} /> دفعة مؤكدة</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end border-t-2 border-gray-100 pt-6 mt-auto">
          <div className="w-1/2">
             <h4 className="text-[10px] font-bold text-gray-800 mb-1 border-b pb-0.5 inline-block">أحكام وشروط الإيجار</h4>
             <pre className="text-gray-400 whitespace-pre-wrap leading-tight italic" style={{ fontSize: `${style.terms}px` }}>
               {companySettings.terms}
             </pre>
          </div>
          <div className="w-2/5 space-y-1.5">
            <div className="flex justify-between items-center text-gray-800 px-3 py-1 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-bold" style={{ fontSize: `${style.summaryLabels}px` }}>رصيد سابق:</span>
              <span className="font-black text-blue-900" style={{ fontSize: `${style.summaryValues}px` }}>{formatCurrency(openingBalance, systemSettings.currency)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-700 px-3 py-0.5">
              <span className="font-bold" style={{ fontSize: `${style.summaryLabels}px` }}>إجمالي الإيجار:</span>
              <span className="font-black" style={{ fontSize: `${style.summaryValues}px` }}>{formatCurrency(roundedSubtotal, systemSettings.currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-red-600 px-3 py-0.5">
                <span className="font-bold" style={{ fontSize: `${style.summaryLabels}px` }}>الخصم:</span>
                <span className="font-black" style={{ fontSize: `${style.summaryValues}px` }}>-{formatCurrency(roundedDiscount, systemSettings.currency)}</span>
              </div>
            )}
            {securityDeposit > 0 && (
              <div className="flex justify-between items-center text-blue-600 px-3 py-0.5">
                <span className="font-bold flex items-center gap-1" style={{ fontSize: `${style.summaryLabels}px` }}><ShieldCheck size={14}/> مبلغ التأمين:</span>
                <span className="font-black" style={{ fontSize: `${style.summaryValues}px` }}>{formatCurrency(securityDeposit, systemSettings.currency)}</span>
              </div>
            )}
            <div className="h-px bg-gray-200"></div>
            <div className="flex justify-between items-center text-gray-500 px-3 py-0.5">
              <span className="font-bold" style={{ fontSize: `${style.summaryLabels}px` }}>المجموع الكلي:</span>
              <span className="font-black" style={{ fontSize: `${style.summaryValues}px` }}>{formatCurrency(totalDue, systemSettings.currency)}</span>
            </div>
            <div className="flex justify-between items-center text-green-700 px-3 py-0.5">
              <span className="font-bold" style={{ fontSize: `${style.summaryLabels}px` }}>المسدد نقداً:</span>
              <span className="font-black" style={{ fontSize: `${style.summaryValues}px` }}>-{formatCurrency(totalPaid, systemSettings.currency)}</span>
            </div>
            
            <div className="flex justify-between items-center bg-blue-900 text-white p-4 rounded-xl shadow-xl border-2 border-blue-800 mt-2">
              <div className="space-y-0.5">
                <span className="text-[10px] opacity-70 block font-bold uppercase tracking-widest">FINAL BALANCE</span>
                <span className="text-sm font-black block">إجمالي الرصيد المتبقي</span>
              </div>
              <span className="font-black" style={{ fontSize: `${style.netBalanceValue}px` }}>{formatCurrency(remainingAmount, systemSettings.currency)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 text-center text-[10px] text-gray-400 border-t">
          <p>{companySettings.footerText} &bull; {now.toLocaleDateString('ar-EG')}</p>
        </div>
      </div>

      {/* MODALS */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-green-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><DollarSign size={18} /> تحصيل دفعة</h3>
              <button onClick={() => setShowPaymentForm(false)} className="hover:bg-green-700 p-1 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <input type="number" name="amount" required step="1" autoFocus className="w-full px-4 py-3 border rounded-xl text-lg font-bold outline-none" placeholder="أدخل المبلغ..." />
              <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all">تأكيد التحصيل</button>
            </form>
          </div>
        </div>
      )}

      {showReturnForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><RotateCcw size={18} /> إرجاع مواد مستأجرة</h3>
              <button onClick={() => setShowReturnForm(false)} className="hover:bg-orange-700 p-1 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleReturnItem} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">اختر المادة المراد إرجاعها للمخزن</label>
                <select name="itemId" required className="w-full p-3 border rounded-xl text-sm font-bold outline-none">
                  {itemsInRent.map(it => (
                    <option key={it.id} value={it.id}>{it.name} (الموجود: {it.currentQty})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">الكمية المرتجعة</label>
                <input type="number" name="qty" required min="1" step="1" className="w-full px-4 py-3 border rounded-xl font-bold outline-none" placeholder="الكمية..." />
              </div>
              <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700">تأكيد الإرجاع</button>
            </form>
          </div>
        </div>
      )}

      {showDiscountForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-pink-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Tag size={18} /> تطبيق خصم للعميل</h3>
              <button onClick={() => setShowDiscountForm(false)} className="hover:bg-pink-700 p-1 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleApplyDiscount} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">نوع الخصم</label>
                  <select name="discountType" defaultValue={rental.discountType} className="w-full p-3 border rounded-xl text-sm font-bold">
                    <option value="fixed">مبلغ ثابت</option>
                    <option value="percentage">نسبة مئوية %</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">القيمة</label>
                  <input name="discountValue" type="number" step="1" defaultValue={rental.discountValue} className="w-full p-3 border rounded-xl font-bold" />
                </div>
              </div>
              <button type="submit" className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 transition-all">حفظ الخصم</button>
            </form>
          </div>
        </div>
      )}

      {showAddItemForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
            <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><PackagePlus size={18} /> إضافة مواد جديدة</h3>
              <button onClick={() => setShowAddItemForm(false)} className="hover:bg-purple-700 p-1 rounded-full"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {inventoryItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white border rounded-xl hover:border-purple-300 transition-colors shadow-sm">
                  <div>
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">المتاح في المخزن: {item.availableQty}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" id={`qty-${item.id}`} min="1" max={item.availableQty} step="1" defaultValue="1" className="w-16 p-2 border rounded-lg text-center font-bold" />
                    <button 
                      onClick={() => {
                        const qty = Number((document.getElementById(`qty-${item.id}`) as HTMLInputElement).value);
                        handleAddItem(item, qty);
                      }}
                      className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700"
                    >
                      إضافة <Plus size={14} className="inline" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-red-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><CheckSquare size={18} /> إنهاء / إغلاق الفاتورة</h3>
              <button onClick={() => setShowCloseConfirm(false)} className="hover:bg-red-700 p-1 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-2">
                <p className="text-red-800 text-sm font-bold">عند إنهاء الفاتورة، سيتم اعتبار العقد منتهياً. المتبقي:</p>
                <div className="flex justify-between items-center border-t border-red-200 pt-2">
                   <span className="font-bold text-red-900">المبلغ المتبقي:</span>
                   <span className="text-xl font-black text-red-600">{formatCurrency(remainingAmount, systemSettings.currency)}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={handleCloseInvoice} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all">تأكيد الإغلاق</button>
                <button onClick={() => setShowCloseConfirm(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Archive size={18} /> نقل الفاتورة للأرشيف</h3>
              <button onClick={() => setShowArchiveConfirm(false)} className="hover:bg-amber-700 p-1 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                <p className="text-amber-800 font-bold">هل أنت متأكد من نقل هذه الفاتورة للأرشيف؟</p>
                <p className="text-amber-600 text-xs mt-2">سيتم إرجاع كافة المواد المتبقية للمخزن تلقائياً.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={handleArchiveInvoice} className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-all">نقل للأرشيف</button>
                <button onClick={() => setShowArchiveConfirm(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceView;
