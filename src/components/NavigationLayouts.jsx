import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as LucideIcons from 'lucide-react';
import { Star, Lock, LogOut, ChevronUp, Users, ShieldAlert, Bell } from 'lucide-react';

/**
 * Custom Internal Micro-Interactive Anchor Button
 */
export function NavigationAnchor({ iconName, label, isActive, onClick, alertBubbleCount, semanticColor, activeBgColor }) {
  const IconComponent = LucideIcons[iconName] || LucideIcons.HelpCircle;

  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 transform active:scale-[0.98] relative overflow-hidden select-none
        ${isActive 
          ? `${activeBgColor} shadow-[0_4px_15px_-3px_rgba(109,40,217,0.02)] border border-violet-100/10` 
          : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'
        }`}
    >
      <div className="flex items-center gap-3.5 z-10 overflow-hidden">
        <div className={`transition-transform duration-300 group-hover:scale-110 group-active:scale-95
          ${isActive ? semanticColor : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
        >
          <IconComponent className="w-[1.25rem] h-[1.25rem] stroke-[2.2]" />
        </div>
        <span className={`text-sm font-bold tracking-tight transition-colors truncate ${
          isActive ? 'text-slate-900 dark:text-white font-extrabold' : 'group-hover:text-slate-800 dark:group-hover:text-slate-200'
        }`}>
          {label}
        </span>
      </div>

      {alertBubbleCount !== undefined && alertBubbleCount > 0 && (
        <span className="z-10 bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
          {alertBubbleCount}
        </span>
      )}
    </button>
  );
}

NavigationAnchor.propTypes = {
  iconName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  alertBubbleCount: PropTypes.number,
  semanticColor: PropTypes.string.isRequired,
  activeBgColor: PropTypes.string.isRequired
};

/**
 * Complete Responsive Navigation Sidebar Layout Grid Matrix
 */
export default function NavigationLayoutSidebar({
  activeTab,
  onTabChange,
  systemUsers,
  activeProfile,
  onSwitchProfile,
  notifications = []
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const unreadNotificationsCount = notifications.filter((n) => n.targetUser === activeProfile && !n.read).length;

  const tabsConfig = [
    { id: 'wall', label: 'The Wall', iconName: 'Home', color: 'text-violet-500', bg: 'bg-violet-50/60 dark:bg-violet-500/10' },
    { id: 'tasks', label: 'Tasks & Chores', iconName: 'ListTodo', color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10' },
    { id: 'projects', label: 'Project Hub', iconName: 'Briefcase', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { id: 'family', label: 'Spiritual Desk', iconName: 'Users', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
    { id: 'logistics', label: 'Logistics', iconName: 'ShoppingCart', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { id: 'finance', label: 'Finances', iconName: 'Wallet', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { id: 'kids', label: 'Kids Room', iconName: 'Gamepad2', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' }
  ];

  const activeUserObj = systemUsers.find((u) => u.name === activeProfile) || { role: 'Adult' };

  return (
    <>
      {/* 1. DESKTOP PERMANENT VIEW SIDEBAR (lg screen breakpoints) */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 h-screen fixed top-0 left-0 z-30 p-6 shadow-[4px_0_25px_-5px_rgba(0,0,0,0.01)] selection:bg-violet-500/20">
        
        {/* Logo/Brand identity anchor header block */}
        <div className="flex mb-10 px-2 items-center gap-3.5 select-none">
          <div className="w-11 h-11 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25 shrink-0">
            <Star className="w-5 h-5 text-white fill-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight leading-none bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-300 bg-clip-text text-transparent">
              Sanctuary
            </span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              OS Environment
            </span>
          </div>
        </div>

        {/* Navigation Core Anchors Collection Track */}
        <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
          {tabsConfig.map((tab) => (
            <NavigationAnchor
              key={tab.id}
              iconName={tab.iconName}
              label={tab.label}
              isActive={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              semanticColor={tab.color}
              activeBgColor={tab.bg}
              alertBubbleCount={tab.id === 'wall' && unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined}
            />
          ))}
        </div>

        {/* Persistent Bottom Profile Context Interface Indicator */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4 relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-slate-100 dark:hover:border-slate-800/60"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shadow-inner shrink-0 border
                ${activeUserObj.role === 'Child' 
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-amber-300' 
                  : 'bg-violet-100 dark:bg-slate-800 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-slate-700'
                }`}
              >
                {activeProfile ? activeProfile.charAt(0) : '?'}
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate leading-snug">
                  {activeProfile || 'Anonymous'}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                  {activeUserObj.role} Profile
                </span>
              </div>
            </div>
            <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Expanded contextual user switching dashboard frame layer */}
          {profileDropdownOpen && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 block border-b border-slate-50 dark:border-slate-850 mb-1">
                Switch Identity Context
              </div>
              
              <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-0.5">
                {systemUsers.map((u) => (
                  <button
                    key={u.id}
                    disabled={u.name === activeProfile}
                    onClick={() => {
                      onSwitchProfile(u);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-all
                      ${u.name === activeProfile
                        ? 'bg-violet-50/50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 cursor-default'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    <span className="truncate">{u.name}</span>
                    <span className="text-[8px] uppercase tracking-wide opacity-60 font-black">{u.role}</span>
                  </button>
                ))}
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
              <button
                onClick={() => onSwitchProfile(null)}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
              >
                <Lock className="w-3.5 h-3.5" /> Lock Application
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. TABLET FLEX COMPACT SIDE RAIL VIEW (md screen breakpoints) */}
      <aside className="hidden md:flex lg:hidden flex-col w-20 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 h-screen fixed top-0 left-0 z-30 py-6 items-center justify-between shadow-sm">
        <div className="w-10 h-10 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
          <Star className="w-4 h-4 text-white fill-white" />
        </div>

        {/* Compact Item Flex Icon Rail Matrix */}
        <div className="flex-1 w-full flex flex-col justify-center items-center gap-4 px-2">
          {tabsConfig.map((tab) => {
            const IconComponent = LucideIcons[tab.iconName] || LucideIcons.HelpCircle;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 transform active:scale-90 relative group
                  ${isTabActive ? `${tab.bg} ${tab.color} shadow-sm` : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                title={tab.label}
              >
                <IconComponent className="w-5 h-5 stroke-[2.2]" />
                
                {/* Floating tooltips */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl opacity-0 scale-90 translate-x-[-10px] group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 transition-all pointer-events-none z-50 whitespace-nowrap shadow-xl">
                  {tab.label}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onSwitchProfile(null)}
          className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center justify-center"
          title="Lock System Profile Workspace"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </aside>

      {/* 3. MOBILE ACTION GRID SHEET RAIL BAR (Persistent bottom views) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800/80 z-40 flex items-center justify-around px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.03)] selection:bg-transparent select-none">
        {tabsConfig.slice(0, 5).map((tab) => {
          const IconComponent = LucideIcons[tab.iconName] || LucideIcons.HelpCircle;
          const isTabActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center h-full flex-1 gap-1 relative group transition-all transform active:scale-95 ${
                isTabActive ? tab.color : 'text-slate-400'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform duration-200 ${isTabActive ? 'scale-110' : ''}`}>
                <IconComponent className="w-[1.2rem] h-[1.2rem] stroke-[2.2]" />
              </div>
              <span className={`text-[9px] font-black tracking-tight uppercase ${isTabActive ? 'font-extrabold text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                {tab.id === 'wall' ? 'Wall' : tab.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

NavigationLayoutSidebar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  systemUsers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired
    })
  ).isRequired,
  activeProfile: PropTypes.string,
  onSwitchProfile: PropTypes.func.isRequired,
  notifications: PropTypes.array
};
