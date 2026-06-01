import React, { useState } from 'react';
import { Check, Plus, Trash2, FileText, Heart } from 'lucide-react';
import { cardBaseClasses, inputBaseClasses } from '../helpers';

export default function FamilySpiritualTab({ spiritualData, familyDocs, onUpdateSpiritual, onAddFamilyDoc, onDeleteFamilyDoc }) {
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  const members = ['Jordan', 'Biljana'];
  const metrics = [
    { key: 'bible', label: 'Bible Reading' },
    { key: 'prayer', label: 'Prayer Time' }
  ];

  const handleToggleCheck = (member, metricKey) => {
    const currentStatus = spiritualData?.dailyChecklist?.[member]?.[metricKey] || false;
    onUpdateSpiritual({
      ...spiritualData,
      dailyChecklist: {
        ...(spiritualData?.dailyChecklist || {}),
        [member]: {
          ...(spiritualData?.dailyChecklist?.[member] || {}),
          [metricKey]: !currentStatus
        }
      }
    });
  };

  const handleDocSubmit = (e) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocUrl.trim()) return;
    onAddFamilyDoc({ id: `doc_${Date.now()}`, name: newDocName.trim(), url: newDocUrl.trim() });
    setNewDocName(''); setNewDocUrl('');
  };

  return (
    <div className="w-full space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Faith & Family Documents</h2>
        <p className="text-sm text-slate-500 mt-1">A space for our family's daily habits and important document links.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${cardBaseClasses} p-6`}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" /> Daily Habits
          </h3>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-3">{member}</span>
                <div className="flex gap-3">
                  {metrics.map((metric) => {
                    const isChecked = spiritualData?.dailyChecklist?.[member]?.[metric.key] || false;
                    return (
                      <button
                        key={metric.key}
                        onClick={() => handleToggleCheck(member, metric.key)}
                        className={`flex-1 flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isChecked ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-300' : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold">{metric.label}</span>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isChecked ? 'bg-rose-500 border-rose-500' : 'border-slate-300'}`}>
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${cardBaseClasses} p-6`}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-500" /> Family Documents
          </h3>
          <form onSubmit={handleDocSubmit} className="space-y-3 mb-6">
            <input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="e.g., Passports Folder" className={`${inputBaseClasses} w-full text-sm py-2`} />
            <div className="flex gap-2">
              <input type="url" value={newDocUrl} onChange={(e) => setNewDocUrl(e.target.value)} placeholder="Link URL" className={`${inputBaseClasses} flex-[2] text-sm py-2`} />
              <button type="submit" className="flex-1 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-colors">Add Link</button>
            </div>
          </form>
          <div className="space-y-2">
            {familyDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline">{doc.name}</a>
                <button onClick={() => onDeleteFamilyDoc(doc.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
