
import React, { useState } from 'react';
import { Item, Rental, SystemSettings } from '../types';
import { Plus, X, User, Phone, Wallet, FileText, MapPin, ShieldCheck } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSave: (rental: Rental) => void;
  items: Item[];
  systemSettings: SystemSettings;
}

const RentalForm: React.FC<Props> = ({ onClose, onSave, items, systemSettings }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedItems, setSelectedItems] = useState<{item: Item, qty: number, customRate: number}[]>([]);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [openingBalance, setOpeningBalance] = useState(0);
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

    const rental: Rental = {
      id: Date.now().toString(),
      customerName,
      customerPhone,
      customerAddress,
      startDate: new Date().toISOString(),
      status: 'active',
      discountValue,
      discountType,
      openingBalance,
      securityDeposit,
      notes,
      payments: [],
      items: selectedItems.map(si => ({
        id: Math.random().toString(36).substr(2, 9),
        itemId: si.item.id,
        name: si.item.name,
        originalQty: si.qty,
        returnedQty: 0,
        currentQty: si.qty,
        rate: si.customRate,
        startDate: new Date().toISOString()
      }))
    };

    onSave(rental);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إنشاء عقد إيجار جديد</h2>
          <p className="opacity-80 text-sm">أضف بيانات العميل والمواد المستأجرة</p>
        </div>
        <button onClick={onClose} className="hover:bg-blue-700 p-2 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <User size={16} /> اسم العميل
            </label>
            <input 
              required
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              placeholder="الاسم الثلاثي..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Phone size={16} /> رقم الهاتف
            </label>
            <input 
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="05xxxxxxx"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <MapPin size={16} /> عنوان العميل
            </label>
            <input 
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="الحي، الشارع، المعلم..."
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">اختيار المواد</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-gray-50 p-4 rounded-xl space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase">المخزن</p>
              <div className="space-y-2 overflow-y-auto max-h-60">
                {items.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    className="w-full text-right p-3 bg-white border rounded-lg hover:border-blue-500 hover:shadow-sm transition-all text-sm flex justify-between items-center group"
                  >
                    <span>{item.name}</span>
                    <Plus size={16} className="text-blue-500 opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              {selectedItems.length === 0 ? (
                <div className="h-full border-2 border-dashed rounded-xl flex items-center justify-center text-gray-400">
                  لم يتم اختيار أي مواد بعد
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map(si => (
                    <div key={si.item.id} className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-gray-800">{si.item.name}</p>
                        <button type="button" onClick={() => removeItem(si.item.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-lg"><X size={18} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">الكمية</label>
                          <input type="number" min="1" className="w-full p-2 border rounded-lg text-center font-bold" value={si.qty} onChange={(e) => updateQty(si.item.id, Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">السعر</label>
                          <input type="number" min="0" className="w-full p-2 border rounded-lg text-center font-bold text-blue-700 bg-white" value={si.customRate} onChange={(e) => updateRate(si.item.id, Number(e.target.value))} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Wallet size={16} /> رصيد سابق
            </label>
            <input type="number" className="w-full px-4 py-2 border rounded-xl" placeholder="0.00" value={openingBalance || ''} onChange={(e) => setOpeningBalance(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600"/> مبلغ التأمين
            </label>
            <input type="number" className="w-full px-4 py-2 border rounded-xl font-black text-blue-700" placeholder="0.00" value={securityDeposit || ''} onChange={(e) => setSecurityDeposit(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">الخصم</label>
            <div className="flex gap-2">
               <select className="w-24 p-2 border rounded-xl text-xs font-bold" value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}>
                 <option value="fixed">ثابت</option>
                 <option value="percentage">%</option>
               </select>
               <input type="number" className="flex-1 p-2 border rounded-xl" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <FileText size={16} /> ملاحظات العقد
          </label>
          <textarea className="w-full px-4 py-3 border rounded-xl outline-none" placeholder="أضف أي ملاحظات..." rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end">
             <button type="submit" className="bg-blue-600 text-white px-12 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">حفظ وطباعة الفاتورة</button>
        </div>
      </form>
    </div>
  );
};

export default RentalForm;
