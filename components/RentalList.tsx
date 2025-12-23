
import React, { useState, useMemo } from 'react';
import { Rental, Currency, SystemSettings, Item } from '../types';
import { Printer, RotateCcw, Archive, Search, AlertCircle } from 'lucide-react';
import { formatCurrency, calculateRentalUnits } from '../utils/calculations';

interface Props {
  rentals: Rental[];
  onViewInvoice: (rental: Rental) => void;
  currency: Currency;
  onUpdateRentals: (rentals: Rental[]) => void;
  onArchive: (rental: Rental) => void;
  systemSettings: SystemSettings;
  onUpdateInventoryItems: (items: Item[]) => void;
  inventoryItems: Item[];
}

const RentalList: React.FC<Props> = ({ 
  rentals, 
  onViewInvoice, 
  currency, 
  onUpdateRentals, 
  onArchive, 
  systemSettings,
  onUpdateInventoryItems,
  inventoryItems
}) => {
  const [returnDialog, setReturnDialog] = useState<{ rental: Rental, itemIndex: number } | null>(null);
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

  const processedRentals = useMemo(() => {
    const filtered = rentals.filter(r => 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.customerPhone.includes(searchTerm)
    );

    return filtered.sort((a, b) => {
      const remainingA = calculateRemaining(a);
      const remainingB = calculateRemaining(b);

      const getPriority = (r: Rental, remaining: number) => {
        if (r.status === 'active') return 0;
        if (r.status === 'closed' && remaining > 0) return 1;
        return 2;
      };

      const prioA = getPriority(a, remainingA);
      const prioB = getPriority(b, remainingB);

      if (prioA !== prioB) return prioA - prioB;
      
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });
  }, [rentals, searchTerm, systemSettings.rentalSystem]);

  const handleReturn = (qty: number) => {
    if (!returnDialog) return;
    const { rental, itemIndex } = returnDialog;
    
    // 1. Return items to inventory
    const targetItem = rental.items[itemIndex];
    const returnAmount = Math.min(qty, targetItem.currentQty);
    
    const updatedInventory = inventoryItems.map(invItem => {
      if (invItem.id === targetItem.itemId) {
        return { ...invItem, availableQty: invItem.availableQty + returnAmount };
      }
      return invItem;
    });
    onUpdateInventoryItems(updatedInventory);

    // 2. Update rental status
    const updatedRentals = rentals.map(r => {
      if (r.id === rental.id) {
        const updatedItems = [...r.items];
        const item = updatedItems[itemIndex];
        
        updatedItems[itemIndex] = {
          ...item,
          returnedQty: item.returnedQty + returnAmount,
          currentQty: item.currentQty - returnAmount
        };
        return { ...r, items: updatedItems };
      }
      return r;
    });

    onUpdateRentals(updatedRentals);
    setReturnDialog(null);
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full no-print">
        <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="بحث باسم العميل أو رقم الهاتف..."
          className="w-full pr-10 pl-4 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-bold text-gray-700">العميل</th>
              <th className="p-4 font-bold text-gray-700">المواد</th>
              <th className="p-4 font-bold text-gray-700">تاريخ البدء</th>
              <th className="p-4 font-bold text-gray-700">المتبقي الحالي</th>
              <th className="p-4 font-bold text-gray-700">الحالة</th>
              <th className="p-4 font-bold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {processedRentals.length > 0 ? processedRentals.map(rental => {
              const remaining = calculateRemaining(rental);
              const hasDebtOnClosed = rental.status === 'closed' && remaining > 0;

              return (
                <tr key={rental.id} className={`border-b transition-colors ${hasDebtOnClosed ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {hasDebtOnClosed && (
                        <span title="عقد مغلق ولكن يوجد مديونية">
                          <AlertCircle size={16} className="text-red-500 shrink-0" />
                        </span>
                      )}
                      <div>
                        <p className={`font-bold ${hasDebtOnClosed ? 'text-red-700' : 'text-gray-800'}`}>{rental.customerName}</p>
                        <p className="text-xs text-gray-500">{rental.customerPhone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {rental.items.map((it, idx) => (
                        <span key={idx} className={`text-[10px] px-2 py-0.5 rounded ${it.currentQty > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 line-through'}`}>
                          {it.name} ({it.currentQty})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium">{new Date(rental.startDate).toLocaleDateString('ar-EG')}</td>
                  <td className="p-4">
                    <p className={`font-black ${remaining > 0 ? (hasDebtOnClosed ? 'text-red-600' : 'text-blue-600') : 'text-gray-400'}`}>
                      {formatCurrency(remaining, currency)}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      rental.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : (remaining > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500')
                    }`}>
                      {rental.status === 'active' ? 'نشط' : (remaining > 0 ? 'مغلق (مديونية)' : 'مكتمل')}
                    </span>
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
                      {rental.status === 'active' && (
                        <button 
                          onClick={() => {
                            const idx = rental.items.findIndex(i => i.currentQty > 0);
                            if (idx !== -1) setReturnDialog({ rental, itemIndex: idx });
                            else alert('تم إرجاع كافة المواد بالفعل');
                          }}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                          title="إرجاع مادة"
                        >
                          <RotateCcw size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من نقل هذه الفاتورة إلى الأرشيف؟ سيتم إرجاع جميع المواد المتبقية للمخزن.')) {
                            onArchive(rental);
                          }
                        }}
                        className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                        title="نقل للأرشيف"
                      >
                        <Archive size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">
                  {searchTerm ? 'لم يتم العثور على عملاء يطابقون البحث' : 'لا توجد عقود مسجلة حالياً'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {returnDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-in zoom-in duration-200 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">إرجاع مادة للمخزن</h3>
            <p className="text-gray-600 mb-4">أدخل الكمية التي تم إرجاعها من: <span className="font-bold text-blue-600">{returnDialog.rental.items[returnDialog.itemIndex].name}</span></p>
            <input 
              type="number" 
              id="returnQty"
              max={returnDialog.rental.items[returnDialog.itemIndex].currentQty}
              className="w-full p-3 border rounded-xl mb-4 font-bold text-center outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="الكمية المرتجعة"
              defaultValue={returnDialog.rental.items[returnDialog.itemIndex].currentQty}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const val = (document.getElementById('returnQty') as HTMLInputElement).value;
                  handleReturn(Number(val));
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
              >
                تأكيد الإرجاع
              </button>
              <button onClick={() => setReturnDialog(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalList;
