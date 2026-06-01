import React, { useState, useEffect } from 'react';
import { Shield, ChevronRight, Eye, EyeOff, AlertTriangle, Heart } from 'lucide-react';

import NavigationLayoutSidebar from './components/NavigationLayouts'; 
import FamilySpiritualTab from './components/FamilySpiritualTab'; 
import ProjectsTab from './components/ProjectTabs';
import KidsTab from './components/KidsCornerParentTab';
import LogisticsFinanceTabs from './components/LogisticsFinanceTabs';
import { TaskDetailModal } from './components/TaskComponents';
import { SettingsModal, NotificationsPanel, ActivityLogModal } from './components/Modals';

export default function SanctuaryOS() {
  const [activeProfile, setActiveProfile] = useState(() => localStorage.getItem('sanctuary_profile') || null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [selectedProfileForPin, setSelectedProfileForPin] = useState(null);
  
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('sanctuary_theme') === 'dark');
  const [activeTab, setActiveTab] = useState('logistics');
  
  // App State Properly Initialized
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [finances, setFinances] = useState({ wages: {}, bills: [], pots: [] });
  const [spiritualLogs, setSpiritualLogs] = useState({ dailyChecklist: {} });
  const [familyDocs, setFamilyDocs] = useState([]);
  const [kidsTasks, setKidsTasks] = useState([]);
  const [kidsRewards, setKidsRewards] = useState([]);
  
  const [meals, setMeals] = useState({
    Monday: { lunch: '', dinner: '' },
    Tuesday: { lunch: '', dinner: '' },
    Wednesday: { lunch: '', dinner: '' },
    Thursday: { lunch: '', dinner: '' },
    Friday: { lunch: '', dinner: '' },
    Saturday: { lunch: '', dinner: '' },
    Sunday: { lunch: '', dinner: '' },
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const systemUsers = [
    { id: '1', name: 'Jordan', role: 'Adult', pin: '1234', avatar: '👨🏽' },
    { id: '2', name: 'Biljana', role: 'Adult', pin: '1234', avatar: '👩🏻' },
    { id: '3', name: 'Leo', role: 'Child', pin: '0000', avatar: '👦🏽' }
  ];

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('sanctuary_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleProfileSelect = (profile) => {
    if (profile.role === 'Child') {
      setActiveProfile(profile.name);
      localStorage.setItem('sanctuary_profile', profile.name);
    } else {
      setSelectedProfileForPin(profile.name);
      setPinInput('');
      setPinError(false);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    const targetUser = systemUsers.find(u => u.name === selectedProfileForPin);
    if (targetUser && pinInput === targetUser.pin) {
      setActiveProfile(selectedProfileForPin);
      localStorage.setItem('sanctuary_profile', selectedProfileForPin);
      setSelectedProfileForPin(null);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLogout = (profileObj) => {
    if (profileObj === null) {
      setActiveProfile(null);
      localStorage.removeItem('sanctuary_profile');
    } else {
      setActiveProfile(profileObj.name);
      localStorage.setItem('sanctuary_profile', profileObj.name);
    }
  };

  if (!activeProfile) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-orange-50 text-slate-800'}`}>
        <div className="w-full max-w-md p-8 mx-4">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-orange-500/10 rounded-full text-orange-500 mb-4 shadow-sm border border-orange-500/20">
              <Heart className="w-8 h-8 fill-orange-500/20" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Sanctuary</h1>
            <p className="text-slate-500 mt-2 font-medium">Who is using the family hub?</p>
          </div>

          {!selectedProfileForPin ? (
            <div className="grid grid-cols-1 gap-4">
              {systemUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleProfileSelect(u)}
                  className={`flex items-center justify-between p-4 rounded-[1.5rem] border transition-all text-left ${
                    isDarkMode 
                      ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900' 
                      : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-md shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl bg-slate-50 dark:bg-slate-800 p-2 rounded-full">{u.avatar}</span>
                    <div>
                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">{u.name}</h3>
                      <p className="text-xs text-slate-400 font-medium">{u.role}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">Welcome back, {selectedProfileForPin}</h3>
                <p className="text-sm text-slate-500">Enter your PIN to unlock</p>
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full tracking-[1em] text-center text-3xl font-mono py-4 px-4 rounded-2xl border border-orange-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-orange-500/20 text-slate-800 dark:text-white shadow-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>

              {pinError && (
                <p className="text-rose-500 text-sm font-medium text-center flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4" /> Incorrect PIN. Try again.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProfileForPin(null)}
                  className="w-1/3 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-white font-bold rounded-xl transition text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length < 4}
                  className="w-2/3 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md shadow-orange-500/20 text-sm"
                >
                  Unlock
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#faf9f8] text-slate-800'}`}>
      
      <NavigationLayoutSidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        systemUsers={systemUsers}
        activeProfile={activeProfile}
        onSwitchProfile={handleLogout}
        notifications={[]}
      />

      <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8 overflow-y-auto h-screen relative lg:pl-80 md:pl-24">
        <div className="max-w-4xl mx-auto mt-4">
          
          {activeTab === 'family' && (
            <FamilySpiritualTab 
              spiritualData={spiritualLogs}
              familyDocs={familyDocs}
              onUpdateSpiritual={setSpiritualLogs}
              onAddFamilyDoc={(doc) => setFamilyDocs([...familyDocs, doc])}
              onDeleteFamilyDoc={(id) => setFamilyDocs(familyDocs.filter(d => d.id !== id))}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab 
              tasks={tasks}
              projects={projects}
              userProfile={activeProfile}
              onOpenTask={setSelectedTask}
              systemUsers={systemUsers}
              onUpdateProject={() => {}}
              onDeleteProject={() => {}}
              onCreateProject={() => {}}
            />
          )}

          {(activeTab === 'logistics' || activeTab === 'finance') && (
            <LogisticsFinanceTabs 
              activeTab={activeTab}
              mealCalendar={meals}
              supplies={supplies}
              financials={finances}
              onUpdateMeals={setMeals}
              onUpdateSupplies={setSupplies}
              onUpdateFinancials={setFinances}
              onTabChange={setActiveTab}
            />
          )}

          {activeTab === 'kids' && (
            <KidsTab 
              kidsTasks={kidsTasks}
              kidsRewards={kidsRewards}
              onAddTask={(task) => setKidsTasks([...kidsTasks, task])}
              onDeleteTask={(id) => setKidsTasks(kidsTasks.filter(t => t.id !== id))}
              onProcessRewardOverride={(id, status) => setKidsRewards(kidsRewards.map(r => r.id === id ? { ...r, status } : r))}
            />
          )}

        </div>
      </main>

      {/* Modals remain structurally identical */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          comments={[]}
          userProfile={activeProfile}
          systemUsers={systemUsers}
        />
      )}

      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          systemUsers={systemUsers}
        />
      )}
    </div>
  );
}
