import React, { useState } from 'react';
import { 
  X, Moon, Sun, History, BellRing, AtSign, CheckCircle2, 
  AlertCircle, Zap, Star 
} from 'lucide-react';
import { inputBaseClasses } from '../helpers';

export function SettingsModal({ onClose, isDarkMode, setIsDarkMode, systemUsers }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <h3 className="font-black text-xl tracking-tight">System Settings</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="flex items-center justify-between w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold hover:border-violet-400 transition-colors active:scale-[0.98]"
          >
            <span className="flex items-center gap-3 text-sm">
              <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-indigo-500/10' : 'bg-amber-100'}`}>
                {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />} 
              </div>
              Interface Theme
            </span>
            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isDarkMode ? 'bg-violet-500' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </button>
          
          <div>
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Household Accounts</h4>
            <div className="space-y-2">
              {systemUsers.map(u => (
                <div key={u.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 font-bold bg-slate-50/50 dark:bg-slate-950/40 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-violet-50 dark:bg-slate-800 flex items-center justify-center text-violet-600 dark:text-violet-300 text-xs">
                      {u.name.charAt(0)}
                    </div>
                    <span>{u.name}</span>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${u.role === 'Adult' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityLogModal({ logs, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-50 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950">
          <h3 className="font-black text-xl flex items-center gap-2.5 tracking-tight">
            <History className="w-5 h-5 text-slate-400" /> Activity Log
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {logs.length === 0 && <p className="text-center text-slate-400 font-bold py-8 text-sm">No recent logs recorded.</p>}
          {logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(log => (
            <div key={log.id} className="flex gap-3 items-start relative before:absolute before:left-[17px] before:top-10 before:bottom-[-20px] before:w-px before:bg-slate-100 dark:before:bg-slate-800 last:before:hidden">
              <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-slate-800 flex items-center justify-center font-black text-xs shrink-0 text-violet-600 border border-violet-100 shadow-sm z-10">
                {log.author?.charAt(0) || '?'}
              </div>
              <div className="pt-1.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug">{log.message}</p>
                <p className="text-[8px] font-black tracking-widest uppercase text-slate-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PromptModal({ title, initialValue = '', onSave, onCancel }) {
  const [val, setVal] = useState(initialValue);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] shadow-2xl w-full max-w-sm p-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <h3 className="font-black text-xl mb-4 tracking-tight">{title}</h3>
        <input 
          autoFocus 
          type="text" 
          value={val} 
          onChange={e => setVal(e.target.value)} 
          className={inputBaseClasses + " w-full mb-6"} 
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition-colors text-xs">Cancel</button>
          <button onClick={() => onSave(val)} className="px-5 py-2 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 text-xs">Save</button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] shadow-2xl w-full max-w-sm p-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="font-black text-xl text-red-500 mb-2 tracking-tight">{title}</h3>
        <p className="text-slate-500 font-medium mb-6 leading-relaxed text-xs">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition-colors text-xs">Cancel</button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 text-xs shadow-md shadow-red-500/10">Proceed Delete</button>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPanel({ notifications, onClose, onNotificationClick }) {
  const getIcon = (type) => {
    if (type === 'mention') return <AtSign className="w-4 h-4 text-amber-500" />;
    if (type === 'complete') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (type === 'alert') return <AlertCircle className="w-4 h-4 text-rose-500" />;
    if (type === 'nudge') return <Zap className="w-4 h-4 text-orange-500" />;
    return <BellRing className="w-4 h-4 text-violet-500" />;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[380px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 border-l border-slate-100 dark:border-slate-800 animate-in slide-in-from-right duration-300 flex flex-col">
      <div className="p-5 border-b border-slate-50 dark:border-slate-850 flex justify-between items-center bg-white dark:bg-slate-900">
        <h3 className="font-black text-xl flex items-center gap-2.5 tracking-tight">
          <BellRing className="w-5 h-5 text-violet-500" /> Action Inbox
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-50 rounded-xl">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <CheckCircle2 className="w-10 h-10 text-slate-400 mb-3" />
            <p className="font-bold text-sm">Inbox clear!</p>
          </div>
        )}
        {notifications.map(n => (
          <div 
            key={n.id} 
            onClick={() => onNotificationClick(n)} 
            className={`p-4 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] active:scale-95 ${n.read ? 'bg-slate-50 dark:bg-slate-950/45 border-slate-100 dark:border-slate-850 text-slate-500' : 'bg-violet-50/55 dark:bg-violet-950/15 border-violet-100 dark:border-violet-900/40 text-violet-950 dark:text-violet-200 font-semibold'}`}
          >
            <div className="flex gap-3">
              <div className="mt-0.5 bg-white dark:bg-slate-800 p-1.5 rounded-full border border-slate-100 shadow-sm h-max">
                {getIcon(n.type)}
              </div>
              <div>
                <p className="leading-normal">{n.message}</p>
                <div className="text-[8px] font-black uppercase tracking-wider mt-1.5 text-slate-400">
                  {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
