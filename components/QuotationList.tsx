
import React, { useState } from 'react';
import { Quotation, Currency } from '../types';
import { Eye, Trash2, Search, ClipboardList, CheckCircle, Archive } from 'lucide-react';

interface Props {
  quotations: Quotation[];
  onView: (quote: Quotation) => void;
  onDelete: (id: string) => void;
  onArchive: (quote: Quotation) => void;
  currency: Currency;
}

const QuotationList: React.FC<Props> = ({ quotations, onView, onDelete, onArchive, currency }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = quotations.filter(q => 
    q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.customerPhone.includes(searchTerm) ||
    q.id.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="relative w-full no-print">
        <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="بحث في عروض الأسعار والأذونات..."
          className="w-full pr-10 pl-4 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-bold text-gray-700">رقم السجل</th>
              <th className="p-4 font-bold text-gray-700">بيانات العميل</th>
              <th className="p-4 font-bold text-gray-700">التاريخ</th>
              <th className="p-4 font-bold text-gray-700">الحالة</th>
              <th className="p-4 font-bold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(quote => (
              <tr key={quote.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4 font-black text-indigo-700">#{quote.id}</td>
                <td className="p-4">
                  <p className="font-bold text-gray-800">{quote.customerName}</p>
                  <p className="text-xs text-gray-500">{quote.customerPhone}</p>
                </td>
                <td className="p-4 text-sm text-gray-500 font-bold">{new Date(quote.date).toLocaleDateString('ar-EG')}</td>
                <td className="p-4">
                  {quote.status === 'converted' ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full w-fit">
                      <CheckCircle size={14} /> تم التحويل لعقد
                    </span>
                  ) : quote.status === 'permit' ? (
                    <span className="text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1 rounded-full w-fit">
                      إذن إخراج
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded-full w-fit">
                      عرض سعر
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onView(quote)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => onArchive(quote)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="نقل للأرشيف"
                    >
                      <Archive size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟')) onDelete(quote.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف نهائي"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-400 font-bold italic">لا توجد سجلات مطابقة للبحث</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationList;
