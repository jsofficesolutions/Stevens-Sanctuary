import React, { useState } from 'react';
import { Star, ShieldAlert, Zap, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cardBaseClasses, inputBaseClasses } from '../helpers';

export default function KidsCornerParentTab({ kidsTasks, kidsRewards, onAddTask, onDeleteTask, onProcessRewardOverride }) {
  const [taskName, setTaskName] = useState('');
  const [taskPoints, setTaskPoints] = useState('1');

  const handleAddTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    onAddTask({
      id: `kid_task_${Date.now()}`,
      name: taskName.trim(),
      points: Number(taskPoints),
      assignedTo: 'Leo',
      completedToday: false,
    });
    setTaskName('');
  };

  return (
    <div className="w-full space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Leo's Corner Controls</h2>
        <p className="text-sm text-slate-500 mt-1">Assign chores to Leo and approve his reward requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${cardBaseClasses} p-6`}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Leo's Chores
          </h3>

          <form onSubmit={handleAddTaskSubmit} className="flex gap-2 mb-6">
            <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="e.g., Tidy up toys" className={`${inputBaseClasses} flex-[2] text-sm py-2`} />
            <select value={taskPoints} onChange={(e) => setTaskPoints(e.target.value)} className={`${inputBaseClasses} flex-1 text-sm py-2`}>
              <option value="1">1 Star</option>
              <option value="2">2 Stars</option>
              <option value="5">5 Stars</option>
            </select>
            <button type="submit" className="px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors">Add</button>
          </form>

          <div className="space-y-3">
            {kidsTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${task.completedToday ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{task.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs font-black">+{task.points} Star</span>
                  <button onClick={() => onDeleteTask(task.id)} className="text-slate-400 hover:text-rose-500"><XCircle className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${cardBaseClasses} p-6`}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> Reward Requests
          </h3>
          <div className="space-y-3">
            {kidsRewards.length > 0 ? kidsRewards.map((reward) => (
              <div key={reward.id} className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{reward.title}</span>
                    <span className="text-xs text-slate-500 block mt-1">Cost: {reward.starCost} Stars</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-amber-100 text-amber-700">
                    {reward.status}
                  </span>
                </div>
                {reward.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => onProcessRewardOverride(reward.id, 'fulfilled')} className="flex-1 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg">Approve & Spend</button>
                    <button onClick={() => onProcessRewardOverride(reward.id, 'available')} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg">Deny</button>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 text-sm font-medium">No pending requests from Leo.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
