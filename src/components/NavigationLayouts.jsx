function NavItem({ icon, label, active, onClick, color, bgColor }) {
  return (
    <button onClick={onClick} className={`flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-4 p-2 md:p-3.5 rounded-2xl transition-all duration-200 w-full group ${active ? `${bgColor} shadow-sm` : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400'}`}>
      <div className={`transition-transform duration-200 group-active:scale-95 ${active ? color : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>{React.cloneElement(icon, { className: 'w-6 h-6 md:w-5 md:h-5' })}</div>
      <span className={`text-[10px] md:text-[13px] font-bold tracking-wide transition-colors ${active ? 'text-slate-900 dark:text-white' : ''}`}>{label}</span>
    </button>
  );
}
