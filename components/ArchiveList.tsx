
import React, { useState, useMemo } from 'react';
import { Rental, Currency, SystemSettings } from '../types';
import { RotateCw, Trash2, Search, Printer, AlertCircle } from 'lucide-react';
import { formatCurrency, calculateRentalUnits } from '../utils/calculations';

interface Props {
  archivedRentals: Rental[];
  onRestore: (rental: Rental) => void;
  onDeletePermanently: (id: string) => void;
  currency: Currency;
  systemSettings: SystemSettings;
  onViewInvoice: (rental: Rental) => void;
}

const ArchiveList: React.FC<Props> = ({ archivedRentals, onRestore, onDeletePermanently, currency, systemSettings, onViewInvoice }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const calculateRemaining = (rental: Rental) => {
    let rentalTotal = 0;
    const now = new Date();
    
    rental.items.forEach(item => {
      const units = calculateRentalUnits(new Date(item.startDate), now, systemSettings.rentalSystem);
      rentalTotal += item.currentQty * item.rate * units;
    });

    const discount = rental.discountType === 'percentage' 
      ? rentalTotal * (rental.discountValue / 100) 
      : rental.discountValue;
    
    const totalDue = (rentalTotal - discount) + (rental.openingBalance || 0);
    const totalPaid = (rental.payments || []).reduce((sum, p) => sum + p.amount, 0);

    return Math.max(0, Math.round(totalDue - totalPaid));
  };

  const filteredArchived = useMemo(() => {
    return archivedRentals.filter(r => 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.customerPhone.includes(searchTerm)
    ).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [archivedRentals, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800 text-sm">
        <AlertCircle size={20} className="shrink-0" />
        <p>هذا القسم يحتوي على الفواتير المؤرشفة. يمكنك استعادة أي فاتورة لإرجاعها لقائمة العقود النشطة أو حذفها نهائياً من النظام.</p>
      </div>

      <div className="relative w-full no-print">
        <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="بحث في الأرشيف..."
          className="w-full pr-10 pl-4 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none shadow-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-bold text-gray-700">العميل</th>
              <th className="p-4 font-bold text-gray-700">تاريخ البدء</th>
              <th className="p-4 font-bold text-gray-700">المتبقي عند الأرشفة</th>
              <th className="p-4 font-bold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredArchived.length > 0 ? filteredArchived.map(rental => {
              const remaining = calculateRemaining(rental);
              return (
                <tr key={rental.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{rental.customerName}</p>
                    <p className="text-xs text-gray-500">{rental.customerPhone}</p>
                  </td>
                  <td className="p-4 text-sm font-medium">{new Date(rental.startDate).toLocaleDateString('ar-EG')}</td>
                  <td className="p-4">
                    <p className={`font-black ${remaining > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {formatCurrency(remaining, currency)}
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onViewInvoice(rental)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="عرض الفاتورة"
                      >
                        <Printer size={18} />
                      </button>
                      <button 
                        onClick={() => onRestore(rental)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="استعادة من الأرشيف"
                      >
                        <RotateCw size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
                            onDeletePermanently(rental.id);
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="حذف نهائي"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-400 font-medium">الأرشيف فارغ حالياً</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ArchiveList;
