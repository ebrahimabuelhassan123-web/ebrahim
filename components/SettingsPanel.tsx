
import React from 'react';
import { CompanySettings, SystemSettings, InvoiceStyle } from '../types';
import { Building, Globe, CreditCard, Clock, FileText, Hash, Image as ImageIcon, Type } from 'lucide-react';

interface Props {
  companySettings: CompanySettings;
  systemSettings: SystemSettings;
  onUpdateCompany: (settings: CompanySettings) => void;
  onUpdateSystem: (settings: SystemSettings) => void;
}

const SettingsPanel: React.FC<Props> = ({ companySettings, systemSettings, onUpdateCompany, onUpdateSystem }) => {
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdateCompany({ ...companySettings, [name]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateCompany({ ...companySettings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSystemChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdateSystem({ 
      ...systemSettings, 
      [name]: name === 'nextInvoiceNumber' ? Number(value) : value 
    });
  };

  const handleFontStyleChange = (key: keyof InvoiceStyle, value: number) => {
    onUpdateSystem({
      ...systemSettings,
      invoiceStyle: {
        ...systemSettings.invoiceStyle,
        [key]: value
      }
    });
  };

  const FontInput = ({ label, value, field }: { label: string, value: number, field: keyof InvoiceStyle }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500">{label}</label>
      <div className="flex items-center gap-2">
        <input 
          type="range" 
          min="8" 
          max="80" 
          value={value} 
          onChange={(e) => handleFontStyleChange(field, Number(e.target.value))}
          className="flex-1 h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer"
        />
        <input 
          type="number" 
          value={value} 
          onChange={(e) => handleFontStyleChange(field, Number(e.target.value))}
          className="w-14 p-1 border rounded text-center text-xs font-bold" 
        />
        <span className="text-[10px] text-gray-400">px</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Company Settings */}
        <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-4">
            <Building className="text-blue-600" size={24} /> بيانات الشركة
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة</label>
              <input name="name" value={companySettings.name} onChange={handleCompanyChange} className="w-full px-4 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شعار الشركة</label>
              <div className="flex items-center gap-4 border p-4 rounded-xl bg-gray-50">
                {companySettings.logo && (
                  <img src={companySettings.logo} alt="Company Logo" className="h-16 w-16 object-contain rounded-lg border bg-white" />
                )}
                <label className="flex-1 cursor-pointer bg-white border border-dashed border-blue-400 p-4 rounded-lg text-center hover:bg-blue-50 transition-colors">
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="text-blue-500" size={20} />
                    <span className="text-xs font-bold text-blue-600">اختر صورة من جهازك</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                <input name="phone" value={companySettings.phone} onChange={handleCompanyChange} className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input name="email" value={companySettings.email} onChange={handleCompanyChange} className="w-full px-4 py-2 border rounded-xl" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
              <input name="address" value={companySettings.address} onChange={handleCompanyChange} className="w-full px-4 py-2 border rounded-xl" />
            </div>
          </div>
        </div>

        {/* System & Font Settings */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-4">
              <Globe className="text-green-600" size={24} /> إعدادات النظام
            </h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-blue-600" />
                  <div>
                    <p className="font-bold text-gray-800 text-sm">العملة</p>
                  </div>
                </div>
                <select name="currency" value={systemSettings.currency} onChange={handleSystemChange} className="bg-white border p-1 rounded-lg font-bold outline-none text-sm">
                  <option value="SAR">الريال السعودي (SAR)</option>
                  <option value="EGP">الجنيه المصري (EGP)</option>
                </select>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="text-purple-600" />
                  <div>
                    <p className="font-bold text-gray-800 text-sm">نظام التسعير</p>
                  </div>
                </div>
                <select name="rentalSystem" value={systemSettings.rentalSystem} onChange={handleSystemChange} className="bg-white border p-1 rounded-lg font-bold outline-none text-sm">
                  <option value="weekly">أسبوعي</option>
                  <option value="monthly">شهري</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-4">
              <Type className="text-indigo-600" size={24} /> أحجام خطوط الفاتورة
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-indigo-500 uppercase border-b border-indigo-50 pb-1">الترويسة والعملاء</p>
                <FontInput label="اسم الشركة" field="companyName" value={systemSettings.invoiceStyle.companyName} />
                <FontInput label="اسم العميل" field="customerName" value={systemSettings.invoiceStyle.customerName} />
                <FontInput label="بيانات العميل (هاتف/عنوان)" field="customerDetails" value={systemSettings.invoiceStyle.customerDetails} />
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-indigo-500 uppercase border-b border-indigo-50 pb-1">الجدول والمحتوى</p>
                <FontInput label="عناوين الجدول" field="tableHeader" value={systemSettings.invoiceStyle.tableHeader} />
                <FontInput label="محتوى الجدول (المواد)" field="tableBody" value={systemSettings.invoiceStyle.tableBody} />
                <FontInput label="تاريخ الفاتورة" field="dateFontSize" value={systemSettings.invoiceStyle.dateFontSize} />
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-indigo-500 uppercase border-b border-indigo-50 pb-1">الخلاصة والنتائج</p>
                <FontInput label="تسميات الملخص" field="summaryLabels" value={systemSettings.invoiceStyle.summaryLabels} />
                <FontInput label="قيم المبالغ" field="summaryValues" value={systemSettings.invoiceStyle.summaryValues} />
                <FontInput label="إجمالي الرصيد النهائي" field="netBalanceValue" value={systemSettings.invoiceStyle.netBalanceValue} />
                <FontInput label="الشروط والأحكام" field="terms" value={systemSettings.invoiceStyle.terms} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Customization Text */}
      <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-4">
          <FileText className="text-orange-600" size={24} /> نصوص الفاتورة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نص الترويسة (Header)</label>
              <textarea name="headerText" value={companySettings.headerText} onChange={handleCompanyChange} rows={3} className="w-full px-4 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نص التذييل (Footer)</label>
              <textarea name="footerText" value={companySettings.footerText} onChange={handleCompanyChange} rows={3} className="w-full px-4 py-2 border rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">أحكام وشروط الإيجار</label>
            <textarea name="terms" value={companySettings.terms} onChange={handleCompanyChange} rows={8} placeholder="اكتب الشروط والأحكام هنا..." className="w-full px-4 py-3 border rounded-xl text-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
