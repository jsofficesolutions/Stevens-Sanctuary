import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Check, Plus, Trash2, FileText, Calendar, CloudLightning } from 'lucide-react';
import { cardBaseClasses, inputBaseClasses } from '../helpers';

export default function FamilySpiritualTab({
  spiritualData,
  familyDocs,
  onUpdateSpiritual,
  onAddFamilyDoc,
  onDeleteFamilyDoc
}) {
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Identity');

  // Hardcoded structure matching adult profile scope
  const memberKeys = ['husband', 'wife'];
  const trackingMetrics = [
    { key: 'word', label: 'Scripture Devotional Word' },
    { key: 'prayer', label: 'Intercessory Prayer Engine' },
    { key: 'worship', label: 'Liturgical Praise Alignment' }
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

    onAddFamilyDoc({
      name: newDocName.trim(),
      url: newDocUrl.trim(),
      category: newDocCategory,
      uploadedAt: new Date().toISOString()
    });

    setNewDocName('');
    setNewDocUrl('');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Info */}
      <div className="border-b border-slate-700/50 pb-4">
        <h2 className="text-xl font-semibold text-slate-100">Family & Spiritual Architecture</h2>
        <p className="text-xs text-slate-400 mt-1">Govern internal devotional verification records alongside secure identity telemetry documentation storage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Worship Checklist Matrices */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`${cardBaseClasses} p-5 border border-slate-800`}>
            <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Daily Devotional Verification Matrix
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memberKeys.map((member) => (
                <div key={member} className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/60 space-y-3">
                  <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase block border-b border-slate-800 pb-1.5 capitalize">
                    {member} Core Metrics
                  </span>
                  <div className="space-y-2">
                    {trackingMetrics.map((metric) => {
                      const isChecked = spiritualData?.dailyChecklist?.[member]?.[metric.key] || false;
                      return (
                        <button
                          key={metric.key}
                          onClick={() => handleToggleCheck(member, metric.key)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 ${
                            isChecked
                              ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-200'
                              : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="text-xs font-medium">{metric.label}</span>
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-indigo-500 border-indigo-400' : 'border-slate-700'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Historical Verification Ring Circles Indicator */}
            <div className="mt-5 pt-4 border-t border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                Past Multi-Week Cadence Log History
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {Array.from({ length: 14 }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-[10px] text-emerald-400 font-semibold select-none"
                    title="All systems verified compliant"
                  >
                    ✓
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cloud-Linked Family Vault Documentation Vault */}
        <div className="space-y-4">
          <div className={`${cardBaseClasses} p-5 border border-slate-800 flex flex-col h-full`}>
            <h3 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Cloud Document Registry
            </h3>

            <form onSubmit={handleDocSubmit} className="space-y-3 mb-4 bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
              <div>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Document metadata title..."
                  className={`${inputBaseClasses} text-xs py-1.5`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="url"
                  required
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  placeholder="Secure Cloud Target URL"
                  className={`${inputBaseClasses} text-xs py-1.5`}
                />
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  className={`${inputBaseClasses} text-xs py-1.5`}
                >
                  <option value="Identity">Identity Vault</option>
                  <option value="Medical">Medical Records</option>
                  <option value="Finance">Legal Contracts</option>
                  <option value="Spiritual">Spiritual Archives</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Inject Asset Anchor
              </button>
            </form>

            {/* Document Resource Stream */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[260px] pr-1">
              {familyDocs && familyDocs.length > 0 ? (
                familyDocs.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="flex items-center justify-between p-2.5 bg-slate-900/50 rounded-xl border border-slate-800/60 group hover:border-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CloudLightning className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <div className="truncate">
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs font-medium text-slate-300 hover:text-indigo-400 underline block truncate"
                        >
                          {doc.name}
                        </a>
                        <span className="text-[9px] text-slate-500 block uppercase tracking-tight">{doc.category}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteFamilyDoc(doc.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                      title="Deallocate asset link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs italic">
                  No secure asset points pinned to this environment workspace cloud stream.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

FamilySpiritualTab.propTypes = {
  spiritualData: PropTypes.shape({
    dailyChecklist: PropTypes.objectOf(
      PropTypes.objectOf(PropTypes.bool)
    )
  }).isRequired,
  familyDocs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      uploadedAt: PropTypes.string.isRequired
    })
  ).isRequired,
  onUpdateSpiritual: PropTypes.func.isRequired,
  onAddFamilyDoc: PropTypes.func.isRequired,
  onDeleteFamilyDoc: PropTypes.func.isRequired
};
