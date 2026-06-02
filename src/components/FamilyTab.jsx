import React, { useState } from 'react'; // <-- Add
import { CheckCircle2, ListTodo, Users, BookOpen, FileText, Plus, Link as LinkIcon, Trash2, Circle } from 'lucide-react'; // <-- Add
import { doc, setDoc, addDoc, collection, deleteDoc } from 'firebase/firestore'; // <-- Add
import { getMonday, cardBaseClasses, inputBaseClasses } from '../helpers'; // <-- Add

export function FamilyTab({ spiritualLogs, systemUsers, db, appId, user, tasks, familyDocs, logActivity }) {

    const currentWeekId = getMonday(0);
    const adults = systemUsers.filter(u => u.role === 'Adult').map(u => u.name);
    const children = systemUsers.filter(u => u.role === 'Child').map(u => u.name);
    const currentLog = spiritualLogs.find(l => l.id === currentWeekId) || {};
    const pastWeeks = [4, 3, 2, 1].map(offset => getMonday(-offset));

    const [newDocTitle, setNewDocTitle] = useState('');
    const [newDocUrl, setNewDocUrl] = useState('');

    const toggleSpiritual = async (adultName, habitField) => {
        if(!user) return;
        const fieldPath = `${habitField}_${adultName}`;
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'spiritual', currentWeekId);
        await setDoc(ref, { [fieldPath]: !currentLog[fieldPath], id: currentWeekId }, { merge: true });
    };

    const getHistory = (adultName, habitField) => {
        return pastWeeks.map(wId => {
            const log = spiritualLogs.find(l => l.id === wId) || {};
            return !!log[`${habitField}_${adultName}`];
        });
    };

    const handleAddDoc = async (e) => {
        e.preventDefault();
        if(!newDocTitle.trim() || !newDocUrl.trim() || !user) return;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'family_docs'), { 
            title: newDocTitle, url: newDocUrl, createdAt: new Date().toISOString() 
        });
        logActivity(`Added new family document link: "${newDocTitle}"`, "System");
        setNewDocTitle('');
        setNewDocUrl('');
    };

    const tasksCompletedThisWeek = tasks.filter(t => t.completed && t.dueDate && t.dueDate >= currentWeekId).length;
    const tasksPendingThisWeek = tasks.filter(t => !t.completed && t.dueDate && t.dueDate >= currentWeekId && t.dueDate <= getMonday(-1)).length;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl font-black mb-2 tracking-tight">Family Dashboard</h2>
                <p className="text-slate-500 text-lg font-medium">Overview, spiritual routines, and important shared links.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3" />
                    <span className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{tasksCompletedThisWeek}</span>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Tasks Done (This Week)</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <ListTodo className="w-8 h-8 text-indigo-500 mb-3" />
                    <span className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{tasksPendingThisWeek}</span>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Tasks Pending (This Week)</span>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-400 dark:border-indigo-700 rounded-[2rem] p-6 shadow-lg shadow-indigo-500/20 flex flex-col items-center justify-center text-center text-white">
                    <Users className="w-8 h-8 text-indigo-200 mb-3" />
                    <span className="text-3xl font-black tracking-tight">{adults.length + children.length}</span>
                    <span className="text-xs font-black uppercase tracking-widest text-indigo-200 mt-1">Family Members</span>
                </div>
            </div>

            <section className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/10 dark:to-blue-900/10 border border-sky-200/60 dark:border-sky-800/50 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-200/30 dark:bg-sky-800/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 relative z-10 gap-4">
                    <h3 className="font-black text-sky-900 dark:text-sky-300 text-2xl flex items-center gap-3 tracking-tight"><BookOpen className="w-7 h-7 text-sky-500"/> Weekly Spiritual Routine</h3>
                    <p className="text-sm font-black text-sky-600 dark:text-sky-400 bg-white/50 dark:bg-slate-900/50 px-4 py-2 rounded-xl shadow-sm border border-sky-100 dark:border-sky-800/50 uppercase tracking-widest">W/C {new Date(currentWeekId).toLocaleDateString()}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {adults.map(adultName => (
                        <div key={adultName} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-sky-100/50 dark:border-sky-800/30 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                            <h4 className="font-black text-xl text-sky-950 dark:text-sky-100 mb-5 px-2 tracking-tight">{adultName}'s Habits</h4>
                            <div className="space-y-3">
                                <SpiritualCard title="Family Worship" checked={currentLog[`familyWorship_${adultName}`]} onClick={()=>toggleSpiritual(adultName, 'familyWorship')} history={getHistory(adultName, 'familyWorship')} />
                                <SpiritualCard title="Midweek Prep" checked={currentLog[`midweek_${adultName}`]} onClick={()=>toggleSpiritual(adultName, 'midweek')} history={getHistory(adultName, 'midweek')} />
                                <SpiritualCard title="Weekend Prep" checked={currentLog[`weekend_${adultName}`]} onClick={()=>toggleSpiritual(adultName, 'weekend')} history={getHistory(adultName, 'weekend')} />
                                <SpiritualCard title="Ministry" checked={currentLog[`ministry_${adultName}`]} onClick={()=>toggleSpiritual(adultName, 'ministry')} history={getHistory(adultName, 'ministry')} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className={cardBaseClasses}>
                <h3 className="font-black text-2xl mb-6 flex items-center gap-3 tracking-tight"><div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"><FileText className="w-6 h-6 text-slate-600 dark:text-slate-400"/></div> Important Docs & Links</h3>
                
                <form onSubmit={handleAddDoc} className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <input type="text" value={newDocTitle} onChange={e=>setNewDocTitle(e.target.value)} placeholder="Title (e.g. School Calendar)..." className={inputBaseClasses + " sm:flex-1 !py-2"} required />
                    <input type="url" value={newDocUrl} onChange={e=>setNewDocUrl(e.target.value)} placeholder="https://..." className={inputBaseClasses + " sm:flex-1 !py-2"} required />
                    <button type="submit" className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-2 rounded-xl font-bold transition-transform active:scale-95 shadow-sm hover:bg-slate-900 w-full sm:w-auto"><Plus className="w-5 h-5 mx-auto"/></button>
                </form>

                {familyDocs.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <LinkIcon className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                        <p className="font-bold text-slate-500">No important links added yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {familyDocs.map(doc => (
                            <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                        <LinkIcon className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{doc.title}</span>
                                </div>
                                <button onClick={(e) => { e.preventDefault(); deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_docs', doc.id)); }} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                            </a>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function SpiritualCard({ title, checked, onClick, history }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 group active:scale-[0.98] ${checked ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-300 dark:border-sky-600 shadow-sm' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-800/50 shadow-sm'}`}>
            <div className="flex flex-col items-start gap-2">
                <span className={`font-black tracking-wide ${checked ? 'text-sky-900 dark:text-sky-100' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white'}`}>{title}</span>
                {history && (
                    <div className="flex items-center gap-1.5" title="Past 4 weeks">
                        {history.map((done, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${done ? 'bg-sky-400 dark:bg-sky-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                        ))}
                    </div>
                )}
            </div>
            <div className={`transition-transform duration-300 ${checked ? 'scale-110' : 'scale-100'}`}>
                {checked ? <CheckCircle2 className="w-6 h-6 text-sky-500 dark:text-sky-400"/> : <Circle className="w-6 h-6 text-slate-200 dark:text-slate-700"/>}
            </div>
        </button>
    )
}
