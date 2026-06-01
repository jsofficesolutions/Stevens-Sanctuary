import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  ChevronDown, ChevronUp, FolderPlus, FileText, 
  Trash2, Edit3, ArrowUp, ArrowDown, Plus, X 
} from 'lucide-react';
import { cardBaseClasses, inputBaseClasses } from '../helpers';

export default function ProjectTabs({ 
  projects, 
  onUpdateProject, 
  onDeleteProject, 
  onCreateProject 
}) {
  const [activeAccordionId, setActiveAccordionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [editFileName, setEditFileName] = useState('');

  const toggleAccordion = (id) => {
    setActiveAccordionId(activeAccordionId === id ? null : id);
  };

  const handleMoveProject = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === projects.length - 1) return;

    const updatedProjects = [...projects];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const [movedProject] = updatedProjects.splice(index, 1);
    updatedProjects.splice(targetIndex, 0, movedProject);

    updatedProjects.forEach((proj, idx) => {
      onUpdateProject(proj.id, { ...proj, sortOrder: idx });
    });
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    onCreateProject({
      name: newFolderName.trim(),
      files: [],
      createdAt: new Date().toISOString(),
      sortOrder: projects.length
    });

    setNewFolderName('');
    setIsModalOpen(false);
  };

  const handleAddFile = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newFile = {
      id: `file_${Date.now()}`,
      name: 'Untitled Document.txt',
      updatedAt: new Date().toISOString()
    };

    onUpdateProject(projectId, {
      ...project,
      files: [...(project.files || []), newFile]
    });
  };

  const handleRenameFile = (projectId, fileId) => {
    if (!editFileName.trim()) return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedFiles = project.files.map(f => 
      f.id === fileId ? { ...f, name: editFileName.trim(), updatedAt: new Date().toISOString() } : f
    );

    onUpdateProject(projectId, { ...project, files: updatedFiles });
    setEditingFileId(null);
    setEditFileName('');
  };

  const handleDeleteFile = (projectId, fileId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedFiles = project.files.filter(f => f.id !== fileId);
    onUpdateProject(projectId, { ...project, files: updatedFiles });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Project Workspace Modules</h2>
          <p className="text-xs text-slate-400 mt-1">Manage localized digital structures, document files, and structural ordering matrices.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all duration-200 transform active:scale-95 shadow-lg shadow-indigo-600/20"
        >
          <FolderPlus className="w-4 h-4" />
          New Directory
        </button>
      </div>

      <div className="space-y-3">
        {projects.map((project, index) => {
          const isOpen = activeAccordionId === project.id;
          return (
            <div 
              key={project.id} 
              className={`${cardBaseClasses} border border-slate-800 overflow-hidden transition-all duration-300 ${isOpen ? 'ring-1 ring-indigo-500/30' : ''}`}
            >
              {/* Accordion Header */}
              <div className="flex items-center justify-between p-4 bg-slate-900/40 select-none">
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleAccordion(project.id)}>
                  <div className="text-slate-400 hover:text-slate-200 transition-colors">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-200 text-sm md:text-base">{project.name}</h3>
                    <p className="text-xs text-slate-500">{project.files?.length || 0} nested resources</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <button 
                    onClick={() => handleMoveProject(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleMoveProject(index, 'down')}
                    disabled={index === projects.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleAddFile(project.id)}
                    className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                    title="Add File"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDeleteProject(project.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Directory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Accordion Content Panel */}
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isOpen ? 'max-h-[1000px] border-t border-slate-800/60' : 'max-h-0'
                }`}
              >
                <div className="p-4 bg-slate-950/20 space-y-2">
                  {project.files && project.files.length > 0 ? (
                    project.files.map((file) => (
                      <div 
                        key={file.id} 
                        className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800/40 hover:border-slate-700/40 group transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          {editingFileId === file.id ? (
                            <div className="flex items-center gap-2 flex-1 max-w-md">
                              <input
                                type="text"
                                value={editFileName}
                                onChange={(e) => setEditFileName(e.target.value)}
                                className={`${inputBaseClasses} text-sm py-1 px-2`}
                                autoFocus
                              />
                              <button 
                                onClick={() => handleRenameFile(project.id, file.id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs transition-colors"
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingFileId(null)}
                                className="p-1 text-slate-400 hover:text-slate-200"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="truncate">
                              <span className="text-slate-300 text-sm font-medium block truncate">{file.name}</span>
                              <span className="text-[10px] text-slate-500 block">Mod: {new Date(file.updatedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {editingFileId !== file.id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => {
                                setEditingFileId(file.id);
                                setEditFileName(file.name);
                              }}
                              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                              title="Rename File"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(project.id, file.id)}
                              className="p-1.5 rounded-md text-rose-400 hover:bg-rose-950/40 transition-colors"
                              title="Delete File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No document files mapped inside this workspace scope. Click the plus button above to add files.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`${cardBaseClasses} max-w-md w-full border border-slate-800 p-6 space-y-4 shadow-2xl relative`}>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-medium text-slate-100">Initialize New System Directory</h3>
              <p className="text-xs text-slate-400 mt-1">Specify structural target identity inside the local hierarchy tree.</p>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Directory Name</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g., Core Systems Engineering"
                  className={inputBaseClasses}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-600/10 transition-colors"
                >
                  Create Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

ProjectTabs.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      sortOrder: PropTypes.number.isRequired,
      files: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          updatedAt: PropTypes.string.isRequired
        })
      )
    })
  ).isRequired,
  onUpdateProject: PropTypes.func.isRequired,
  onDeleteProject: PropTypes.func.isRequired,
  onCreateProject: PropTypes.func.isRequired
};
