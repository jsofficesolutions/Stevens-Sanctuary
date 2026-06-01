import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, LogOut, CheckCircle2, Circle, Clock, Trash2, 
  Calendar as CalendarIcon, Shield, Heart, Lightbulb, 
  User, Flame, Sparkles, TrendingUp, DollarSign, 
  Layers, Bell, BookOpen, Settings, AlertTriangle, 
  Menu, X, Check, Lock, ChevronRight, Eye, EyeOff,
  ChevronDown, MessageSquare, ThumbsUp, Send, Image
} from 'lucide-react';

// Import your newly refactored components
import Sidebar from './components/NavigationLayouts'; // Imports NavigationLayoutSidebar as default
import { NavigationAnchor } from './components/NavigationLayouts';
import { MetricCard, ProgressBar } from './components/MetricCards';
import { CategoryBadge, PriorityBadge } from './components/CategoryFilters';
import { FormField, Input, Select, Textarea } from './components/FormInputs';
import { TaskRow } from './components/TaskComponents';
import FamilyWallTab from './components/FamilySpiritualTab'; // Handles wall, feed, and spiritual rules
import PulseTab from './components/TaskComponents'; // Primary engine for tasks/pulses
import ProjectsTab from './components/ProjectTabs';
import KidsTab from './components/KidsCornerParentTab';
import { LogisticsTab, FinanceTab } from './components/LogisticsFinanceTabs';
import { 
  TaskDetailModal, NotificationsPanel, ActivityLogModal, 
  PromptModal, ConfirmModal, SettingsModal 
} from './components/Modals';

// Import Firebase App/Database helper instances 
import { db, auth } from './firebase'; 
import { getMonday, inputBaseClasses } from './helpers';

export default function SanctuaryOS() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [user, setUser] = useState({ uid: "demo-user", email: "jordan@jsos.com" }); // Fallback/Auth state
  const [activeProfile, setActiveProfile] = useState(() => localStorage.getItem('sanctuary_profile') || null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  
  // Theme & Navigation
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('wall');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Core Data Collections
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [financeRecords, setFinanceRecords] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // UI Modals & Interaction States
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // System Configuration Mock Data (Syncs with Firebase Realtime/Firestore)
  const systemUsers = {
    Jordan: { name: 'Jordan', role: 'Admin', pin: '4321', avatar: '👨‍💻', color: 'indigo' },
    Bilja: { name: 'Bilja', role: 'Partner', pin: '1234', avatar: '👩‍🎨', color: 'rose' },
    Leo: { name: 'Leo', role: 'Kid', pin: '0000', avatar: '👦', color: 'amber' }
  };

  // ============================================================================
  // SIDE EFFECTS & DATA SYNCING
  // ============================================================================
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle Profile Security/Authentication
  const handleProfileSelect = (profileName) => {
    if (systemUsers[profileName].pin === '0000') {
      setActiveProfile(profileName);
      localStorage.setItem('sanctuary_profile', profileName);
    } else {
      setSelectedProfileForPin(profileName);
      setPinInput('');
      setPinError(false);
    }
  };

  const [selectedProfileForPin, setSelectedProfileForPin] = useState(null);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    const targetUser = systemUsers[selectedProfileForPin];
    if (pinInput === targetUser.pin) {
      setActiveProfile(selectedProfileForPin);
      localStorage.setItem('sanctuary_profile', selectedProfileForPin);
      setSelectedProfileForPin(null);
      setPinInput('');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLogout = () => {
    setActiveProfile(null);
    localStorage.removeItem('sanctuary_profile');
  };

  // ============================================================================
  // RENDERING INTERCEPTORS (Gateways for Screen Views)
  // ============================================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-slate-400 font-medium">Initializing Sanctuary Core...</p>
        </div>
      </div>
    );
  }

  // Profile PIN Entry Interceptor Screen
  if (!activeProfile) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-940 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        <div className="w-full max-w-md p-8 mx-4">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-indigo-600/10 rounded-2xl text-indigo-500 mb-3">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Sanctuary OS</h1>
            <p className="text-slate-400 mt-2">Select your identity space</p>
          </div>

          {!selectedProfileForPin ? (
            <div className="grid grid-cols-1 gap-4">
              {Object.keys(systemUsers).map((key) => {
                const u = systemUsers[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleProfileSelect(key)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                      isDarkMode 
                        ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl">{u.avatar}</span>
                      <div>
                        <h3 className="font-bold text-lg">{u.name}</h3>
                        <p className="text-xs text-slate-400">{u.role}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div className="text-center mb-4">
                <span className="text-5xl block mb-2">{systemUsers[selectedProfileForPin].avatar}</span>
                <h3 className="text-xl font-bold">Hello, {systemUsers[selectedProfileForPin].name}</h3>
                <p className="text-sm text-slate-400">Enter security PIN access keys</p>
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className={`w-full tracking-[1.5em] text-center text-2xl font-mono py-3 px-4 rounded-xl border ${
                    pinError 
                      ? 'border-rose-500 focus:ring-rose-500/20' 
                      : 'border-slate-700 focus:ring-indigo-500/20'
                  } bg-slate-900 focus:outline-none focus:ring-4`}
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
                  className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={pinInput.length < 4}
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl transition"
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

  // Redirect Route for Child Mode (Leo's Dashboard View)
  if (activeProfile === 'Leo') {
    return (
      <KidsTab 
        userProfile={systemUsers.Leo} 
        tasks={tasks.filter(t => t.assignee === 'Leo')} 
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
      />
    );
  }

  // ============================================================================
  // ADULT ADMINISTRATIVE WORKSPACE RETURN
  // ============================================================================
  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Sidebar Modular Layout Navigation */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        activeProfile={systemUsers[activeProfile]}
        isDarkMode={isDarkMode}
      />

      {/* Main Panel Content Window Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Core Control Center Header */}
        <Header 
          setSidebarOpen={setSidebarOpen}
          activeProfile={systemUsers[activeProfile]}
          onOpenSettings={() => setShowSettings(true)}
          onOpenNotifications={() => setShowNotifications(!showNotifications)}
          onOpenLogs={() => setShowLogs(true)}
          notificationCount={notifications.filter(n => !n.read).length}
        />

        {/* Operational Workspace Screen Wrapper */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {activeTab === 'wall' && (
            <FamilyWallTab 
              tasks={tasks} 
              userProfile={systemUsers[activeProfile]} 
              posts={posts}
              setPosts={setPosts}
            />
          )}

          {activeTab === 'tasks' && (
            <PulseTab 
              tasks={tasks} 
              setTasks={setTasks} 
              userProfile={systemUsers[activeProfile]} 
              onTaskSelect={setSelectedTask}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab 
              projects={projects} 
              setProjects={setProjects} 
              tasks={tasks}
            />
          )}

          {activeTab === 'kids' && (
            <KidsTab 
              userProfile={systemUsers[activeProfile]} 
              tasks={tasks} 
              isParentView={true}
            />
          )}

          {activeTab === 'logistics' && (
            <LogisticsTab 
              tasks={tasks}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceTab 
              records={financeRecords} 
              setRecords={setFinanceRecords}
            />
          )}

        </main>
      </div>

      {/* ============================================================================
          GLOBAL SYSTEM MODALS 
         ============================================================================ */}
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
          setNotifications={setNotifications} 
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showLogs && (
        <ActivityLogModal 
          logs={logs} 
          onClose={() => setShowLogs(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)}
          onSave={(updatedTask) => {
            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
            setSelectedTask(null);
          }}
        />
      )}

    </div>
  );
}
