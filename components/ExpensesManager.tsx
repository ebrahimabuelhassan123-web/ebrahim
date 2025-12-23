
import React, { useState } from 'react';
import { Expense, Currency } from '../types';
// Changed ReceiptArabic to ReceiptText as ReceiptArabic does not exist in lucide-react
import { Plus, Trash2, Search, ReceiptText, Calendar, PieChart } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface Props {
  expenses: Expense[];
  onUpdate: (expenses: Expense[]) => void;
  currency: Currency;
}

const ExpensesManager: React.FC<Props> = ({ expenses, onUpdate, currency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      onUpdate(expenses.filter(e => e.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newExpense: Expense = {
      id: Date.now().toString(),
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      amount: Number(formData.get('amount')),
      date: formData.get('date') as string,
    };

    onUpdate([...expenses, newExpense]);
    setShowForm(false);
  };

  const getMonthlyTotal = () => {
    const now = new Date();
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><PieChart size={20} /></div>
            <p className="text-gray-500 text-sm font-medium">إجمالي المصاريف</p>
          </div>
          <p className="text-2xl font-black text-gray-800">{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0), currency)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20} /></div>
            <p className="text-gray-500 text-sm font-medium">مصاريف الشهر الحالي</p>
          </div>
          <p className="text-2xl font-black text-blue-600">{formatCurrency(getMonthlyTotal(), currency)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            {/* Changed icon from ReceiptArabic to ReceiptText */}
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><ReceiptText size={20} /></div>
            <p className="text-gray-500 text-sm font-medium">عدد العمليات</p>
          </div>
          <p className="text-2xl font-black text-gray-800">{expenses.length}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="بحث في المصاريف..."
            className="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full md:w-auto bg-red-600 text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 shadow-lg transition-all"
        >
          <Plus size={20} />
          إضافة مصروف جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-bold text-gray-700">التاريخ</th>
              <th className="p-4 font-bold text-gray-700">الوصف</th>
              <th className="p-4 font-bold text-gray-700">التصنيف</th>
              <th className="p-4 font-bold text-gray-700">المبلغ</th>
              <th className="p-4 font-bold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
              <tr key={expense.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm text-gray-500">
                  {new Date(expense.date).toLocaleDateString('ar-EG')}
                </td>
                <td className="p-4 font-bold text-gray-800">{expense.description}</td>
                <td className="p-4">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                    {expense.category}
                  </span>
                </td>
                <td className="p-4 font-black text-red-600">{formatCurrency(expense.amount, currency)}</td>
                <td className="p-4">
                  <button 
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-400 font-medium">لا توجد مصاريف مضافة حالياً</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">إضافة مصروف جديد</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">وصف المصروف</label>
                <input name="description" required placeholder="مثلاً: إيجار المحل، فاتورة كهرباء..." className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">التصنيف</label>
                <select name="category" required className="w-full px-4 py-2 border rounded-xl font-bold">
                  <option value="إيجار">إيجار</option>
                  <option value="فواتير">فواتير</option>
                  <option value="رواتب">رواتب</option>
                  <option value="صيانة">صيانة</option>
                  <option value="مشتريات">مشتريات</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المبلغ</label>
                  <input name="amount" type="number" step="1" required className="w-full px-4 py-2 border rounded-xl font-black" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">التاريخ</label>
                  <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full px-4 py-2 border rounded-xl" />
                </div>
              </div>
              <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg">
                حفظ المصروف
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManager;
