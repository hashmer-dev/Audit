import React, { useState } from 'react';
import {
  X,
  Search,
  Scale,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import { Rulebook } from '../types/audit';
import { PunjabLogo } from './PunjabLogo';

interface RulesLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rulebooks: Rulebook[];
  onAddCustomRule: (rule: Rulebook) => void;
}

export const RulesLibraryModal: React.FC<RulesLibraryModalProps> = ({
  isOpen,
  onClose,
  rulebooks,
  onAddCustomRule,
}) => {
  const [selectedRulebookId, setSelectedRulebookId] = useState<string>(
    rulebooks[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedClause, setCopiedClause] = useState<string | null>(null);

  // New Rule / SRO form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAuthority, setNewAuthority] = useState<string>('');
  const [newSection, setNewSection] = useState<string>('');
  const [newSectionTitle, setNewSectionTitle] = useState<string>('');
  const [newText, setNewText] = useState<string>('');

  if (!isOpen) return null;

  const activeRulebook =
    rulebooks.find((r) => r.id === selectedRulebookId) || rulebooks[0];

  const filteredSections = activeRulebook?.sections.filter((s) => {
    if (!searchQuery) return true;
    return (
      s.sectionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  const handleCopyClause = (clauseText: string, ruleNum: string) => {
    navigator.clipboard.writeText(`${ruleNum}: ${clauseText} (${activeRulebook.title})`);
    setCopiedClause(ruleNum);
    setTimeout(() => setCopiedClause(null), 2000);
  };

  const handleSaveCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSection) return;

    const customRule: Rulebook = {
      id: `custom-rule-${Date.now()}`,
      title: newTitle,
      shortCode: newTitle.slice(0, 8).toUpperCase(),
      authority: newAuthority || 'Government of the Punjab',
      year: '2024',
      clausesCount: 1,
      summary: 'Custom statutory rule / regulatory circular uploaded by auditor.',
      content: newText,
      sections: [
        {
          sectionNumber: newSection,
          title: newSectionTitle || 'Statutory Requirement',
          text: newText,
        },
      ],
    };

    onAddCustomRule(customRule);
    setSelectedRulebookId(customRule.id);
    setShowAddForm(false);
    setNewTitle('');
    setNewAuthority('');
    setNewSection('');
    setNewSectionTitle('');
    setNewText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-xl overflow-hidden animate-scaleUp">
        {/* Modal Header with Punjab Logo */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <PunjabLogo size="md" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Rules & Regulations Library</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-300 font-bold">
                  Statutory Reference Code
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Government of the Punjab &bull; PPRA & Financial Rules Regulatory Library
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer font-semibold"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>{showAddForm ? 'View Rulebooks' : 'Add Custom SRO/Rule'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {showAddForm ? (
          <form onSubmit={handleSaveCustomRule} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 bg-white">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-700" />
              <span>Register Custom Regulatory Statutory Order (SRO) / Rulebook</span>
            </h3>
            <p className="text-slate-500">
              Add provincial procurement rules (e.g., Punjab Procurement Rules 2014, Punjab Finance Acts) or specialized departmental regulations to the AI's cross-referencing engine.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Rulebook / Act Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Punjab Procurement Rules, 2014"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-emerald-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Enacting Authority</label>
                <input
                  type="text"
                  placeholder="e.g. Punjab PPRA / Finance Department Punjab"
                  value={newAuthority}
                  onChange={(e) => setNewAuthority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-emerald-700 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Section / Rule Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rule 12(1)"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-emerald-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Clause Subject / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Prohibition on Splitting of Procurements"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-emerald-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">Legal Text / Provision *</label>
              <textarea
                rows={5}
                required
                placeholder="Paste the statutory clause text here..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-emerald-700 font-mono text-[11px]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                Save and Register into AI Engine
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Rulebook Selector List */}
            <div className="w-1/3 bg-slate-50 border-r border-slate-200 p-3 space-y-2 overflow-y-auto">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block px-2">
                Available Statutes ({rulebooks.length})
              </span>
              {rulebooks.map((rule) => {
                const isSelected = rule.id === selectedRulebookId;
                return (
                  <button
                    key={rule.id}
                    onClick={() => setSelectedRulebookId(rule.id)}
                    className={`w-full text-left p-3 rounded-xl transition border cursor-pointer ${
                      isSelected
                        ? 'bg-white border-emerald-700 text-emerald-950 shadow-xs ring-1 ring-emerald-700/50'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{rule.shortCode}</span>
                      <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                        {rule.clausesCount} Clauses
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-700 line-clamp-1">{rule.title}</p>
                    <p className="text-[9px] text-slate-500 mt-1 truncate">{rule.authority}</p>
                  </button>
                );
              })}
            </div>

            {/* Sections & Clauses View */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* Search Bar for Clauses */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder={`Search ${activeRulebook.shortCode} clauses (e.g. "Rule 12", "Mobilization Advance", "Tax")...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 text-xs text-slate-900 outline-none placeholder-slate-400 font-medium"
                />
              </div>

              {/* Clauses Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100">
                <div className="p-3 bg-white border border-slate-200 rounded-xl mb-3 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900">{activeRulebook.title}</h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">{activeRulebook.summary}</p>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Enacted by: {activeRulebook.authority} &bull; {activeRulebook.year}
                  </div>
                </div>

                {filteredSections.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
                    No matching clauses found for "{searchQuery}".
                  </div>
                ) : (
                  filteredSections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                            {sec.sectionNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{sec.title}</span>
                        </div>
                        <button
                          onClick={() => handleCopyClause(sec.text, sec.sectionNumber)}
                          className="flex items-center gap-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-1 rounded transition border border-slate-300 cursor-pointer shrink-0 font-medium"
                          title="Copy rule citation"
                        >
                          {copiedClause === sec.sectionNumber ? (
                            <Check className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedClause === sec.sectionNumber ? 'Copied' : 'Cite'}</span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-800 font-serif leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                        {sec.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
