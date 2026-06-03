import React, { useState } from 'react';
import { Star, Timer, Repeat, Plus, Circle, Trash2, CheckCircle2, Gift, ShoppingCart } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { cardBaseClasses, inputBaseClasses } from '../helpers';

export function KidsTab({ leoData, db, appId, user, logActivity, leoStats, tasks, toggleTask, userProfile }) {

    const [newItem, setNewItem] = useState('');
    const [newRewardCost, setNewRewardCost] = useState('');
    const [isPermanentReward, setIsPermanentReward] = useState(false);
    const [newTimeLimit, setNewTimeLimit] = useState('');
    const [activeList, setActiveList] = useState('tasks');
    
    const handleAddKidItem = async (e) => {
        e.preventDefault();
        if(!newItem.trim()) return;
        
        if (activeList === 'tasks') {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
                title: newItem, assignee: 'Leo', projectId: '', section: '',
                dueDate: null, timeLimit: newTimeLimit ? Number(newTimeLimit) : null,
                recurrence: 'none', recurrenceDays: [], recurrenceEndDate: null,
                completed: false, nudged: false, subtasks: [], createdAt: new Date().toISOString(), createdBy: userProfile
            });
            logActivity(`Added task for Leo: "${newItem}"`, userProfile);
            setNewItem('');
            setNewTimeLimit('');
            return;
        }

        if (activeList === 'rewards') {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'leodata'), { 
                type: 'rewards', 
                title: newItem, 
                cost: newRewardCost === '' ? 0 : Number(newRewardCost), 
                status: 'available', 
                isPermanent: isPermanentReward,
                childName: 'Leo', // Added explicitly so notifications display the child's name
                createdAt: new Date().toISOString() 
            });
            setNewRewardCost('');
            setIsPermanentReward(false);
        } else {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'leodata'), { type: activeList, title: newItem, completed: false, createdAt: new Date().toISOString() });
        }
        logActivity(`Added to Leo's ${activeList}: "${newItem}"`, "System");
        setNewItem('');
    };

    const approveReward = async (rewardId) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', rewardId), { status: 'fulfilled' });
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl font-black mb-2 tracking-tight">Kids HQ</h2>
                <p className="text-slate-500 text-lg font-medium">Manage tasks, rewards, and milestones for the little ones.</p>
            </header>

            <section className={cardBaseClasses + " p-8"}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-2xl flex items-center gap-3 tracking-tight"><Star className="w-7 h-7 text-amber-500"/> Leo's Dashboard</h3>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/10 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm">
                        <Star className="w-5 h-5 fill-amber-500" /> <span className="font-black text-lg">{leoStats?.stars || 0} Stars Earned</span>
                    </div>
                </div>

                <div className="flex gap-2 mb-8 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-x-auto custom-scrollbar shadow-inner">
                    <button onClick={()=>setActiveList('tasks')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeList==='tasks'?'bg-white dark:bg-slate-800 shadow-sm text-amber-600 scale-[1.02]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Tasks & Chores</button>
                    <button onClick={()=>setActiveList('milestones')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeList==='milestones'?'bg-white dark:bg-slate-800 shadow-sm text-amber-600 scale-[1.02]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Milestones</button>
                    <button onClick={()=>setActiveList('appointments')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeList==='appointments'?'bg-white dark:bg-slate-800 shadow-sm text-amber-600 scale-[1.02]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Appointments</button>
                    <button onClick={()=>setActiveList('restock')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeList==='restock'?'bg-white dark:bg-slate-800 shadow-sm text-amber-600 scale-[1.02]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Needs</button>
                    <button onClick={()=>setActiveList('rewards')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeList==='rewards'?'bg-white dark:bg-slate-800 shadow-sm text-amber-600 scale-[1.02]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Rewards Shop</button>
                </div>
                
                <form onSubmit={handleAddKidItem} className="flex flex-wrap gap-3 mb-6">
                    <input type="text" value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder={`Add new ${activeList}...`} className={inputBaseClasses + " flex-1 min-w-[200px]"} />
                    
                    {activeList === 'tasks' && (
                        <div className={inputBaseClasses + " flex items-center gap-2 px-3 w-32 !py-0"}>
                            <Timer className="w-5 h-5 text-slate-400"/>
                            <input type="number" value={newTimeLimit} onChange={e=>setNewTimeLimit(e.target.value)} placeholder="Mins (opt)" className="w-full bg-transparent outline-none font-bold placeholder:text-slate-400 py-3 text-sm" />
                        </div>
                    )}

                    {activeList === 'rewards' && (
                        <>
                            <div className={inputBaseClasses + " flex items-center gap-2 px-3 w-28 !py-0"}>
                                <Star className="w-5 h-5 text-amber-500"/>
                                <input type="number" value={newRewardCost} onChange={e=>setNewRewardCost(e.target.value)} placeholder="Cost" className="w-full bg-transparent outline-none font-bold placeholder:text-slate-400 py-3" />
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setIsPermanentReward(!isPermanentReward)}
                                className={`px-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex flex-col items-center justify-center shrink-0 shadow-sm ${isPermanentReward ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/50 dark:border-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                                title="Toggle Permanent Reward"
                            >
                                <Repeat className="w-4 h-4 mb-0.5"/>
                                {isPermanentReward ? 'Perm' : 'Once'}
                            </button>
                        </>
                    )}
                    <button type="submit" className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-6 rounded-xl font-bold shadow-md shadow-amber-500/20 hover:shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus className="w-6 h-6"/></button>
                </form>

                <div className="space-y-3">
                    {activeList === 'tasks' ? (
                        <>
                            {tasks.filter(t => t.assignee === 'Leo' && !t.completed).map(task => (
                                <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 group transition-colors hover:border-amber-200 dark:hover:border-amber-800/50">
                                    <button onClick={() => toggleTask(task, userProfile)} className="transform transition-transform active:scale-75"><Circle className="w-6 h-6 text-slate-300 hover:text-amber-500" /></button>
                                    <div className="flex-1 flex flex-col">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{task.title}</span>
                                        {task.timeLimit && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 flex items-center gap-1"><Timer className="w-3 h-3"/> {task.timeLimit} Mins</span>}
                                    </div>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            ))}
                            {tasks.filter(t => t.assignee === 'Leo' && t.completed).map(task => (
                                <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl opacity-50 grayscale group">
                                    <button onClick={() => toggleTask(task, userProfile)}><CheckCircle2 className="w-6 h-6 text-emerald-500" /></button>
                                    <span className="flex-1 font-bold line-through text-slate-500">{task.title}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-2"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            ))}
                        </>
                    ) : activeList === 'rewards' ? (
                        <>
                            {leoData.rewards?.filter(r => r.status === 'pending').map(reward => (
                                <div key={reward.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-rose-200 dark:border-rose-800/60 bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/10 dark:to-slate-900 shadow-sm animate-in slide-in-from-left-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-11 h-11 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                            <Gift className="w-5 h-5 text-rose-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-lg leading-snug">
                                                <span className="text-rose-600 dark:text-rose-400 font-extrabold">{reward.childName || 'Leo'}</span> wants to cash in <span className="text-amber-600 dark:text-amber-400 font-extrabold">{reward.cost} stars</span> for "{reward.title}"
                                            </p>
                                            <span className="text-[10px] uppercase font-black tracking-widest text-rose-500 bg-rose-100/50 dark:bg-rose-900/40 px-2.5 py-0.5 rounded-md shadow-inner mt-1.5 inline-block">Pending Approval</span>
                                        </div>
                                    </div>
                                    <button onClick={() => approveReward(reward.id)} className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0">Approve Request</button>
                                </div>
                            ))}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                {leoData.rewards?.filter(r => r.status === 'available').map(reward => (
                                    <div key={reward.id} className="flex flex-col gap-3 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm group hover:border-amber-200 dark:hover:border-amber-800/50 transition-all">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800/50">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500"/>
                                                <span className="font-black text-amber-700 dark:text-amber-400">{reward.cost}</span>
                                            </div>
                                            <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', reward.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-lg text-slate-800 dark:text-slate-200 tracking-tight">{reward.title}</span>
                                            {reward.isPermanent && <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded shadow-sm">Perm</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {leoData[activeList]?.filter(i=>!i.completed).map(item => (
                                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 group hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors">
                                    <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id), {completed: true})} className="transform transition-transform active:scale-75"><Circle className="w-6 h-6 text-slate-300 hover:text-indigo-500" /></button>
                                    <span className="flex-1 font-bold text-slate-800 dark:text-slate-200">{item.title}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            ))}
                            {leoData[activeList]?.filter(i=>i.completed).map(item => (
                                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl opacity-50 grayscale group">
                                    <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id), {completed: false})}><CheckCircle2 className="w-6 h-6 text-emerald-500" /></button>
                                    <span className="flex-1 font-bold line-through text-slate-500">{item.title}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-2"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
