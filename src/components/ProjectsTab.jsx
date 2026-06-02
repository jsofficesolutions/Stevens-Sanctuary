import React, { useState } from 'react'; // <-- Add
import { Plus, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Edit2, Trash2 } from 'lucide-react'; // <-- Add
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'; // <-- Add
import { cardBaseClasses, inputBaseClasses, WEEK_DAYS } from '../helpers'; // <-- Add
import { TaskRow } from './TaskComponents'; // <-- Add
import { PromptModal, ConfirmModal } from './Modals'; // <-- Add

export function ProjectsTab({ tasks, projects, userProfile, onOpenTask, db, appId, user, systemUsers, toggleTask, logActivity, sendNotification }) {
    
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

            <div className="space-y-4">
                {sortedProjects.map((p, index) => {
                    const pTasks = tasks.filter(t => t.projectId === p.id);
                    const activeCount = pTasks.filter(t=>!t.completed).length;
                    const sections = p.sections || ['General'];
                    const isExpanded = expandedProjects.includes(p.id);
                    
                    return (
                        <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-all duration-300">
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

            {actionModal?.type === 'editProject' && <PromptModal title="Rename Project" initialValue={projects.find(p=>p.id===actionModal.targetId)?.name} onSave={executeAction} onCancel={()=>setActionModal(null)} />}
            {actionModal?.type === 'deleteProject' && <ConfirmModal title="Delete Project?" message="Are you sure you want to delete this project? Its tasks will be moved to General." onConfirm={executeAction} onCancel={()=>setActionModal(null)} />}
            {actionModal?.type === 'editSection' && <PromptModal title="Rename Section" initialValue={actionModal.sectionName} onSave={executeAction} onCancel={()=>setActionModal(null)} />}
            {actionModal?.type === 'deleteSection' && <ConfirmModal title="Delete Section?" message={`Delete the section "${actionModal.sectionName}"? Tasks will be moved to General.`} onConfirm={executeAction} onCancel={()=>setActionModal(null)} />}
        </div>
    );
}
