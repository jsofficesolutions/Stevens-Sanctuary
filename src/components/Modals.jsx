function SettingsModal({ onClose, isDarkMode, setIsDarkMode, systemUsers }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200/50 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <h3 className="font-black text-2xl tracking-tight">Settings</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400"/></button>
                </div>
                <div className="p-6 md:p-8">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-between w-full p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold hover:border-indigo-500 transition-colors shadow-sm active:scale-[0.98]">
                        <span className="flex items-center gap-4 text-lg">
                            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-500/20' : 'bg-amber-100'}`}>
                                {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400"/> : <Sun className="w-5 h-5 text-amber-500"/>} 
                            </div>
                            Dark Mode
                        </span>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </button>
                    
                    <div className="mt-10">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Household Profiles</h4>
                        <div className="space-y-3">
                            {systemUsers.map(u => (
                                <div key={u.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 font-bold bg-slate-50 dark:bg-slate-950 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 text-sm">{u.name.charAt(0)}</div>
                                        <span>{u.name}</span>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${u.role === 'Adult' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'}`}>{u.role}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PromptModal({ title, initialValue = '', onSave, onCancel }) {
    const [val, setVal] = useState(initialValue);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-sm p-8 border border-slate-200/50 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <h3 className="font-black text-2xl mb-6 tracking-tight">{title}</h3>
                <input autoFocus type="text" value={val} onChange={e=>setVal(e.target.value)} className={inputBaseClasses + " w-full mb-8"} />
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button onClick={() => onSave(val)} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md">Save</button>
                </div>
            </div>
        </div>
    )
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-sm p-8 border border-slate-200/50 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500"/>
                </div>
                <h3 className="font-black text-2xl text-red-500 mb-3 tracking-tight">{title}</h3>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 active:scale-95 transition-all shadow-md shadow-red-500/20">Delete</button>
                </div>
            </div>
        </div>
    )
}

function ActivityLogModal({ logs, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200/50 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <h3 className="font-black text-2xl flex items-center gap-3 tracking-tight"><History className="w-6 h-6 text-slate-400"/> Activity Log</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400"/></button>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                    {logs.length === 0 && <p className="text-center text-slate-400 font-bold py-10">No recent activity.</p>}
                    {logs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(log => (
                        <div key={log.id} className="flex gap-4 items-start relative before:absolute before:left-[19px] before:top-10 before:bottom-[-24px] before:w-px before:bg-slate-100 dark:before:bg-slate-800 last:before:hidden">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-sm shrink-0 text-slate-500 border border-slate-200 dark:border-slate-700 shadow-sm z-10">{log.author?.charAt(0) || '?'}</div>
                            <div className="pt-2">
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">{log.message}</p>
                                <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function NotificationsPanel({ notifications, onClose, onNotificationClick }) {
    const getIcon = (type) => {
        if (type === 'mention') return <AtSign className="w-4 h-4 text-amber-500" />;
        if (type === 'complete') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        if (type === 'alert') return <AlertCircle className="w-4 h-4 text-rose-500" />;
        if (type === 'nudge') return <Zap className="w-4 h-4 text-orange-500" />;
        return <BellRing className="w-4 h-4 text-indigo-500" />;
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl z-50 border-l border-slate-200/60 dark:border-slate-800 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                <h3 className="font-black text-2xl flex items-center gap-3 tracking-tight"><BellRing className="w-6 h-6 text-indigo-500"/> Action Inbox</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                        <CheckCircle2 className="w-12 h-12 text-slate-400 mb-4" />
                        <p className="font-bold text-lg">You're all caught up!</p>
                    </div>
                )}
                {notifications.map(n => (
                    <div key={n.id} onClick={() => onNotificationClick(n)} className={`p-5 rounded-2xl border text-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${n.read ? 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-500' : 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 border-indigo-200 dark:border-indigo-800/50 text-indigo-950 dark:text-indigo-200 shadow-md shadow-indigo-500/5'}`}>
                        <div className="flex gap-4">
                            <div className="mt-0.5 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 h-max">{getIcon(n.type)}</div>
                            <div>
                                <p className="font-bold leading-relaxed">{n.message}</p>
                                <div className={`text-[10px] font-black uppercase tracking-widest mt-2 ${n.read ? 'text-slate-400' : 'text-indigo-500'}`}>{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
