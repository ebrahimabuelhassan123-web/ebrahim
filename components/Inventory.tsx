
import React, { useState } from 'react';
import { Item, Currency } from '../types';
import { Plus, Trash2, Edit, Search } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface Props {
  items: Item[];
  onUpdate: (items: Item[]) => void;
  currency: Currency;
}

const Inventory: React.FC<Props> = ({ items, onUpdate, currency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filteredItems = items.filter(i => i.name.includes(searchTerm) || i.category.includes(searchTerm));

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      onUpdate(items.filter(i => i.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem: Item = {
      id: editingItem?.id || Date.now().toString(),
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      ratePerUnit: Number(formData.get('rate')),
      availableQty: Number(formData.get('qty')),
    };

    if (editingItem) {
      onUpdate(items.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      onUpdate([...items, newItem]);
    }
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="بحث في المخزن..."
            className="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingItem(null); }}
          className="w-full md:w-auto bg-green-600 text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg transition-all"
        >
          <Plus size={20} />
          إضافة صنف جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-bold text-gray-700">الصنف</th>
              <th className="p-4 font-bold text-gray-700">التصنيف</th>
              <th className="p-4 font-bold text-gray-700">السعر الدوري</th>
              <th className="p-4 font-bold text-gray-700">الكمية المتاحة</th>
              <th className="p-4 font-bold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-gray-800">{item.name}</p>
                </td>
                <td className="p-4">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                    {item.category}
                  </span>
                </td>
                <td className="p-4 font-semibold text-blue-600">{formatCurrency(item.ratePerUnit, currency)}</td>
                <td className="p-4 text-gray-600">{item.availableQty}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingItem(item); setShowForm(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingItem ? 'تعديل صنف' : 'إضافة صنف جديد'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الصنف</label>
                <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                <input name="category" defaultValue={editingItem?.category} required className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                  <input name="rate" type="number" defaultValue={editingItem?.ratePerUnit} required className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
                  <input name="qty" type="number" defaultValue={editingItem?.availableQty} required className="w-full px-4 py-2 border rounded-xl" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                حفظ الصنف
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
