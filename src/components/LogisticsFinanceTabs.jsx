import React from 'react';
import { cardBaseClasses, inputBaseClasses } from '../helpers';
import { DollarSign, Calendar, CheckSquare, Square, TrendingUp, Plus, Trash2, Wallet } from 'lucide-react';

export default function LogisticsFinanceTabs({
  activeTab,
  onTabChange,
  mealCalendar,
  supplies,
  financials,
  onUpdateMeals,
  onUpdateSupplies,
  onUpdateFinancials
}) {

  const handleAddSupply = (e) => {
    e.preventDefault();
    const input = e.target.elements.supplyInput;
    if (!input.value.trim()) return;
    onUpdateSupplies([...supplies, { id: `supply_${Date.now()}`, name: input.value.trim(), checked: false }]);
    input.value = '';
  };

  const handleToggleSupply = (id) => {
    onUpdateSupplies(supplies.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleDeleteSupply = (id) => {
    onUpdateSupplies(supplies.filter(item => item.id !== id));
  };

  const handleMealChange = (day, mealType, value) => {
    onUpdateMeals({ ...mealCalendar, [day]: { ...mealCalendar[day], [mealType]: value } });
  };

  const handleAddBill = (e) => {
    e.preventDefault();
    const name = e.target.elements.billName.value;
    const amt = e.target.elements.billAmount.value;
    if (!name.trim() || !amt) return;
    onUpdateFinancials({ ...financials, bills: [...(financials.bills || []), { id: `bill_${Date.now()}`, name: name.trim(), amount: Number(amt) }] });
    e.target.reset();
  };

  const activeSupplies = supplies.filter(s => !s.checked);
  const checkedSupplies = supplies.filter(s => s.checked);

  return (
    <div className="w-full space-y-6">
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => onTabChange('logistics')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-all duration-200 ${
            activeTab === 'logistics' ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-500/10' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-4 h-4" /> Meals & Groceries
        </button>
        <button
          onClick={() => onTabChange('finance')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-sm transition-all duration-200 ${
            activeTab === 'finance' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Family Budget
        </button>
      </div>

      {activeTab === 'logistics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className={`${cardBaseClasses} p-6`}>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" /> Weekly Meal Plan
              </h3>
              <div className="space-y-3">
                {Object.keys(mealCalendar).map((day) => (
                  <div key={day} className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="w-24 font-bold text-sm text-slate-700 dark:text-slate-300">{day}</span>
                    <input type="text" value={mealCalendar[day].lunch} onChange={(e) => handleMealChange(day, 'lunch', e.target.value)} placeholder="Lunch..." className={`${inputBaseClasses} flex-1 text-sm py-2`} />
                    <input type="text" value={mealCalendar[day].dinner} onChange={(e) => handleMealChange(day, 'dinner', e.target.value)} placeholder="Dinner..." className={`${inputBaseClasses} flex-1 text-sm py-2`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`${cardBaseClasses} p-6 flex flex-col h-full`}>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-orange-500" /> Groceries & Needs
              </h3>
              <form onSubmit={handleAddSupply} className="flex gap-2 mb-4">
                <input name="supplyInput" type="text" placeholder="Add an item..." className={`${inputBaseClasses} flex-1 text-sm py-2`} />
                <button type="submit" className="p-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white transition-colors"><Plus className="w-5 h-5" /></button>
              </form>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {activeSupplies.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group">
                    <button onClick={() => handleToggleSupply(item.id)} className="flex items-center gap-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">
                      <Square className="w-5 h-5 text-slate-300" /> <span>{item.name}</span>
                    </button>
                    <button onClick={() => handleDeleteSupply(item.id)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {checkedSupplies.length > 0 && (
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Got it</span>
                    {checkedSupplies.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 opacity-60">
                        <button onClick={() => handleToggleSupply(item.id)} className="flex items-center gap-3 text-sm text-slate-500 line-through">
                          <CheckSquare className="w-5 h-5 text-emerald-500" /> <span>{item.name}</span>
                        </button>
                        <button onClick={() => handleDeleteSupply(item.id)} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget tab content warmed up similarly... */}
          <div className={`${cardBaseClasses} p-6`}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Monthly Bills
            </h3>
            <form onSubmit={handleAddBill} className="flex gap-2 mb-6">
              <input name="billName" type="text" placeholder="Bill name (e.g. Energy)" className={`${inputBaseClasses} flex-[2] text-sm py-2`} />
              <input name="billAmount" type="number" placeholder="$ Amount" className={`${inputBaseClasses} flex-1 text-sm py-2`} />
              <button type="submit" className="px-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-bold transition-colors">Add</button>
            </form>
            <div className="space-y-2">
              {(financials.bills || []).map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{bill.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">${bill.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
