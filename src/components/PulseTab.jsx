import React, { useState } from 'react'; // <-- Add
import { Gift, CalendarClock, Timer, Repeat, ListTodo, BellRing, CheckCircle2 } from 'lucide-react'; // <-- Add
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'; // <-- Add
import { cardBaseClasses, WEEK_DAYS } from '../helpers'; // <-- Add
import { TaskRow } from './TaskComponents'; // <-- Add

export function PulseTab({ tasks, userProfile, onOpenTask, db, appId, user, toggleTask, sendNotification, logActivity, systemUsers, leoData }) {

    const [newTask, setNewTask] = useState('');
    const [newAssignee, setNewAssignee] = useState(userProfile);
    const [newDueDate, setNewDueDate] = useState('');
    const [newTimeLimit, setNewTimeLimit] = useState('');
    const [newRecurrence, setNewRecurrence] = useState('none');
    const [newRecurrenceDays, setNewRecurrenceDays] = useState([]);
    const [newRecurEndDate, setNewRecurEndDate] = useState('');
    
    const myTasks = tasks.filter(t => t.assignee === userProfile || t.assignee === 'Both' || !t.assignee);
    const activeTasks = myTasks.filter(t => !t.completed);
    const nudgedTasks = activeTasks.filter(t => t.nudged);
    const generalTasks = activeTasks.filter(t => !t.nudged);

    const pendingRewards = leoData?.rewards?.filter(r => r.status === 'pending') || [];

    const handleAdd = async (e) => {
        e.preventDefault();
        if(!newTask.trim() || !user) return;
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
            title: newTask, assignee: newAssignee, projectId: '', section: '',
            dueDate: newDueDate || null, timeLimit: newTimeLimit ? Number(newTimeLimit) : null,
            recurrence: newRecurrence, recurrenceDays: newRecurrenceDays, recurrenceEndDate: newRecurEndDate || null,
            completed: false, nudged: false, subtasks: [],
            createdAt: new Date().toISOString(), createdBy: userProfile
        });
        
        logActivity(`Added task: "${newTask}"`, userProfile);
        if (newAssignee && newAssignee !== userProfile && newAssignee !== 'Both') {
            sendNotification(newAssignee, `${userProfile} assigned you a task: "${newTask}"`, docRef.id, 'assign');
        }

        setNewTask(''); setNewDueDate(''); setNewTimeLimit(''); setNewRecurrence('none'); setNewRecurrenceDays([]); setNewRecurEndDate('');
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header className="mb-2">
                <h2 className="text-4xl font-black mb-2 tracking-tight">The Pulse</h2>
                <p className="text-slate-500 text-lg font-medium">Your personal inbox and active nudges.</p>
            </header>

            {pendingRewards.length > 0 && (
                <div className="space-y-4">
                    {pendingRewards.map(reward => (
                        <div key={reward.id} className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200/60 dark:border-rose-800/60 rounded-[1.5rem] p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 animate-in slide-in-from-bottom-4">
                            <div>
                                <h3 className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2 mb-1"><Gift className="w-5 h-5"/> Reward Request</h3>
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-300 leading-relaxed">Someone wants to cash in <strong className="font-black px-1.5 py-0.5 bg-rose-200/50 dark:bg-rose-800/50 rounded">{reward.cost} stars</strong> for <strong>{reward.title}</strong>.</p>
                            </div>
                            <button onClick={() => {
                                updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', reward.id), { status: 'fulfilled' });
                                logActivity(`Approved reward: "${reward.title}"`, userProfile);
                            }} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-emerald-500/20 w-full sm:w-auto transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap">Approve Reward</button>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleAdd} className={cardBaseClasses + " flex flex-col gap-4"}>
                <input type="text" value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Quick add a task..." className="w-full bg-slate-100/50 dark:bg-slate-800/50 rounded-xl px-5 py-4 outline-none dark:text-white border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg shadow-inner placeholder:text-slate-400" />
                
                <div className="flex flex-wrap gap-3 items-center">
                    <select value={newAssignee} onChange={e=>setNewAssignee(e.target.value)} className="bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer">
                        {systemUsers.map(u => <option key={u.id} value={u.name}>For {u.name}</option>)}
                        <option value="Both">Joint</option>
                        <option value="">Unassigned</option>
                    </select>
                    
                    <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-pointer">
                        <CalendarClock className="w-4 h-4 text-slate-500"/>
                        <input type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer" title="Start Date / Next Due" />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-pointer w-32">
                        <Timer className="w-4 h-4 text-slate-500"/>
                        <input type="number" value={newTimeLimit} onChange={e=>setNewTimeLimit(e.target.value)} placeholder="Mins" className="w-full bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400" title="Optional Timer (Minutes)" />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-pointer">
                        <Repeat className="w-4 h-4 text-slate-500"/>
                        <select value={newRecurrence} onChange={e=>{setNewRecurrence(e.target.value); setNewRecurrenceDays([]);}} className="bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                            <option value="none">Once</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Biweekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    
                    {(newRecurrence === 'weekly' || newRecurrence === 'biweekly') && (
                        <div className="flex gap-1 ml-1 pl-3 border-l-2 border-slate-200 dark:border-slate-800">
                            {WEEK_DAYS.map((d, i) => (
                                <button key={i} type="button" onClick={(e) => { e.preventDefault(); if(newRecurrenceDays.includes(d.v)) setNewRecurrenceDays(newRecurrenceDays.filter(day => day !== d.v)); else setNewRecurrenceDays([...newRecurrenceDays, d.v]); }}
                                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all shadow-sm ${newRecurrenceDays.includes(d.v) ? 'bg-indigo-500 text-white scale-110' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
                                    {d.l}
                                </button>
                            ))}
                        </div>
                    )}

                    {newRecurrence !== 'none' && (
                        <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-pointer ml-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Until</span>
                            <input type="date" value={newRecurEndDate} onChange={e=>setNewRecurEndDate(e.target.value)} className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer" />
                        </div>
                    )}
                    
                    <div className="flex-1"></div>
                    <button type="submit" className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all active:scale-95">Add</button>
                </div>
            </form>

            {nudgedTasks.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200/60 dark:border-orange-800/60 rounded-[1.5rem] p-6 shadow-sm">
                    <h3 className="font-bold text-orange-800 dark:text-orange-400 mb-5 flex items-center gap-2"><BellRing className="w-5 h-5"/> Chased / Nudged</h3>
                    <div className="space-y-3">
                        {nudgedTasks.map(task => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onOpen={() => onOpenTask(task)} />)}
                    </div>
                </div>
            )}

            <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-5 flex items-center gap-2 text-lg"><ListTodo className="w-5 h-5 text-indigo-500"/> My Active Tasks</h3>
                {generalTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 border-dashed">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-slate-500 font-bold text-lg">You're all clear.</p>
                        <p className="text-slate-400 text-sm mt-1">Enjoy your free time!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {generalTasks.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(task => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onOpen={() => onOpenTask(task)} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
