import React from 'react';
import PropTypes from 'prop-types';
import * as LucideIcons from 'lucide-react';

// Hardcoded explicit fallback fallback values to protect compilation pipeline robustness
export const CATEGORIES = [
  { id: 'all', label: 'All Feeds', iconName: 'Home', gradient: 'from-violet-500 to-indigo-600', activeBg: 'bg-violet-500' },
  { id: 'tasks', label: 'Tasks', iconName: 'ListTodo', gradient: 'from-sky-400 to-indigo-500', activeBg: 'bg-sky-500' },
  { id: 'projects', label: 'Projects', iconName: 'Briefcase', gradient: 'from-indigo-500 to-purple-600', activeBg: 'bg-indigo-500' },
  { id: 'spiritual', label: 'Spiritual', iconName: 'BookOpen', gradient: 'from-teal-500 to-emerald-600', activeBg: 'bg-teal-500' },
  { id: 'logistics', label: 'Logistics', iconName: 'ShoppingCart', gradient: 'from-rose-500 to-pink-600', activeBg: 'bg-rose-500' },
  { id: 'finance', label: 'Finances', iconName: 'Wallet', gradient: 'from-emerald-500 to-teal-600', activeBg: 'bg-emerald-500' },
  { id: 'kids', label: 'Kids Room', iconName: 'Gamepad2', gradient: 'from-amber-400 to-orange-500', activeBg: 'bg-amber-500' }
];

/**
 * Individual horizontal scrolling category capsule indicator
 */
export function CategoryPill({ label, iconName, isActive, onClick, count, gradient }) {
  // Safely resolve explicit Lucide React icons via mapping configuration keys
  const IconComponent = LucideIcons[iconName] || LucideIcons.HelpCircle;

  return (
    <button
      onClick={onClick}
      className={`group shrink-0 flex items-center gap-3 px-5 py-3 rounded-[1.4rem] font-bold text-xs uppercase tracking-wider border transition-all duration-300 transform active:scale-95 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.01)]
        ${isActive 
          ? `bg-gradient-to-r ${gradient} text-white border-transparent shadow-lg shadow-violet-500/10 scale-[1.02]` 
          : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800/80 hover:border-violet-300 dark:hover:border-violet-800 hover:text-slate-800 dark:hover:text-white'
        }`}
    >
      <div className={`p-1.5 rounded-xl transition-colors duration-300
        ${isActive 
          ? 'bg-white/20 text-white' 
          : 'bg-slate-50 dark:bg-slate-950 text-slate-400 group-hover:text-violet-500 dark:group-hover:text-violet-400'
        }`}
      >
        <IconComponent className="w-4 h-4 stroke-[2.5]" />
      </div>

      <span className="font-black tracking-widest">{label}</span>

      {count !== undefined && (
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ml-1 transition-colors
          ${isActive 
            ? 'bg-white/20 text-white' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

CategoryPill.propTypes = {
  label: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  count: PropTypes.number,
  gradient: PropTypes.string.isRequired
};

/**
 * Horizontally scrollable Category Filters ribbon panel wrapper component
 */
export default function CategoryFiltersBar({ activeCategory, onCategoryChange, tasks = [] }) {
  // Dynamically calculate quantitative counters matching specific application hubs
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return tasks.length;
    if (categoryId === 'tasks') return tasks.filter(t => !t.completed).length;
    if (categoryId === 'kids') return tasks.filter(t => t.assignee === 'Leo' && !t.completed).length;
    if (categoryId === 'projects') return tasks.filter(t => t.projectId).length;
    return undefined; // Hide count badges for specialized logging sections
  };

  return (
    <div className="w-full relative overflow-hidden py-2 select-none">
      {/* Scrollable Container track element */}
      <div className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1 px-1 custom-scrollbar scroll-smooth snap-x">
        {CATEGORIES.map((category) => (
          <div key={category.id} className="snap-center">
            <CategoryPill
              label={category.label}
              iconName={category.iconName}
              gradient={category.gradient}
              isActive={activeCategory === category.id}
              onClick={() => onCategoryChange(category.id)}
              count={getCategoryCount(category.id)}
            />
          </div>
        ))}
      </div>
      
      {/* Soft gradient edge masking fading tracks for premium scroll look */}
      <div className="absolute right-0 top-0 bottom-3 w-12 bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-950 pointer-events-none hidden sm:block" />
    </div>
  );
}

CategoryFiltersBar.propTypes = {
  activeCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  tasks: PropTypes.array
};
