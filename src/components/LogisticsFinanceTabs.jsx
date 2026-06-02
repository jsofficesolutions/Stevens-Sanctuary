function LogisticsTab({ shoppingList, meals, db, appId, user, logActivity }) {
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
