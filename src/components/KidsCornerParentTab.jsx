import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Star, ShieldAlert, Zap, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cardBaseClasses, inputBaseClasses } from '../helpers';

export default function KidsCornerParentTab({
  kidsTasks,
  kidsRewards,
  onAddTask,
  onDeleteTask,
  onProcessRewardOverride
}) {
  const [taskName, setTaskName] = useState('');
  const [taskDuration, setTaskDuration] = useState('15');
  const [taskPoints, setTaskPoints] = useState('1');
  const [targetChild, setTargetChild] = useState('Leo');

  const handleAddTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    onAddTask({
      id: `kid_task_${Date.now()}`,
      name: taskName.trim(),
      duration: `${taskDuration} Mins`,
      points: Number(taskPoints),
      assignedTo: targetChild,
      completedToday: false,
      timestamp: new Date().toISOString()
    });

    setTaskName('');
  };

  return (
    <div className="w-full space-y-6">
      {/* Visual Workspace Subheader Info */}
      <div className="border-b border-slate-700/50 pb-4">
        <h2 className="text-xl font-semibold text-slate-100">Kids Corner Parameter Controls</h2>
        <p className="text-xs text-slate-400 mt-1">Configure chore tasks timelines, allocate ledger point balances, and process compensation rewards state adjustments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Management & Assigner */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`${cardBaseClasses} p-5 border border-slate-800`}>
            <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              Active Functional Task Pipeline
            </h3>

            {/* Creation Form Injector */}
            <form onSubmit={handleAddTaskSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-800/60 mb-5">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Task Definition</label>
                <input
                  type="text"
                  required
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g., Structural Room Cleanup Sequence"
                  className={`${inputBaseClasses} text-xs py-1.5`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Time Profile</label>
                <select
                  value={taskDuration}
                  onChange={(e) => setTaskDuration(e.target.value)}
                  className={`${inputBaseClasses} text-xs py-1.5`}
                >
                  <option value="5">5 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <button
                  type="submit"
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" /> Bind Task
                </button>
              </div>
            </form>

            {/* Interactive Data List Stream */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {kidsTasks && kidsTasks.length > 0 ? (
                kidsTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 hover:border-slate-700/40 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${task.completedToday ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500'}`} />
                      <div className="truncate">
                        <span className="text-xs font-medium text-slate-300 block truncate">{task.name}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {task.duration}</span>
                          <span>•</span>
                          <span className="bg-indigo-950/60 border border-indigo-900 px-1 py-0.2 rounded text-[9px] text-indigo-400 font-bold">
                            +{task.points || 1} Star
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Deallocate Task Engine"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs italic">
                  No custom chore parameter nodes mapped to the active execution window.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rewards Allowance Override Operations Processor */}
        <div className="space-y-4">
          <div className={`${cardBaseClasses} p-5 border border-slate-800 flex flex-col h-full`}>
            <h3 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-indigo-400" />
              Compensation Claims Desk
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
              {kidsRewards && kidsRewards.length > 0 ? (
                kidsRewards.map((reward) => {
                  const isPending = reward.status === 'pending';
                  const isFulfilled = reward.status === 'fulfilled';

                  return (
                    <div 
                      key={reward.id} 
                      className={`p-3 rounded-xl border transition-all ${
                        isPending 
                          ? 'bg-amber-500/5 border-amber-500/20' 
                          : isFulfilled 
                            ? 'bg-slate-950/20 border-slate-900 opacity-60' 
                            : 'bg-slate-900/40 border-slate-800/60'
                      }`}
                    >
                      <div className="flex justify-between items-start text-xs gap-2">
                        <div>
                          <span className="font-semibold text-slate-300 block leading-tight">{reward.title}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block font-medium">Cost: {reward.starCost} Stars</span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isPending ? 'bg-amber-500/10 text-amber-400' : isFulfilled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {reward.status}
                        </span>
                      </div>

                      {/* Control Interceptors */}
                      {isPending && (
                        <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-800/60">
                          <button
                            onClick={() => onProcessRewardOverride(reward.id, 'fulfilled')}
                            className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve & Spend
                          </button>
                          <button
                            onClick={() => onProcessRewardOverride(reward.id, 'available')}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold rounded transition-colors"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs italic">
                  No reward requests or exchange tokens pending verification.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

KidsCornerParentTab.propTypes = {
  kidsTasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      duration: PropTypes.string.isRequired,
      points: PropTypes.number.isRequired,
      assignedTo: PropTypes.string,
      completedToday: PropTypes.bool.isRequired
    })
  ).isRequired,
  kidsRewards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      starCost: PropTypes.number.isRequired,
      status: PropTypes.oneOf(['available', 'pending', 'fulfilled']).isRequired
    })
  ).isRequired,
  onAddTask: PropTypes.func.isRequired,
  onDeleteTask: PropTypes.func.isRequired,
  onProcessRewardOverride: PropTypes.func.isRequired
};
