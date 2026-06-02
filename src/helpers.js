// Add 'export' to each declaration below:

export const getMonday = (offset = 0) => {
    const d = new Date();
    const day = d.getDay() || 7; 
    d.setDate(d.getDate() - day + 1 + (offset * 7));
    d.setHours(0,0,0,0);
    return d.toISOString().split('T')[0];
};

export const getCurrentMonthId = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const calculateNextDueDate = (dateStr, recurrence, specificDays = []) => {
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

export const formatDueDate = (dateStr) => {
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

export const WEEK_DAYS = [{l:'M', v:1}, {l:'T', v:2}, {l:'W', v:3}, {l:'T', v:4}, {l:'F', v:5}, {l:'S', v:6}, {l:'S', v:7}];

// UI Helpers
export const inputBaseClasses = "bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm placeholder:text-slate-400";
export const cardBaseClasses = "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[1.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]";
