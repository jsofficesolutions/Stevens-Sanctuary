import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Calendar, Timer, Repeat, AtSign, User, Check, Sparkles } from 'lucide-react';
import { inputBaseClasses, WEEK_DAYS } from '../helpers';

/**
 * Animated High-Fidelity Toggle/Switch Option with tactile feedback styles
 */
export function AnimatedToggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_4px_15px_-3px_rgba(109,40,217,0.01)] transition-all duration-300">
      <div className="flex flex-col pr-4">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">{label}</span>
        {description && <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">{description}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-400 dark:focus:ring-offset-slate-900 ${
          checked ? 'bg-violet-500' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

AnimatedToggle.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string
};

/**
 * Custom Date Input layout showcasing custom-designed trigger actions
 */
export function CustomDateInput({ value, onChange, label, min }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">{label}</label>}
      <div className="relative flex items-center group w-full">
        <div className="absolute left-4 text-slate-400 group-focus-within:text-violet-500 transition-colors pointer-events-none">
          <Calendar className="w-4 h-4 stroke-[2.2]" />
        </div>
        <input
          type="date"
          value={value || ''}
          min={min}
          onChange={(e) => onChange(e.target.value || null)}
          className={`${inputBaseClasses} w-full pl-11 cursor-pointer`}
        />
      </div>
    </div>
  );
}

CustomDateInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  min: PropTypes.string
};

/**
 * Parameter Configuration Grid capturing Task timer values and recurrent schedules
 */
export function ParameterConfigGrid({
  timeLimit,
  onTimeLimitChange,
  recurrence,
  onRecurrenceChange,
  recurrenceDays,
  onRecurrenceDaysChange,
  recurrenceEndDate,
  onRecurrenceEndDateChange
}) {
  return (
    <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-5 space-y-5 shadow-inner">
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 block px-1">
        Operational Parameters
      </span>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timer Config */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-amber-500" /> Task Time Limit
          </label>
          <div className="relative flex items-center w-full">
            <input
              type="number"
              value={timeLimit || ''}
              onChange={(e) => onTimeLimitChange(e.target.value ? Number(e.target.value) : null)}
              placeholder="No active limit"
              className={`${inputBaseClasses} w-full pr-14`}
              min="1"
            />
            <span className="absolute right-4 text-xs font-bold uppercase tracking-wider text-slate-400 pointer-events-none">
              Mins
            </span>
          </div>
        </div>

        {/* Recurrence Trigger Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-indigo-500" /> Recurrence Cadence
          </label>
          <select
            value={recurrence || 'none'}
            onChange={(e) => {
              onRecurrenceChange(e.target.value);
              onRecurrenceDaysChange([]);
            }}
            className={`${inputBaseClasses} w-full cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat`}
          >
            <option value="none">Once (Non-recurring)</option>
            <option value="daily">Daily Cycle</option>
            <option value="weekly">Weekly Cycle</option>
            <option value="biweekly">Biweekly Cycle</option>
            <option value="monthly">Monthly Cycle</option>
          </select>
        </div>
      </div>

      {/* Weekday selection subset logic */}
      {(recurrence === 'weekly' || recurrence === 'biweekly') && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block px-1">
            Execute on Selected Days
          </label>
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
            {WEEK_DAYS.map((day) => {
              const isSelected = recurrenceDays.includes(day.v);
              return (
                <button
                  key={day.v}
                  type="button"
                  onClick={() => {
                    const nextDays = isSelected
                      ? recurrenceDays.filter((d) => d !== day.v)
                      : [...recurrenceDays, day.v].sort();
                    onRecurrenceDaysChange(nextDays);
                  }}
                  className={`flex-1 min-w-[36px] h-9 rounded-xl font-black text-xs transition-all duration-200 transform active:scale-90 flex items-center justify-center border ${
                    isSelected
                      ? 'bg-gradient-to-tr from-violet-500 to-indigo-600 text-white border-transparent shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                >
                  {day.l}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recurrence End Conditions */}
      {recurrence !== 'none' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <CustomDateInput
            label="Recurrence End Cut-off Date (Optional)"
            value={recururrenceEndDate || ''}
            onChange={onRecurrenceEndDateChange}
          />
        </div>
      )}
    </div>
  );
}

ParameterConfigGrid.propTypes = {
  timeLimit: PropTypes.number,
  onTimeLimitChange: PropTypes.func.isRequired,
  recurrence: PropTypes.string.isRequired,
  onRecurrenceChange: PropTypes.func.isRequired,
  recurrenceDays: PropTypes.arrayOf(PropTypes.number).isRequired,
  onRecurrenceDaysChange: PropTypes.func.isRequired,
  recurrenceEndDate: PropTypes.string,
  onRecurrenceEndDateChange: PropTypes.func.isRequired
};

/**
 * Profile User Mention Textarea Input containing auto-complete overlay anchors
 */
export function ProfileMentionInput({ value, onChange, placeholder, systemUsers, activeProfile }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [triggerIdx, setTriggerIdx] = useState(-1);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange(text);

    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1 && (lastAtIdx === 0 || /\s/.test(textBeforeCursor[lastAtIdx - 1]))) {
      const textAfterAt = textBeforeCursor.slice(lastAtIdx + 1);
      if (!/\s/.test(textAfterAt)) {
        setTriggerIdx(lastAtIdx);
        setSearchQuery(textAfterAt.toLowerCase());
        setShowSuggestions(true);
        return;
      }
    }
    setShowSuggestions(false);
  };

  const selectUserSuggestion = (userName) => {
    if (triggerIdx === -1 || !textareaRef.current) return;
    const currentCursor = textareaRef.current.selectionStart;
    const beforeMention = value.slice(0, triggerIdx);
    const afterCursor = value.slice(currentCursor);
    
    const insertedText = `${beforeMention}@${userName} ${afterCursor}`;
    onChange(insertedText);
    setShowSuggestions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = triggerIdx + userName.length + 2; 
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  };

  const filteredUsers = systemUsers.filter((u) => {
    const isMatched = u.name.toLowerCase().includes(searchQuery);
    return isMatched && u.name !== activeProfile;
  });

  return (
    <div ref={containerRef} className="relative flex flex-col w-full">
      <div className="relative flex w-full">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`${inputBaseClasses} w-full min-h-[100px] resize-none pr-10 leading-relaxed py-4`}
        />
        <div className="absolute right-4 top-4 text-slate-300 pointer-events-none">
          <AtSign className="w-4 h-4" />
        </div>
      </div>

      {/* Suggestion Dropdown Panel */}
      {showSuggestions && filteredUsers.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mention Household Member</span>
            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/20" />
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => selectUserSuggestion(u.name)}
                className="w-full px-4 py-3 text-left hover:bg-violet-50/50 dark:hover:bg-slate-800/60 flex items-center justify-between group font-semibold text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-slate-800 text-violet-600 dark:text-violet-300 flex items-center justify-center font-black text-[10px]">
                    {u.name.charAt(0)}
                  </div>
                  <span className="text-slate-700 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 font-bold transition-colors">
                    {u.name}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md">
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

ProfileMentionInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  systemUsers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired
    })
  ).isRequired,
  activeProfile: PropTypes.string
};
