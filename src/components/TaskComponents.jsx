import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, CalendarClock, Timer, Repeat, 
  ListTodo, Trash2, X, Zap, MessageSquare, Plus, Star 
} from 'lucide-react';
import { doc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { formatDueDate, WEEK_DAYS, inputBaseClasses } from '../helpers';
import { ConfirmModal } from './Modals';

export function TaskRow({ task, onToggle, onOpen }) {
  const isNudged = task.nudged && !task.completed;
  const isRecurring = task.recurrence && task.recurrence !== 'none';
  
  return (
    <div 
      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer group active:scale-[0.99]
        ${task.completed ? 'bg-slate-50/50 dark:bg-slate-950/30 border-transparent opacity-60' : isNudged ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-orange-950/20 border-amber-200 dark:border-amber-900/50 shadow-sm hover:shadow' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 hover:border-violet-300 dark:hover:border-violet-900 shadow-sm'}`}
      onClick={onOpen}
    >
      <div className="flex items-center gap-3.5 overflow-hidden">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(); }} 
          className="transform active:scale-75 transition-transform shrink-0"
        >
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
  );
}

export function SlideToComplete({ task, onComplete }) {
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

export function TaskDetailModal({ task, onClose, db, appId, user, comments, userProfile, systemUsers, sendNotification, logActivity }) {
  const [editTitle, setEditTitle] = useState(task.title);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [actionModal, setActionModal] = useState(null);

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
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), { 
      taskId: task.id, 
      text: newComment, 
      author: userProfile, 
      createdAt: new Date().toISOString() 
    });
    
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

  const renderCommentText = (text) => {
    return text.split(' ').map((word, i) => {
      if (word.startsWith('@')) return <span key={i} className="text-amber-500 font-bold bg-amber-500/10 px-1 rounded">{word} </span>;
      return word + ' ';
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 sticky top-0 z-10">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core task options</span>
          <div className="flex gap-1.5">
            <button onClick={() => setActionModal({type: 'deleteTask'})} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-xl">
              <Trash2 className="w-5 h-5"/>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
          <input 
            value={editTitle} 
            onChange={(e)=>setEditTitle(e.target.value)} 
            onBlur={()=>editTitle!==task.title && updateTask({title:editTitle})} 
            className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white w-full border-none focus:ring-0 p-0 bg-transparent outline-none tracking-tight leading-tight" 
          />
          
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
                      <button 
                        key={i} 
                        type="button" 
                        onClick={(e) => { 
                          e.preventDefault(); 
                          const newDays = days.includes(d.v) ? days.filter(day => day !== d.v) : [...days, d.v];
                          updateTask({recurrenceDays: newDays});
                        }}
                        className={`w-6 h-6 rounded-full text-[8px] font-bold transition-all shadow-sm ${days.includes(d.v) ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                      >
                        {d.l}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button 
              onClick={handleNudge} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${task.nudged ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'}`}
            >
              <Zap className="w-4 h-4"/> {task.nudged ? 'Mute Chase' : 'Chase Chore'}
            </button>
          </div>

          <div>
            <h4 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2 text-slate-400">
              <ListTodo className="w-4 h-4"/> Subtasks Breakdown
            </h4>
            <div className="space-y-2 mb-3">
              {task.subtasks?.map(sub => (
                <div key={sub.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-50 bg-slate-50/50 dark:bg-slate-950/50 group">
                  <button onClick={()=>toggleSubtask(sub.id)} className="active:scale-75 transition-transform">
                    <Circle className={`w-5 h-5 ${sub.completed ? 'text-emerald-500 fill-emerald-500' : 'text-slate-300'}`}/>
                  </button>
                  <span className={`flex-1 font-bold text-xs ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{sub.title}</span>
                  <button onClick={()=>deleteSubtask(sub.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-0.5">
                    <X className="w-3.5 h-3.5"/>
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input type="text" value={newSubtask} onChange={e=>setNewSubtask(e.target.value)} placeholder="New subtask details..." className={inputBaseClasses + " flex-1 py-2 text-xs"} />
              <button type="submit" className="bg-slate-800 dark:bg-slate-700 text-white px-4 rounded-xl font-bold text-xs">Add</button>
            </form>
          </div>

          <div className="border-t border-slate-50 dark:border-slate-800/60 pt-6">
            <h4 className="font-black text-sm uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-400">
              <MessageSquare className="w-4 h-4"/> Comments & Logs
            </h4>
            <div className="space-y-4">
              {comments.filter(c=>c.taskId === task.id).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).map(c => (
                <div key={c.id} className={`flex flex-col ${c.author === userProfile ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{c.author}</span>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed ${c.author === userProfile ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50'}`}>
                    {renderCommentText(c.text)}
                  </div>
                  <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 mt-1 px-1">
                    {new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
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
        <ConfirmModal 
          title="Delete Task?" 
          message="Are you sure you want to permanently discard this task?" 
          onConfirm={async () => { 
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id)); 
            onClose(); 
          }} 
          onCancel={() => setActionModal(null)} 
        />
      )}
    </div>
  );
}
