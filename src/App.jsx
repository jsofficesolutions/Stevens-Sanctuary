import React, { useState, useEffect } from 'react';
import { Shield, ChevronRight, Eye, EyeOff, AlertTriangle } from 'lucide-react';

// Import your newly refactored components using their exact named and default exports
import NavigationLayoutSidebar from './components/NavigationLayouts'; 
import FamilyWallTab from './components/FamilySpiritualTab'; 
import ProjectsTab from './components/ProjectTabs';
import KidsTab from './components/KidsCornerParentTab';
import LogisticsFinanceTabs from './components/LogisticsFinanceTabs';
import { TaskDetailModal } from './components/TaskComponents';
import { 
  SettingsModal, 
  NotificationsPanel, 
  ActivityLogModal 
} from './components/Modals';

export default function SanctuaryOS() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [activeProfile, setActiveProfile] = useState(() => localStorage.getItem('sanctuary_profile') || null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [selectedProfileForPin, setSelectedProfileForPin] = useState(null);
  
  // Navigation & Theme
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('sanctuary_theme') === 'dark');
  const [activeTab, setActiveTab] = useState('wall');
  
  // Core Application Data Pools
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [finances, setFinances] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [spiritualLogs, setSpiritualLogs] = useState([]);
  const [leoData, setLeoData] = useState({ milestones: [], appointments: [], restock: [], rewards: [] });
  const [leoStats, setLeoStats] = useState({ stars: 0 });
  const [familyDocs, setFamilyDocs] = useState([]);
  const [meals, setMeals] = useState([]);

  // UI Open/Close Modals State
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Household User Registry Map
  const systemUsers = [
    { id: '1', name: 'Jordan', role: 'Adult', pin: '1234', avatar: '👨‍💼' },
    { id: '2', name: 'Biljana', role: 'Adult', pin: '1234', avatar: '👩‍💼' },
    { id: '3', name: 'Leo', role: 'Child', pin: '0000', avatar: '👦' }
  ];

  // ============================================================================
  // SIDE EFFECTS
  // ============================================================================
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sanctuary_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // ============================================================================
  // INTERACTIVE HANDLERS
  // ============================================================================
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
    // If passing null from sidebar lock, completely reset down to lock screen
    if (profileObj === null) {
      setActiveProfile(null);
      localStorage.removeItem('sanctuary_profile');
    } else {
      setActiveProfile(profileObj.name);
      localStorage.setItem('sanctuary_profile', profileObj.name);
    }
  };

  // ============================================================================
  // GATEWAY RENDER INTERCEPTORS
  // ============================================================================
  if (!activeProfile) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        <div className="w-full max-w-md p-8 mx-4">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-violet-600/10 rounded-2xl text-violet-500 mb-3">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Sanctuary OS</h1>
            <p className="text-slate-400 mt-2">Select your identity space</p>
          </div>

          {!selectedProfileForPin ? (
            <div className="grid grid-cols-1 gap-4">
              {systemUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleProfileSelect(u)}
                  className={`flex items-center justify-between p-4 rounded-[2rem] border transition-all text-left ${
                    isDarkMode 
                      ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{u.avatar}</span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{u.name}</h3>
                      <p className="text-xs text-slate-400">{u.role}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">Hello, {selectedProfileForPin}</h3>
                <p className="text-sm text-slate-400">Enter security PIN access keys</p>
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full tracking-[1.5em] text-center text-2xl font-mono py-3 px-4 rounded-2xl border border-violet-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-990 focus:outline-none focus:ring-4 focus:ring-violet-500/20 text-slate-800 dark:text-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {pinError && (
                <p className="text-rose-500 text-sm text-center flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Security identification mismatch.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProfileForPin(null)}
                  className="w-1/2 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-white font-medium rounded-xl transition text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length < 4}
                  className="w-1/2 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 disabled:opacity-50 text-white font-medium rounded-xl transition text-sm"
                >
                  Verify Access
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // WORKSPACE HUB
  // ============================================================================
  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Complete Responsive Navigation Sidebar Layout Grid Matrix */}
      <NavigationLayoutSidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        systemUsers={systemUsers}
        activeProfile={activeProfile}
        onSwitchProfile={handleLogout}
        notifications={notifications}
      />

      {/* Primary Desktop Action Windows Workspace */}
      <main className="flex-1 p-4 lg:p-12 pb-28 lg:pb-14 overflow-y-auto h-screen relative lg:pl-80 md:pl-24">
        <div className="max-w-5xl mx-auto">
          
          {activeTab === 'wall' && (
            <FamilyWallTab 
              tasks={tasks}
              userProfile={activeProfile}
              posts={posts}
              onOpenTask={setSelectedTask}
              meals={meals}
              leoStats={leoStats}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'tasks' && (
            <ProjectsTab 
              tasks={tasks}
              projects={projects}
              userProfile={activeProfile}
              onOpenTask={setSelectedTask}
              systemUsers={systemUsers}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab 
              tasks={tasks}
              projects={projects}
              userProfile={activeProfile}
              onOpenTask={setSelectedTask}
              systemUsers={systemUsers}
            />
          )}

          {activeTab === 'family' && (
            <LogisticsFinanceTabs 
              mealCalendar={{}}
              supplies={[]}
              financials={{}}
              onUpdateMeals={() => {}}
              onUpdateSupplies={() => {}}
              onUpdateFinancials={() => {}}
            />
          )}

          {activeTab === 'logistics' && (
            <LogisticsFinanceTabs 
              mealCalendar={{}}
              supplies={[]}
              financials={{}}
              onUpdateMeals={() => {}}
              onUpdateSupplies={() => {}}
              onUpdateFinancials={() => {}}
            />
          )}

          {activeTab === 'finance' && (
            <LogisticsFinanceTabs 
              mealCalendar={{}}
              supplies={[]}
              financials={{}}
              onUpdateMeals={() => {}}
              onUpdateSupplies={() => {}}
              onUpdateFinancials={() => {}}
            />
          )}

          {activeTab === 'kids' && (
            <KidsTab 
              leoData={leoData}
              leoStats={leoStats}
              tasks={tasks}
              userProfile={activeProfile}
              isParentView={true}
            />
          )}

        </div>
      </main>

      {/* Global Interface Modals */}
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

      {showNotifications && (
        <NotificationsPanel 
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showActivity && (
        <ActivityLogModal 
          logs={activityLogs}
          onClose={() => setShowActivity(false)}
        />
      )}

    </div>
  );
}
