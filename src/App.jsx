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
  Timer, Play, Pause, FileText, Link as LinkIcon, Volume2, Send, CloudSun, Smile
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

// UI Design Tokens matching FamilyWall (Warm, Friendly, Soft Purple Primary, rounded-2xl & 3xl)
const inputBaseClasses = "bg-violet-50/50 dark:bg-slate-800/60 border border-violet-100 dark:border-slate-700/50 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm placeholder:text-slate-400 text-slate-800 dark:text-slate-100 text-sm font-medium";
const cardBaseClasses = "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-[0_10px_35px_-5px_rgba(109,40,217,0.04)] dark:shadow-[0_12px_40px_-5px_rgba(0,0,0,0.3)]";

// ============================================================================
// 3. CORE APPLICATION
// ============================================================================
export default function SanctuaryOS() {
  const [user, setUser] = useState(null);
  const [activeProfile, setActiveProfile] = useState(localStorage.getItem('sanctuary_profile') || null);
  const [pendingProfile, setPendingProfile] = useState(null); 
  const [activeTab, setActiveTab] = useState('wall'); // 'wall' (FamilyWall dashboard feed), 'tasks', 'projects', 'family', 'kids', 'logistics', 'finance'
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
  const [familyPosts, setFamilyPosts] = useState([]); // Interactive wall feed messages

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
      onSnapshot(collection(db, ...basePath, 'family_posts'), (snap) => setFamilyPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
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
            else setActiveTab('tasks');
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
  if (!user) return <div className="min-h-screen flex items-center justify-center bg-violet-50 dark:bg-slate-950 text-violet-600 font-bold">Loading Sanctuary...</div>;

  if (!activeProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-violet-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 p-6 selection:bg-violet-500/30">
        <div className="w-20 h-20 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-violet-500/30 mb-8 animate-in fade-in zoom-in duration-500">
            <Star className="w-10 h-10 text-white fill-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight text-center">Sanctuary OS</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-12 text-center text-sm md:text-base">A premium virtual home environment for your family.</p>
        
        <h2 className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-[0.2em] mb-6">Select Household Member</h2>
        <div className="flex flex-wrap justify-center gap-6 max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
          {systemUsers.map(u => (
            <button key={u.id} onClick={() => attemptLogin(u)} className={`group relative w-32 h-36 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${u.role === 'Child' ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-transparent text-white shadow-amber-500/25' : 'bg-white dark:bg-slate-900 border-violet-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-violet-400 dark:hover:border-violet-500 shadow-sm'}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black transition-transform duration-300 group-hover:scale-110 ${u.role === 'Child' ? 'bg-white/20' : 'bg-violet-50 dark:bg-slate-800 text-violet-600 dark:text-violet-300'}`}>
                {u.name.charAt(0)}
              </div>
              <span className="font-bold tracking-wide text-sm">{u.name}</span>
            </button>
          ))}
        </div>

        {/* PIN MODAL */}
        {pendingProfile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-violet-500"/>
                    </div>
                    <h3 className="text-2xl font-black mb-2 dark:text-white">Enter PIN</h3>
                    <p className="text-slate-500 font-medium mb-8">Access restricted to {pendingProfile}</p>
                    <input 
                        type="password" autoFocus maxLength={4} placeholder="••••"
                        className="w-full text-center text-4xl tracking-[0.7em] font-black bg-slate-50 dark:bg-slate-950 border border-violet-100 dark:border-slate-800 rounded-2xl py-5 mb-6 outline-none focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all dark:text-white shadow-inner"
                        onChange={(e) => {
                            if(e.target.value === '1234') { // Default Hardcoded PIN
                                setActiveProfile(pendingProfile);
                                localStorage.setItem('sanctuary_profile', pendingProfile);
                                setPendingProfile(null);
                            }
                        }}
                    />
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-8">Default PIN: 1234</p>
                    <button onClick={() => setPendingProfile(null)} className="text-slate-400 font-bold hover:text-slate-700 dark:hover:text-white transition-colors text-sm">Cancel</button>
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-violet-500/30">
      
      {/* NAVIGATION SIDEBAR / BAR */}
      <nav className="w-full lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 flex-shrink-0 fixed bottom-0 lg:static z-20 flex lg:flex-col justify-around lg:justify-start p-3 lg:p-6 shadow-[0_-8px_30px_rgba(109,40,217,0.03)] lg:shadow-none">
        
        {/* LOGO AREA */}
        <div className="hidden lg:flex mb-10 px-2 items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Star className="w-6 h-6 text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight leading-none bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-300 bg-clip-text text-transparent">Sanctuary</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Our Family Space</span>
          </div>
        </div>
        
        {/* FAMILY CIRCLE PANEL */}
        <div className="hidden lg:block mb-8 px-2">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Family Members</h4>
            <div className="flex flex-col gap-2.5">
                {systemUsers.map(u => (
                    <div 
                        key={u.id} 
                        className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${u.name === activeProfile ? 'bg-violet-50/50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/50' : 'border-transparent'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm border ${u.role === 'Child' ? 'bg-amber-400 text-white border-amber-300' : 'bg-violet-100 dark:bg-slate-800 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-slate-700'}`}>
                                {u.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-700 dark:text-slate-200">{u.name}</span>
                                <span className="text-[9px] font-bold text-slate-400">{u.role}</span>
                            </div>
                        </div>
                        {u.name === activeProfile ? (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        ) : (
                            <button onClick={() => attemptLogin(u)} className="text-[10px] font-bold text-violet-500 hover:underline">Switch</button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* NAV ITEMS */}
        <div className="flex lg:flex-col w-full gap-1 lg:gap-3 justify-between lg:justify-start">
          <NavItem icon={<Home/>} label="The Wall" active={activeTab==='wall'} onClick={()=>setActiveTab('wall')} color="text-violet-500" bgColor="bg-violet-50/60 dark:bg-violet-500/10" />
          <NavItem icon={<ListTodo/>} label="Tasks" active={activeTab==='tasks'} onClick={()=>setActiveTab('tasks')} color="text-sky-500" bgColor="bg-sky-50 dark:bg-sky-500/10" />
          <NavItem icon={<Briefcase/>} label="Projects" active={activeTab==='projects'} onClick={()=>setActiveTab('projects')} color="text-indigo-500" bgColor="bg-indigo-50 dark:bg-indigo-500/10" />
          <NavItem icon={<Users/>} label="Spiritual" active={activeTab==='family'} onClick={()=>setActiveTab('family')} color="text-teal-500" bgColor="bg-teal-50 dark:bg-teal-500/10" />
          <NavItem icon={<ShoppingCart/>} label="Logistics" active={activeTab==='logistics'} onClick={()=>setActiveTab('logistics')} color="text-rose-500" bgColor="bg-rose-50 dark:bg-rose-500/10" />
          <NavItem icon={<Wallet/>} label="Finances" active={activeTab==='finance'} onClick={()=>setActiveTab('finance')} color="text-emerald-500" bgColor="bg-emerald-50 dark:bg-emerald-500/10" />
          <NavItem icon={<Gamepad2/>} label="Kids Room" active={activeTab==='kids'} onClick={()=>setActiveTab('kids')} color="text-amber-500" bgColor="bg-amber-50 dark:bg-amber-500/10" />
        </div>

        {/* LOGOUT AREA */}
        <div className="hidden lg:flex mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/80 flex-col gap-4 px-2">
           <button 
               onClick={() => { setActiveProfile(null); localStorage.removeItem('sanctuary_profile'); }} 
               className="flex items-center gap-3 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors text-xs font-bold"
           >
               <Lock className="w-4 h-4"/> Lock Sanctuary
           </button>
        </div>
      </nav>

      {/* MOBILE HEADER */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80 z-10 lg:hidden flex items-center justify-between px-5">
          <div className="font-black text-lg flex items-center gap-2.5 tracking-tight">
              <Star className="w-5 h-5 text-violet-500 fill-violet-500" />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Sanctuary</span>
          </div>
          <div className="flex gap-4 items-center">
              <button onClick={() => setShowActivity(true)} className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"><History className="w-5 h-5"/></button>
              <button onClick={() => setShowNotifications(true)} className="relative text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                  <BellRing className="w-5 h-5"/>
                  {unreadCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </button>
              <button onClick={() => setShowSettings(true)} className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"><Settings className="w-5 h-5"/></button>
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-violet-600 dark:text-violet-300 border border-violet-200/50" onClick={() => { setActiveProfile(null); localStorage.removeItem('sanctuary_profile'); }}>{activeProfile.charAt(0)}</div>
          </div>
      </div>

      {/* DESKTOP HEADER ACTIONS */}
      <div className="hidden lg:flex fixed top-6 right-8 z-20 gap-3 items-center">
          <button onClick={() => setShowActivity(true)} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.02)] transition-all" title="Activity Log"><History className="w-5 h-5" /></button>
          <button onClick={() => setShowSettings(true)} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.02)] transition-all"><Settings className="w-5 h-5" /></button>
          <button onClick={() => setShowNotifications(true)} className="relative p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.02)] transition-all">
              <BellRing className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
          </button>
      </div>

      {/* WORKSPACE AREA */}
      <main className="flex-1 pt-20 lg:pt-10 p-4 lg:p-12 pb-28 lg:pb-14 overflow-y-auto h-screen relative">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'wall' && <FamilyWallTab tasks={tasks} userProfile={activeProfile} posts={familyPosts} onOpenTask={setSelectedTask} db={db} appId={appId} user={user} toggleTask={(t)=>toggleTask(t, activeProfile)} sendNotification={sendNotification} logActivity={logActivity} systemUsers={systemUsers} leoData={leoData} setActiveTab={setActiveTab} meals={meals} />}
          {activeTab === 'tasks' && <PulseTab tasks={tasks} userProfile={activeProfile} onOpenTask={setSelectedTask} db={db} appId={appId} user={user} toggleTask={(t)=>toggleTask(t, activeProfile)} sendNotification={sendNotification} logActivity={logActivity} systemUsers={systemUsers} leoData={leoData} />}
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
    <button onClick={onClick} className={`flex flex-col lg:flex-row items-center lg:justify-start gap-1 lg:gap-3.5 p-1.5 lg:p-3.5 rounded-2xl transition-all duration-200 w-full group ${active ? `${bgColor} shadow-sm` : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400'}`}>
      <div className={`transition-transform duration-200 group-active:scale-90 ${active ? color : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
        {React.cloneElement(icon, { className: 'w-5 h-5 lg:w-[1.35rem] lg:h-[1.35rem]' })}
      </div>
      <span className={`text-[10px] lg:text-sm font-bold transition-colors ${active ? 'text-slate-900 dark:text-white' : ''}`}>{label}</span>
    </button>
  );
}

// ============================================================================
// NEW TAB: THE MAIN FAMILY WALL FEED (Matches FamilyWall Core Interface)
// ============================================================================
function FamilyWallTab({ tasks, userProfile, posts, onOpenTask, db, appId, user, toggleTask, sendNotification, logActivity, systemUsers, leoData, setActiveTab, meals }) {
    const [newPostText, setNewPostText] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('❤️');
    
    const activeTasks = tasks.filter(t => !t.completed && (t.assignee === userProfile || t.assignee === 'Both'));
    const shoppingListCount = tasks.filter(t => !t.completed && t.section === 'General').length;

    const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const weekId = getMonday(0);
    const todayMeal = meals.find(m => m.day === todayDay && m.weekId === weekId)?.text || "Nothing planned yet";

    const emojis = ['❤️', '👍', '🎉', '🌟', '🥘', '🧺', '🐾', '📅'];

    const handlePublishPost = async (e) => {
        e.preventDefault();
        if(!newPostText.trim() || !user) return;
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'family_posts'), {
            author: userProfile,
            text: newPostText.trim(),
            emoji: selectedEmoji,
            likes: [],
            createdAt: new Date().toISOString()
        });
        logActivity(`Posted on the Family Wall: "${newPostText.trim()}"`, userProfile);
        setNewPostText('');
    };

    const handleLikePost = async (post) => {
        const likes = post.likes || [];
        const updatedLikes = likes.includes(userProfile) ? likes.filter(l => l !== userProfile) : [...likes, userProfile];
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_posts', post.id), { likes: updatedLikes });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* GREETING PANEL */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-800 dark:to-indigo-900 text-white rounded-[2.2rem] p-6 lg:p-8 shadow-xl shadow-violet-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCkiLz48L3N2Zz4=')] pointer-events-none"></div>
                
                <div className="space-y-2 relative z-10">
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight">Hello, {userProfile}! 👋</h2>
                    <p className="text-violet-100 font-medium text-sm lg:text-base">Welcome back to the Stevens Family Sanctuary.</p>
                </div>

                {/* Live Info Widget */}
                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-inner relative z-10 shrink-0">
                    <CloudSun className="w-10 h-10 text-amber-200 fill-amber-200/20" />
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-white leading-none">21°C • Sunny</span>
                        <span className="text-[10px] font-bold text-violet-100 uppercase tracking-wider mt-1">Romford, UK</span>
                    </div>
                </div>
            </div>

            {/* QUICK DASHBOARD MODULE BUTTONS (Emulates FamilyWall's cozy circle menu) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <WallQuickCard icon={<ListTodo className="w-6 h-6" />} label="Task List" activeCount={activeTasks.length} onClick={() => setActiveTab('tasks')} color="text-sky-500 bg-sky-50 dark:bg-sky-950/40" hoverColor="hover:border-sky-200" />
                <WallQuickCard icon={<Briefcase className="w-6 h-6" />} label="Projects" onClick={() => setActiveTab('projects')} color="text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" hoverColor="hover:border-indigo-200" />
                <WallQuickCard icon={<Utensils className="w-6 h-6" />} label="Meal Plan" extraText={todayMeal} onClick={() => setActiveTab('logistics')} color="text-rose-500 bg-rose-50 dark:bg-rose-950/40" hoverColor="hover:border-rose-200" />
                <WallQuickCard icon={<ShoppingCart className="w-6 h-6" />} label="Grocery Store" onClick={() => setActiveTab('logistics')} color="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" hoverColor="hover:border-emerald-200" />
                <WallQuickCard icon={<Wallet className="w-6 h-6" />} label="Finance Hub" onClick={() => setActiveTab('finance')} color="text-violet-500 bg-violet-50 dark:bg-violet-950/40" hoverColor="hover:border-violet-200" />
                <WallQuickCard icon={<Gamepad2 className="w-6 h-6" />} label="Kid's Corner" onClick={() => setActiveTab('kids')} color="text-amber-500 bg-amber-50 dark:bg-amber-950/40" hoverColor="hover:border-amber-200" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* INTERACTIVE FAMILY POST WALL (Left & Center) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* WRITE TO WALL PANEL */}
                    <div className={cardBaseClasses + " p-6"}>
                        <h3 className="font-black text-slate-800 dark:text-white text-lg mb-4 flex items-center gap-2">
                            <Smile className="w-5 h-5 text-violet-500" /> Post on the Family Wall
                        </h3>
                        <form onSubmit={handlePublishPost} className="space-y-4">
                            <textarea 
                                value={newPostText} 
                                onChange={e => setNewPostText(e.target.value)} 
                                placeholder="Type a message, chore, reminder, or just check in..." 
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 resize-none h-24"
                                required
                            />
                            
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Tag Icon</span>
                                    {emojis.map(emo => (
                                        <button 
                                            key={emo} 
                                            type="button" 
                                            onClick={() => setSelectedEmoji(emo)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-transform active:scale-90 ${selectedEmoji === emo ? 'bg-violet-100 dark:bg-violet-950 border border-violet-300 dark:border-violet-700 scale-110 shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        >
                                            {emo}
                                        </button>
                                    ))}
                                </div>
                                <button type="submit" className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg shadow-violet-500/20 active:scale-95 transition-all flex items-center gap-2 text-sm">
                                    <Send className="w-4 h-4" /> Share
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* WALL FEED LIST */}
                    <div className="space-y-4">
                        {posts.length === 0 ? (
                            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <Smile className="w-12 h-12 text-violet-300 mx-auto mb-3" />
                                <p className="font-bold text-slate-500">The wall is empty!</p>
                                <p className="text-slate-400 text-xs mt-1">Be the first to post something nice.</p>
                            </div>
                        ) : (
                            [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(post => {
                                const isLiked = post.likes?.includes(userProfile);
                                return (
                                    <div key={post.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2.2rem] p-6 shadow-sm flex gap-4 animate-in slide-in-from-bottom-3 duration-300">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base shadow-sm shrink-0 bg-violet-50 dark:bg-slate-800 text-violet-600 dark:text-violet-300 border border-violet-200/50">
                                            {post.author?.charAt(0)}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-slate-800 dark:text-slate-100">{post.author}</span>
                                                    <span className="text-lg">{post.emoji}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">{post.text}</p>
                                            
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/60">
                                                <div className="flex items-center gap-4">
                                                    <button 
                                                        onClick={() => handleLikePost(post)}
                                                        className={`flex items-center gap-1.5 text-xs font-bold transition-all active:scale-90 ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >
                                                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                                                        {post.likes?.length || 0}
                                                    </button>
                                                </div>
                                                {post.author === userProfile && (
                                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_posts', post.id))} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                </div>

                {/* SIDE COLUMN GLANCE WIDGETS (Right Panel) */}
                <div className="space-y-6">
                    
                    {/* TODAY'S FOCUS TASK / NUDGE */}
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-slate-900/60 dark:to-violet-950/30 border border-violet-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                        <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-indigo-500 fill-indigo-100 dark:fill-transparent" /> Today's Agenda
                        </h3>
                        {activeTasks.length === 0 ? (
                            <p className="text-xs font-bold text-slate-400 py-4 italic text-center">No active chores or tasks scheduled today!</p>
                        ) : (
                            <div className="space-y-3">
                                {activeTasks.slice(0, 3).map(task => (
                                    <div key={task.id} onClick={() => onOpenTask(task)} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:border-violet-300 transition-colors cursor-pointer flex justify-between items-center shadow-sm">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{task.title}</span>
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                ))}
                                {activeTasks.length > 3 && (
                                    <button onClick={() => setActiveTab('tasks')} className="text-xs font-black text-violet-500 hover:underline w-full text-center mt-2">See remaining {activeTasks.length - 3} tasks</button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* DINNER MENU COMPONENT */}
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-slate-900/60 dark:to-rose-950/20 border border-rose-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                        <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Utensils className="w-5 h-5 text-rose-500" /> Tonight's Kitchen
                        </h3>
                        <div className="bg-white dark:bg-slate-900 border border-rose-50 dark:border-slate-800 rounded-2xl p-4 text-center shadow-sm">
                            <p className="font-black text-sm text-rose-700 dark:text-rose-400 leading-snug mb-1">{todayMeal}</p>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{todayDay}'s Menu</span>
                        </div>
                        <button onClick={() => setActiveTab('logistics')} className="text-xs font-black text-rose-500 hover:underline w-full text-center mt-4">Adjust Meal Planner &rarr;</button>
                    </div>

                    {/* LEO'S REWARD STATUS GLANCE */}
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-slate-900/60 dark:to-amber-950/20 border border-amber-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm">
                        <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500/20" /> Kid's Quests Progress
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-amber-100/50 dark:border-slate-800 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-400 text-white font-black text-sm flex items-center justify-center">L</div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">Leo</span>
                                    <span className="text-[10px] font-bold text-slate-400">Child User</span>
                                </div>
                            </div>
                            <span className="font-black text-amber-600 text-sm bg-amber-100/50 dark:bg-amber-900/40 px-3 py-1.5 rounded-xl">{leoStats.stars || 0} ⭐ Stars</span>
                        </div>
                        <button onClick={() => setActiveTab('kids')} className="text-xs font-black text-amber-500 hover:underline w-full text-center mt-4">Manage Rewards &rarr;</button>
                    </div>

                </div>

            </div>

        </div>
    );
}

function WallQuickCard({ icon, label, activeCount, extraText, onClick, color, hoverColor }) {
    return (
        <button onClick={onClick} className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-[2rem] flex flex-col items-center justify-center text-center gap-3 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)] transition-all hover:scale-[1.03] active:scale-95 ${hoverColor}`}>
            <div className={`p-3.5 rounded-full ${color} shadow-sm`}>{icon}</div>
            <div className="flex flex-col items-center gap-0.5">
                <span className="font-black text-xs text-slate-700 dark:text-slate-200 tracking-tight">{label}</span>
                {activeCount !== undefined && (
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{activeCount} active</span>
                )}
                {extraText && (
                    <span className="text-[9px] font-bold text-slate-400 truncate max-w-[100px]">{extraText}</span>
                )}
            </div>
        </button>
    )
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
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'stats', 'leo'), { stars: stats.stars - reward.cost });
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', reward.id), { status: 'pending' });
    };

    const fulfilledRewards = rewardsData?.filter(r => r.status === 'fulfilled') || [];
    const acknowledgeReward = async (id, isPermanent) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', id), { status: isPermanent ? 'available' : 'archived' });
    };

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
        <div className="min-h-screen bg-gradient-to-br from-violet-500 to-indigo-600 p-4 md:p-8 flex flex-col font-sans relative overflow-hidden selection:bg-white/30">
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-950/85 backdrop-blur-md p-4 animate-in zoom-in duration-500">
                    <div className="bg-white rounded-[3.2rem] p-12 max-w-lg w-full text-center shadow-2xl border-b-8 border-emerald-200 relative overflow-hidden">
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

            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 relative z-10">
                <button onClick={() => setShowRewards(false)} className="text-4xl md:text-5xl font-black text-white drop-shadow-lg flex items-center gap-4 hover:scale-105 transition-transform tracking-tight">
                    <Gamepad2 className="w-12 h-12 md:w-14 md:h-14 opacity-90 animate-pulse" /> Leo's {showRewards ? 'Rewards' : 'Mission Board'}
                </button>
                <button ref={starCounterRef} onClick={() => setShowRewards(!showRewards)} className="bg-white/20 backdrop-blur-xl border border-white/40 px-8 py-4 rounded-[2.2rem] flex items-center gap-4 shadow-xl shadow-indigo-900/20 hover:bg-white/30 transition-all cursor-pointer group hover:-translate-y-1">
                    <Star className="w-10 h-10 md:w-12 md:h-12 text-yellow-300 fill-yellow-300 group-hover:rotate-12 duration-200 drop-shadow" />
                    <span className="text-3xl md:text-4xl font-black text-white tracking-tight">{stats.stars || 0} Stars</span>
                </button>
            </header>

            <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar px-2">
                {!showRewards ? (
                    leoTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-300 blur-3xl opacity-30 rounded-full animate-pulse"></div>
                                <Award className="w-48 h-48 text-yellow-300 mb-8 drop-shadow-2xl relative z-10" />
                            </div>
                            <h2 className="text-6xl font-black text-white drop-shadow-lg mb-6 tracking-tight">You finished!</h2>
                            <p className="text-2xl text-sky-100 font-bold drop-shadow-sm">All quests done. Amazing job today!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto pb-24">
                            {leoTasks.map(task => (
                                <div key={task.id} className="bg-white/95 backdrop-blur-sm rounded-[2.8rem] p-8 md:p-10 shadow-2xl shadow-indigo-950/25 flex flex-col gap-8 border-b-8 border-slate-200 animate-in slide-in-from-bottom-8">
                                    <span className="text-3xl md:text-4xl font-black text-slate-800 text-center leading-tight tracking-tight">{task.title}</span>
                                    
                                    {task.timeLimit ? (
                                        <button onClick={() => setActiveTimerTask(task)} className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-[2.2rem] h-20 flex items-center justify-center gap-4 text-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all border-b-4 border-amber-600 active:border-b-0 active:translate-y-1">
                                            <Timer className="w-8 h-8 animate-spin-slow" /> Start Quest ({task.timeLimit}m)
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
                            <div key={reward.id} className="bg-white/95 backdrop-blur-sm rounded-[2.8rem] p-8 shadow-2xl shadow-indigo-950/20 border-b-8 border-slate-200 flex flex-col items-center text-center gap-4 relative animate-in zoom-in-95">
                                {reward.isPermanent && (
                                    <div className="absolute top-6 right-6 bg-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-1 shadow-sm">
                                        <Repeat className="w-4 h-4" /> Keep
                                    </div>
                                )}
                                <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mb-2">
                                    <Gift className="w-12 h-12 text-rose-500 drop-shadow-sm" />
                                </div>
                                <span className="text-2xl font-black text-slate-800 tracking-tight leading-tight px-4">{reward.title}</span>
                                
                                {reward.status === 'pending' ? (
                                    <div className="bg-slate-100 text-slate-500 px-8 py-4 rounded-2xl font-bold text-lg w-full mt-4 border-2 border-dashed border-slate-300">
                                        Waiting for Parents...
                                    </div>
                                ) : (
                                    <div className="w-full mt-4">
                                        <button 
                                            disabled={stats.stars < reward.cost}
                                            onClick={() => redeemReward(reward)}
                                            className={`w-full py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all ${stats.stars >= reward.cost ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 text-white shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed border-b-4 border-slate-300'}`}
                                        >
                                            <Star className={`w-7 h-7 ${stats.stars >= reward.cost ? 'fill-yellow-300 text-yellow-100 drop-shadow-md' : 'fill-slate-300 text-slate-300'}`}/> 
                                            {reward.cost === 0 ? 'Free!' : `${reward.cost} Stars`}
                                        </button>
                                        
                                        <div className="w-full bg-slate-100 rounded-full h-4 mt-6 mb-2 overflow-hidden shadow-inner border border-slate-200">
                                            <div className={`h-full rounded-full transition-all duration-700 ease-out ${progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">
                                            {starsNeeded > 0 ? `Need ${starsNeeded} more star${starsNeeded>1?'s':''}` : 'Ready to buy!'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )})}
                        {rewardsData?.filter(r => r.status === 'available' || r.status === 'pending').length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center text-center text-white bg-white/10 backdrop-blur-xl rounded-[2.2rem] p-16 border border-white/20">
                                <ShoppingCart className="w-16 h-16 text-white/50 mb-6" />
                                <span className="text-2xl font-black tracking-tight">No rewards listed in shop!</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button onClick={onLogout} className="absolute bottom-8 left-8 bg-white/20 hover:bg-white/30 text-white px-8 py-3.5 rounded-full font-bold backdrop-blur-xl transition-colors z-20 flex items-center gap-3 shadow-lg border border-white/20 tracking-wide">
                <Lock className="w-4 h-4" /> Lock Tablet
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
            const voices = window.speechSynthesis.getVoices();
            if(voices.length > 0) utterance.voice = voices.find(v => v.lang.includes('en')) || voices[0];
            utterance.rate = 0.95;
            utterance.pitch = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

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
    const radius = 130;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;

    return (
        <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-300">
            <button onClick={onCancel} className="absolute top-10 left-10 text-slate-400 hover:text-white flex items-center gap-2 font-bold text-xl transition-colors">
                <X className="w-8 h-8" /> Cancel
            </button>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-16 text-center tracking-tight px-6">{task.title}</h2>

            <div className="relative w-[300px] h-[300px] md:w-[380px] md:h-[380px] flex items-center justify-center mb-16">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r={radius} className="stroke-slate-900" strokeWidth="20" fill="none" />
                    <circle 
                        cx="50%" cy="50%" r={radius} 
                        className={`transition-all duration-1000 ease-linear ${timeLeft === 0 ? 'stroke-rose-500' : 'stroke-amber-400'}`} 
                        strokeWidth="20" fill="none" strokeLinecap="round"
                        style={{ strokeDasharray: circumference, strokeDashoffset }} 
                    />
                </svg>
                <div className="relative flex flex-col items-center">
                    <span className={`text-6xl md:text-7xl font-black tracking-tighter ${timeLeft === 0 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-2 mt-2 text-slate-500 font-bold uppercase tracking-widest text-xs">
                        <Volume2 className="w-4 h-4" /> Voice Guidance
                    </div>
                </div>
            </div>

            <div className="flex gap-6">
                {timeLeft > 0 && (
                    <button onClick={toggleTimer} className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-90 ${isRunning ? 'bg-slate-800 text-white' : 'bg-emerald-500 text-white shadow-[0_0_35px_rgba(16,185,129,0.35)]'}`}>
                        {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>
                )}
                <button onClick={onComplete} className="w-20 h-20 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-400 transition-transform active:scale-90 shadow-[0_0_35px_rgba(99,102,241,0.35)]">
                    <Check className="w-10 h-10" strokeWidth={3} />
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
        let newX = e.clientX - trackRect.left - 40; 
        newX = Math.max(0, Math.min(newX, trackRect.width - 80)); 
        setOffset(newX);
    };
    
    const handlePointerUp = (e) => {
        if(!isDragging || completed || !trackRef.current) return;
        setIsDragging(false);
        const trackWidth = trackRef.current.getBoundingClientRect().width;
        if(offset > trackWidth * 0.70) { 
            setOffset(trackWidth - 80);
            setCompleted(true);
            const thumbRect = thumbRef.current.getBoundingClientRect();
            onComplete(e, thumbRect.left + thumbRect.width/2, thumbRect.top + thumbRect.height/2);
        } else {
            setOffset(0);
        }
        e.target.releasePointerCapture(e.pointerId);
    };

    return (
        <div ref={trackRef} className="bg-slate-100 border-4 border-slate-200 rounded-[2.2rem] h-20 w-full relative flex items-center overflow-hidden shadow-inner select-none touch-none">
            <span className="absolute w-full text-center text-slate-400 font-black text-sm pointer-events-none pl-16 pr-4 uppercase tracking-[0.15em]">
                Slide to complete &rarr;
            </span>
            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-300 to-emerald-400 transition-none" style={{ width: offset + 40 }}></div>
            <div 
                ref={thumbRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ transform: `translateX(${offset}px)` }}
                className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center absolute left-0 top-[-4px] cursor-grab shadow-lg z-10 border-b-4 transition-all ${isDragging ? 'bg-amber-300 border-amber-500 scale-105' : 'bg-amber-400 border-amber-600'}`}
            >
                <Star className="w-10 h-10 text-white fill-white" />
            </div>
        </div>
    );
}

// ============================================================================
// TAB 1: THE PULSE (Tasks List)
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="mb-2">
                <h2 className="text-3xl font-black mb-1 tracking-tight">Tasks & Chores</h2>
                <p className="text-slate-500 text-sm font-medium">Coordinate your home missions and repetitive schedule.</p>
            </header>

            {/* PENDING REWARDS FROM LEO */}
            {pendingRewards.length > 0 && (
                <div className="space-y-3">
                    {pendingRewards.map(reward => (
                        <div key={reward.id} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/40 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 text-sm"><Gift className="w-5 h-5"/> Reward Claim Request</h3>
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mt-1">Leo wishes to exchange <strong className="font-black">{reward.cost} stars</strong> for <strong>{reward.title}</strong>.</p>
                            </div>
                            <button onClick={() => {
                                updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', reward.id), { status: 'fulfilled' });
                                logActivity(`Approved reward: "${reward.title}"`, userProfile);
                            }} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 w-full sm:w-auto hover:scale-105 active:scale-95 transition-all">Approve Claim</button>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleAdd} className={cardBaseClasses + " flex flex-col gap-4"}>
                <input type="text" value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Add a new task..." className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-xl px-5 py-3.5 outline-none dark:text-white border border-transparent focus:border-violet-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-violet-500/5 transition-all text-sm shadow-inner placeholder:text-slate-400 font-medium" />
                
                <div className="flex flex-wrap gap-2.5 items-center">
                    <select value={newAssignee} onChange={e=>setNewAssignee(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-xl px-3 py-2 outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                        {systemUsers.map(u => <option key={u.id} value={u.name}>Assign: {u.name}</option>)}
                        <option value="Both">Joint Assignee</option>
                        <option value="">No Assignee</option>
                    </select>
                    
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <CalendarClock className="w-4 h-4 text-slate-400"/>
                        <input type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} className="bg-transparent outline-none cursor-pointer" />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700/60 w-28 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <Timer className="w-4 h-4 text-slate-400"/>
                        <input type="number" value={newTimeLimit} onChange={e=>setNewTimeLimit(e.target.value)} placeholder="Timer (m)" className="w-full bg-transparent outline-none placeholder:text-slate-400" />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <Repeat className="w-4 h-4 text-slate-400"/>
                        <select value={newRecurrence} onChange={e=>{setNewRecurrence(e.target.value); setNewRecurrenceDays([]);}} className="bg-transparent outline-none cursor-pointer">
                            <option value="none">Once</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Biweekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    
                    {(newRecurrence === 'weekly' || newRecurrence === 'biweekly') && (
                        <div className="flex gap-1 ml-1 pl-3 border-l border-slate-200 dark:border-slate-700">
                            {WEEK_DAYS.map((d, i) => (
                                <button key={i} type="button" onClick={(e) => { e.preventDefault(); if(newRecurrenceDays.includes(d.v)) setNewRecurrenceDays(newRecurrenceDays.filter(day => day !== d.v)); else setNewRecurrenceDays([...newRecurrenceDays, d.v]); }}
                                    className={`w-7 h-7 rounded-full text-[10px] font-black transition-all ${newRecurrenceDays.includes(d.v) ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                    {d.l}
                                </button>
                            ))}
                        </div>
                    )}

                    {newRecurrence !== 'none' && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400">Until</span>
                            <input type="date" value={newRecurEndDate} onChange={e=>setNewRecurEndDate(e.target.value)} className="bg-transparent outline-none cursor-pointer" />
                        </div>
                    )}
                    
                    <div className="flex-1"></div>
                    <button type="submit" className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md shadow-violet-500/10 hover:shadow-lg hover:scale-105 active:scale-95 transition-all">Add Task</button>
                </div>
            </form>

            {nudgedTasks.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/10 dark:to-orange-950/10 border border-amber-200/50 dark:border-amber-800/40 rounded-2xl p-5">
                    <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-4 flex items-center gap-2"><Zap className="w-4 h-4"/> Chased Chore list</h3>
                    <div className="space-y-2">
                        {nudgedTasks.map(task => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onOpen={() => onOpenTask(task)} />)}
                    </div>
                </div>
            )}

            <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><ListTodo className="w-4 h-4 text-violet-500"/> Personal Assigned Tasks</h3>
                {generalTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 border-dashed">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-slate-500 text-sm font-bold">Clear checklist!</p>
                        <p className="text-slate-400 text-xs mt-0.5">Nothing pending under your profile.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {generalTasks.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(task => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onOpen={() => onOpenTask(task)} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// TAB 2: PROJECTS & FOLDERS (Accordion Dashboard UI)
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
                <h2 className="text-3xl font-black mb-1 tracking-tight">Project Hub</h2>
                <p className="text-slate-500 text-sm font-medium font-medium">Create distinct category binders or lists for complex chores.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Task */}
                <form onSubmit={handleAddTask} className={cardBaseClasses}>
                    <h3 className="font-black text-xs text-slate-400 uppercase tracking-[0.15em] mb-4">Add Task to Folder</h3>
                    <div className="space-y-3">
                        <input type="text" value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Task details..." className={inputBaseClasses + " w-full"} required />
                        
                        <div className="flex gap-2">
                            <select value={newAssignee} onChange={e=>setNewAssignee(e.target.value)} className={inputBaseClasses + " flex-1 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-850"}>
                                <option value="">No Assignee</option>
                                {systemUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                <option value="Both">Joint</option>
                            </select>
                            <input type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} className={inputBaseClasses + " flex-1 py-2 text-xs font-bold"} title="Start Date / Next Due" />
                            <input type="number" value={newTimeLimit} onChange={e=>setNewTimeLimit(e.target.value)} placeholder="Timer (m)" className={inputBaseClasses + " w-20 py-2 text-xs font-bold"} title="Optional Time Limit in Minutes" />
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            <select value={newRecurrence} onChange={e=>{setNewRecurrence(e.target.value); setNewRecurrenceDays([]);}} className={inputBaseClasses + " flex-1 py-2 text-xs font-bold"}>
                                <option value="none">Once</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Biweekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            {(newRecurrence === 'weekly' || newRecurrence === 'biweekly') && (
                                <div className="flex gap-1 ml-2">
                                    {WEEK_DAYS.map((d, i) => (
                                        <button key={i} type="button" onClick={(e) => { e.preventDefault(); if(newRecurrenceDays.includes(d.v)) setNewRecurrenceDays(newRecurrenceDays.filter(day => day !== d.v)); else setNewRecurrenceDays([...newRecurrenceDays, d.v]); }}
                                            className={`w-7 h-7 rounded-full text-[9px] font-bold shadow-sm transition-all ${newRecurrenceDays.includes(d.v) ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            {d.l}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {newRecurrence !== 'none' && (
                            <div className={inputBaseClasses + " flex items-center gap-2 py-2"}>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-1">Recur Until (Optional)</span>
                                <input type="date" value={newRecurEndDate} onChange={e=>setNewRecurEndDate(e.target.value)} className="bg-transparent outline-none text-xs font-bold text-slate-700 dark:text-slate-200" />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <select value={selectedProject} onChange={e=>{setSelectedProject(e.target.value); setSelectedSection('General');}} className={inputBaseClasses + " flex-1 py-2 text-xs font-bold"}>
                                <option value="">General (No Project)</option>
                                {sortedProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {selectedProject && (
                                <select value={selectedSection} onChange={e=>setSelectedSection(e.target.value)} className={inputBaseClasses + " w-1/3 py-2 text-xs font-bold"}>
                                    {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}
                            <button type="submit" className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white px-4 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all"><Plus className="w-5 h-5"/></button>
                        </div>
                    </div>
                </form>

                {/* Add Project */}
                <form onSubmit={handleAddProject} className={cardBaseClasses + " flex flex-col justify-between p-6"}>
                    <div>
                        <h3 className="font-black text-xs text-slate-400 uppercase tracking-[0.15em] mb-4">Create Project Folder</h3>
                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">Create top-level folders to organize related tasks and chores (e.g. Garden, Renovation, Summer Trip).</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="text" value={newProject} onChange={e=>setNewProject(e.target.value)} placeholder="e.g. House Deep Clean" className={inputBaseClasses + " flex-1"} required />
                        <button type="submit" className="bg-slate-800 dark:bg-slate-700 text-white px-5 rounded-xl font-bold transition-transform active:scale-95 text-xs hover:bg-slate-900">Create</button>
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
                        <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.2rem] shadow-sm overflow-hidden transition-all duration-300">
                            {/* Accordion Header */}
                            <div 
                                className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors select-none"
                                onClick={() => toggleProjectExpand(p.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-violet-50 dark:bg-slate-800' : 'bg-transparent'}`}>
                                        {isExpanded ? <ChevronDown className="w-5 h-5 text-violet-500"/> : <ChevronRight className="w-5 h-5 text-slate-400"/>}
                                    </div>
                                    <h3 className="font-black text-xl text-slate-800 dark:text-slate-100 tracking-tight">{p.name}</h3>
                                    {!isExpanded && activeCount > 0 && (
                                        <span className="text-[10px] font-black uppercase text-violet-500 bg-violet-50/50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">{activeCount} active</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/80 rounded-xl p-1 shadow-inner border border-slate-100/50 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                                    <button onClick={()=>moveProject(p, 'up')} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30"><ArrowUp className="w-4 h-4"/></button>
                                    <button onClick={()=>moveProject(p, 'down')} disabled={index === sortedProjects.length - 1} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30"><ArrowDown className="w-4 h-4"/></button>
                                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                                    <button onClick={()=>setActionModal({type: 'editProject', targetId: p.id})} className="p-1.5 text-slate-400 hover:text-violet-500"><Edit2 className="w-4 h-4"/></button>
                                    <button onClick={()=>setActionModal({type: 'deleteProject', targetId: p.id})} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                            
                            {/* Accordion Body */}
                            {isExpanded && (
                                <div className="p-5 md:p-6 pt-0 border-t border-slate-50 dark:border-slate-800/60 mt-1 space-y-6 animate-in slide-in-from-top-3 duration-300">
                                    {sections.map(sectionName => {
                                        const sTasks = pTasks.filter(t => (t.section || 'General') === sectionName);
                                        if (sTasks.length === 0 && sectionName === 'General') return null;

                                        return (
                                            <div key={sectionName} className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80 rounded-[1.8rem] p-4 shadow-sm">
                                                <div className="flex justify-between items-center mb-3 px-2">
                                                    <h4 className="font-black text-xs text-slate-400 uppercase tracking-[0.15em]">{sectionName}</h4>
                                                    {sectionName !== 'General' && (
                                                        <div className="flex gap-2">
                                                            <button onClick={()=>setActionModal({type: 'editSection', targetProjId: p.id, sectionName})} className="text-slate-300 hover:text-violet-500"><Edit2 className="w-3.5 h-3.5"/></button>
                                                            <button onClick={()=>setActionModal({type: 'deleteSection', targetProjId: p.id, sectionName})} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {sTasks.filter(t=>!t.completed).length === 0 && <p className="text-xs text-slate-400 font-semibold italic px-2">No active tasks in this section.</p>}
                                                    {sTasks.filter(t=>!t.completed).map(t => <TaskRow key={t.id} task={t} onToggle={()=>toggleTask(t, userProfile)} onOpen={()=>onOpenTask(t)} />)}
                                                    {sTasks.filter(t=>t.completed).length > 0 && (
                                                        <div className="pt-3 mt-3 border-t border-slate-200/40 dark:border-slate-800/40 opacity-60">
                                                            {sTasks.filter(t=>t.completed).map(t => <TaskRow key={t.id} task={t} onToggle={()=>toggleTask(t, userProfile)} onOpen={()=>onOpenTask(t)} />)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* Add Section Form */}
                                    <div className="mt-4 flex gap-2">
                                        <input type="text" value={selectedProject===p.id ? newSection : ''} onChange={e=>{setNewSection(e.target.value); setSelectedProject(p.id);}} placeholder="New section title..." className={inputBaseClasses + " flex-1 py-1.5 text-xs"} />
                                        <button onClick={()=>handleAddSection(p.id)} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-200 px-4 rounded-xl font-bold text-xs">Add Section</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Custom Action Modals */}
            {actionModal?.type === 'editProject' && <PromptModal title="Rename Project Folder" initialValue={projects.find(p=>p.id===actionModal.targetId)?.name} onSave={executeAction} onCancel={()=>setActionModal(null)} />}
            {actionModal?.type === 'deleteProject' && <ConfirmModal title="Delete Folder?" message="Delete this project folder? All items within will revert to general tasks." onConfirm={executeAction} onCancel={()=>setActionModal(null)} />}
            {actionModal?.type === 'editSection' && <PromptModal title="Rename Sub-section" initialValue={actionModal.sectionName} onSave={executeAction} onCancel={()=>setActionModal(null)} />}
            {actionModal?.type === 'deleteSection' && <ConfirmModal title="Delete Sub-section?" message={`Are you sure you want to delete "${actionModal.sectionName}"? Items inside will revert to General.`} onConfirm={executeAction} onCancel={()=>setActionModal(null)} />}
        </div>
    );
}

// ============================================================================
// TAB 3: SPIRITUAL TRACKER & DOCUMENTS (Overview, Docs, Spiritual)
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
        logActivity(`Added family doc link: "${newDocTitle}"`, "System");
        setNewDocTitle('');
        setNewDocUrl('');
    };

    const tasksCompletedThisWeek = tasks.filter(t => t.completed && t.dueDate && t.dueDate >= currentWeekId).length;
    const tasksPendingThisWeek = tasks.filter(t => !t.completed && t.dueDate && t.dueDate >= currentWeekId && t.dueDate <= getMonday(-1)).length;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-black mb-1 tracking-tight">Family Spiritual Hub</h2>
                <p className="text-slate-500 text-sm font-medium">Keep alignment on worship, ministry schedules, and vital links.</p>
            </header>

            {/* Weekly Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{tasksCompletedThisWeek}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Chores Done This Week</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <ListTodo className="w-8 h-8 text-sky-500 mb-2" />
                    <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{tasksPendingThisWeek}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Pending Past-Due Chores</span>
                </div>
                <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-[2rem] p-6 shadow-lg shadow-violet-500/10 flex flex-col items-center justify-center text-center text-white">
                    <Users className="w-8 h-8 text-violet-200 mb-2" />
                    <span className="text-3xl font-black tracking-tight">{adults.length + children.length}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-100 mt-1">Circle Members</span>
                </div>
            </div>

            {/* Spiritual Tracker */}
            <section className="bg-gradient-to-br from-teal-50/50 to-emerald-50/20 dark:from-slate-900 dark:to-teal-950/20 border border-teal-100/80 dark:border-slate-800 rounded-[2.2rem] p-6 lg:p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-200/20 dark:bg-teal-950/30 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 relative z-10 gap-4">
                    <h3 className="font-black text-teal-900 dark:text-teal-300 text-2xl flex items-center gap-3 tracking-tight">
                        <BookOpen className="w-6 h-6 text-teal-500"/> Spiritual Checklist
                    </h3>
                    <p className="text-xs font-black text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-teal-100/50 dark:border-slate-800 uppercase tracking-widest">
                        W/C {new Date(currentWeekId).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {adults.map(adultName => (
                        <div key={adultName} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-teal-50 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                            <h4 className="font-black text-lg text-slate-800 dark:text-white mb-4 px-1 tracking-tight">{adultName}</h4>
                            <div className="space-y-2">
                                <SpiritualCard title="Family Worship" checked={currentLog[`familyWorship_${adultName}`]} onClick={()=>toggleSpiritual(adultName, 'familyWorship')} history={getHistory(adultName, 'familyWorship')} />
                                <SpiritualCard title="Midweek Prep" checked={currentLog[`midweek_${adultName}`]} onClick={()=>toggleSpiritual(adultName, 'midweek')} history={getHistory(adultName, 'midweek')} />
                                <SpiritualCard title="Weekend Prep" checked={currentLog[`weekend_${adultName}`]} onClick={()=>toggleSpiritual(adultName, 'weekend')} history={getHistory(adultName, 'weekend')} />
                                <SpiritualCard title="Ministry Activity" checked={currentLog[`ministry_${adultName}`]} onClick={()=>toggleSpiritual(adultName, 'ministry')} history={getHistory(adultName, 'ministry')} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Important Docs */}
            <section className={cardBaseClasses}>
                <h3 className="font-black text-2xl mb-6 flex items-center gap-3 tracking-tight"><div className="p-2 bg-violet-50 dark:bg-slate-800 rounded-xl"><FileText className="w-6 h-6 text-violet-500"/></div> Important Docs & Links</h3>
                
                <form onSubmit={handleAddDoc} className="flex flex-col sm:flex-row gap-2.5 mb-6 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <input type="text" value={newDocTitle} onChange={e=>setNewDocTitle(e.target.value)} placeholder="Title (e.g. Schedule PDF)..." className={inputBaseClasses + " sm:flex-1 !py-2"} required />
                    <input type="url" value={newDocUrl} onChange={e=>setNewDocUrl(e.target.value)} placeholder="https://..." className={inputBaseClasses + " sm:flex-1 !py-2"} required />
                    <button type="submit" className="bg-violet-600 text-white px-5 py-2 rounded-xl font-bold transition-transform active:scale-95 text-xs">Save Link</button>
                </form>

                {familyDocs.length === 0 ? (
                    <div className="text-center py-8 opacity-40">
                        <LinkIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="font-bold text-slate-500 text-sm">No document links shared yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {familyDocs.map(doc => (
                            <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-900/50 transition-all group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-violet-50 dark:bg-slate-850 rounded-xl group-hover:bg-violet-100 transition-colors">
                                        <LinkIcon className="w-4 h-4 text-violet-500" />
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-sm">{doc.title}</span>
                                </div>
                                <button onClick={(e) => { e.preventDefault(); deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'family_docs', doc.id)); }} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button>
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
        <button onClick={onClick} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group active:scale-[0.98] ${checked ? 'bg-teal-50/60 dark:bg-teal-950/25 border-teal-200 dark:border-teal-900/50 shadow-sm' : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-900/50'}`}>
            <div className="flex flex-col items-start gap-1">
                <span className={`font-bold text-xs tracking-tight ${checked ? 'text-teal-900 dark:text-teal-300 font-extrabold' : 'text-slate-600 dark:text-slate-300'}`}>{title}</span>
                {history && (
                    <div className="flex items-center gap-1" title="Past weeks progress">
                        {history.map((done, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-teal-400' : 'bg-slate-200 dark:bg-slate-800'}`} />
                        ))}
                    </div>
                )}
            </div>
            <div className={`transition-transform duration-300 ${checked ? 'scale-110' : 'scale-100'}`}>
                {checked ? <CheckCircle2 className="w-5 h-5 text-teal-500"/> : <Circle className="w-5 h-5 text-slate-200 dark:text-slate-800"/>}
            </div>
        </button>
    )
}

// ============================================================================
// TAB 6: KIDS CORNER PARENT CONTROL (Manage Kids Tasks, Rewards, etc.)
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
        logActivity(`Added Leo's ${activeList}: "${newItem}"`, "System");
        setNewItem('');
    };

    const approveReward = async (rewardId) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', rewardId), { status: 'fulfilled' });
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-black mb-1 tracking-tight">Kid's Corner Control</h2>
                <p className="text-slate-500 text-sm font-medium">Configure rewards, review completed missions, and edit milestone logs.</p>
            </header>

            <section className={cardBaseClasses + " p-6 lg:p-8"}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h3 className="font-black text-slate-800 dark:text-white text-2xl flex items-center gap-3 tracking-tight">
                        <Star className="w-6 h-6 text-amber-500 fill-amber-500"/> Leo's Stars Balance
                    </h3>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-slate-900 dark:to-amber-950/20 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-2xl border border-amber-200/50 dark:border-amber-800 shadow-sm">
                        <Star className="w-4 h-4 fill-amber-500" /> <span className="font-black text-base">{leoStats?.stars || 0} Stars Saved</span>
                    </div>
                </div>

                {/* Sub Menu Switcher */}
                <div className="flex gap-1.5 mb-6 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-850 overflow-x-auto custom-scrollbar shadow-inner">
                    <button onClick={()=>setActiveList('tasks')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeList==='tasks'?'bg-white dark:bg-slate-800 shadow-sm text-amber-500':'text-slate-500'}`}>Chores & Quests</button>
                    <button onClick={()=>setActiveList('milestones')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeList==='milestones'?'bg-white dark:bg-slate-800 shadow-sm text-amber-500':'text-slate-500'}`}>Milestones</button>
                    <button onClick={()=>setActiveList('appointments')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeList==='appointments'?'bg-white dark:bg-slate-800 shadow-sm text-amber-500':'text-slate-500'}`}>Appointments</button>
                    <button onClick={()=>setActiveList('restock')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeList==='restock'?'bg-white dark:bg-slate-800 shadow-sm text-amber-500':'text-slate-500'}`}>Needs / Shopping</button>
                    <button onClick={()=>setActiveList('rewards')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeList==='rewards'?'bg-white dark:bg-slate-800 shadow-sm text-amber-500':'text-slate-500'}`}>Rewards Shop</button>
                </div>
                
                <form onSubmit={handleAddKidItem} className="flex flex-wrap gap-2 mb-6">
                    <input type="text" value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder={`Create new ${activeList}...`} className={inputBaseClasses + " flex-1 min-w-[200px]"} required />
                    
                    {activeList === 'tasks' && (
                        <div className={inputBaseClasses + " flex items-center gap-2 px-3 w-28 !py-0"}>
                            <Timer className="w-4 h-4 text-slate-400"/>
                            <input type="number" value={newTimeLimit} onChange={e=>setNewTimeLimit(e.target.value)} placeholder="Limit (m)" className="w-full bg-transparent outline-none font-bold placeholder:text-slate-400 py-2 text-xs" />
                        </div>
                    )}

                    {activeList === 'rewards' && (
                        <>
                            <div className={inputBaseClasses + " flex items-center gap-2 px-3 w-24 !py-0"}>
                                <Star className="w-4 h-4 text-amber-500"/>
                                <input type="number" value={newRewardCost} onChange={e=>setNewRewardCost(e.target.value)} placeholder="Cost" className="w-full bg-transparent outline-none font-bold placeholder:text-slate-400 py-2 text-xs" required />
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setIsPermanentReward(!isPermanentReward)}
                                className={`px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${isPermanentReward ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                            >
                                {isPermanentReward ? 'Infinite' : 'Single Use'}
                            </button>
                        </>
                    )}
                    <button type="submit" className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-5 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all"><Plus className="w-5 h-5"/></button>
                </form>

                <div className="space-y-2">
                    {activeList === 'tasks' ? (
                        <>
                            {tasks.filter(t => t.assignee === 'Leo' && !t.completed).map(task => (
                                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 group transition-colors hover:border-amber-200 dark:hover:border-amber-900/50">
                                    <button onClick={() => toggleTask(task, userProfile)}><Circle className="w-5 h-5 text-slate-300 hover:text-amber-500" /></button>
                                    <div className="flex-1 flex flex-col">
                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{task.title}</span>
                                        {task.timeLimit && <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-0.5"><Timer className="w-3 h-3"/> {task.timeLimit} Mins limit</span>}
                                    </div>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                            {tasks.filter(t => t.assignee === 'Leo' && t.completed).map(task => (
                                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl opacity-50 grayscale group">
                                    <button onClick={() => toggleTask(task, userProfile)}><CheckCircle2 className="w-5 h-5 text-emerald-500" /></button>
                                    <span className="flex-1 font-bold line-through text-slate-500 text-sm">{task.title}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </>
                    ) : activeList === 'rewards' ? (
                        <>
                            {leoData.rewards?.filter(r => r.status === 'pending').map(reward => (
                                <div key={reward.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-gradient-to-r from-rose-50/40 to-white dark:from-slate-950 dark:to-slate-900 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                                            <Gift className="w-4 h-4 text-rose-500" />
                                        </div>
                                        <span className="font-bold text-rose-800 dark:text-rose-200 text-sm">{reward.title}</span>
                                        <span className="text-[9px] uppercase font-black tracking-wider text-rose-500 bg-rose-100/50 px-2 py-0.5 rounded ml-2">Request Pending</span>
                                    </div>
                                    <button onClick={() => approveReward(reward.id)} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all">Approve Claim</button>
                                </div>
                            ))}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                {leoData.rewards?.filter(r => r.status === 'available').map(reward => (
                                    <div key={reward.id} className="flex flex-col gap-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm group hover:border-amber-200 dark:hover:border-amber-800/50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-100 dark:border-amber-900/40">
                                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500"/>
                                                <span className="font-black text-amber-700 dark:text-amber-400 text-xs">{reward.cost}</span>
                                            </div>
                                            <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', reward.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-black text-slate-800 dark:text-slate-200 text-sm">{reward.title}</span>
                                            {reward.isPermanent && <span className="text-[8px] uppercase font-black tracking-widest text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">Infinite</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {leoData[activeList]?.filter(i=>!i.completed).map(item => (
                                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 group hover:border-violet-200 dark:hover:border-violet-900/50">
                                    <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id), {completed: true})}><Circle className="w-5 h-5 text-slate-300 hover:text-violet-500" /></button>
                                    <span className="flex-1 font-bold text-slate-800 dark:text-slate-200 text-sm">{item.title}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                            {leoData[activeList]?.filter(i=>i.completed).map(item => (
                                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl opacity-50 grayscale group">
                                    <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id), {completed: false})}><CheckCircle2 className="w-5 h-5 text-emerald-500" /></button>
                                    <span className="flex-1 font-bold line-through text-slate-500 text-sm">{item.title}</span>
                                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leodata', item.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-4 h-4"/></button>
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
                <h2 className="text-3xl font-black mb-1 tracking-tight">Logistics Desk</h2>
                <p className="text-slate-500 text-sm font-medium">Map out household dinners and check off shopping trips.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Meal Plan */}
                <div className={cardBaseClasses}>
                    <h3 className="font-black text-2xl mb-6 flex items-center gap-3 tracking-tight"><div className="p-2 bg-rose-50 dark:bg-slate-800 rounded-xl"><Utensils className="w-5 h-5 text-rose-500"/></div> Week Meal Plan</h3>
                    <div className="space-y-3">
                        {days.map(day => {
                            const meal = meals.find(m => m.day === day && m.weekId === weekId);
                            const isToday = new Date().toLocaleDateString('en-US', {weekday: 'long'}) === day;
                            return (
                                <div key={day} className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-2xl border transition-all ${isToday ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                                    <span className={`text-[10px] font-black uppercase tracking-wider w-24 shrink-0 ${isToday ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-400'}`}>
                                        {day} {isToday && '•'}
                                    </span>
                                    <input type="text" defaultValue={meal?.text || ''} onBlur={(e) => handleUpdateMeal(day, e.target.value)} placeholder="What's for dinner?" className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-rose-400 transition-all ${isToday ? 'bg-white dark:bg-slate-900' : ''}`} />
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Groceries */}
                <div className={cardBaseClasses + " flex flex-col lg:h-[620px]"}>
                    <h3 className="font-black text-2xl mb-6 flex items-center gap-3 tracking-tight"><div className="p-2 bg-emerald-50 dark:bg-slate-800 rounded-xl"><ShoppingCart className="w-5 h-5 text-emerald-500"/></div> Grocery Store Checklist</h3>
                    <form onSubmit={handleAddShopping} className="flex gap-2 mb-4">
                        <input type="text" value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="Item name..." className={inputBaseClasses + " flex-1"} />
                        <button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all"><Plus className="w-5 h-5"/></button>
                    </form>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {shoppingList.filter(i=>!i.completed).map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 group border border-transparent hover:border-slate-100">
                                <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', item.id), {completed:true})}><Circle className="w-5 h-5 text-slate-300 hover:text-emerald-500" /></button>
                                <span className="flex-1 font-bold text-slate-800 dark:text-slate-200 text-xs">{item.title}</span>
                                <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', item.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        ))}
                        {shoppingList.filter(i=>i.completed).length > 0 && (
                            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Crossed off</h4>
                                {shoppingList.filter(i=>i.completed).map(item => (
                                    <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl opacity-55 group">
                                        <button onClick={() => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', item.id), {completed:false})}><CheckCircle2 className="w-5 h-5 text-emerald-500" /></button>
                                        <span className="flex-1 font-bold line-through text-slate-500 text-xs">{item.title}</span>
                                        <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shopping', item.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-4 h-4"/></button>
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
// TAB 5: FINANCES (Incomes, Outgoings, Pots)
// ============================================================================
function FinanceTab({ finances, db, appId, user }) {
    const monthId = getCurrentMonthId();
    const currentFinance = finances.find(f => f.id === monthId) || { incomes: [], outgoings: [], pots: [] };
    
    // Forms
    const [newIncomeName, setNewIncomeName] = useState('');
    const [newIncomeAmt, setNewIncomeAmt] = useState('');
    
    const [newOutName, setNewOutName] = useState('');
    const [newOutAmt, setNewOutAmt] = useState('');
    const [newOutType, setNewOutType] = useState('Fixed'); 
    
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
    const leftToAllocate = availableForPots - totalAllocated;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header>
                <h2 className="text-3xl font-black mb-1 tracking-tight">Finance planner</h2>
                <p className="text-slate-500 text-sm font-medium">Keep track of incoming payday values, static bills, and savings pots.</p>
            </header>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950/30 rounded-[2rem] p-6 shadow-sm text-center relative overflow-hidden">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Income</h3>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">£{totalIncome}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/30 rounded-[2rem] p-6 shadow-sm text-center relative overflow-hidden">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Outgoings</h3>
                    <p className="text-3xl font-black text-rose-600 dark:text-rose-400">£{totalOutgoings}</p>
                </div>
                <div className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-[2rem] p-6 shadow-lg shadow-violet-500/10 text-center relative overflow-hidden">
                    <h3 className="text-[10px] font-black text-violet-100 uppercase tracking-wider mb-1">Savings Pots Allocation</h3>
                    <p className="text-3xl font-black">£{availableForPots}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* INCOMES & OUTGOINGS */}
                <div className="space-y-8">
                    <div className={cardBaseClasses}>
                        <h3 className="font-black text-xl mb-4 flex items-center gap-2.5 tracking-tight"><div className="p-2 bg-emerald-50 dark:bg-slate-800 rounded-xl"><Wallet className="w-5 h-5 text-emerald-500"/></div> Incoming Wages</h3>
                        <form onSubmit={addIncome} className="flex gap-2 mb-4 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-100 dark:border-slate-850">
                            <input type="text" value={newIncomeName} onChange={e=>setNewIncomeName(e.target.value)} placeholder="Wages source..." className="flex-1 bg-transparent outline-none text-xs font-bold px-2 text-slate-800 dark:text-white" required />
                            <input type="number" value={newIncomeAmt} onChange={e=>setNewIncomeAmt(e.target.value)} placeholder="£" className="w-16 bg-transparent outline-none text-xs font-bold border-l border-slate-200 dark:border-slate-700 pl-2 text-slate-800 dark:text-white" required />
                            <button type="submit" className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold"><Plus className="w-4 h-4"/></button>
                        </form>
                        <div className="space-y-2">
                            {(currentFinance.incomes||[]).map(inc => (
                                <div key={inc.id} className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-50 group hover:border-emerald-200">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{inc.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">£{inc.amount}</span>
                                        <button onClick={()=>removeItem('incomes', inc.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-3.5 h-3.5"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={cardBaseClasses}>
                        <h3 className="font-black text-xl mb-4 flex items-center gap-2.5 tracking-tight"><div className="p-2 bg-rose-50 dark:bg-slate-800 rounded-xl"><ArrowRight className="w-5 h-5 text-rose-500"/></div> Dynamic Outgoings</h3>
                        <form onSubmit={addOutgoing} className="flex flex-col gap-2 mb-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                            <div className="flex gap-2">
                                <input type="text" value={newOutName} onChange={e=>setNewOutName(e.target.value)} placeholder="Outgoing name..." className="flex-1 bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-white" required />
                                <input type="number" value={newOutAmt} onChange={e=>setNewOutAmt(e.target.value)} placeholder="£" className="w-16 bg-transparent outline-none text-xs font-bold border-l border-slate-200 dark:border-slate-700 pl-2 text-slate-800 dark:text-white" required />
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                <select value={newOutType} onChange={e=>setNewOutType(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-500 cursor-pointer">
                                    <option value="Fixed">Fixed Bill</option>
                                    <option value="Temporary">Temporary</option>
                                </select>
                                <button type="submit" className="bg-rose-500 text-white px-4 py-1.5 rounded-xl font-bold text-xs">Add</button>
                            </div>
                        </form>
                        <div className="space-y-2">
                            {(currentFinance.outgoings||[]).map(out => (
                                <div key={out.id} className="flex justify-between items-center p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-50 group hover:border-rose-200">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{out.name}</span>
                                        <span className="text-[8px] uppercase font-black text-slate-400 mt-0.5">{out.type}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-sm text-rose-600 dark:text-rose-400">£{out.amount}</span>
                                        <button onClick={()=>removeItem('outgoings', out.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-3.5 h-3.5"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* BUDGET POTS */}
                <div className={cardBaseClasses}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 gap-3">
                        <h3 className="font-black text-xl flex items-center gap-2.5 tracking-tight"><div className="p-2 bg-violet-50 dark:bg-slate-800 rounded-xl"><PiggyBank className="w-5 h-5 text-violet-500"/></div> Piggy Bank Pots</h3>
                        <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-850 text-right w-full sm:w-auto">
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">Remaining Cash</span>
                            <span className={`text-xl font-black ${leftToAllocate < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>£{leftToAllocate}</span>
                        </div>
                    </div>
                    
                    <form onSubmit={addPot} className="flex gap-2 mb-6 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-100 dark:border-slate-850">
                        <input type="text" value={newPotName} onChange={e=>setNewPotName(e.target.value)} placeholder="Pot name..." className="flex-1 bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-white px-2" required />
                        <input type="number" value={newPotAlloc} onChange={e=>setNewPotAlloc(e.target.value)} placeholder="£ Alloc" className="w-20 bg-transparent outline-none text-xs font-bold border-l border-slate-200 dark:border-slate-700 pl-2 text-slate-800 dark:text-white" required />
                        <button type="submit" className="bg-violet-500 text-white px-3 py-1.5 rounded-xl font-bold"><Plus className="w-4 h-4"/></button>
                    </form>

                    <div className="space-y-4">
                        {(currentFinance.pots||[]).map(pot => {
                            const potLeft = pot.allocated - pot.spent;
                            const percentage = Math.min((pot.spent / pot.allocated) * 100 || 0, 100);
                            return (
                                <div key={pot.id} className="flex flex-col p-4 rounded-2xl border border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm gap-3 group">
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-slate-800 dark:text-white text-sm">{pot.name}</span>
                                        <button onClick={()=>removeItem('pots', pot.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-3.5 h-3.5"/></button>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-100">
                                        <div className={`h-full rounded-full transition-all duration-500 ${potLeft < 0 ? 'bg-red-500' : 'bg-violet-500'}`} style={{width: `${percentage}%`}}></div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] uppercase text-slate-400 font-bold">Limit</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">£{pot.allocated}</span>
                                            </div>
                                            <div className="flex flex-col border-l border-slate-200 dark:border-slate-850 pl-4">
                                                <span className="text-[8px] uppercase text-slate-400 font-bold">Spent</span>
                                                <div className="flex items-center">
                                                    <span className="font-bold text-rose-500 mr-0.5">£</span>
                                                    <input type="number" value={pot.spent} onChange={e=>updatePotSpent(pot.id, e.target.value)} className="w-12 bg-transparent outline-none font-bold text-rose-500 text-xs" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[8px] uppercase text-slate-400 font-bold">Remaining</span>
                                            <span className={`font-black ${potLeft < 0 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>£{potLeft}</span>
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
// TASK ROW & TASK DETAILS MODAL (High-Fidelity)
// ============================================================================
function TaskRow({ task, onToggle, onOpen }) {
    const isNudged = task.nudged && !task.completed;
    const isRecurring = task.recurrence && task.recurrence !== 'none';
    
    return (
        <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer group active:scale-[0.99]
            ${task.completed ? 'bg-slate-50/50 dark:bg-slate-950/30 border-transparent opacity-60' : isNudged ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-orange-950/20 border-amber-200 dark:border-amber-900/50 shadow-sm hover:shadow' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:border-violet-300 dark:hover:border-violet-900 shadow-sm'}`}
            onClick={onOpen}
        >
            <div className="flex items-center gap-3.5 overflow-hidden">
                <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="transform active:scale-75 transition-transform shrink-0">
                    {task.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className={`w-5 h-5 ${isNudged ? 'text-orange-500' : 'text-slate-300 group-hover:text-violet-400'}`} />}
                </button>
                <div className="flex flex-col overflow-hidden">
                    <span className={`font-bold text-sm truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</span>
                    {(task.dueDate || task.timeLimit) && !task.completed && (
                        <div className="flex items-center gap-2 mt-1">
                            {task.dueDate && <span className="text-[9px] font-black uppercase text-violet-500 flex items-center gap-1 bg-violet-50 dark:bg-violet-950/50 px-2 py-0.5 rounded"><CalendarClock className="w-3 h-3"/> {formatDueDate(task.dueDate)}</span>}
                            {task.timeLimit && <span className="text-[9px] font-black uppercase text-amber-500 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded"><Timer className="w-3 h-3"/> {task.timeLimit}m</span>}
                            {isRecurring && <span className="text-[9px] font-black uppercase text-slate-400 flex items-center bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"><Repeat className="w-3 h-3"/></span>}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 ml-2">
                {task.subtasks?.length > 0 && (
                    <span className="text-[9px] font-black text-slate-400 hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"><ListTodo className="w-3 h-3"/> {task.subtasks.filter(s=>s.completed).length}/{task.subtasks.length}</span>
                )}
                {task.assignee && !task.completed && (
                    <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200/50 dark:border-slate-700/50">{task.assignee}</span>
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
            if (word.startsWith('@')) return <span key={i} className="text-amber-500 font-bold bg-amber-500/10 px-1 rounded">{word} </span>;
            return word + ' ';
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 sticky top-0 z-10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core task options</span>
                    <div className="flex gap-1.5">
                        <button onClick={deleteTask} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-xl"><Trash2 className="w-5 h-5"/></button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X className="w-5 h-5"/></button>
                    </div>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                    <input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} onBlur={()=>editTitle!==task.title && updateTask({title:editTitle})} className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white w-full border-none focus:ring-0 p-0 bg-transparent outline-none tracking-tight leading-tight" />
                    
                    {/* Setup Parameters */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Assignee</span>
                            <select value={task.assignee || ''} onChange={(e) => updateTask({assignee: e.target.value})} className="bg-transparent outline-none cursor-pointer">
                                <option value="">Unassigned</option>
                                {systemUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                <option value="Both">Joint</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Due</span>
                            <input type="date" value={task.dueDate || ''} onChange={(e) => updateTask({dueDate: e.target.value || null})} className="bg-transparent outline-none cursor-pointer" />
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Timer</span>
                            <input type="number" value={task.timeLimit || ''} onChange={(e) => updateTask({timeLimit: e.target.value ? Number(e.target.value) : null})} placeholder="Min" className="w-12 bg-transparent outline-none cursor-pointer" />
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Repeat</span>
                            <select value={task.recurrence || 'none'} onChange={(e) => updateTask({recurrence: e.target.value, recurrenceDays: []})} className="bg-transparent outline-none cursor-pointer">
                                <option value="none">Once</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Biweekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            
                            {(task.recurrence === 'weekly' || task.recurrence === 'biweekly') && (
                                <div className="flex gap-1 ml-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
                                    {WEEK_DAYS.map((d, i) => {
                                        const days = task.recurrenceDays || [];
                                        return (
                                            <button key={i} type="button" onClick={(e) => { 
                                                e.preventDefault(); 
                                                const newDays = days.includes(d.v) ? days.filter(day => day !== d.v) : [...days, d.v];
                                                updateTask({recurrenceDays: newDays});
                                            }}
                                                className={`w-6 h-6 rounded-full text-[8px] font-bold transition-all shadow-sm ${days.includes(d.v) ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                {d.l}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <button onClick={handleNudge} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${task.nudged ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'}`}>
                            <Zap className="w-4 h-4"/> {task.nudged ? 'Mute Chase' : 'Chase Chore'}
                        </button>
                    </div>

                    {/* Subtasks */}
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2 text-slate-400"><ListTodo className="w-4 h-4"/> Subtasks Breakdown</h4>
                        <div className="space-y-2 mb-3">
                            {task.subtasks?.map(sub => (
                                <div key={sub.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-50 bg-slate-50/50 dark:bg-slate-950/50 group">
                                    <button onClick={()=>toggleSubtask(sub.id)} className="active:scale-75 transition-transform"><Circle className={`w-5 h-5 ${sub.completed ? 'text-emerald-500 fill-emerald-500' : 'text-slate-300'}`}/></button>
                                    <span className={`flex-1 font-bold text-xs ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{sub.title}</span>
                                    <button onClick={()=>deleteSubtask(sub.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-0.5"><X className="w-3.5 h-3.5"/></button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddSubtask} className="flex gap-2">
                            <input type="text" value={newSubtask} onChange={e=>setNewSubtask(e.target.value)} placeholder="New subtask details..." className={inputBaseClasses + " flex-1 py-2 text-xs"} />
                            <button type="submit" className="bg-slate-800 dark:bg-slate-700 text-white px-4 rounded-xl font-bold text-xs">Add</button>
                        </form>
                    </div>

                    {/* Chat Comments */}
                    <div className="border-t border-slate-50 dark:border-slate-800/60 pt-6">
                        <h4 className="font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-400"><MessageSquare className="w-4 h-4"/> Comments & Logs</h4>
                        <div className="space-y-4">
                            {comments.filter(c=>c.taskId === task.id).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).map(c => (
                                <div key={c.id} className={`flex flex-col ${c.author === userProfile ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{c.author}</span>
                                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed ${c.author === userProfile ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50'}`}>
                                        {renderCommentText(c.text)}
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 mt-1 px-1">{new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleAddComment} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800/80 flex gap-2.5 relative z-10">
                    <input type="text" value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Post a response (@Name to ping)..." className="flex-1 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400" required />
                    <button type="submit" className="bg-violet-600 text-white px-4 rounded-xl font-bold hover:bg-violet-700 text-xs">Post</button>
                </form>
            </div>

            {actionModal?.type === 'deleteTask' && (
                <ConfirmModal title="Delete Task?" message="Are you sure you want to permanently discard this task?" onConfirm={async () => { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id)); onClose(); }} onCancel={()=>setActionModal(null)} />
            )}
        </div>
    )
}

// ============================================================================
// UTILITY OVERLAYS & DIALOGS
// ============================================================================
function NotificationsPanel({ notifications, onClose, onNotificationClick }) {
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
                <h3 className="font-black text-xl flex items-center gap-2.5 tracking-tight"><BellRing className="w-5 h-5 text-violet-500"/> Action Inbox</h3>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-50 rounded-xl"><X className="w-5 h-5 text-slate-400"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <CheckCircle2 className="w-10 h-10 text-slate-400 mb-3" />
                        <p className="font-bold text-sm">Inbox clear!</p>
                    </div>
                )}
                {notifications.map(n => (
                    <div key={n.id} onClick={() => onNotificationClick(n)} className={`p-4 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] active:scale-95 ${n.read ? 'bg-slate-50 dark:bg-slate-950/45 border-slate-100 dark:border-slate-850 text-slate-500' : 'bg-violet-50/55 dark:bg-violet-950/15 border-violet-100 dark:border-violet-900/40 text-violet-950 dark:text-violet-200 font-semibold'}`}>
                        <div className="flex gap-3">
                            <div className="mt-0.5 bg-white dark:bg-slate-800 p-1.5 rounded-full border border-slate-100 shadow-sm h-max">{getIcon(n.type)}</div>
                            <div>
                                <p className="leading-normal">{n.message}</p>
                                <div className="text-[8px] font-black uppercase tracking-wider mt-1.5 text-slate-400">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
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
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-slate-50 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950">
                    <h3 className="font-black text-xl flex items-center gap-2.5 tracking-tight"><History className="w-5 h-5 text-slate-400"/> Activity Log</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                    {logs.length === 0 && <p className="text-center text-slate-400 font-bold py-8 text-sm">No recent logs recorded.</p>}
                    {logs.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(log => (
                        <div key={log.id} className="flex gap-3 items-start relative before:absolute before:left-[17px] before:top-10 before:bottom-[-20px] before:w-px before:bg-slate-100 dark:before:bg-slate-800 last:before:hidden">
                            <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-slate-800 flex items-center justify-center font-black text-xs shrink-0 text-violet-600 border border-violet-100 shadow-sm z-10">{log.author?.charAt(0) || '?'}</div>
                            <div className="pt-1.5">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug">{log.message}</p>
                                <p className="text-[8px] font-black tracking-widest uppercase text-slate-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
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
            <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] shadow-2xl w-full max-w-sm p-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <h3 className="font-black text-xl mb-4 tracking-tight">{title}</h3>
                <input autoFocus type="text" value={val} onChange={e=>setVal(e.target.value)} className={inputBaseClasses + " w-full mb-6"} />
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition-colors text-xs">Cancel</button>
                    <button onClick={() => onSave(val)} className="px-5 py-2 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 text-xs">Save</button>
                </div>
            </div>
        </div>
    )
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] shadow-2xl w-full max-w-sm p-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-red-500"/>
                </div>
                <h3 className="font-black text-xl text-red-500 mb-2 tracking-tight">{title}</h3>
                <p className="text-slate-500 font-medium mb-6 leading-relaxed text-xs">{message}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition-colors text-xs">Cancel</button>
                    <button onClick={onConfirm} className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 text-xs shadow-md shadow-red-500/10">Proceed Delete</button>
                </div>
            </div>
        </div>
    )
}

function SettingsModal({ onClose, isDarkMode, setIsDarkMode, systemUsers }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.2rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <h3 className="font-black text-xl tracking-tight">System Settings</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="p-6 space-y-6">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-between w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold hover:border-violet-400 transition-colors active:scale-[0.98]">
                        <span className="flex items-center gap-3 text-sm">
                            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-indigo-500/10' : 'bg-amber-100'}`}>
                                {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400"/> : <Sun className="w-4 h-4 text-amber-500"/>} 
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
                                        <div className="w-7 h-7 rounded-full bg-violet-50 dark:bg-slate-800 flex items-center justify-center text-violet-600 dark:text-violet-300 text-xs">{u.name.charAt(0)}</div>
                                        <span>{u.name}</span>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${u.role === 'Adult' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>{u.role}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
