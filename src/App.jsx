import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { 
  Home, Users, Briefcase, Zap, BellRing, CheckCircle2, Circle, Star, 
  Plus, Calendar, MessageSquare, Trash2, Settings, UserPlus, Moon, Sun, 
  Heart, ShoppingCart, Utensils, Check, AlertCircle, Wallet, PiggyBank,
  BookOpen, Target, ArrowRight, Edit2, ListTodo, X, Lock, KeyRound, Gamepad2, Award,
  Repeat, ArrowUp, ArrowDown, CalendarClock, History, AtSign, ChevronDown, ChevronRight, Gift,
  Timer, Play, Pause, Square, FileText, Link as LinkIcon, Volume2
} from 'lucide-react';

// ============================================================================
// 1. FIREBASE CONFIGURATION
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBzarUX4dkMs487-doUfG1Ct8oivtoLX9Y",
  authDomain: "stevens-sanctuary.firebaseapp.com",
  projectId: "stevens-sanctuary",
  storageBucket: "stevens-sanctuary.firebasestorage.app",
  messagingSenderId: "45718875766",
  appId: "1:45718875766:web:f06156090035d44366b957"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "stevens-sanctuary";

// ============================================================================
// 2. HELPERS
// ============================================================================
const getMonday = (offset = 0) => {
    const d = new Date();
    const day = d.getDay() || 7; 
    d.setDate(d.getDate() - day + 1 + (offset * 7));
    d.setHours(0,0,0,0);
    return d.toISOString().split('T')[0];
};

const getCurrentMonthId = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const calculateNextDueDate = (dateStr, recurrence, specificDays = []) => {
    let d = dateStr ? new Date(dateStr) : new Date();
    
    if (recurrence === 'daily') {
        d.setDate(d.getDate() + 1);
    } else if (recurrence === 'monthly') {
        d.setMonth(d.getMonth() + 1);
    } else if (recurrence === 'weekly' || recurrence === 'biweekly') {
        if (specificDays && specificDays.length > 0) {
            let currentDay = d.getDay() || 7; // 1-7 (Mon-Sun)
            let sortedDays = [...specificDays].sort();
            let nextDay = sortedDays.find(day => day > currentDay);
            
            if (nextDay) {
                d.setDate(d.getDate() + (nextDay - currentDay));
            } else {
                let daysToNextWeekDay = (7 - currentDay) + sortedDays[0];
                if (recurrence === 'biweekly') daysToNextWeekDay += 7;
                d.setDate(d.getDate() + daysToNextWeekDay);
            }
        } else {
            d.setDate(d.getDate() + (recurrence === 'biweekly' ? 14 : 7));
        }
    }
    return d.toISOString().split('T')[0];
};

const formatDueDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    const diffTime = d - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const WEEK_DAYS = [{l:'M', v:1}, {l:'T', v:2}, {l:'W', v:3}, {l:'T', v:4}, {l:'F', v:5}, {l:'S', v:6}, {l:'S', v:7}];

// UI Helpers
const inputBaseClasses = "bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm placeholder:text-slate-400";
const cardBaseClasses = "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[1.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]";

// ============================================================================
// 3. CORE APPLICATION
// ============================================================================
export default function SanctuaryOS() {
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
            console.warn("Custom token failed (expected if using a custom Firebase config). Falling back to anonymous sign-in.", err);
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

    const unsubs = [
      onSnapshot(collection(db, ...basePath, 'system_users'), (snap) => {
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (fetched.length === 0) {
            addDoc(collection(db, ...basePath, 'system_users'), { name: 'Jordan', role: 'Adult' });
            addDoc(collection(db, ...basePath, 'system_users'), { name: 'Biljana', role: 'Adult' });
            addDoc(collection(db, ...basePath, 'system_users'), { name: 'Leo', role: 'Child' });
        } else setSystemUsers(fetched);
      }),
      onSnapshot(collection(db, ...basePath, 'tasks'), (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...basePath, 'projects'), (snap) => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...basePath, 'comments'), (snap) => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...basePath, 'notifications'), (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...basePath, 'activity_log'), (snap) => setActivityLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...basePath, 'shopping'), (snap) => setShoppingList(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...basePath, 'meals'), (snap) => setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...basePath, 'spiritual'), (snap) => setSpiritualLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...basePath, 'finances'), (snap) => setFinances(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, ...basePath, 'family_docs'), (snap) => setFamilyDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(doc(db, ...basePath, 'stats', 'leo'), (snap) => {
         if(snap.exists()) setLeoStats(snap.data());
         else setDoc(doc(db, ...basePath, 'stats', 'leo'), { stars: 0 });
      }),
      onSnapshot(collection(db, ...basePath, 'leodata'), (snap) => {
         const data = { milestones: [], appointments: [], restock: [], rewards: [] };
         snap.docs.forEach(doc => { const item = { id: doc.id, ...doc.data() }; if(data[item.type]) data[item.type].push(item); });
         setLeoData(data);
      })
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

// --- NAV COMPONENT ---
function NavItem({ icon, label, active, onClick, color, bgColor }) {
  return (
    <button onClick={onClick} className={`flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-4 p-2 md:p-3.5 rounded-2xl transition-all duration-200 w-full group ${active ? `${bgColor} shadow-sm` : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400'}`}>
      <div className={`transition-transform duration-200 group-active:scale-95 ${active ? color : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>{React.cloneElement(icon, { className: 'w-6 h-6 md:w-5 md:h-5' })}</div>
      <span className={`text-[10px] md:text-[13px] font-bold tracking-wide transition-colors ${active ? 'text-slate-900 dark:text-white' : ''}`}>{label}</span>
    </button>
  );
}

// ============================================================================
// LEO'S GAMIFIED TABLET VIEW (With Slider, Rewards, and Timer)
// ============================================================================
function LeoDashboard({ tasks, db, appId, stats, toggleTask, onLogout, rewardsData }) {
    const [flyingStars, setFlyingStars] = useState([]);
    const [localCompleted, setLocalCompleted] = useState({});
    const [showRewards, setShowRewards] = useState(false);
    const [activeTimerTask, setActiveTimerTask] = useState(null);
    const starCounterRef = React.useRef(null);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    // Filter tasks: assigned to Leo, uncompleted, and due today or earlier (or no date)
    const leoTasks = tasks.filter(t => {
        if (t.assignee !== 'Leo' || t.completed || localCompleted[t.id]) return false;
        if (!t.dueDate) return true;
        return t.dueDate <= todayStr;
    });
    
    const completeTask = (task, event, startX, startY) => {
        setLocalCompleted(prev => ({...prev, [task.id]: true}));

        let endX = window.innerWidth - 100;
        let endY = 50;
        if (starCounterRef.current) {
            const targetRect = starCounterRef.current.getBoundingClientRect();
            endX = targetRect.left + targetRect.width / 2;
            endY = targetRect.top + targetRect.height / 2;
        }

        const newStar = { id: Date.now() + Math.random(), startX: startX || window.innerWidth/2, startY: startY || window.innerHeight/2, endX, endY };
        setFlyingStars(prev => [...prev, newStar]);

        setTimeout(async () => {
            setFlyingStars(prev => prev.filter(s => s.id !== newStar.id));
            await toggleTask(task, 'Leo');
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stats', 'leo'), { stars: (stats.stars || 0) + 1 });
        }, 800);
    };

    const redeemReward = async (reward) => {
        if (stats.stars < reward.cost) return;
        // Deduct stars
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stats', 'leo'), { stars: stats.stars - reward.cost });
        // Update reward status
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', reward.id), { status: 'pending' });
    };

    const fulfilledRewards = rewardsData?.filter(r => r.status === 'fulfilled') || [];
    const acknowledgeReward = async (id, isPermanent) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', id), { status: isPermanent ? 'available' : 'archived' });
    };

    // If timer is active, overlay the whole screen
    if (activeTimerTask) {
        return (
            <TimerOverlay 
                task={activeTimerTask} 
                onComplete={() => {
                    completeTask(activeTimerTask);
                    setActiveTimerTask(null);
                }} 
                onCancel={() => setActiveTimerTask(null)} 
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-400 to-indigo-500 p-4 md:p-8 flex flex-col font-sans relative overflow-hidden selection:bg-white/30">
            <style>{`
                @keyframes flyToStar {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
                    30% { transform: translate(0, -50px) scale(1.5) rotate(90deg); opacity: 1; filter: drop-shadow(0 0 30px rgba(253, 224, 71, 1)); }
                    100% { transform: translate(var(--tx), var(--ty)) scale(0.3) rotate(360deg); opacity: 0; }
                }
                .star-fly { animation: flyToStar 0.8s cubic-bezier(0.25, 0.1, 0.25, 1) forwards; }
            `}</style>

            {flyingStars.map(star => (
                <Star key={star.id} className="fixed z-[100] w-24 h-24 text-yellow-300 fill-yellow-300 pointer-events-none star-fly"
                    style={{
                        left: star.startX - 48, top: star.startY - 48,
                        '--tx': `${star.endX - star.startX}px`, '--ty': `${star.endY - star.startY}px`,
                    }}
                />
            ))}

            {/* FULFILLED REWARD CELEBRATION */}
            {fulfilledRewards.length > 0 && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-900/80 backdrop-blur-md p-4 animate-in zoom-in duration-500">
                    <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl border-b-8 border-emerald-200 relative overflow-hidden">
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-300/40 rounded-full blur-3xl pointer-events-none"></div>
                        <Gift className="w-32 h-32 text-rose-400 mx-auto mb-6 animate-bounce drop-shadow-xl" />
                        <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tight">Yay!</h2>
                        <p className="text-2xl font-bold text-sky-600 mb-10 leading-relaxed">
                            You can have the <strong className="text-indigo-600 text-3xl">{fulfilledRewards[0].title}</strong>!<br/>Well done Leo! ❤️
                        </p>
                        <button onClick={() => acknowledgeReward(fulfilledRewards[0].id, fulfilledRewards[0].isPermanent)} className="bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-white text-3xl font-black px-10 py-6 rounded-[2.5rem] w-full shadow-xl shadow-emerald-500/30 transform transition-transform active:scale-95 border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1">
                            Awesome!
                        </button>
                    </div>
                </div>
            )}

            {/* Decorative Background Elements */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] pointer-events-none"></div>

            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 relative z-10">
                <button onClick={() => setShowRewards(false)} className="text-5xl md:text-6xl font-black text-white drop-shadow-lg flex items-center gap-4 hover:scale-105 transition-transform tracking-tight">
                    <Gamepad2 className="w-12 h-12 md:w-16 md:h-16 opacity-90" /> Leo's {showRewards ? 'Rewards' : 'Quests!'}
                </button>
                <button ref={starCounterRef} onClick={() => setShowRewards(!showRewards)} className="bg-white/20 backdrop-blur-xl border border-white/40 px-8 py-4 rounded-[2rem] flex items-center gap-4 shadow-xl shadow-indigo-900/20 hover:bg-white/30 transition-all cursor-pointer group hover:-translate-y-1">
                    <Star className="w-10 h-10 md:w-12 md:h-12 text-yellow-300 fill-yellow-300 group-hover:animate-spin-slow drop-shadow" />
                    <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{stats.stars || 0} Stars</span>
                </button>
            </header>

            <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar px-2">
                {!showRewards ? (
                    leoTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-300 blur-3xl opacity-30 rounded-full animate-pulse"></div>
                                <Award className="w-56 h-56 text-yellow-300 mb-8 drop-shadow-2xl relative z-10" />
                            </div>
                            <h2 className="text-7xl font-black text-white drop-shadow-lg mb-6 tracking-tight">You did it!</h2>
                            <p className="text-4xl text-sky-100 font-bold drop-shadow-sm">No more quests for today. Go play!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto pb-24">
                            {leoTasks.map(task => (
                                <div key={task.id} className="bg-white/95 backdrop-blur-sm rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-indigo-900/20 flex flex-col gap-8 border-b-8 border-slate-200 animate-in slide-in-from-bottom-8">
                                    <span className="text-4xl md:text-5xl font-black text-slate-800 text-center leading-tight tracking-tight">{task.title}</span>
                                    
                                    {task.timeLimit ? (
                                        <button onClick={() => setActiveTimerTask(task)} className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-[3rem] h-24 flex items-center justify-center gap-4 text-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all border-b-4 border-amber-600 active:border-b-0 active:translate-y-1">
                                            <Timer className="w-10 h-10" /> Start Mission ({task.timeLimit}m)
                                        </button>
                                    ) : (
                                        <SlideToComplete task={task} onComplete={(e, startX, startY) => completeTask(task, e, startX, startY)} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto pb-24">
                        {rewardsData?.filter(r => r.status === 'available' || r.status === 'pending').map(reward => {
                            const progress = reward.cost === 0 ? 100 : Math.min((stats.stars / reward.cost) * 100, 100);
                            const starsNeeded = Math.max(0, reward.cost - stats.stars);

                            return (
                            <div key={reward.id} className="bg-white/95 backdrop-blur-sm rounded-[3rem] p-8 shadow-2xl shadow-indigo-900/20 border-b-8 border-slate-200 flex flex-col items-center text-center gap-4 relative animate-in zoom-in-95">
                                {reward.isPermanent && (
                                    <div className="absolute top-6 right-6 bg-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-1 shadow-sm">
                                        <Repeat className="w-4 h-4" /> Keep
                                    </div>
                                )}
                                <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mb-2">
                                    <Gift className="w-14 h-14 text-rose-500 drop-shadow-sm" />
                                </div>
                                <span className="text-3xl font-black text-slate-800 tracking-tight leading-tight px-4">{reward.title}</span>
                                
                                {reward.status === 'pending' ? (
                                    <div className="bg-slate-100 text-slate-500 px-8 py-4 rounded-2xl font-bold text-xl w-full mt-4 border-2 border-dashed border-slate-300">
                                        Waiting for Parents...
                                    </div>
                                ) : (
                                    <div className="w-full mt-4">
                                        <button 
                                            disabled={stats.stars < reward.cost}
                                            onClick={() => redeemReward(reward)}
                                            className={`w-full py-5 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-all ${stats.stars >= reward.cost ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 text-white shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed border-b-4 border-slate-300'}`}
                                        >
                                            <Star className={`w-8 h-8 ${stats.stars >= reward.cost ? 'fill-yellow-300 text-yellow-100 drop-shadow-md' : 'fill-slate-300 text-slate-300'}`}/> 
                                            {reward.cost === 0 ? 'Free!' : `Buy for ${reward.cost}`}
                                        </button>
                                        
                                        <div className="w-full bg-slate-100 rounded-full h-4 mt-6 mb-2 overflow-hidden shadow-inner border border-slate-200">
                                            <div className={`h-full rounded-full transition-all duration-700 ease-out ${progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`} style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-400 tracking-wide uppercase">
                                            {starsNeeded > 0 ? `Need ${starsNeeded} more star${starsNeeded>1?'s':''}` : 'Ready to buy!'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )})}
                        {rewardsData?.filter(r => r.status === 'available' || r.status === 'pending').length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center text-center text-white bg-white/20 backdrop-blur-xl rounded-[3rem] p-16 shadow-xl border border-white/30">
                                <ShoppingCart className="w-24 h-24 text-white/50 mb-6" />
                                <span className="text-4xl font-black tracking-tight">No rewards in the shop right now!</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button onClick={onLogout} className="absolute bottom-10 left-10 bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-full font-bold backdrop-blur-xl transition-colors z-20 flex items-center gap-3 shadow-lg border border-white/30 tracking-wide">
                <Lock className="w-5 h-5" /> Lock Tablet
            </button>
        </div>
    )
}

function TimerOverlay({ task, onComplete, onCancel }) {
    const totalSeconds = (task.timeLimit || 5) * 60;
    const [timeLeft, setTimeLeft] = useState(totalSeconds);
    const [isRunning, setIsRunning] = useState(false);
    const spokenRef = useRef({ started: false, half: false, five: false, one: false, zero: false });

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            // Try to find a friendly or default voice
            const voices = window.speechSynthesis.getVoices();
            if(voices.length > 0) utterance.voice = voices.find(v => v.lang.includes('en')) || voices[0];
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Initialize speech voices (browser quirk workaround)
    useEffect(() => {
        if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    }, []);

    useEffect(() => {
        let interval;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    const newTime = prev - 1;
                    const s = spokenRef.current;
                    
                    if (newTime === Math.floor(totalSeconds / 2) && totalSeconds > 120 && !s.half) {
                        speak("Halfway there! Keep going!");
                        s.half = true;
                    }
                    if (newTime === 300 && totalSeconds > 300 && !s.five) {
                        speak("5 minutes left.");
                        s.five = true;
                    }
                    if (newTime === 60 && totalSeconds > 60 && !s.one) {
                        speak("1 minute left! Almost done!");
                        s.one = true;
                    }
                    if (newTime === 0 && !s.zero) {
                        speak("Time's up! Great job!");
                        s.zero = true;
                    }
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, totalSeconds]);

    const toggleTimer = () => {
        if (!isRunning && timeLeft === totalSeconds && !spokenRef.current.started) {
            speak(`Starting ${task.title}. You have ${task.timeLimit} minutes.`);
            spokenRef.current.started = true;
        }
        setIsRunning(!isRunning);
    };

    const percentage = (timeLeft / totalSeconds) * 100;
    const radius = 140;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;

    return (
        <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-300">
            <button onClick={onCancel} className="absolute top-10 left-10 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-xl transition-colors">
                <X className="w-8 h-8" /> Cancel
            </button>

            <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center tracking-tight">{task.title}</h2>

            <div className="relative w-[320px] h-[320px] md:w-[400px] md:h-[400px] flex items-center justify-center mb-16">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r={radius} className="stroke-slate-800" strokeWidth="24" fill="none" />
                    <circle 
                        cx="50%" cy="50%" r={radius} 
                        className={`transition-all duration-1000 ease-linear ${timeLeft === 0 ? 'stroke-rose-500' : 'stroke-amber-400'}`} 
                        strokeWidth="24" fill="none" strokeLinecap="round"
                        style={{ strokeDasharray: circumference, strokeDashoffset }} 
                    />
                </svg>
                <div className="relative flex flex-col items-center">
                    <span className={`text-7xl md:text-8xl font-black tracking-tighter ${timeLeft === 0 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-2 mt-2 text-slate-400 font-bold uppercase tracking-widest">
                        <Volume2 className="w-4 h-4" /> Voice On
                    </div>
                </div>
            </div>

            <div className="flex gap-6">
                {timeLeft > 0 && (
                    <button onClick={toggleTimer} className={`w-24 h-24 rounded-full flex items-center justify-center transition-transform active:scale-90 ${isRunning ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)]'}`}>
                        {isRunning ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
                    </button>
                )}
                <button onClick={onComplete} className="w-24 h-24 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-400 transition-transform active:scale-90 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                    <Check className="w-12 h-12" strokeWidth={3} />
                </button>
            </div>
        </div>
    )
}

function SlideToComplete({ task, onComplete }) {
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [completed, setCompleted] = useState(false);
    const trackRef = React.useRef(null);
    const thumbRef = React.useRef(null);
    
    const handlePointerDown = (e) => {
        if(completed) return;
        setIsDragging(true);
        e.target.setPointerCapture(e.pointerId);
    };
    
    const handlePointerMove = (e) => {
        if(!isDragging || completed || !trackRef.current) return;
        const trackRect = trackRef.current.getBoundingClientRect();
        // 48 is approx half thumb width (thumb is 96px)
        let newX = e.clientX - trackRect.left - 48; 
        newX = Math.max(0, Math.min(newX, trackRect.width - 96)); 
        setOffset(newX);
    };
    
    const handlePointerUp = (e) => {
        if(!isDragging || completed || !trackRef.current) return;
        setIsDragging(false);
        const trackWidth = trackRef.current.getBoundingClientRect().width;
        if(offset > trackWidth * 0.70) { // If dragged past 70%, complete it
            setOffset(trackWidth - 96);
            setCompleted(true);
            const thumbRect = thumbRef.current.getBoundingClientRect();
            onComplete(e, thumbRect.left + thumbRect.width/2, thumbRect.top + thumbRect.height/2);
        } else {
            setOffset(0);
        }
        e.target.releasePointerCapture(e.pointerId);
    };

    return (
        <div ref={trackRef} className="bg-slate-100 border-4 border-slate-200 rounded-[3rem] h-24 w-full relative flex items-center overflow-hidden shadow-inner select-none touch-none">
            <span className="absolute w-full text-center text-slate-400 font-black text-xl pointer-events-none pl-16 pr-4 uppercase tracking-[0.2em] opacity-80">
                Slide to finish &rarr;
            </span>
            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-300 to-emerald-400 transition-none" style={{ width: offset + 48 }}></div>
            <div 
                ref={thumbRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ transform: `translateX(${offset}px)` }}
                className={`w-24 h-24 rounded-[3rem] flex items-center justify-center absolute left-0 top-[-4px] cursor-grab shadow-xl z-10 border-b-4 transition-colors ${isDragging ? 'bg-amber-300 border-amber-500 scale-105' : 'bg-amber-400 border-amber-600 hover:bg-amber-300'}`}
            >
                <Star className="w-12 h-12 text-white fill-white drop-shadow-sm" />
            </div>
        </div>
    );
}

// ============================================================================
// TAB 1: THE PULSE (Dashboard)
// ============================================================================
function PulseTab({ tasks, userProfile, onOpenTask, db, appId, user, toggleTask, sendNotification, logActivity, systemUsers, leoData }) {
    const [newTask, setNewTask] = useState('');
    const [newAssignee, setNewAssignee] = useState(userProfile);
    const [newDueDate, setNewDueDate] = useState('');
    const [newTimeLimit, setNewTimeLimit] = useState('');
    const [newRecurrence, setNewRecurrence] = useState('none');
    const [newRecurrenceDays, setNewRecurrenceDays] = useState([]);
    const [newRecurEndDate, setNewRecurEndDate] = useState('');
    
    const myTasks = tasks.filter(t => t.assignee === userProfile || t.assignee === 'Both' || !t.assignee);
    const activeTasks = myTasks.filter(t => !t.completed);
    const nudgedTasks = activeTasks.filter(t => t.nudged);
    const generalTasks = activeTasks.filter(t => !t.nudged);

    const pendingRewards = leoData?.rewards?.filter(r => r.status === 'pending') || [];

    const handleAdd = async (e) => {
        e.preventDefault();
        if(!newTask.trim() || !user) return;
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
            title: newTask, assignee: newAssignee, projectId: '', section: '',
            dueDate: newDueDate || null, timeLimit: newTimeLimit ? Number(newTimeLimit) : null,
            recurrence: newRecurrence, recurrenceDays: newRecurrenceDays, recurrenceEndDate: newRecurEndDate || null,
            completed: false, nudged: false, subtasks: [],
            createdAt: new Date().toISOString(), createdBy: userProfile
        });
        
        logActivity(`Added task: "${newTask}"`, userProfile);
        if (newAssignee && newAssignee !== userProfile && newAssignee !== 'Both') {
            sendNotification(newAssignee, `${userProfile} assigned you a task: "${newTask}"`, docRef.id, 'assign');
        }

        setNewTask(''); setNewDueDate(''); setNewTimeLimit(''); setNewRecurrence('none'); setNewRecurrenceDays([]); setNewRecurEndDate('');
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header className="mb-2">
                <h2 className="text-4xl font-black mb-2 tracking-tight">The Pulse</h2>
                <p className="text-slate-500 text-lg font-medium">Your personal inbox and active nudges.</p>
            </header>

            {/* PENDING REWARDS FROM LEO */}
            {pendingRewards.length > 0 && (
                <div className="space-y-4">
                    {pendingRewards.map(reward => (
                        <div key={reward.id} className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200/60 dark:border-rose-800/60 rounded-[1.5rem] p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 animate-in slide-in-from-bottom-4">
                            <div>
                                <h3 className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2 mb-1"><Gift className="w-5 h-5"/> Reward Request</h3>
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-300 leading-relaxed">Someone wants to cash in <strong className="font-black px-1.5 py-0.5 bg-rose-200/50 dark:bg-rose-800/50 rounded">{reward.cost} stars</strong> for <strong>{reward.title}</strong>.</p>
                            </div>
                            <button onClick={() => {
                                updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', reward.id), { status: 'fulfilled' });
                                logActivity(`Approved reward: "${reward.title}"`, userProfile);
                            }} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-emerald-500/20 w-full sm:w-auto transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap">Approve Reward</button>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleAdd} className={cardBaseClasses + " flex flex-col gap-4"}>
                <input type="text" value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Quick add a task..." className="w-full bg-slate-100/50 dark:bg-slate-800/50 rounded-xl px-5 py-4 outline-none dark:text-white border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg shadow-inner placeholder:text-slate-400" />
                
                <div className="flex flex-wrap gap-3 items-center">
                    <select value={newAssignee} onChange={e=>setNewAssignee(e.target.value)} className="bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer">
                        {systemUsers.map(u => <option key={u.id} value={u.name}>For {u.name}</option>)}
                        <option value="Both">Joint</option>
                        <option value="">Unassigned</option>
                    </select>
                    
                    <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-pointer">
                        <CalendarClock className="w-4 h-4 text-slate-500"/>
                        <input type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer" title="Start Date / Next Due" />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-pointer w-32">
                        <Timer className="w-4 h-4 text-slate-500"/>
                        <input type="number" value={newTimeLimit} onChange={e=>setNewTimeLimit(e.target.value)} placeholder="Mins" className="w-full bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400" title="Optional Timer (Minutes)" />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-pointer">
                        <Repeat className="w-4 h-4 text-slate-500"/>
                        <select value={newRecurrence} onChange={e=>{setNewRecurrence(e.target.value); setNewRecurrenceDays([]);}} className="bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                            <option value="none">Once</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Biweekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    
                    {(newRecurrence === 'weekly' || newRecurrence === 'biweekly') && (
                        <div className="flex gap-1 ml-1 pl-3 border-l-2 border-slate-200 dark:border-slate-800">
                            {WEEK_DAYS.map((d, i) => (
                                <button key={i} type="button" onClick={(e) => { e.preventDefault(); if(newRecurrenceDays.includes(d.v)) setNewRecurrenceDays(newRecurrenceDays.filter(day => day !== d.v)); else setNewRecurrenceDays([...newRecurrenceDays, d.v]); }}
                                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all shadow-sm ${newRecurrenceDays.includes(d.v) ? 'bg-indigo-500 text-white scale-110' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
                                    {d.l}
                                </button>
                            ))}
                        </div>
                    )}

                    {newRecurrence !== 'none' && (
                        <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-pointer ml-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Until</span>
                            <input type="date" value={newRecurEndDate} onChange={e=>setNewRecurEndDate(e.target.value)} className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 cursor-pointer" />
                        </div>
                    )}
                    
                    <div className="flex-1"></div>
                    <button type="submit" className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all active:scale-95">Add</button>
                </div>
            </form>

            {nudgedTasks.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200/60 dark:border-orange-800/60 rounded-[1.5rem] p-6 shadow-sm">
                    <h3 className="font-bold text-orange-800 dark:text-orange-400 mb-5 flex items-center gap-2"><BellRing className="w-5 h-5"/> Chased / Nudged</h3>
                    <div className="space-y-3">
                        {nudgedTasks.map(task => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onOpen={() => onOpenTask(task)} />)}
                    </div>
                </div>
            )}

            <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-5 flex items-center gap-2 text-lg"><ListTodo className="w-5 h-5 text-indigo-500"/> My Active Tasks</h3>
                {generalTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 border-dashed">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="text-slate-500 font-bold text-lg">You're all clear.</p>
                        <p className="text-slate-400 text-sm mt-1">Enjoy your free time!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {generalTasks.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(task => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onOpen={() => onOpenTask(task)} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// TAB 2: PROJECTS & TASKS (Collapsible Accordion UI)
// ============================================================================
function ProjectsTab({ tasks, projects, userProfile, onOpenTask, db, appId, user, systemUsers, toggleTask, logActivity, sendNotification }) {
    const [newProject, setNewProject] = useState('');
    const [newTask, setNewTask] = useState('');
    const [newAssignee, setNewAssignee] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [newTimeLimit, setNewTimeLimit] = useState('');
    const [newRecurrence, setNewRecurrence] = useState('none');
    const [newRecurrenceDays, setNewRecurrenceDays] = useState([]);
    const [newRecurEndDate, setNewRecurEndDate] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedSection, setSelectedSection] = useState('General');
    const [newSection, setNewSection] = useState('');
    
    const [actionModal, setActionModal] = useState(null); 
    const [expandedProjects, setExpandedProjects] = useState([]);

    const toggleProjectExpand = (projId) => {
        setExpandedProjects(prev => prev.includes(projId) ? prev.filter(id => id !== projId) : [...prev, projId]);
    };

    const sortedProjects = [...projects].sort((a, b) => (a.order || 0) - (b.order || 0));
    const projObj = sortedProjects.find(p => p.id === selectedProject);
    const availableSections = projObj?.sections || ['General'];

    const handleAddProject = async (e) => {
        e.preventDefault();
        if(!newProject.trim() || !user) return;
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), { 
            name: newProject, sections: ['General'], order: sortedProjects.length, createdAt: new Date().toISOString() 
        });
        setExpandedProjects(prev => [...prev, docRef.id]); 
        logActivity(`Created project: "${newProject}"`, userProfile);
        setNewProject('');
    };

    const handleAddSection = async (projId) => {
        if(!newSection.trim() || !user) return;
        const p = projects.find(p => p.id === projId);
        const sections = p.sections || ['General'];
        if(!sections.includes(newSection)) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projId), { sections: [...sections, newSection] });
            logActivity(`Added section "${newSection}" to project "${p.name}"`, userProfile);
        }
        setNewSection('');
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if(!newTask.trim() || !user) return;
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
            title: newTask, assignee: newAssignee, projectId: selectedProject, section: selectedSection || 'General',
            dueDate: newDueDate || null, timeLimit: newTimeLimit ? Number(newTimeLimit) : null,
            recurrence: newRecurrence, recurrenceDays: newRecurrenceDays, recurrenceEndDate: newRecurEndDate || null,
            completed: false, nudged: false, subtasks: [], createdAt: new Date().toISOString(), createdBy: userProfile
        });
        logActivity(`Added task: "${newTask}"`, userProfile);
        if (newAssignee && newAssignee !== userProfile && newAssignee !== 'Both') {
            sendNotification(newAssignee, `${userProfile} assigned you a task: "${newTask}"`, docRef.id, 'assign');
        }
        if (selectedProject && !expandedProjects.includes(selectedProject)) {
            setExpandedProjects(prev => [...prev, selectedProject]);
        }
        setNewTask(''); setNewDueDate(''); setNewTimeLimit(''); setNewRecurrence('none'); setNewRecurrenceDays([]); setNewRecurEndDate('');
    };

    const executeAction = async (val) => {
        const { type, targetId, sectionName, targetProjId } = actionModal;
        if (type === 'editProject') {
            if (val && val.trim()) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', targetId), { name: val.trim() });
        } else if (type === 'deleteProject') {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', targetId));
            const pTasks = tasks.filter(t => t.projectId === targetId);
            for(const t of pTasks) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { projectId: '', section: 'General' });
        } else if (type === 'editSection') {
            if (val && val.trim() && val.trim() !== sectionName) {
                const p = projects.find(p => p.id === targetProjId);
                const updatedSections = p.sections.map(s => s === sectionName ? val.trim() : s);
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', targetProjId), { sections: updatedSections });
                const sTasks = tasks.filter(t => t.projectId === targetProjId && (t.section || 'General') === sectionName);
                for(const t of sTasks) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { section: val.trim() });
            }
        } else if (type === 'deleteSection') {
            const p = projects.find(p => p.id === targetProjId);
            const updatedSections = p.sections.filter(s => s !== sectionName);
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', targetProjId), { sections: updatedSections });
            const sTasks = tasks.filter(t => t.projectId === targetProjId && (t.section || 'General') === sectionName);
            for(const t of sTasks) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), { section: 'General' });
        }
        setActionModal(null);
    };

    const moveProject = async (p, direction) => {
        const index = sortedProjects.findIndex(proj => proj.id === p.id);
        if (direction === 'up' && index > 0) {
            const prev = sortedProjects[index - 1];
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', p.id), { order: index - 1 });
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', prev.id), { order: index });
        } else if (direction === 'down' && index < sortedProjects.length - 1) {
            const next = sortedProjects[index + 1];
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', p.id), { order: index + 1 });
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', next.id), { order: index });
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl font-black mb-2 tracking-tight">Projects & Folders</h2>
                <p className="text-slate-500 text-lg font-medium">Manage household projects, chores, and sub-sections.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Task */}
                <form onSubmit={handleAddTask} className={cardBaseClasses}>
                    <h3 className="font-black text-xs text-slate-400 uppercase tracking-[0.15em] mb-5">New Task / Chore</h3>
                    <div className="space-y-4">
                        <input type="text" value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Task name..." className={inputBaseClasses + " w-full"} required />
                        
                        <div className="flex gap-3">
                            <select value={newAssignee} onChange={e=>setNewAssignee(e.target.value)} className={inputBaseClasses + " flex-1 py-2 text-sm font-bold"}>
                                <option value="">Unassigned</option>
                                {systemUsers.map(u => <option key={u.id} value={u.name}>For {u.name}</option>)}
                                <option value="Both">Joint</option>
                            </select>
                            <input type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} className={inputBaseClasses + " flex-1 py-2 text-sm font-bold"} title="Start Date / Next Due" />
                            <input type="number" value={newTimeLimit} onChange={e=>setNewTimeLimit(e.target.value)} placeholder="Mins (opt)" className={inputBaseClasses + " w-24 py-2 text-sm font-bold"} title="Optional Time Limit in Minutes" />
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            <select value={newRecurrence} onChange={e=>{setNewRecurrence(e.target.value); setNewRecurrenceDays([]);}} className={inputBaseClasses + " flex-1 py-2 text-sm font-bold"}>
                                <option value="none">Does not repeat</option>
                                <option value="daily">Repeats Daily</option>
                                <option value="weekly">Repeats Weekly</option>
                                <option value="biweekly">Repeats Biweekly</option>
                                <option value="monthly">Repeats Monthly</option>
                            </select>
                            {(newRecurrence === 'weekly' || newRecurrence === 'biweekly') && (
                                <div className="flex gap-1 ml-2">
                                    {WEEK_DAYS.map((d, i) => (
                                        <button key={i} type="button" onClick={(e) => { e.preventDefault(); if(newRecurrenceDays.includes(d.v)) setNewRecurrenceDays(newRecurrenceDays.filter(day => day !== d.v)); else setNewRecurrenceDays([...newRecurrenceDays, d.v]); }}
                                            className={`w-8 h-8 rounded-full text-[10px] font-bold shadow-sm transition-all ${newRecurrenceDays.includes(d.v) ? 'bg-indigo-500 text-white scale-110' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                            {d.l}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {newRecurrence !== 'none' && (
                            <div className={inputBaseClasses + " flex items-center gap-3 py-2"}>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-1">Recur Until (Optional)</span>
                                <input type="date" value={newRecurEndDate} onChange={e=>setNewRecurEndDate(e.target.value)} className="bg-transparent outline-none text-sm font-bold text-slate-700 dark:text-slate-200" />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <select value={selectedProject} onChange={e=>{setSelectedProject(e.target.value); setSelectedSection('General');}} className={inputBaseClasses + " flex-1 py-2 text-sm font-bold"}>
                                <option value="">General (No Project)</option>
                                {sortedProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {selectedProject && (
                                <select value={selectedSection} onChange={e=>setSelectedSection(e.target.value)} className={inputBaseClasses + " w-1/3 py-2 text-sm font-bold"}>
                                    {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}
                            <button type="submit" className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 rounded-xl font-bold hover:shadow-lg shadow-rose-500/20 transition-all active:scale-95"><Plus className="w-5 h-5"/></button>
                        </div>
                    </div>
                </form>

                {/* Add Project */}
                <form onSubmit={handleAddProject} className={cardBaseClasses + " flex flex-col justify-between"}>
                    <div>
                        <h3 className="font-black text-xs text-slate-400 uppercase tracking-[0.15em] mb-5">New Project Folder</h3>
                        <p className="text-sm text-slate-500 mb-6">Create top-level folders to organize related tasks and chores.</p>
                    </div>
                    <div className="flex gap-3">
                        <input type="text" value={newProject} onChange={e=>setNewProject(e.target.value)} placeholder="e.g. House Renovation" className={inputBaseClasses + " flex-1"} required />
                        <button type="submit" className="bg-slate-800 dark:bg-slate-700 text-white px-6 rounded-xl font-bold transition-transform active:scale-95 shadow-md hover:bg-slate-900"><Plus className="w-5 h-5"/></button>
                    </div>
                </form>
            </div>

            {/* ACCORDION PROJECT LIST */}
            <div className="space-y-4">
                {sortedProjects.map((p, index) => {
                    const pTasks = tasks.filter(t => t.projectId === p.id);
                    const activeCount = pTasks.filter(t=>!t.completed).length;
                    const sections = p.sections || ['General'];
                    const isExpanded = expandedProjects.includes(p.id);
                    
                    return (
                        <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-all duration-300">
                            {/* Accordion Header */}
                            <div 
                                className="flex justify-between items-center p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none"
                                onClick={() => toggleProjectExpand(p.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-slate-100 dark:bg-slate-800' : 'bg-transparent'}`}>
                                        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-500"/> : <ChevronRight className="w-5 h-5 text-slate-400"/>}
                                    </div>
                                    <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100 tracking-tight">{p.name}</h3>
                                    {!isExpanded && activeCount > 0 && (
                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700">{activeCount} active</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-1 shadow-inner" onClick={e => e.stopPropagation()}>
                                    <button onClick={()=>moveProject(p, 'up')} disabled={index === 0} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 transition-colors"><ArrowUp className="w-4 h-4"/></button>
                                    <button onClick={()=>moveProject(p, 'down')} disabled={index === sortedProjects.length - 1} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 transition-colors"><ArrowDown className="w-4 h-4"/></button>
                                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                    <button onClick={()=>setActionModal({type: 'editProject', targetId: p.id})} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"><Edit2 className="w-4 h-4"/></button>
                                    <button onClick={()=>setActionModal({type: 'deleteProject', targetId: p.id})} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                            
                            {/* Accordion Body */}
                            {isExpanded && (
                                <div className="p-6 md:p-8 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-8 animate-in slide-in-from-top-4 duration-300">
                                    {sections.map(sectionName => {
                                        const sTasks = pTasks.filter(t => (t.section || 'General') === sectionName);
                                        if (sTasks.length === 0 && sectionName === 'General') return null;

                                        return (
                                            <div key={sectionName} className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-5 shadow-sm">
                                                <div className="flex justify-between items-center mb-4 px-2">
                                                    <h4 className="font-black text-sm text-slate-400 uppercase tracking-[0.15em]">{sectionName}</h4>
                                                    {sectionName !== 'General' && (
                                                        <div className="flex gap-2">
                                                            <button onClick={()=>setActionModal({type: 'editSection', targetProjId: p.id, sectionName})} className="text-slate-300 hover:text-indigo-500 transition-colors"><Edit2 className="w-4 h-4"/></button>
                                                            <button onClick={()=>setActionModal({type: 'deleteSection', targetProjId: p.id, sectionName})} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2.5">
                                                    {sTasks.filter(t=>!t.completed).length === 0 && <p className="text-sm text-slate-400 font-medium italic px-2 pb-2">No active tasks here.</p>}
                                                    {sTasks.filter(t=>!t.completed).map(t => <TaskRow key={t.id} task={t} onToggle={()=>toggleTask(t, userProfile)} onOpen={()=>onOpenTask(t)} />)}
                                                    {sTasks.filter(t=>t.completed).length > 0 && (
                                                        <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-300">
                                                            {sTasks.filter(t=>t.completed).map(t => <TaskRow key={t.id} task={t} onToggle={()=>toggleTask(t, userProfile)} onOpen={()=>onOpenTask(t)} />)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* Add Section Inline Form */}
                                    <div className="mt-6 flex gap-3">
                                        <input type="text" value={selectedProject===p.id ? newSection : ''} onChange={e=>{setNewSection(e.target.value); setSelectedProject(p.id);}} placeholder="Add a new section (e.g. Painting)..." className={inputBaseClasses + " flex-1 py-2 text-sm"} />
                                        <button onClick={()=>handleAddSection(p.id)} className="bg-slate-200/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-5 rounded-xl font-bold text-sm hover:bg-slate-300 transition-colors">Add Section</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Custom Action Modals */}
            {actionModal?.type === 'editProject' && <PromptModal title="Rename Project" initialValue={projects.find(p=>p.id===actionModal.targetId)?.name} onSave={executeAction} onCancel={()=>setActionModal(null)} />}
            {actionModal?.type === 'deleteProject' && <ConfirmModal title="Delete Project?" message="Are you sure you want to delete this project? Its tasks will be moved to General." onConfirm={executeAction} onCancel={()=>setActionModal(null)} />}
            {actionModal?.type === 'editSection' && <PromptModal title="Rename Section" initialValue={actionModal.sectionName} onSave={executeAction} onCancel={()=>setActionModal(null)} />}
            {actionModal?.type === 'deleteSection' && <ConfirmModal title="Delete Section?" message={`Delete the section "${actionModal.sectionName}"? Tasks will be moved to General.`} onConfirm={executeAction} onCancel={()=>setActionModal(null)} />}
        </div>
    );
}

// ============================================================================
// TAB 3: FAMILY DASHBOARD (Overview, Docs, Spiritual)
// ============================================================================
function FamilyTab({ spiritualLogs, systemUsers, db, appId, user, tasks, familyDocs, logActivity }) {
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

    // Calculate basic weekly stats
    const tasksCompletedThisWeek = tasks.filter(t => t.completed && t.dueDate && t.dueDate >= currentWeekId).length;
    const tasksPendingThisWeek = tasks.filter(t => !t.completed && t.dueDate && t.dueDate >= currentWeekId && t.dueDate <= getMonday(-1)).length;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl font-black mb-2 tracking-tight">Family Dashboard</h2>
                <p className="text-slate-500 text-lg font-medium">Overview, spiritual routines, and important shared links.</p>
            </header>

            {/* Weekly Overview */}
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

            {/* Spiritual Tracker */}
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

            {/* Important Docs */}
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

// ============================================================================
// TAB 6: KIDS TAB (Management of Kids Tasks, Rewards, etc.)
// ============================================================================
function KidsTab({ leoData, db, appId, user, logActivity, leoStats, tasks, toggleTask, userProfile }) {
    const [newItem, setNewItem] = useState('');
    const [newRewardCost, setNewRewardCost] = useState('');
    const [isPermanentReward, setIsPermanentReward] = useState(false);
    const [newTimeLimit, setNewTimeLimit] = useState('');
    const [activeList, setActiveList] = useState('tasks');
    
    const handleAddKidItem = async (e) => {
        e.preventDefault();
        if(!newItem.trim()) return;
        
        if (activeList === 'tasks') {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
                title: newItem, assignee: 'Leo', projectId: '', section: '',
                dueDate: null, timeLimit: newTimeLimit ? Number(newTimeLimit) : null,
                recurrence: 'none', recurrenceDays: [], recurrenceEndDate: null,
                completed: false, nudged: false, subtasks: [], createdAt: new Date().toISOString(), createdBy: userProfile
            });
            logActivity(`Added task for Leo: "${newItem}"`, userProfile);
            setNewItem('');
            setNewTimeLimit('');
            return;
        }

        if (activeList === 'rewards') {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'leodata'), { 
                type: 'rewards', 
                title: newItem, 
                cost: newRewardCost === '' ? 0 : Number(newRewardCost), 
                status: 'available', 
                isPermanent: isPermanentReward,
                createdAt: new Date().toISOString() 
            });
            setNewRewardCost('');
            setIsPermanentReward(false);
        } else {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'leodata'), { type: activeList, title: newItem, completed: false, createdAt: new Date().toISOString() });
        }
        logActivity(`Added to Leo's ${activeList}: "${newItem}"`, "System");
        setNewItem('');
    };

    const approveReward = async (rewardId) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', rewardId), { status: 'fulfilled' });
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl font-black mb-2 tracking-tight">Kids HQ</h2>
                <p className="text-slate-500 text-lg font-medium">Manage tasks, rewards, and milestones for the little ones.</p>
            </header>

            <section className={cardBaseClasses + " p-8"}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-2xl flex items-center gap-3 tracking-tight"><Star className="w-7 h-7 text-amber-500"/> Leo's Dashboard</h3>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/10 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-sm">
                        <Star className="w-5 h-5 fill-amber-500" /> <span className="font-black text-lg">{leoStats?.stars || 0} Stars Earned</span>
                    </div>
                </div>

                <div className="flex gap-2 mb-8 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-x-auto custom-scrollbar shadow-inner">
                    <button onClick={()=>setActiveList('tasks')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeList==='tasks'?'bg-white dark:bg-slate-800 shadow-sm text-amber-600 scale-[1.02]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Tasks & Chores</button>
                    <button onClick={()=>setActiveList('milestones')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeList==='milestones'?'bg-white dark:bg-slate-800 shadow-sm text-amber-600 scale-[1.02]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Milestones</button>
                    <button onClick={()=>setActiveList('appointments')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeList==='appointments'?'bg-white dark:bg-slate-800 shadow-sm text-amber-600 scale-[1.02]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Appointments</button>
                    <button onClick={()=>setActiveList('restock')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeList==='restock'?'bg-white dark:bg-slate-800 shadow-sm text-amber-600 scale-[1.02]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Needs</button>
                    <button onClick={()=>setActiveList('rewards')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeList==='rewards'?'bg-white dark:bg-slate-800 shadow-sm text-amber-600 scale-[1.02]':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Rewards Shop</button>
                </div>
                
                <form onSubmit={handleAddKidItem} className="flex flex-wrap gap-3 mb-6">
                    <input type="text" value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder={`Add new ${activeList}...`} className={inputBaseClasses + " flex-1 min-w-[200px]"} />
                    
                    {activeList === 'tasks' && (
                        <div className={inputBaseClasses + " flex items-center gap-2 px-3 w-32 !py-0"}>
                            <Timer className="w-5 h-5 text-slate-400"/>
                            <input type="number" value={newTimeLimit} onChange={e=>setNewTimeLimit(e.target.value)} placeholder="Mins (opt)" className="w-full bg-transparent outline-none font-bold placeholder:text-slate-400 py-3 text-sm" />
                        </div>
                    )}

                    {activeList === 'rewards' && (
                        <>
                            <div className={inputBaseClasses + " flex items-center gap-2 px-3 w-28 !py-0"}>
                                <Star className="w-5 h-5 text-amber-500"/>
                                <input type="number" value={newRewardCost} onChange={e=>setNewRewardCost(e.target.value)} placeholder="Cost" className="w-full bg-transparent outline-none font-bold placeholder:text-slate-400 py-3" />
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setIsPermanentReward(!isPermanentReward)}
                                className={`px-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex flex-col items-center justify-center shrink-0 shadow-sm ${isPermanentReward ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/50 dark:border-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/50' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-950 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                                title="Toggle Permanent Reward"
                            >
                                <Repeat className="w-4 h-4 mb-0.5"/>
                                {isPermanentReward ? 'Perm' : 'Once'}
                            </button>
                        </>
                    )}
                    <button type="submit" className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-6 rounded-xl font-bold shadow-md shadow-amber-500/20 hover:shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus className="w-6 h-6"/></button>
                </form>

                <div className="space-y-3">
                    {activeList === 'tasks' ? (
                        <>
                            {tasks.filter(t => t.assignee === 'Leo' && !t.completed).map(task => (
                                <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 group transition-colors hover:border-amber-200 dark:hover:border-amber-800/50">
                                    <button onClick={() => toggleTask(task, userProfile)} className="transform transition-transform active:scale-75"><Circle className="w-6 h-6 text-slate-300 hover:text-amber-500" /></button>
                                    <div className="flex-1 flex flex-col">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{task.title}</span>
                                        {task.timeLimit && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 flex items-center gap-1"><Timer className="w-3 h-3"/> {task.timeLimit} Mins</span>}
                                    </div>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            ))}
                            {tasks.filter(t => t.assignee === 'Leo' && t.completed).map(task => (
                                <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl opacity-50 grayscale group">
                                    <button onClick={() => toggleTask(task, userProfile)}><CheckCircle2 className="w-6 h-6 text-emerald-500" /></button>
                                    <span className="flex-1 font-bold line-through text-slate-500">{task.title}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-2"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            ))}
                        </>
                    ) : activeList === 'rewards' ? (
                        <>
                            {leoData.rewards?.filter(r => r.status === 'pending').map(reward => (
                                <div key={reward.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 bg-gradient-to-r from-rose-50 to-white dark:from-rose-900/20 dark:to-slate-900 shadow-sm animate-in slide-in-from-left-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center">
                                            <Gift className="w-5 h-5 text-rose-500" />
                                        </div>
                                        <span className="font-bold text-rose-800 dark:text-rose-200 text-lg">{reward.title}</span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-rose-500 bg-rose-100 dark:bg-rose-900/50 px-2.5 py-1 rounded-md shadow-sm ml-2">Pending Auth</span>
                                    </div>
                                    <button onClick={() => approveReward(reward.id)} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">Approve</button>
                                </div>
                            ))}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                {leoData.rewards?.filter(r => r.status === 'available').map(reward => (
                                    <div key={reward.id} className="flex flex-col gap-3 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm group hover:border-amber-200 dark:hover:border-amber-800/50 transition-all">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800/50">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500"/>
                                                <span className="font-black text-amber-700 dark:text-amber-400">{reward.cost}</span>
                                            </div>
                                            <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', reward.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-lg text-slate-800 dark:text-slate-200 tracking-tight">{reward.title}</span>
                                            {reward.isPermanent && <span className="text-[10px] uppercase font-black tracking-widest text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded shadow-sm">Perm</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {leoData[activeList]?.filter(i=>!i.completed).map(item => (
                                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 group hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors">
                                    <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id), {completed: true})} className="transform transition-transform active:scale-75"><Circle className="w-6 h-6 text-slate-300 hover:text-indigo-500" /></button>
                                    <span className="flex-1 font-bold text-slate-800 dark:text-slate-200">{item.title}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            ))}
                            {leoData[activeList]?.filter(i=>i.completed).map(item => (
                                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl opacity-50 grayscale group">
                                    <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id), {completed: false})}><CheckCircle2 className="w-6 h-6 text-emerald-500" /></button>
                                    <span className="flex-1 font-bold line-through text-slate-500">{item.title}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-2"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

// ============================================================================
// TAB 4: LOGISTICS (Meals & Groceries)
// ============================================================================
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
                {/* Meal Plan */}
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

                {/* Groceries */}
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

// ============================================================================
// TAB 5: FINANCES (Multiple Incomes, Fixed/Temp Outgoings, Pots)
// ============================================================================
function FinanceTab({ finances, db, appId, user }) {
    const monthId = getCurrentMonthId();
    const currentFinance = finances.find(f => f.id === monthId) || { incomes: [], outgoings: [], pots: [] };
    
    // Forms
    const [newIncomeName, setNewIncomeName] = useState('');
    const [newIncomeAmt, setNewIncomeAmt] = useState('');
    
    const [newOutName, setNewOutName] = useState('');
    const [newOutAmt, setNewOutAmt] = useState('');
    const [newOutType, setNewOutType] = useState('Fixed'); // Fixed or Temporary
    
    const [newPotName, setNewPotName] = useState('');
    const [newPotAlloc, setNewPotAlloc] = useState('');

    const saveFinance = async (updates) => {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'finances', monthId);
        await updateDoc(ref, updates).catch(() => {
            addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'finances'), { ...currentFinance, ...updates }).then(d => {
                 updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'finances', d.id), {id: monthId});
            });
        });
    };

    const addIncome = (e) => {
        e.preventDefault();
        if(!newIncomeName || !newIncomeAmt) return;
        saveFinance({ incomes: [...(currentFinance.incomes||[]), {id: Date.now().toString(), name: newIncomeName, amount: Number(newIncomeAmt)}] });
        setNewIncomeName(''); setNewIncomeAmt('');
    };

    const addOutgoing = (e) => {
        e.preventDefault();
        if(!newOutName || !newOutAmt) return;
        saveFinance({ outgoings: [...(currentFinance.outgoings||[]), {id: Date.now().toString(), name: newOutName, amount: Number(newOutAmt), type: newOutType}] });
        setNewOutName(''); setNewOutAmt('');
    };

    const addPot = (e) => {
        e.preventDefault();
        if(!newPotName) return;
        saveFinance({ pots: [...(currentFinance.pots||[]), {id: Date.now().toString(), name: newPotName, allocated: Number(newPotAlloc)||0, spent: 0}] });
        setNewPotName(''); setNewPotAlloc('');
    };

    const removeItem = (field, id) => {
        saveFinance({ [field]: currentFinance[field].filter(i => i.id !== id) });
    };

    const updatePotSpent = (potId, spentAmt) => {
        const updated = currentFinance.pots.map(p => p.id === potId ? {...p, spent: Number(spentAmt)} : p);
        saveFinance({ pots: updated });
    };

    const totalIncome = (currentFinance.incomes||[]).reduce((sum, i) => sum + i.amount, 0);
    const totalOutgoings = (currentFinance.outgoings||[]).reduce((sum, o) => sum + o.amount, 0);
    const availableForPots = totalIncome - totalOutgoings;
    
    const totalAllocated = (currentFinance.pots||[]).reduce((sum, p) => sum + p.allocated, 0);
    const totalSpent = (currentFinance.pots||[]).reduce((sum, p) => sum + p.spent, 0);
    const leftToAllocate = availableForPots - totalAllocated;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-4xl font-black mb-2 tracking-tight">Finances</h2>
                <p className="text-slate-500 text-lg font-medium">Payday planner: Incomes, outgoings, and pots.</p>
            </header>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-emerald-100/50 dark:border-emerald-900/30 rounded-[2rem] p-8 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl"></div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 relative z-10">Total Income</h3>
                    <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 relative z-10 tracking-tight">£{totalIncome}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-rose-100/50 dark:border-rose-900/30 rounded-[2rem] p-8 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-100 dark:bg-rose-900/20 rounded-full blur-3xl"></div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 relative z-10">Total Outgoings</h3>
                    <p className="text-4xl font-black text-rose-600 dark:text-rose-400 relative z-10 tracking-tight">£{totalOutgoings}</p>
                </div>
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-[2rem] p-8 shadow-lg shadow-violet-500/20 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSIvPjwvc3ZnPg==')] pointer-events-none"></div>
                    <h3 className="text-xs font-black text-violet-200 uppercase tracking-[0.2em] mb-2 relative z-10">Available for Pots</h3>
                    <p className="text-4xl font-black relative z-10 tracking-tight">£{availableForPots}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* INCOMES & OUTGOINGS */}
                <div className="space-y-8">
                    <div className={cardBaseClasses}>
                        <h3 className="font-black text-2xl mb-6 flex items-center gap-3 tracking-tight"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"><Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400"/></div> Income</h3>
                        <form onSubmit={addIncome} className="flex gap-2 mb-6 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                            <input type="text" value={newIncomeName} onChange={e=>setNewIncomeName(e.target.value)} placeholder="Source..." className="flex-1 bg-transparent outline-none text-sm font-bold px-3 placeholder:text-slate-400" />
                            <input type="number" value={newIncomeAmt} onChange={e=>setNewIncomeAmt(e.target.value)} placeholder="£" className="w-20 bg-transparent outline-none text-sm font-bold border-l border-slate-200 dark:border-slate-700 pl-3 placeholder:text-slate-400" />
                            <button type="submit" className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-sm active:scale-95 transition-transform"><Plus className="w-5 h-5"/></button>
                        </form>
                        <div className="space-y-3">
                            {(currentFinance.incomes||[]).map(inc => (
                                <div key={inc.id} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 group transition-colors hover:border-emerald-200 dark:hover:border-emerald-800/50">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{inc.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">£{inc.amount}</span>
                                        <button onClick={()=>removeItem('incomes', inc.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={cardBaseClasses}>
                        <h3 className="font-black text-2xl mb-6 flex items-center gap-3 tracking-tight"><div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl"><ArrowRight className="w-6 h-6 text-rose-600 dark:text-rose-400"/></div> Outgoings</h3>
                        <form onSubmit={addOutgoing} className="flex flex-col gap-3 mb-6 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                            <div className="flex gap-2">
                                <input type="text" value={newOutName} onChange={e=>setNewOutName(e.target.value)} placeholder="Bill / Expense..." className="flex-1 bg-transparent outline-none text-sm font-bold px-2 placeholder:text-slate-400" />
                                <input type="number" value={newOutAmt} onChange={e=>setNewOutAmt(e.target.value)} placeholder="£" className="w-20 bg-transparent outline-none text-sm font-bold border-l border-slate-200 dark:border-slate-700 pl-3 placeholder:text-slate-400" />
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                                <select value={newOutType} onChange={e=>setNewOutType(e.target.value)} className="bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer">
                                    <option value="Fixed">Fixed (Always)</option>
                                    <option value="Temporary">Temporary (This Month)</option>
                                </select>
                                <button type="submit" className="bg-rose-500 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform">Add</button>
                            </div>
                        </form>
                        <div className="space-y-3">
                            {(currentFinance.outgoings||[]).map(out => (
                                <div key={out.id} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 group transition-colors hover:border-rose-200 dark:hover:border-rose-800/50">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{out.name}</span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded w-max">{out.type}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-lg text-rose-600 dark:text-rose-400">£{out.amount}</span>
                                        <button onClick={()=>removeItem('outgoings', out.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* BUDGET POTS */}
                <div className={cardBaseClasses}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
                        <h3 className="font-black text-2xl flex items-center gap-3 tracking-tight"><div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl"><PiggyBank className="w-6 h-6 text-violet-600 dark:text-violet-400"/></div> Budget Pots</h3>
                        <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-right w-full sm:w-auto">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 block mb-1">Left to Allocate</span>
                            <span className={`text-2xl font-black tracking-tight ${leftToAllocate < 0 ? 'text-red-500' : 'text-emerald-500'}`}>£{leftToAllocate}</span>
                        </div>
                    </div>
                    
                    <form onSubmit={addPot} className="flex gap-2 mb-8 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                        <input type="text" value={newPotName} onChange={e=>setNewPotName(e.target.value)} placeholder="Pot name..." className="flex-1 bg-transparent outline-none text-sm font-bold px-3 placeholder:text-slate-400" />
                        <input type="number" value={newPotAlloc} onChange={e=>setNewPotAlloc(e.target.value)} placeholder="£ Alloc" className="w-24 bg-transparent outline-none text-sm font-bold border-l border-slate-200 dark:border-slate-700 pl-3 placeholder:text-slate-400" />
                        <button type="submit" className="bg-violet-500 text-white px-4 py-2 rounded-xl font-bold shadow-sm active:scale-95 transition-transform"><Plus className="w-5 h-5"/></button>
                    </form>

                    <div className="space-y-5">
                        {(currentFinance.pots||[]).map(pot => {
                            const potLeft = pot.allocated - pot.spent;
                            const percentage = Math.min((pot.spent / pot.allocated) * 100 || 0, 100);
                            return (
                                <div key={pot.id} className="flex flex-col p-5 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm gap-4 group hover:shadow transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-lg text-slate-800 dark:text-slate-100 tracking-tight">{pot.name}</span>
                                        <button onClick={()=>removeItem('pots', pot.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 shadow-inner overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                                        <div className={`h-full rounded-full transition-all duration-500 ease-out ${potLeft < 0 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-400 to-violet-500'}`} style={{width: `${percentage}%`}}></div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                                        <div className="flex items-center gap-5">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-0.5">Allocated</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">£{pot.allocated}</span>
                                            </div>
                                            <div className="flex flex-col border-l border-slate-200 dark:border-slate-800 pl-5">
                                                <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-0.5">Spent</span>
                                                <div className="flex items-center gap-0.5">
                                                    <span className="font-bold text-rose-500">£</span>
                                                    <input type="number" value={pot.spent} onChange={e=>updatePotSpent(pot.id, e.target.value)} className="w-14 bg-transparent outline-none font-bold text-rose-500" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest mb-0.5">Remaining</span>
                                            <span className={`font-black text-lg ${potLeft < 0 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>£{potLeft}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// TASK ROW & TASK MODAL
// ============================================================================
function TaskRow({ task, onToggle, onOpen }) {
    const isNudged = task.nudged && !task.completed;
    const isRecurring = task.recurrence && task.recurrence !== 'none';
    
    return (
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer group active:scale-[0.99]
            ${task.completed ? 'bg-slate-50/50 dark:bg-slate-950/50 border-transparent opacity-60 mix-blend-luminosity hover:mix-blend-normal' : isNudged ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border-orange-200 dark:border-orange-800 shadow-sm hover:shadow' : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow'}`}
            onClick={onOpen}
        >
            <div className="flex items-center gap-4 overflow-hidden">
                <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="focus:outline-none transform active:scale-75 transition-transform shrink-0">
                    {task.completed ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className={`w-6 h-6 transition-colors ${isNudged ? 'text-orange-500' : 'text-slate-300 group-hover:text-indigo-400'}`} />}
                </button>
                <div className="flex flex-col overflow-hidden gap-1">
                    <span className={`font-bold truncate text-base ${task.completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</span>
                    {(task.dueDate || task.timeLimit) && !task.completed && (
                        <div className="flex items-center gap-2">
                            {task.dueDate && <span className="text-[10px] font-black tracking-wide uppercase text-indigo-500 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md"><CalendarClock className="w-3 h-3"/> {formatDueDate(task.dueDate)}</span>}
                            {task.timeLimit && <span className="text-[10px] font-black tracking-wide uppercase text-amber-500 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md"><Timer className="w-3 h-3"/> {task.timeLimit}m</span>}
                            {isRecurring && <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md"><Repeat className="w-3 h-3"/></span>}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 ml-3">
                {task.subtasks?.length > 0 && (
                    <span className="text-[10px] font-black uppercase text-slate-400 hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"><ListTodo className="w-3 h-3"/> {task.subtasks.filter(s=>s.completed).length}/{task.subtasks.length}</span>
                )}
                {task.assignee && !task.completed && (
                    <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200/50 dark:border-slate-700/50">{task.assignee}</span>
                )}
            </div>
        </div>
    )
}

function TaskDetailModal({ task, onClose, db, appId, user, comments, userProfile, systemUsers, sendNotification, logActivity }) {
    const [editTitle, setEditTitle] = useState(task.title);
    const [newComment, setNewComment] = useState('');
    const [newSubtask, setNewSubtask] = useState('');

    const updateTask = async (updates) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id), updates);
    };

    const handleNudge = async () => {
        const newNudgeState = !task.nudged;
        await updateTask({ nudged: newNudgeState });
        if(newNudgeState && task.assignee && task.assignee !== userProfile && task.assignee !== 'Both') {
            sendNotification(task.assignee, `NUDGE: ${userProfile} is chasing up on "${task.title}"!`, task.id, 'nudge');
            logActivity(`${userProfile} chased up task: "${task.title}"`, userProfile);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if(!newComment.trim()) return;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), { taskId: task.id, text: newComment, author: userProfile, createdAt: new Date().toISOString() });
        
        // Parse Mentions
        const mentions = systemUsers.filter(u => newComment.includes(`@${u.name}`));
        mentions.forEach(u => {
            if (u.name !== userProfile) {
                sendNotification(u.name, `${userProfile} mentioned you: "${newComment.substring(0,30)}..."`, task.id, 'mention');
            }
        });

        setNewComment('');
    };

    const handleAddSubtask = async (e) => {
        e.preventDefault();
        if(!newSubtask.trim()) return;
        const newSub = { id: Date.now().toString(), title: newSubtask, completed: false };
        await updateTask({ subtasks: [...(task.subtasks || []), newSub] });
        setNewSubtask('');
    };

    const toggleSubtask = async (subId) => {
        const updatedSubs = task.subtasks.map(s => s.id === subId ? {...s, completed: !s.completed} : s);
        await updateTask({ subtasks: updatedSubs });
    };

    const deleteSubtask = async (subId) => {
        const updatedSubs = task.subtasks.filter(s => s.id !== subId);
        await updateTask({ subtasks: updatedSubs });
    };

    const deleteTask = async () => {
        setActionModal({type: 'deleteTask'}); 
    };

    const [actionModal, setActionModal] = useState(null);

    const renderCommentText = (text) => {
        return text.split(' ').map((word, i) => {
            if (word.startsWith('@')) return <span key={i} className="text-amber-300 font-bold bg-black/10 px-1 rounded">{word} </span>;
            return word + ' ';
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] border border-slate-200/50 dark:border-slate-800 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Task Details</span>
                    <div className="flex gap-2">
                        <button onClick={deleteTask} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 className="w-5 h-5"/></button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"><X className="w-5 h-5"/></button>
                    </div>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                    <input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} onBlur={()=>editTitle!==task.title && updateTask({title:editTitle})} className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white w-full border-none focus:ring-0 p-0 mb-8 bg-transparent outline-none tracking-tight leading-tight" />
                    
                    <div className="flex flex-wrap items-center gap-3 mb-10">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm focus-within:border-indigo-500 transition-colors">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</span>
                            <select value={task.assignee || ''} onChange={(e) => updateTask({assignee: e.target.value})} className="bg-transparent text-sm font-bold outline-none cursor-pointer">
                                <option value="">Unassigned</option>
                                {systemUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                <option value="Both">Joint</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm focus-within:border-indigo-500 transition-colors">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><CalendarClock className="w-3 h-3"/> Due</span>
                            <input type="date" value={task.dueDate || ''} onChange={(e) => updateTask({dueDate: e.target.value || null})} className="bg-transparent text-sm font-bold outline-none cursor-pointer" />
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm focus-within:border-indigo-500 transition-colors">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Timer className="w-3 h-3"/> Timer</span>
                            <input type="number" value={task.timeLimit || ''} onChange={(e) => updateTask({timeLimit: e.target.value ? Number(e.target.value) : null})} placeholder="Mins" className="w-16 bg-transparent text-sm font-bold outline-none cursor-pointer" />
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm focus-within:border-indigo-500 transition-colors">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Repeat className="w-3 h-3"/> Repeat</span>
                            <select value={task.recurrence || 'none'} onChange={(e) => updateTask({recurrence: e.target.value, recurrenceDays: []})} className="bg-transparent text-sm font-bold outline-none cursor-pointer">
                                <option value="none">Once</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Biweekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            
                            {(task.recurrence === 'weekly' || task.recurrence === 'biweekly') && (
                                <div className="flex gap-1 ml-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                                    {WEEK_DAYS.map((d, i) => {
                                        const days = task.recurrenceDays || [];
                                        return (
                                            <button key={i} type="button" onClick={(e) => { 
                                                e.preventDefault(); 
                                                const newDays = days.includes(d.v) ? days.filter(day => day !== d.v) : [...days, d.v];
                                                updateTask({recurrenceDays: newDays});
                                            }}
                                                className={`w-6 h-6 rounded-full text-[9px] font-bold transition-all shadow-sm ${days.includes(d.v) ? 'bg-indigo-500 text-white scale-110' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
                                                {d.l}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {task.recurrence !== 'none' && (
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm focus-within:border-indigo-500 transition-colors">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">Recur Until</span>
                                <input type="date" value={task.recurrenceEndDate || ''} onChange={(e) => updateTask({recurrenceEndDate: e.target.value || null})} className="bg-transparent text-sm font-bold outline-none cursor-pointer" />
                            </div>
                        )}

                        <button onClick={handleNudge} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95 ${task.nudged ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-md hover:shadow-orange-500/20'}`}>
                            <Zap className="w-4 h-4"/> {task.nudged ? 'Remove Nudge' : 'Chase Up'}
                        </button>
                    </div>

                    {/* Subtasks */}
                    <div className="mb-10">
                        <h4 className="font-black text-lg mb-4 flex items-center gap-2 tracking-tight"><ListTodo className="w-5 h-5 text-indigo-500"/> Sub-Tasks</h4>
                        <div className="space-y-2.5 mb-4">
                            {task.subtasks?.map(sub => (
                                <div key={sub.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                    <button onClick={()=>toggleSubtask(sub.id)} className="active:scale-75 transition-transform"><Circle className={`w-6 h-6 ${sub.completed ? 'text-emerald-500 fill-emerald-500' : 'text-slate-300'}`}/></button>
                                    <span className={`flex-1 font-bold text-sm ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{sub.title}</span>
                                    <button onClick={()=>deleteSubtask(sub.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><X className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddSubtask} className="flex gap-2">
                            <input type="text" value={newSubtask} onChange={e=>setNewSubtask(e.target.value)} placeholder="Add a sub-task..." className={inputBaseClasses + " flex-1 py-2.5 text-sm"} />
                            <button type="submit" className="bg-slate-800 dark:bg-slate-700 text-white px-5 rounded-xl font-bold active:scale-95 transition-transform shadow-sm"><Plus className="w-4 h-4"/></button>
                        </form>
                    </div>

                    {/* Comments */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                        <h4 className="font-black text-lg mb-6 flex items-center gap-2 tracking-tight"><MessageSquare className="w-5 h-5 text-indigo-500"/> Discussion</h4>
                        <div className="space-y-6">
                            {comments.filter(c=>c.taskId === task.id).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).map(c => (
                                <div key={c.id} className={`flex flex-col ${c.author === userProfile ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-2">{c.author}</span>
                                    <div className={`px-5 py-3.5 rounded-[1.5rem] max-w-[85%] text-sm font-medium shadow-sm leading-relaxed ${c.author === userProfile ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200/50 dark:border-slate-700/50'}`}>
                                        {renderCommentText(c.text)}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 mt-1.5 px-2">{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleAddComment} className="p-4 sm:p-6 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800 flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-10">
                    <input type="text" value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Type a comment (@Name to tag)..." className="flex-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 px-5 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 shadow-inner" />
                    <button type="submit" disabled={!newComment.trim()} className="bg-indigo-600 text-white px-6 rounded-2xl font-bold disabled:opacity-50 hover:bg-indigo-700 active:scale-95 transition-all shadow-md"><ArrowRight className="w-5 h-5"/></button>
                </form>
            </div>

            {actionModal?.type === 'deleteTask' && (
                <ConfirmModal title="Delete Task?" message="Delete this task completely? This cannot be undone." onConfirm={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id)); onClose(); }} onCancel={()=>setActionModal(null)} />
            )}
        </div>
    )
}

// ============================================================================
// UTILITY OVERLAYS & MODALS
// ============================================================================
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
