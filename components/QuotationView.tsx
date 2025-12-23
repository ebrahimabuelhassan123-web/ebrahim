
import React, { useState, useEffect, useCallback } from 'react';
import { Quotation, CompanySettings, SystemSettings } from '../types';
import { ArrowLeft, Printer, Mail, Phone, MapPin, Package, FileText, CheckCircle, ShieldCheck, Truck, Archive, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface Props {
  quotation: Quotation;
  onBack: () => void;
  companySettings: CompanySettings;
  systemSettings: SystemSettings;
  onConvertToContract: (quote: Quotation) => void;
  onUpdateStatus: (id: string, status: 'pending' | 'permit' | 'converted') => void;
  onArchive: (quote: Quotation) => void;
  onDelete: (id: string) => void;
}

const QuotationView: React.FC<Props> = ({ 
  quotation, 
  onBack, 
  companySettings, 
  systemSettings, 
  onConvertToContract, 
  onUpdateStatus,
  onArchive,
  onDelete
}) => {
  const [viewType, setViewType] = useState<'quotation' | 'permit'>(quotation.status === 'permit' ? 'permit' : 'quotation');
  
  useEffect(() => {
    if (quotation.status === 'permit') setViewType('permit');
    else if (quotation.status === 'pending') setViewType('quotation');
  }, [quotation.status]);

  const style = systemSettings.invoiceStyle;

  let subtotal = 0;
  quotation.items.forEach(item => {
    subtotal += item.currentQty * item.rate;
  });

  const discount = quotation.discountType === 'percentage' 
    ? subtotal * (quotation.discountValue / 100) 
    : quotation.discountValue;

  const totalAfterDiscount = subtotal - discount;
  const securityDeposit = quotation.securityDeposit || 0;

  const handleIssuePermit = useCallback(() => {
    if(confirm('هل تريد إصدار إذن إخراج رسمي ونقله لقسم الأذونات؟ سيتم خصم الكميات من المخزن تلقائياً.')) {
      onUpdateStatus(quotation.id, 'permit');
    }
  }, [quotation.id, onUpdateStatus]);

  const handleConvertToRental = useCallback(() => {
    const msg = quotation.status === 'permit' 
      ? 'هل تريد تحويل هذا الإذن إلى عقد إيجار نشط الآن؟ سيتم فتح الفاتورة تلقائياً للمتابعة.'
      : 'هل تريد تحويل عرض السعر إلى عقد إيجار رسمي؟ سيتم خصم الكميات وبدء الحساب المالي.';
    if(confirm(msg)) {
      onConvertToContract(quotation);
    }
  }, [quotation, onConvertToContract]);

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Action Header */}
      <div className="no-print flex flex-col md:flex-row gap-4 justify-between items-center mb-6 px-2">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={onBack} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 text-gray-600 bg-white px-4 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 transition-all font-bold border border-gray-100"
          >
            <ArrowLeft size={18} /> العودة
          </button>
          
          <button 
            onClick={() => setViewType(viewType === 'quotation' ? 'permit' : 'quotation')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl shadow-sm transition-all border font-bold ${
              viewType === 'permit' 
                ? 'bg-orange-50 text-orange-700 border-orange-200' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            {viewType === 'quotation' ? <Truck size={18} /> : <FileText size={18} />}
            {viewType === 'quotation' ? 'إذن إخراج' : 'عرض سعر'}
          </button>

          {quotation.status === 'pending' && (
            <button 
              onClick={handleIssuePermit}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-xl hover:bg-orange-700 shadow-lg font-black transition-all active:scale-95"
              title="خصم من المخزن ونقل لقسم الأذونات"
            >
              <Truck size={18} /> إصدار إذن إخراج
            </button>
          )}

          {(quotation.status === 'pending' || quotation.status === 'permit') && (
            <button 
              onClick={handleConvertToRental}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 shadow-lg font-black transition-all active:scale-95"
              title="تحويل لعقد إيجار رسمي وبدء الفوترة"
            >
              <CheckCircle size={18} /> تحويل لعقد إيجار
            </button>
          )}
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => onArchive(quotation)} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-50 text-amber-600 px-4 py-2.5 rounded-xl border border-amber-200 hover:bg-amber-100 font-bold transition-all"
            title="أرشفة السجل"
          >
            <Archive size={18} /> أرشيف
          </button>
          <button 
            onClick={() => onDelete(quotation.id)} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl border border-red-200 hover:bg-red-100 font-bold transition-all"
            title="حذف نهائي"
          >
            <Trash2 size={18} /> حذف
          </button>
          <button 
            onClick={() => window.print()} 
            className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg font-bold transition-all"
          >
            <Printer size={18} /> طباعة
          </button>
        </div>
      </div>

      {/* Main Document View */}
      <div className="bg-white shadow-2xl mx-auto p-6 md:p-12 print:p-8 min-h-[29.7cm] w-full max-w-[21cm] text-gray-800 relative flex flex-col rounded-lg border overflow-hidden">
        {quotation.status === 'converted' && (
          <div className="absolute top-10 -right-10 bg-green-600 text-white py-2 px-16 rotate-45 font-black uppercase text-xs shadow-lg z-50">
            تم التحويل لعقد
          </div>
        )}
        
        {/* Header */}
        <div className={`flex justify-between items-start border-b-4 pb-6 mb-4 ${viewType === 'quotation' ? 'border-indigo-600' : 'border-orange-600'}`}>
          <div>
            <h1 className="font-black mb-1 text-gray-900" style={{ fontSize: `${style.companyName}px` }}>
              {companySettings.name}
            </h1>
            <p className="text-gray-500 text-sm max-w-xs font-bold">{companySettings.headerText}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <img src={companySettings.logo} alt="logo" className="h-16 md:h-20 w-auto mb-2 object-contain" />
            <div className="space-y-0.5 text-xs text-gray-600 font-bold">
              <p className="flex items-center justify-end gap-2">{companySettings.phone} <Phone size={12} /></p>
              <p className="flex items-center justify-end gap-2">{companySettings.email} <Mail size={12} /></p>
              <p className="flex items-center justify-end gap-2">{companySettings.address} <MapPin size={12} /></p>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
           <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest ${viewType === 'quotation' ? 'text-indigo-900' : 'text-orange-900'}`}>
             {viewType === 'quotation' ? 'عرض سعر إيجار معدات' : 'إذن إخراج مواد (مخزن)'}
           </h2>
           <p className="text-gray-400 text-[10px] font-black">DOCUMENT NO. #{quotation.id}</p>
        </div>

        {/* Customer & Info Card */}
        <div className="bg-gray-50 p-4 md:p-6 rounded-3xl mb-8 flex flex-col sm:flex-row justify-between items-center border border-gray-100">
          <div className="space-y-1 text-center sm:text-right w-full sm:w-auto">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">بيانات العميل</p>
            <h3 className="font-black text-gray-800" style={{ fontSize: `${style.customerName}px` }}>{quotation.customerName}</h3>
            <p className="text-gray-600 font-bold" style={{ fontSize: `${style.customerDetails}px` }}>{quotation.customerPhone}</p>
            {quotation.customerAddress && <p className="text-gray-500 text-sm flex items-center justify-center sm:justify-start gap-1 font-bold mt-2"><MapPin size={14} className="text-blue-500"/> {quotation.customerAddress}</p>}
          </div>
          <div className="bg-white px-8 py-5 rounded-2xl border border-gray-200 shadow-sm text-center mt-4 sm:mt-0 w-full sm:w-auto">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">تاريخ الإصدار</p>
            <p className="font-black text-xl text-gray-800" style={{ fontSize: `${style.dateFontSize}px` }}>{new Date(quotation.date).toLocaleDateString('ar-EG')}</p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-grow overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[500px]">
            <thead>
              <tr className={`${viewType === 'quotation' ? 'bg-indigo-900' : 'bg-orange-900'} text-white font-black`}>
                <th className="p-4 rounded-rt-2xl">المادة / الصنف</th>
                <th className="p-4 text-center">الكمية</th>
                {viewType === 'quotation' && <th className="p-4 text-center">السعر الدوري</th>}
                {viewType === 'quotation' && <th className="p-4 text-center">المجموع التقديري</th>}
                <th className={`p-4 rounded-lt-2xl ${viewType === 'quotation' ? '' : 'w-48'}`}>
                  {viewType === 'quotation' ? 'ملاحظات' : 'توقيع المستلم'}
                </th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 font-bold">
                  <td className="p-4 text-gray-800" style={{ fontSize: `${style.tableBody}px` }}>{item.name}</td>
                  <td className="p-4 text-center text-lg">{item.currentQty}</td>
                  {viewType === 'quotation' && <td className="p-4 text-center font-bold text-gray-600">{formatCurrency(item.rate, systemSettings.currency)}</td>}
                  {viewType === 'quotation' && <td className="p-4 text-center text-indigo-700 font-black">{formatCurrency(item.currentQty * item.rate, systemSettings.currency)}</td>}
                  <td className="p-4 text-gray-300 italic text-sm">
                    {viewType === 'quotation' ? '---' : '________________'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary (Only for Quotation View) */}
        {viewType === 'quotation' && (
          <div className="flex flex-col md:flex-row justify-between items-end border-t-2 border-gray-100 pt-8 mt-8 gap-8">
            <div className="w-full md:w-1/2">
               <h4 className="text-xs font-black text-gray-800 mb-2 border-b-2 border-indigo-100 inline-block">الشروط والأحكام الخاصة بالعرض</h4>
               <p className="text-[10px] text-gray-400 leading-relaxed italic whitespace-pre-wrap font-bold">{companySettings.terms}</p>
            </div>
            <div className="w-full md:w-1/3 space-y-2 font-black">
               <div className="flex justify-between px-2 text-sm text-gray-500">
                 <span style={{ fontSize: `${style.summaryLabels}px` }}>الإجمالي:</span>
                 <span style={{ fontSize: `${style.summaryValues}px` }}>{formatCurrency(subtotal, systemSettings.currency)}</span>
               </div>
               {discount > 0 && (
                 <div className="flex justify-between px-2 text-red-500 text-sm">
                   <span style={{ fontSize: `${style.summaryLabels}px` }}>الخصم:</span>
                   <span style={{ fontSize: `${style.summaryValues}px` }}>-{formatCurrency(discount, systemSettings.currency)}</span>
                 </div>
               )}
               {securityDeposit > 0 && (
                 <div className="flex justify-between px-2 text-blue-600 text-sm">
                   <span className="flex items-center gap-1" style={{ fontSize: `${style.summaryLabels}px` }}><ShieldCheck size={14}/> التأمين:</span>
                   <span style={{ fontSize: `${style.summaryValues}px` }}>{formatCurrency(securityDeposit, systemSettings.currency)}</span>
                 </div>
               )}
               <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-5 rounded-3xl flex justify-between items-center shadow-xl border border-indigo-950">
                 <span className="text-sm font-black">الإجمالي الكلي</span>
                 <span className="text-2xl font-black">{formatCurrency(totalAfterDiscount + securityDeposit, systemSettings.currency)}</span>
               </div>
            </div>
          </div>
        )}

        {/* Store Signatures (Only for Permit View) */}
        {viewType === 'permit' && (
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 gap-10 md:gap-20">
             <div className="border-t-2 border-gray-200 pt-4 text-center font-black">
               <p className="text-gray-800">توقيع مسؤول المستودع</p>
               <p className="text-[10px] text-gray-400 uppercase tracking-widest">Storekeeper Signature</p>
             </div>
             <div className="border-t-2 border-gray-200 pt-4 text-center font-black">
               <p className="text-gray-800">توقيع المستلم / السائق</p>
               <p className="text-[10px] text-gray-400 uppercase tracking-widest">Receiver Signature</p>
             </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-6 text-center text-[10px] text-gray-400 border-t border-dashed font-bold">
          <p>{companySettings.footerText} &bull; {new Date().toLocaleDateString('ar-EG')}</p>
        </div>
      </div>
    </div>
  );
};

export default QuotationView;
