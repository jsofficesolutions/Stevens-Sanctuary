import React, { useState, useEffect } from 'react';
import { 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc 
} from 'firebase/firestore';
import { auth, db, appId } from './firebase';
import { formatDueDate, calculateNextDueDate } from './helpers';

// Keep your sub-component imports here if they are in other files, for example:
import { PulseTab } from './components/PulseTab';
import { ProjectsTab } from './components/ProjectsTab';
import { FamilyTab } from './components/FamilyTab';
import { KidsTab } from './components/KidsCornerParentTab';
import { LogisticsTab, FinanceTab } from './components/LogisticsFinanceTabs';
import { TaskDetailModal } from './components/TaskComponents';
import { NotificationsPanel, ActivityLogModal, SettingsModal } from './components/Modals';
import { NavItem } from './components/NavigationLayouts';
import { Star, Zap, Briefcase, Users, Gamepad2, ShoppingCart, Wallet, Lock, History, Settings, BellRing } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeProfile, setActiveProfile] = useState(localStorage.getItem('sanctuary_profile') || null);
  const [pendingProfile, setPendingProfile] = useState(null); 
  const [activeTab, setActiveTab] = useState('pulse');
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('sanctuary_theme') === 'dark');
  
  // App Data
  const [systemUsers, setSystemUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [comments, setComments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [meals, setMeals] = useState([]);
  const [leoData, setLeoData] = useState({ milestones: [], appointments: [], restock: [], rewards: [] });
  const [spiritualLogs, setSpiritualLogs] = useState([]);
  const [finances, setFinances] = useState([]);
  const [leoStats, setLeoStats] = useState({ stars: 0 });
  const [familyDocs, setFamilyDocs] = useState([]);

  // UI State
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (err) {
            console.warn("Custom token failed. Falling back to anonymous sign-in.", err);
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { 
        console.error("Auth initialization failed:", e); 
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // Theme
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('sanctuary_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Data Fetching
  useEffect(() => {
    if (!user) return;
    const basePath = ['artifacts', appId, 'public', 'data'];
    const errHandler = (err) => console.error("Firestore sync error:", err);

    const unsubs = [
      onSnapshot(collection(db, ...basePath, 'system_users'), (snap) => {
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (fetched.length === 0) {
            addDoc(collection(db, ...basePath, 'system_users'), { name: 'Jordan', role: 'Adult' });
            addDoc(collection(db, ...basePath, 'system_users'), { name: 'Biljana', role: 'Adult' });
            addDoc(collection(db, ...basePath, 'system_users'), { name: 'Leo', role: 'Child' });
        } else setSystemUsers(fetched);
      }, errHandler),
      onSnapshot(collection(db, ...basePath, 'tasks'), (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))), errHandler),
      onSnapshot(collection(db, ...basePath, 'projects'), (snap) => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))), errHandler),
      onSnapshot(collection(db, ...basePath, 'comments'), (snap) => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() }))), errHandler),
      onSnapshot(collection(db, ...basePath, 'notifications'), (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))), errHandler),
      onSnapshot(collection(db, ...basePath, 'activity_log'), (snap) => setActivityLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), errHandler),
      onSnapshot(collection(db, ...basePath, 'shopping'), (snap) => setShoppingList(snap.docs.map(d => ({ id: d.id, ...d.data() }))), errHandler),
      onSnapshot(collection(db, ...basePath, 'meals'), (snap) => setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() }))), errHandler),
      onSnapshot(collection(db, ...basePath, 'spiritual'), (snap) => setSpiritualLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), errHandler),
      onSnapshot(collection(db, ...basePath, 'finances'), (snap) => setFinances(snap.docs.map(d => ({ id: d.id, ...d.data() }))), errHandler),
      onSnapshot(collection(db, ...basePath, 'family_docs'), (snap) => setFamilyDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), errHandler),
      onSnapshot(doc(db, ...basePath, 'stats', 'leo'), (snap) => {
         if(snap.exists()) setLeoStats(snap.data());
         else setDoc(doc(db, ...basePath, 'stats', 'leo'), { stars: 0 });
      }, errHandler),
      onSnapshot(collection(db, ...basePath, 'leodata'), (snap) => {
         const data = { milestones: [], appointments: [], restock: [], rewards: [] };
         snap.docs.forEach(doc => { const item = { id: doc.id, ...doc.data() }; if(data[item.type]) data[item.type].push(item); });
         setLeoData(data);
      }, errHandler)
    ];
    return () => unsubs.forEach(fn => fn());
  }, [user]);

  // Client-side Due Date Checker
  useEffect(() => {
    if (!user || !activeProfile || tasks.length === 0) return;
    const evaluateDueDates = async () => {
        const today = new Date(); today.setHours(0,0,0,0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

        const myPending = tasks.filter(t => !t.completed && t.dueDate && (t.assignee === activeProfile || t.assignee === 'Both'));
        for (const t of myPending) {
            const due = new Date(t.dueDate); due.setHours(0,0,0,0);
            if (due < today && !t.notifiedOverdue) {
                sendNotification(activeProfile, `Overdue: "${t.title}" was due ${formatDueDate(t.dueDate)}!`, t.id, 'alert');
                updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { notifiedOverdue: true });
            } else if (due.getTime() === tomorrow.getTime() && !t.notifiedAlmostDue) {
                sendNotification(activeProfile, `Almost Due: "${t.title}" is due tomorrow!`, t.id, 'alert');
                updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { notifiedAlmostDue: true });
            }
        }
    };
    evaluateDueDates();
  }, [tasks, activeProfile, user]);

  // --- ACTIONS ---
  const sendNotification = async (targetUser, message, taskId = null, type = 'general') => {
    if (!user || !targetUser || targetUser === activeProfile) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { 
        targetUser, message, taskId, type, read: false, createdAt: new Date().toISOString() 
    });
  };

  const broadcastNotification = async (message, taskId = null) => {
      if (!user) return;
      const others = systemUsers.filter(u => u.name !== activeProfile && u.role === 'Adult');
      for (const u of others) {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'notifications'), { 
              targetUser: u.name, message, taskId, read: false, createdAt: new Date().toISOString() 
          });
      }
  };

  const logActivity = async (message, authorName) => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activity_log'), {
        message, author: authorName, createdAt: new Date().toISOString()
    });
  };

  const handleNotificationClick = async (n) => {
    if (!n.read) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notifications', n.id), { read: true });
    if (n.taskId) {
        const task = tasks.find(t => t.id === n.taskId);
        if (task) {
            setSelectedTask(task);
            setShowNotifications(false);
            if (task.projectId) setActiveTab('projects');
            else setActiveTab('pulse');
        }
    }
  };

  const toggleTask = async (task, actorName) => {
      const isCompleting = !task.completed;
      
      if (isCompleting && task.recurrence && task.recurrence !== 'none') {
          const nextDate = calculateNextDueDate(task.dueDate || new Date().toISOString().split('T')[0], task.recurrence, task.recurrenceDays);
          
          let shouldSpawn = true;
          if (task.recurrenceEndDate && nextDate > task.recurrenceEndDate) {
              shouldSpawn = false;
          }

          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), { completed: true, recurrence: 'none' });
          
          if (shouldSpawn) {
              const { id, ...taskDataToCopy } = task; 
              await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
                  ...taskDataToCopy, completed: false, dueDate: nextDate, createdAt: new Date().toISOString()
              });
          }
      } else {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), { completed: isCompleting });
      }

      // Handle uncompleting a Leo task (Parent managing Leo)
      if (!isCompleting && task.assignee === 'Leo') {
          const currentStars = leoStats.stars || 0;
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stats', 'leo'), { stars: Math.max(0, currentStars - 1) }, { merge: true });
          logActivity(`${actorName} reversed Leo's task. Star deducted.`, actorName);
      }

      if (isCompleting) {
          logActivity(`Completed task: "${task.title}"`, actorName);
          if (task.createdBy && task.createdBy !== actorName && actorName !== 'Leo') {
              sendNotification(task.createdBy, `${actorName} completed a task you created: "${task.title}"`, task.id, 'complete');
          }
      } else {
          logActivity(`Re-opened task: "${task.title}"`, actorName);
      }
  };

  const attemptLogin = (userObj) => {
      if (userObj.role === 'Child') {
          setActiveProfile(userObj.name);
          localStorage.setItem('sanctuary_profile', userObj.name);
      } else {
          setPendingProfile(userObj.name);
      }
  };

  // --- RENDER BOOTSTRAP ---
  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">Loading Sanctuary...</div>;

  if (!activeProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 selection:bg-indigo-500/30">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-8 animate-in fade-in zoom-in duration-500">
            <Star className="w-8 h-8 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-10 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">Who is operating Sanctuary?</h1>
        <div className="flex flex-wrap justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
          {systemUsers.map(u => (
            <button key={u.id} onClick={() => attemptLogin(u)} className={`group relative w-36 h-36 rounded-3xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${u.role === 'Child' ? 'bg-gradient-to-br from-sky-400 to-blue-500 border-transparent text-white shadow-sky-500/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm'}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black transition-transform duration-300 group-hover:scale-110 ${u.role === 'Child' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {u.name.charAt(0)}
              </div>
              <span className="font-bold tracking-wide">{u.name}</span>
            </button>
          ))}
        </div>

        {/* PIN MODAL */}
        {pendingProfile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 max-w-sm w-full shadow-2xl text-center border border-slate-200/50 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-indigo-500"/>
                    </div>
                    <h3 className="text-2xl font-black mb-2 dark:text-white">Enter PIN</h3>
                    <p className="text-slate-500 font-medium mb-8">Welcome back, {pendingProfile}</p>
                    <input 
                        type="password" autoFocus maxLength={4} placeholder="••••"
                        className="w-full text-center text-5xl tracking-[0.7em] font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-6 mb-6 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white shadow-inner"
                        onChange={(e) => {
                            if(e.target.value === '1234') { // Default Hardcoded PIN
                                setActiveProfile(pendingProfile);
                                localStorage.setItem('sanctuary_profile', pendingProfile);
                                setPendingProfile(null);
                            }
                        }}
                    />
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-8">Default PIN: 1234</p>
                    <button onClick={() => setPendingProfile(null)} className="text-slate-500 font-bold hover:text-slate-800 dark:hover:text-white transition-colors">Cancel</button>
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- LEO'S GAMIFIED DASHBOARD ---
  if (activeProfile === 'Leo') {
      return <LeoDashboard tasks={tasks} db={db} appId={appId} stats={leoStats} rewardsData={leoData.rewards} toggleTask={toggleTask} onLogout={() => { setActiveProfile(null); localStorage.removeItem('sanctuary_profile'); }} />
  }

  // --- STANDARD ADULT OS ---
  const unreadCount = notifications.filter(n => n.targetUser === activeProfile && !n.read).length;
  const activeSelectedTask = selectedTask ? tasks.find(t => t.id === selectedTask.id) : null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* NAVIGATION */}
      <nav className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex-shrink-0 fixed bottom-0 md:static z-20 flex md:flex-col justify-around md:justify-start p-4 md:p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] md:shadow-none">
        <div className="hidden md:flex mb-10 px-2 items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"><Star className="w-6 h-6 text-white fill-white" /></div>
          <span className="text-2xl font-black tracking-tight">Sanctuary</span>
        </div>
        
        <div className="flex md:flex-col w-full gap-2 md:gap-3">
          <NavItem icon={<Zap/>} label="Pulse" active={activeTab==='pulse'} onClick={()=>setActiveTab('pulse')} color="text-indigo-500" bgColor="bg-indigo-50 dark:bg-indigo-500/10" />
          <NavItem icon={<Briefcase/>} label="Projects" active={activeTab==='projects'} onClick={()=>setActiveTab('projects')} color="text-rose-500" bgColor="bg-rose-50 dark:bg-rose-500/10" />
          <NavItem icon={<Users/>} label="Family" active={activeTab==='family'} onClick={()=>setActiveTab('family')} color="text-sky-500" bgColor="bg-sky-50 dark:bg-sky-500/10" />
          <NavItem icon={<Gamepad2/>} label="Kids" active={activeTab==='kids'} onClick={()=>setActiveTab('kids')} color="text-amber-500" bgColor="bg-amber-50 dark:bg-amber-500/10" />
          <NavItem icon={<ShoppingCart/>} label="Logistics" active={activeTab==='logistics'} onClick={()=>setActiveTab('logistics')} color="text-emerald-500" bgColor="bg-emerald-50 dark:bg-emerald-500/10" />
          <NavItem icon={<Wallet/>} label="Finances" active={activeTab==='finance'} onClick={()=>setActiveTab('finance')} color="text-violet-500" bgColor="bg-violet-50 dark:bg-violet-500/10" />
        </div>

        <div className="hidden md:flex mt-auto pt-6 border-t border-slate-200/80 dark:border-slate-800 flex-col gap-4 px-2">
           <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800">
               <span className="text-sm font-bold flex items-center gap-3">
                   <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-sm shadow-sm border border-slate-200/50 dark:border-slate-700">{activeProfile.charAt(0)}</div> 
                   {activeProfile}
               </span>
               <button onClick={() => { setActiveProfile(null); localStorage.removeItem('sanctuary_profile'); }} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"><Lock className="w-4 h-4"/></button>
           </div>
        </div>
      </nav>

      {/* MOBILE HEADER */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 z-10 md:hidden flex items-center justify-between px-5">
          <div className="font-black text-xl flex items-center gap-2 tracking-tight"><Star className="w-6 h-6 text-indigo-500 fill-indigo-500" /> Sanctuary</div>
          <div className="flex gap-4 items-center">
              <button onClick={() => setShowActivity(true)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"><History className="w-6 h-6"/></button>
              <button onClick={() => setShowNotifications(true)} className="relative text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                  <BellRing className="w-6 h-6"/>
                  {unreadCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </button>
              <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"><Settings className="w-6 h-6"/></button>
          </div>
      </div>

      {/* DESKTOP HEADER ACTIONS */}
      <div className="hidden md:flex fixed top-6 right-8 z-20 gap-3 items-center">
          <button onClick={() => setShowActivity(true)} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white shadow-sm hover:shadow transition-all" title="Activity Log"><History className="w-5 h-5" /></button>
          <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white shadow-sm hover:shadow transition-all"><Settings className="w-5 h-5" /></button>
          <button onClick={() => setShowNotifications(true)} className="relative p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white shadow-sm hover:shadow transition-all">
              <BellRing className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
          </button>
      </div>

      {/* WORKSPACE */}
      <main className="flex-1 pt-20 md:pt-10 p-5 md:p-10 lg:p-14 pb-28 md:pb-14 overflow-y-auto h-screen relative">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'pulse' && <PulseTab tasks={tasks} userProfile={activeProfile} onOpenTask={setSelectedTask} db={db} appId={appId} user={user} toggleTask={(t)=>toggleTask(t, activeProfile)} sendNotification={sendNotification} logActivity={logActivity} systemUsers={systemUsers} leoData={leoData} />}
          {activeTab === 'projects' && <ProjectsTab tasks={tasks} projects={projects} userProfile={activeProfile} onOpenTask={setSelectedTask} db={db} appId={appId} user={user} sendNotification={sendNotification} logActivity={logActivity} systemUsers={systemUsers} toggleTask={(t)=>toggleTask(t, activeProfile)} broadcastNotification={broadcastNotification} />}
          {activeTab === 'family' && <FamilyTab spiritualLogs={spiritualLogs} systemUsers={systemUsers} db={db} appId={appId} user={user} tasks={tasks} familyDocs={familyDocs} logActivity={logActivity} />}
          {activeTab === 'kids' && <KidsTab leoData={leoData} db={db} appId={appId} user={user} logActivity={logActivity} leoStats={leoStats} tasks={tasks} toggleTask={(t)=>toggleTask(t, activeProfile)} userProfile={activeProfile} />}
          {activeTab === 'logistics' && <LogisticsTab shoppingList={shoppingList} meals={meals} db={db} appId={appId} user={user} logActivity={logActivity} />}
          {activeTab === 'finance' && <FinanceTab finances={finances} db={db} appId={appId} user={user} />}
        </div>
      </main>

      {/* MODALS */}
      {activeSelectedTask && (
          <TaskDetailModal 
            task={activeSelectedTask} onClose={() => setSelectedTask(null)} 
            db={db} appId={appId} user={user} comments={comments} 
            userProfile={activeProfile} systemUsers={systemUsers} 
            sendNotification={sendNotification} logActivity={logActivity}
          />
      )}
      {showNotifications && <NotificationsPanel notifications={notifications.filter(n => n.targetUser === activeProfile).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))} onClose={() => setShowNotifications(false)} onNotificationClick={handleNotificationClick} />}
      {showActivity && <ActivityLogModal logs={activityLogs} onClose={() => setShowActivity(false)} />}
      {showSettings && <SettingsModal isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} systemUsers={systemUsers} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
