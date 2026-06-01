import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { cardBaseClasses, inputBaseClasses } from '../helpers';
import { 
  DollarSign, Calendar, CheckSquare, Square, 
  TrendingUp, Percent, Plus, Trash2, Wallet 
} from 'lucide-react';

export default function LogisticsFinanceTabs({
  mealCalendar,
  supplies,
  financials,
  onUpdateMeals,
  onUpdateSupplies,
  onUpdateFinancials
}) {
  const [activeSubTab, setActiveSubTab] = useState('logistics'); // logistics | finance
  const [newSupplyName, setNewSupplyName] = useState('');
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newPotName, setNewPotName] = useState('');
  const [newPotAllocated, setNewPotAllocated] = useState('');

  // SUPPLY ACTIONS
  const handleAddSupply = (e) => {
    e.preventDefault();
    if (!newSupplyName.trim()) return;

    const newItem = {
      id: `supply_${Date.now()}`,
      name: newSupplyName.trim(),
      checked: false
    };

    onUpdateSupplies([...supplies, newItem]);
    setNewSupplyName('');
  };

  const handleToggleSupply = (id) => {
    const updated = supplies.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    onUpdateSupplies(updated);
  };

  const handleDeleteSupply = (id) => {
    onUpdateSupplies(supplies.filter(item => item.id !== id));
  };

  // FINANCIAL ACTIONS
  const handleUpdateWages = (field, value) => {
    onUpdateFinancials({
      ...financials,
      wages: {
        ...(financials.wages || {}),
        [field]: Number(value)
      }
    });
  };

  const handleAddBill = (e) => {
    e.preventDefault();
    if (!newBillName.trim() || !newBillAmount) return;

    const newBill = {
      id: `bill_${Date.now()}`,
      name: newBillName.trim(),
      amount: Number(newBillAmount)
    };

    onUpdateFinancials({
      ...financials,
      bills: [...(financials.bills || []), newBill]
    });

    setNewBillName('');
    setNewBillAmount('');
  };

  const handleDeleteBill = (id) => {
    onUpdateFinancials({
      ...financials,
      bills: financials.bills.filter(b => b.id !== id)
    });
  };

  const handleAddPot = (e) => {
    e.preventDefault();
    if (!newPotName.trim() || !newPotAllocated) return;

    const newPot = {
      id: `pot_${Date.now()}`,
      name: newPotName.trim(),
      allocated: Number(newPotAllocated),
      spent: 0
    };

    onUpdateFinancials({
      ...financials,
      pots: [...(financials.pots || []), newPot]
    });

    setNewPotName('');
    setNewPotAllocated('');
  };

  const handleUpdatePotSpent = (id, value) => {
    const updatedPots = (financials.pots || []).map(p => 
      p.id === id ? { ...p, spent: Number(value) } : p
    );
    onUpdateFinancials({ ...financials, pots: updatedPots });
  };

  const handleDeletePot = (id) => {
    onUpdateFinancials({
      ...financials,
      pots: financials.pots.filter(p => p.id !== id)
    });
  };

  // CALENDAR CHANGES
  const handleMealChange = (day, mealType, value) => {
    onUpdateMeals({
      ...mealCalendar,
      [day]: {
        ...mealCalendar[day],
        [mealType]: value
      }
    });
  };

  // DERIVED VALUES
  const totalIncome = (financials.wages?.primary || 0) + (financials.wages?.secondary || 0);
  const totalBills = financials.bills?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const netSurplus = totalIncome - totalBills;
  const billBurnRatePercentage = totalIncome > 0 ? Math.min((totalBills / totalIncome) * 100, 100) : 0;

  const totalPotAllocated = financials.pots?.reduce((acc, curr) => acc + curr.allocated, 0) || 0;
  const leftToAllocate = netSurplus - totalPotAllocated;

  const activeSupplies = supplies.filter(s => !s.checked);
  const checkedSupplies = supplies.filter(s => s.checked);

  return (
    <div className="w-full space-y-6">
      {/* Visual Navigation Subheader */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('logistics')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
            activeSubTab === 'logistics'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Domestic Logistics
        </button>
        <button
          onClick={() => setActiveSubTab('finance')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
            activeSubTab === 'finance'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Fiscal Aggregations
        </button>
      </div>

      {activeSubTab === 'logistics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Meal Calendar Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`${cardBaseClasses} p-5 border border-slate-800`}>
              <h3 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Weekly Provision Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 font-medium uppercase tracking-wider w-24">Day Scope</th>
                      <th className="py-2.5 font-medium uppercase tracking-wider">Midday Operational Core</th>
                      <th className="py-2.5 font-medium uppercase tracking-wider">Evening Strategic Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {Object.keys(mealCalendar).map((day) => (
                      <tr key={day} className="hover:bg-slate-900/20">
                        <td className="py-3 font-medium text-slate-300 capitalize">{day}</td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={mealCalendar[day].lunch}
                            onChange={(e) => handleMealChange(day, 'lunch', e.target.value)}
                            placeholder="Awaiting input..."
                            className={`${inputBaseClasses} text-xs py-1 px-2.5`}
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="text"
                            value={mealCalendar[day].dinner}
                            onChange={(e) => handleMealChange(day, 'dinner', e.target.value)}
                            placeholder="Awaiting input..."
                            className={`${inputBaseClasses} text-xs py-1 px-2.5`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Supplies Cross-off Interface */}
          <div className="space-y-4">
            <div className={`${cardBaseClasses} p-5 border border-slate-800 flex flex-col h-full`}>
              <h3 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                Supply Inventory Checklist
              </h3>

              <form onSubmit={handleAddSupply} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSupplyName}
                  onChange={(e) => setNewSupplyName(e.target.value)}
                  placeholder="Request replenishment item..."
                  className={`${inputBaseClasses} text-xs py-2`}
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              <div className="space-y-4 flex-1 overflow-y-auto max-h-[380px] pr-1">
                {/* Active Items */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase block">Pending Chores</span>
                  {activeSupplies.length > 0 ? (
                    activeSupplies.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/60 group">
                        <button 
                          onClick={() => handleToggleSupply(item.id)}
                          className="flex items-center gap-2.5 text-left text-xs font-medium text-slate-300 flex-1 min-w-0"
                        >
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteSupply(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 block italic pl-1">All supplies allocated.</span>
                  )}
                </div>

                {/* Crossed off Items */}
                {checkedSupplies.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">Crossed off</span>
                    {checkedSupplies.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-xl border border-slate-900/20 group">
                        <button 
                          onClick={() => handleToggleSupply(item.id)}
                          className="flex items-center gap-2.5 text-left text-xs text-slate-500 line-through flex-1 min-w-0"
                        >
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteSupply(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Wage Config & Allocation Meter */}
          <div className="space-y-4">
            <div className={`${cardBaseClasses} p-5 border border-slate-800 space-y-4`}>
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Inbound Revenue Models
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Primary Stream Earnings</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      value={financials.wages?.primary || ''}
                      onChange={(e) => handleUpdateWages('primary', e.target.value)}
                      placeholder="0.00"
                      className={`${inputBaseClasses} text-xs py-1.5 pl-7`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Secondary Auxiliary Stream</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      value={financials.wages?.secondary || ''}
                      onChange={(e) => handleUpdateWages('secondary', e.target.value)}
                      placeholder="0.00"
                      className={`${inputBaseClasses} text-xs py-1.5 pl-7`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Linear Meter Gauge */}
            <div className={`${cardBaseClasses} p-5 border border-slate-800 space-y-3`}>
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-400 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-400" /> Debt-to-Income Overhead
                </span>
                <span className={`font-semibold ${billBurnRatePercentage > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {billBurnRatePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out rounded-full ${
                    billBurnRatePercentage > 75 ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${billBurnRatePercentage}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 text-center border-t border-slate-800/40">
                <div>
                  <span className="text-[10px] block text-slate-500 uppercase font-medium">Total Income</span>
                  <span className="text-sm font-semibold text-slate-300">${totalIncome.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] block text-slate-500 uppercase font-medium">Net Margin</span>
                  <span className={`text-sm font-semibold ${netSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${netSurplus.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Liabilities & Budget Pots Allocation Wrapper Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bill Breakdowns Configurations */}
            <div className={`${cardBaseClasses} p-5 border border-slate-800`}>
              <h3 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                Liabilities & Fixed Debits
              </h3>

              <form onSubmit={handleAddBill} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={newBillName}
                    onChange={(e) => setNewBillName(e.target.value)}
                    placeholder="Liability description tag..."
                    className={`${inputBaseClasses} text-xs py-2`}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      value={newBillAmount}
                      onChange={(e) => setNewBillAmount(e.target.value)}
                      placeholder="Amount"
                      className={`${inputBaseClasses} text-xs py-2 pl-7`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="overflow-y-auto max-h-[180px] pr-1 space-y-2">
                {financials.bills && financials.bills.length > 0 ? (
                  financials.bills.map((bill) => (
                    <div 
                      key={bill.id} 
                      className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 hover:border-slate-700/40 transition-colors"
                    >
                      <span className="text-xs font-medium text-slate-300">{bill.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-indigo-400">${bill.amount.toLocaleString()}</span>
                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs italic">
                    No outbound fixed debits mapped to this fiscal envelope.
                  </div>
                )}
              </div>
            </div>

            {/* Budget Pots Management Panel */}
            <div className={`${cardBaseClasses} p-5 border border-slate-800 space-y-4`}>
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-indigo-400" />
                  Piggy Bank Savings Pots
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${leftToAllocate < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  Left to Allocate: ${leftToAllocate.toLocaleString()}
                </span>
              </div>

              <form onSubmit={handleAddPot} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={newPotName}
                    onChange={(e) => setNewPotName(e.target.value)}
                    placeholder="e.g., Vacation Savings, Rainy Day..."
                    className={`${inputBaseClasses} text-xs py-2`}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newPotAllocated}
                    onChange={(e) => setNewPotAllocated(e.target.value)}
                    placeholder="Allocated"
                    className={`${inputBaseClasses} text-xs py-2`}
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="space-y-3 overflow-y-auto max-h-[180px] pr-1">
                {financials.pots && financials.pots.length > 0 ? (
                  financials.pots.map((pot) => {
                    const remaining = pot.allocated - (pot.spent || 0);
                    const progress = pot.allocated > 0 ? Math.min(((pot.spent || 0) / pot.allocated) * 100, 100) : 0;
                    return (
                      <div key={pot.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 space-y-2 group">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300">{pot.name}</span>
                          <button onClick={() => handleDeletePot(pot.id)} className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <span>Spent: $</span>
                            <input
                              type="number"
                              value={pot.spent || 0}
                              onChange={(e) => handleUpdatePotSpent(pot.id, e.target.value)}
                              className="w-12 bg-slate-800/50 border border-slate-700/40 rounded px-1 text-slate-200 font-medium"
                            />
                            <span>/ ${pot.allocated}</span>
                          </div>
                          <span className={remaining < 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                            Rem: ${remaining}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-slate-500 text-xs italic">
                    No savings pots mapped to this monthly cycle.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

LogisticsFinanceTabs.propTypes = {
  mealCalendar: PropTypes.objectOf(
    PropTypes.shape({
      lunch: PropTypes.string.isRequired,
      dinner: PropTypes.string.isRequired
    })
  ).isRequired,
  supplies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      checked: PropTypes.bool.isRequired
    })
  ).isRequired,
  financials: PropTypes.shape({
    wages: PropTypes.shape({
      primary: PropTypes.number,
      secondary: PropTypes.number
    }),
    bills: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired
      })
    ),
    pots: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        allocated: PropTypes.number.isRequired,
        spent: PropTypes.number
      })
    )
  }).isRequired,
  onUpdateMeals: PropTypes.func.isRequired,
  onUpdateSupplies: PropTypes.func.isRequired,
  onUpdateFinancials: PropTypes.func.isRequired
};
