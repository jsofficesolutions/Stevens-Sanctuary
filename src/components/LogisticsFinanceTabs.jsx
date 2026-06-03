import React, { useState } from 'react';
import { Utensils, ShoppingCart, Plus, Circle, Trash2, CheckCircle2, Wallet, ArrowRight, PiggyBank } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getMonday, getCurrentMonthId, cardBaseClasses, inputBaseClasses } from '../helpers';

export function LogisticsTab({ shoppingList, meals, db, appId, user, logActivity }) {
    
    const [newItem, setNewItem] = useState('');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekId = getMonday(0);

    const handleAddShopping = async (e) => {
        e.preventDefault();
        if(!newItem.trim()) return;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shopping'), { title: newItem, completed: false });
        setNewItem('');
    };

    const handleUpdateMeal = async (day, text) => {
        const existing = meals.find(m => m.day === day && m.weekId === weekId);
        if (existing) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'meals', existing.id), { text });
        else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'meals'), { day, text, weekId });
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl font-black mb-2 tracking-tight">Logistics</h2>
                <p className="text-slate-500 text-lg font-medium">Meal prep and grocery runs.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={cardBaseClasses}>
                    <h3 className="font-black text-2xl mb-8 flex items-center gap-3 tracking-tight"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"><Utensils className="w-6 h-6 text-emerald-600 dark:text-emerald-400"/></div> Meal Plan</h3>
                    <div className="space-y-4">
                        {days.map(day => {
                            const meal = meals.find(m => m.day === day && m.weekId === weekId);
                            const isToday = new Date().toLocaleDateString('en-US', {weekday: 'long'}) === day;
                            return (
                                <div key={day} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-2xl border transition-all ${isToday ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/50 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                    <span className={`text-xs font-black uppercase tracking-widest w-28 shrink-0 ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                        {day} {isToday && '•'}
                                    </span>
                                    <input type="text" defaultValue={meal?.text || ''} onBlur={(e) => handleUpdateMeal(day, e.target.value)} placeholder="What's for dinner?" className={`w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-400 ${isToday ? 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-800/50' : ''}`} />
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className={cardBaseClasses + " flex flex-col lg:h-[700px]"}>
                    <h3 className="font-black text-2xl mb-8 flex items-center gap-3 tracking-tight"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"><ShoppingCart className="w-6 h-6 text-emerald-600 dark:text-emerald-400"/></div> Groceries</h3>
                    <form onSubmit={handleAddShopping} className="flex gap-3 mb-6">
                        <input type="text" value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="Add item..." className={inputBaseClasses + " flex-1"} />
                        <button type="submit" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 rounded-xl font-bold shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"><Plus className="w-6 h-6"/></button>
                    </form>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {shoppingList.filter(i=>!i.completed).map(item => (
                            <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', item.id), {completed:true})} className="transform transition-transform active:scale-75"><Circle className="w-6 h-6 text-slate-300 hover:text-emerald-500" /></button>
                                <span className="flex-1 font-bold text-slate-800 dark:text-slate-200">{item.title}</span>
                                <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', item.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        ))}
                        {shoppingList.filter(i=>i.completed).length > 0 && (
                            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">Crossed off</h4>
                                {shoppingList.filter(i=>i.completed).map(item => (
                                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl opacity-50 grayscale hover:grayscale-0 transition-all group">
                                        <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', item.id), {completed:false})}><CheckCircle2 className="w-6 h-6 text-emerald-500" /></button>
                                        <span className="flex-1 font-bold line-through text-slate-500">{item.title}</span>
                                        <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', item.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function FinanceTab({ finances, db, appId, user }) {
    const monthId = getCurrentMonthId();
    const currentFinance = finances.find(f => f.id === monthId) || { incomes: [], outgoings: [], pots: [] };
    
    const [newIncomeName, setNewIncomeName] = useState('');
    const [newIncomeAmt, setNewIncomeAmt] = useState('');
    
    const [newOutName, setNewOutName] = useState('');
    const [newOutAmt, setNewOutAmt] = useState('');
    const [newOutType, setNewOutType] = useState('Fixed'); 
    
    const [newPotName, setNewPotName] = useState('');
    const [newPotAlloc, setNewPotAlloc] = useState('');

    const saveFinance = async (updates) => {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'finances', monthId);
        await updateDoc(ref, updates).catch(async () => {
            const d = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'finances'), { ...currentFinance, ...updates });
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'finances', d.id), {id: monthId});
        });
    };

    const addIncome = (e) => {
        e.preventDefault();
        if(!newIncomeName || !newIncomeAmt) return;
        saveFinance({ incomes: [...(currentFinance.incomes||[]), {id: Date.now().toString(), name: newIncomeName, amount: Number(newIncomeAmt)}] });
        setNewIncomeName(''); setNewIncomeAmt('');
    };

    const addOutgoing = (e) => {
        e.preventDefault();
        if(!newOutName || !newOutAmt) return;
        saveFinance({ outgoings: [...(currentFinance.outgoings||[]), {id: Date.now().toString(), name: newOutName, amount: Number(newOutAmt), type: newOutType}] });
        setNewOutName(''); setNewOutAmt('');
    };

    const addPot = (e) => {
        e.preventDefault();
        if(!newPotName) return;
        saveFinance({ pots: [...(currentFinance.pots||[]), {id: Date.now().toString(), name: newPotName, allocated: Number(newPotAlloc)||0, spent: 0}] });
        setNewPotName(''); setNewPotAlloc('');
    };

    const removeItem = (field, id) => {
        saveFinance({ [field]: currentFinance[field].filter(i => i.id !== id) });
    };

    const updatePotSpent = (potId, spentAmt) => {
        const updated = currentFinance.pots.map(p => p.id === potId ? {...p, spent: Number(spentAmt)} : p);
        saveFinance({ pots: updated });
    };

    const totalIncome = (currentFinance.incomes||[]).reduce((sum, i) => sum + i.amount, 0);
    const totalOutgoings = (currentFinance.outgoings||[]).reduce((sum, o) => sum + o.amount, 0);
    const availableForPots = totalIncome - totalOutgoings;
    
    const totalAllocated = (currentFinance.pots||[]).reduce((sum, p) => sum + p.allocated, 0);
    const leftToAllocate = availableForPots - totalAllocated;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl font-black mb-2 tracking-tight">Finances</h2>
                <p className="text-slate-500 text-lg font-medium">Payday planner: Incomes, outgoings, and pots.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-emerald-100/50 dark:border-emerald-900/30 rounded-[2rem] p-8 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl"></div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 relative z-10">Total Income</h3>
                    <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 relative z-10 tracking-tight">£{totalIncome}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-rose-100/50 dark:border-rose-900/30 rounded-[2rem] p-8 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-100 dark:bg-rose-900/20 rounded-full blur-3xl"></div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 relative z-10">Total Outgoings</h3>
                    <p className="text-4xl font-black text-rose-600 dark:text-rose-400 relative z-10 tracking-tight">£{totalOutgoings}</p>
                </div>
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-[2rem] p-8 shadow-lg shadow-violet-500/20 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSIvPjwvc3ZnPg==')] pointer-events-none"></div>
                    <h3 className="text-xs font-black text-violet-200 uppercase tracking-[0.2em] mb-2 relative z-10">Available for Pots</h3>
                    <p className="text-4xl font-black relative z-10 tracking-tight">£{availableForPots}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-8">
                    {/* INCOME CARD */}
                    <div className={`${cardBaseClasses} flex flex-col justify-between`}>
                        <div>
                            <h3 className="font-black text-2xl mb-6 flex items-center gap-3 tracking-tight"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"><Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400"/></div> Income</h3>
                            <div className="space-y-3 mb-6 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                {(currentFinance.incomes||[]).map(inc => (
                                    <div key={inc.id} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 group transition-colors hover:border-emerald-200 dark:hover:border-emerald-800/50">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{inc.name}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">£{inc.amount}</span>
                                            <button type="button" onClick={()=>removeItem('incomes', inc.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ))}
                                {(currentFinance.incomes||[]).length === 0 && (
                                    <p className="text-sm font-medium italic text-slate-400 text-center py-6">No income channels registered.</p>
                                )}
                            </div>
                        </div>
                        <form onSubmit={addIncome} className="flex gap-2.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 mt-auto">
                            <input type="text" value={newIncomeName} onChange={e=>setNewIncomeName(e.target.value)} placeholder="Source name (e.g., Salary)..." className={`${inputBaseClasses} flex-1 !py-2.5`} required />
                            <input type="number" value={newIncomeAmt} onChange={e=>setNewIncomeAmt(e.target.value)} placeholder="£" className={`${inputBaseClasses} w-24 !py-2.5`} required />
                            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-md shadow-emerald-500/20 shrink-0">
                                <Plus className="w-5 h-5"/>
                            </button>
                        </form>
                    </div>

                    {/* OUTGOINGS CARD */}
                    <div className={`${cardBaseClasses} flex flex-col justify-between`}>
                        <div>
                            <h3 className="font-black text-2xl mb-6 flex items-center gap-3 tracking-tight"><div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl"><ArrowRight className="w-6 h-6 text-rose-600 dark:text-rose-400"/></div> Outgoings</h3>
                            <div className="space-y-3 mb-6 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                                {(currentFinance.outgoings||[]).map(out => (
                                    <div key={out.id} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 group transition-colors hover:border-rose-200 dark:hover:border-rose-800/50">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{out.name}</span>
                                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded w-max">{out.type}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-lg text-rose-600 dark:text-rose-400">£{out.amount}</span>
                                            <button type="button" onClick={()=>removeItem('outgoings', out.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ))}
                                {(currentFinance.outgoings||[]).length === 0 && (
                                    <p className="text-sm font-medium italic text-slate-400 text-center py-6">No recurring expenses logged.</p>
                                )}
                            </div>
                        </div>
                        <form onSubmit={addOutgoing} className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 mt-auto">
                            <div className="flex gap-2">
                                <input type="text" value={newOutName} onChange={e=>setNewOutName(e.target.value)} placeholder="Bill / Expense details..." className="flex-1 bg-transparent outline-none text-sm font-bold px-2 placeholder:text-slate-400 dark:text-white" required />
                                <input type="number" value={newOutAmt} onChange={e=>setNewOutAmt(e.target.value)} placeholder="£ Amount" className="w-24 bg-transparent outline-none text-sm font-bold border-l border-slate-200 dark:border-slate-700 pl-3 placeholder:text-slate-400 dark:text-white" required />
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                <select value={newOutType} onChange={e=>setNewOutType(e.target.value)} className="bg-slate-200/60 dark:bg-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 outline-none cursor-pointer">
                                    <option value="Fixed">Fixed (Always)</option>
                                    <option value="Temporary">Temporary (This Month)</option>
                                </select>
                                <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-1.5 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5"/> Add Outgoing</button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* BUDGET POTS CARD */}
                <div className={`${cardBaseClasses} flex flex-col justify-between`}>
                    <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
                            <h3 className="font-black text-2xl flex items-center gap-3 tracking-tight"><div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl"><PiggyBank className="w-6 h-6 text-violet-600 dark:text-violet-400"/></div> Budget Pots</h3>
                            <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-right w-full sm:w-auto">
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 block mb-1">Left to Allocate</span>
                                <span className={`text-2xl font-black tracking-tight ${leftToAllocate < 0 ? 'text-red-500' : 'text-emerald-500'}`}>£{leftToAllocate}</span>
                            </div>
                        </div>

                        <div className="space-y-5 mb-6 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                            {(currentFinance.pots||[]).map(pot => {
                                const potLeft = pot.allocated - pot.spent;
                                const percentage = Math.min((pot.spent / pot.allocated) * 100 || 0, 100);
                                return (
                                    <div key={pot.id} className="flex flex-col p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm gap-4 group hover:shadow transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-lg text-slate-800 dark:text-slate-100 tracking-tight">{pot.name}</span>
                                            <button type="button" onClick={()=>removeItem('pots', pot.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 shadow-inner overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                                            <div className={`h-full rounded-full transition-all duration-500 ease-out ${potLeft < 0 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-400 to-violet-500'}`} style={{width: `${percentage}%`}}></div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                                            <div className="flex items-center gap-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-0.5">Allocated</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">£{pot.allocated}</span>
                                                </div>
                                                <div className="flex flex-col border-l border-slate-200 dark:border-slate-800 pl-5">
                                                    <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-0.5">Spent</span>
                                                    <div className="flex items-center gap-0.5">
                                                        <span className="font-bold text-rose-500">£</span>
                                                        <input type="number" value={pot.spent} onChange={e=>updatePotSpent(pot.id, e.target.value)} className="w-14 bg-transparent outline-none font-bold text-rose-500" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-0.5">Remaining</span>
                                                <span className={`font-black text-lg ${potLeft < 0 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>£{potLeft}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {(currentFinance.pots||[]).length === 0 && (
                                <p className="text-sm font-medium italic text-slate-400 text-center py-10">No specific budgeting pots generated yet.</p>
                            )}
                        </div>
                    </div>
                    
                    <form onSubmit={addPot} className="flex gap-2.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 mt-auto">
                        <input type="text" value={newPotName} onChange={e=>setNewPotName(e.target.value)} placeholder="Pot name (e.g., Groceries)..." className={`${inputBaseClasses} flex-1 !py-2.5`} required />
                        <input type="number" value={newPotAlloc} onChange={e=>setNewPotAlloc(e.target.value)} placeholder="£ Alloc" className={`${inputBaseClasses} w-24 !py-2.5`} required />
                        <button type="submit" className="bg-violet-500 hover:bg-violet-600 text-white px-4 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-md shadow-violet-500/20 shrink-0">
                            <Plus className="w-5 h-5"/>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
