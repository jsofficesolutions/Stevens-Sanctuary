import React, { useState } from 'react';
import PropTypes from 'prop-types';
import * as LucideIcons from 'lucide-react';
import { Heart, Lock, LogOut, ChevronUp } from 'lucide-react';

export function NavigationAnchor({ iconName, label, isActive, onClick, alertBubbleCount, semanticColor, activeBgColor }) {
  const IconComponent = LucideIcons[iconName] || LucideIcons.HelpCircle;

  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 font-medium
        ${isActive 
          ? `${activeBgColor} shadow-sm border border-slate-200/50 dark:border-slate-700/50` 
          : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50'
        }`}
    >
      <div className="flex items-center gap-3.5 z-10 overflow-hidden">
        <div className={`transition-transform duration-300 ${isActive ? semanticColor : 'text-slate-400'}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <span className={`text-sm tracking-tight transition-colors truncate ${
          isActive ? 'text-slate-900 dark:text-white font-bold' : 'group-hover:text-slate-800 dark:group-hover:text-slate-200'
        }`}>
          {label}
        </span>
      </div>
      {alertBubbleCount > 0 && (
        <span className="z-10 bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
          {alertBubbleCount}
        </span>
      )}
    </button>
  );
}

export default function NavigationLayoutSidebar({ activeTab, onTabChange, systemUsers, activeProfile, onSwitchProfile }) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Warmed up UI labels and colors
  const tabsConfig = [
    { id: 'family', label: 'Faith & Documents', iconName: 'BookOpen', color: 'text-teal-600', bg: 'bg-white dark:bg-teal-500/10' },
    { id: 'logistics', label: 'Meals & Groceries', iconName: 'ShoppingCart', color: 'text-orange-500', bg: 'bg-white dark:bg-orange-500/10' },
    { id: 'finance', label: 'Family Budget', iconName: 'Wallet', color: 'text-emerald-600', bg: 'bg-white dark:bg-emerald-500/10' },
    { id: 'projects', label: 'Projects', iconName: 'FolderHeart', color: 'text-indigo-500', bg: 'bg-white dark:bg-indigo-500/10' },
    { id: 'kids', label: 'Leo\'s Corner', iconName: 'Gamepad2', color: 'text-amber-500', bg: 'bg-white dark:bg-amber-500/10' }
  ];

  const activeUserObj = systemUsers.find((u) => u.name === activeProfile) || { role: 'Adult' };

  return (
    <>
      <aside className="hidden lg:flex flex-col w-72 bg-[#faf9f8] dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 h-screen fixed top-0 left-0 z-30 p-6">
        
        <div className="flex mb-10 px-2 items-center gap-3.5 select-none">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-md shrink-0">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Sanctuary
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Family Hub
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {tabsConfig.map((tab) => (
            <NavigationAnchor
              key={tab.id}
              iconName={tab.iconName}
              label={tab.label}
              isActive={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              semanticColor={tab.color}
              activeBgColor={tab.bg}
            />
          ))}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 mt-4 relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                {activeUserObj.avatar || '?'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{activeProfile}</span>
                <span className="text-[10px] font-medium text-slate-400">{activeUserObj.role}</span>
              </div>
            </div>
            <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileDropdownOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 block border-b border-slate-100 dark:border-slate-800 mb-1">
                Switch Family Member
              </div>
              {systemUsers.map((u) => (
                <button
                  key={u.id}
                  disabled={u.name === activeProfile}
                  onClick={() => { onSwitchProfile(u); setProfileDropdownOpen(false); }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-left text-sm font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <span className="flex items-center gap-2">{u.avatar} {u.name}</span>
                </button>
              ))}
              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <button
                onClick={() => onSwitchProfile(null)}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                <Lock className="w-4 h-4" /> Lock Screen
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
