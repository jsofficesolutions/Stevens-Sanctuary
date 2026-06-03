import React, { useState } from 'react';
import { FolderPlus, Folder, Trash2, Plus, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { cardBaseClasses, inputBaseClasses } from '../helpers';

export default function ProjectsTab({ projects, tasks, db, appId, userProfile, toggleTask }) {
    const [newProjectName, setNewProjectName] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [newProjectTask, setNewProjectTask] = useState('');

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), {
            name: newProjectName.trim(),
            createdAt: new Date().toISOString(),
            createdBy: userProfile?.name || 'System'
        });
        setNewProjectName('');
    };

    const handleAddProjectTask = async (e) => {
        e.preventDefault();
        if (!newProjectTask.trim() || !selectedProject) return;

        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
            title: newProjectTask.trim(),
            projectId: selectedProject.id,
            assignee: 'Unassigned',
            section: '',
            dueDate: null,
            timeLimit: null,
            recurrence: 'none',
            recurrenceDays: [],
            recurrenceEndDate: null,
            completed: false,
            nudged: false,
            subtasks: [],
            createdAt: new Date().toISOString(),
            createdBy: userProfile
        });
        setNewProjectTask('');
    };

    const handleDeleteProject = async (projectId, e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project folder? Linked tasks will remain unassigned.')) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', projectId));
            if (selectedProject?.id === projectId) {
                setSelectedProject(null);
            }
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500 w-full max-w-full overflow-hidden">
            <header>
                <h2 className="text-4xl font-black mb-2 tracking-tight">Projects</h2>
                <p className="text-slate-500 text-lg font-medium">Group workflows and assign tasks into top-level folders.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full max-w-full">
                {/* LEFT: PROJECT FOLDERS LIST & CREATION */}
                <div className="space-y-6 lg:col-span-1 w-full max-w-full">
                    {/* Fixed Creation Card Layout (image_1e850a.png Fix) */}
                    <div className={cardBaseClasses + " w-full max-w-full overflow-hidden"}>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">New Project Folder</h3>
                        <p className="text-slate-500 text-sm font-medium mb-6">Create top-level folders to organize related tasks and chores.</p>
                        
                        <form onSubmit={handleCreateProject} className="flex gap-2.5 items-center w-full max-w-full">
                            <input 
                                type="text" 
                                value={newProjectName} 
                                onChange={e => setNewProjectName(e.target.value)} 
                                placeholder="e.g. House Renovation" 
                                className={inputBaseClasses + " flex-1 min-w-0"} 
                                required
                            />
                            <button 
                                type="submit" 
                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 h-12 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 shrink-0"
                            >
                                <Plus className="w-5 h-5"/>
                            </button>
                        </form>
                    </div>

                    {/* PROJECT FOLDERS MANAGEMENT */}
                    <div className={cardBaseClasses + " w-full max-w-full"}>
                        <h3 className="font-black text-xl mb-4 tracking-tight flex items-center gap-2">
                            <Folder className="w-5 h-5 text-slate-400" /> Folders
                        </h3>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            {projects.map(project => {
                                const isSelected = selectedProject?.id === project.id;
                                const projectTaskCount = tasks.filter(t => t.projectId === project.id).length;
                                
                                return (
                                    <div 
                                        key={project.id}
                                        onClick={() => setSelectedProject(project)}
                                        className={`flex justify-between items-center p-4 rounded-2xl border cursor-pointer transition-all group ${
                                            isSelected 
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                                                : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-100 dark:border-slate-800/50 hover:bg-slate-100/70'
                                        }`}
                                    >
                                        <div className="flex flex-col overflow-hidden pr-2">
                                            <span className="font-bold truncate text-sm sm:text-base">{project.name}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                                                {projectTaskCount} {projectTaskCount === 1 ? 'task' : 'tasks'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-white translate-x-1' : 'text-slate-400 group-hover:translate-x-0.5'}`} />
                                            <button 
                                                type="button" 
                                                onClick={(e) => handleDeleteProject(project.id, e)} 
                                                className={`p-1 rounded-lg transition-opacity ${isSelected ? 'text-slate-400 hover:text-red-400' : 'text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100'}`}
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {projects.length === 0 && (
                                <p className="text-sm font-medium italic text-slate-400 text-center py-6">No project folders defined yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: SELECTED PROJECT INNER CONTENT VIEW */}
                <div className="lg:col-span-2 w-full max-w-full">
                    {selectedProject ? (
                        <div className={cardBaseClasses + " w-full max-w-full flex flex-col min-h-[510px]"}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5 mb-6 gap-4 w-full">
                                <div className="overflow-hidden">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Active Folder View</span>
                                    <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100 tracking-tight truncate">{selectedProject.name}</h3>
                                </div>
                            </div>

                            {/* ADD TASK INSIDE FOLDER CONTAINER */}
                            <form onSubmit={handleAddProjectTask} className="flex gap-2 mb-6 w-full max-w-full items-center">
                                <input 
                                    type="text" 
                                    value={newProjectTask} 
                                    onChange={e => setNewProjectTask(e.target.value)} 
                                    placeholder={`Add task directly into ${selectedProject.name}...`} 
                                    className={inputBaseClasses + " flex-1 min-w-0"} 
                                    required 
                                />
                                <button 
                                    type="submit" 
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 h-12 rounded-xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-md shrink-0"
                                >
                                    <Plus className="w-5 h-5"/>
                                </button>
                            </form>

                            {/* PROJECT FOLDER TASKS FEED */}
                            <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Pending Tasks</h4>
                                {tasks.filter(t => t.projectId === selectedProject.id && !t.completed).map(task => (
                                    <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 group hover:border-slate-200 transition-colors w-full max-w-full">
                                        <button onClick={() => toggleTask(task, userProfile)} className="transform transition-transform active:scale-75 shrink-0">
                                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-600" />
                                        </button>
                                        <div className="flex-1 overflow-hidden pr-2">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{task.title}</span>
                                            {task.assignee && task.assignee !== 'Unassigned' && (
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5 inline-block bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                                                    {task.assignee}
                                                </span>
                                            )}
                                        </div>
                                        <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                ))}

                                {tasks.filter(t => t.projectId === selectedProject.id && !t.completed).length === 0 && (
                                    <p className="text-sm font-semibold text-slate-400 italic py-6 text-center bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-100 dark:border-slate-800">No pending folder items listed.</p>
                                )}

                                {/* ARCHIVED / COMPLETED SEGMENT INSIDE FOLDER */}
                                {tasks.filter(t => t.projectId === selectedProject.id && t.completed).length > 0 && (
                                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 space-y-2 w-full max-w-full">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Completed</h4>
                                        {tasks.filter(t => t.projectId === selectedProject.id && t.completed).map(task => (
                                            <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl opacity-50 grayscale group w-full max-w-full">
                                                <button onClick={() => toggleTask(task, userProfile)} className="shrink-0">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                </button>
                                                <span className="flex-1 font-bold line-through text-slate-500 truncate">{task.title}</span>
                                                <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', task.id))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1 shrink-0">
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center min-h-[510px] bg-slate-50/20 w-full max-w-full">
                            <FolderPlus className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                            <h4 className="font-black text-lg text-slate-700 dark:text-slate-300 tracking-tight">No Folder Selected</h4>
                            <p className="text-sm text-slate-400 font-medium max-w-xs mt-1">Select a folder profile from the list to view embedded milestones, chores, and complete project breakdowns.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
