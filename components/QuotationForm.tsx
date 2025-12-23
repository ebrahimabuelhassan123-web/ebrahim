
import React, { useState } from 'react';
import { Item, Quotation, SystemSettings } from '../types';
import { Plus, X, User, Phone, MapPin, ClipboardList, ShieldCheck, Tag } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSave: (quote: Quotation) => void;
  items: Item[];
  systemSettings: SystemSettings;
}

const QuotationForm: React.FC<Props> = ({ onClose, onSave, items, systemSettings }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedItems, setSelectedItems] = useState<{item: Item, qty: number, customRate: number}[]>([]);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [notes, setNotes] = useState('');

  const addItem = (item: Item) => {
    if (selectedItems.find(si => si.item.id === item.id)) return;
    setSelectedItems([...selectedItems, { item, qty: 1, customRate: item.ratePerUnit }]);
  };

  const removeItem = (id: string) => {
    setSelectedItems(selectedItems.filter(si => si.item.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    setSelectedItems(selectedItems.map(si => si.item.id === id ? { ...si, qty } : si));
  };

  const updateRate = (id: string, customRate: number) => {
    setSelectedItems(selectedItems.map(si => si.item.id === id ? { ...si, customRate } : si));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || selectedItems.length === 0) {
      alert('يرجى ملء البيانات واختيار مادة واحدة على الأقل');
      return;
    }

    const quote: Quotation = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      customerName,
      customerPhone,
      customerAddress,
      date: new Date().toISOString(),
      status: 'pending',
      discountValue,
      discountType,
      securityDeposit,
      notes,
      items: selectedItems.map(si => ({
        id: Math.random().toString(36).substr(2, 9),
        itemId: si.item.id,
        name: si.item.name,
        originalQty: si.qty,
        returnedQty: 0,
        currentQty: si.qty,
        rate: si.customRate, // Use the custom rate
        startDate: new Date().toISOString()
      }))
    };

    onSave(quote);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><ClipboardList /> إنشاء عرض سعر جديد</h2>
          <p className="opacity-80 text-sm">أضف بيانات العميل لتسعير المواد المستأجرة</p>
        </div>
        <button onClick={onClose} className="hover:bg-indigo-700 p-2 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><User size={16} /> اسم العميل</label>
            <input required className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="الاسم..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Phone size={16} /> رقم الهاتف</label>
            <input className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="05xxxxxxx" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><MapPin size={16} /> العنوان</label>
            <input className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="الحي..." value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">اختيار المواد وتعديل الأسعار</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-gray-50 p-4 rounded-xl space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase">المخزن</p>
              <div className="space-y-2 overflow-y-auto max-h-60">
                {items.map(item => (
                  <button key={item.id} type="button" onClick={() => addItem(item)} className="w-full text-right p-3 bg-white border rounded-lg hover:border-indigo-500 transition-all text-sm flex justify-between items-center group">
                    <span>{item.name}</span>
                    <Plus size={16} className="text-indigo-500" />
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              {selectedItems.length === 0 ? (
                <div className="h-full border-2 border-dashed rounded-xl flex items-center justify-center text-gray-400">لم يتم اختيار أي مواد</div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map(si => (
                    <div key={si.item.id} className="bg-indigo-50 p-4 rounded-xl space-y-3 border border-indigo-100">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-gray-800 text-lg">{si.item.name}</p>
                        <button type="button" onClick={() => removeItem(si.item.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><X size={18} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500">الكمية:</label>
                          <input type="number" min="1" className="w-full p-2 border rounded-lg text-center font-bold" value={si.qty} onChange={(e) => updateQty(si.item.id, Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500">سعر الإيجار ({systemSettings.currency}):</label>
                          <input type="number" min="0" className="w-full p-2 border border-indigo-200 rounded-lg text-center font-black text-indigo-700 bg-white" value={si.customRate} onChange={(e) => updateRate(si.item.id, Number(e.target.value))} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl">
           <div className="space-y-4">
              <h4 className="font-bold text-gray-700 flex items-center gap-2"><Tag size={18} className="text-pink-600"/> إعدادات الخصم</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">نوع الخصم</label>
                  <select className="w-full p-2 border rounded-xl font-bold" value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
                    <option value="fixed">مبلغ ثابت</option>
                    <option value="percentage">نسبة مئوية %</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">قيمة الخصم</label>
                  <input type="number" className="w-full p-2 border rounded-xl font-bold" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))} />
                </div>
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="font-bold text-gray-700 flex items-center gap-2"><ShieldCheck size={18} className="text-blue-600"/> مبلغ التأمين</h4>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">مبلغ التأمين المسترد ({systemSettings.currency})</label>
                <input type="number" className="w-full p-2 border rounded-xl font-black text-blue-700" placeholder="0.00" value={securityDeposit || ''} onChange={(e) => setSecurityDeposit(Number(e.target.value))} />
              </div>
           </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">ملاحظات عرض السعر</label>
          <textarea className="w-full mt-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أضف ملاحظات إضافية هنا..." />
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-indigo-600 text-white px-12 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 hover:-translate-y-1 transition-all">حفظ عرض السعر</button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
