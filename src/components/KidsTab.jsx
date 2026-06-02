import React, { useState, useEffect, useRef } from 'react'; // <-- Add
import { Star, Gift, Gamepad2, Award, Timer, Repeat, ShoppingCart, Lock, X, Volume2, Pause, Play, Check } from 'lucide-react'; // <-- Add
import { doc, setDoc, updateDoc } from 'firebase/firestore'; // <-- Add

export function LeoDashboard({ tasks, db, appId, stats, toggleTask, onLogout, rewardsData }) {

    const [flyingStars, setFlyingStars] = useState([]);
    const [localCompleted, setLocalCompleted] = useState({});
    const [showRewards, setShowRewards] = useState(false);
    const [activeTimerTask, setActiveTimerTask] = useState(null);
    const starCounterRef = React.useRef(null);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

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

            <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl pointer-events-none"></div>

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
            const voices = window.speechSynthesis.getVoices();
            if(voices.length > 0) utterance.voice = voices.find(v => v.lang.includes('en')) || voices[0];
            utterance.rate = 0.9;
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
        let newX = e.clientX - trackRect.left - 48; 
        newX = Math.max(0, Math.min(newX, trackRect.width - 96)); 
        setOffset(newX);
    };
    
    const handlePointerUp = (e) => {
        if(!isDragging || completed || !trackRef.current) return;
        setIsDragging(false);
        const trackWidth = trackRef.current.getBoundingClientRect().width;
        if(offset > trackWidth * 0.70) { 
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
