import React, { useState } from 'react';
import {
  ActiveView,
  AuditPara,
  AuditSession,
  DocumentFile,
} from './types/audit';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuditWorkspace } from './components/AuditWorkspace';
import { CommercialAuditWord } from './components/CommercialAuditWord';
import { AuditVaultModal } from './components/AuditVaultModal';
import { NewSessionModal } from './components/NewSessionModal';
import { exportReportToDocx } from './utils/docxExport';

export default function App() {
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [currentSession, setCurrentSession] = useState<AuditSession | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('workspace');
  const [selectedModel, setSelectedModel] = useState<string>('nvidia/nemotron-3.5-lightning:free');

  // Modals & Drawers
  const [isNewSessionOpen, setIsNewSessionOpen] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [dualViewOpen, setDualViewOpen] = useState<boolean>(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | undefined>(undefined);

  // Switch to Word Editor with a specific Para in view
  const handleOpenInWord = (para: AuditPara) => {
    setActiveView('word_editor');
  };

  // Append a Para to Word Editor report
  const handleAppendToWord = (para: AuditPara) => {
    if (!currentSession) return;
    setCurrentSession((prev) => {
      if (!prev) return prev;
      const exists = prev.paras.some((p) => p.id === para.id);
      if (exists) return prev;
      return {
        ...prev,
        paras: [...prev.paras, para],
      };
    });
  };

  // Export current session to DOCX
  const handleExportDocx = () => {
    if (!currentSession) return;
    exportReportToDocx({
      entityName: currentSession.entityName,
      financialYear: currentSession.financialYear,
      auditScope: currentSession.auditScope,
      executiveSummary: currentSession.executiveSummary,
      totalAmount: currentSession.totalIrregularityAmount,
      paras: currentSession.paras,
    });
  };

  // Print PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // Update Paras from Workspace analysis
  const handleUpdateSessionParas = (
    newParas: AuditPara[],
    totalAmount?: string,
    summary?: string
  ) => {
    if (!currentSession) return;
    const updated: AuditSession = {
      ...currentSession,
      paras: newParas,
      totalIrregularityAmount: totalAmount || currentSession.totalIrregularityAmount,
      executiveSummary: summary || currentSession.executiveSummary,
    };
    setCurrentSession(updated);
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  // Add Uploaded Documents to Session
  const handleAddDocuments = (newDocs: DocumentFile[]) => {
    if (!currentSession) return;
    const updatedDocs = [...currentSession.documents, ...newDocs];
    const updated: AuditSession = {
      ...currentSession,
      documents: updatedDocs,
    };
    setCurrentSession(updated);
    if (!selectedDoc && updatedDocs.length > 0) {
      setSelectedDoc(updatedDocs[0]);
    }
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  // Create New Session
  const handleCreateSession = (newSession: AuditSession) => {
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSession(newSession);
    setSelectedDoc(undefined);
    setActiveView('workspace');
  };

  // Select Session from Vault
  const handleSelectSession = (session: AuditSession) => {
    setCurrentSession(session);
    setSelectedDoc(session.documents[0] || undefined);
    setActiveView('workspace');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Official Government Left Sidebar */}
      <Sidebar
        currentSession={currentSession}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenNewSession={() => setIsNewSessionOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        onSelectDocument={(doc) => {
          setSelectedDoc(doc);
          setDualViewOpen(true);
        }}
        selectedDocId={selectedDoc?.id}
      />

      {/* Main Right Content Section */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Government Portal Header */}
        <Header
          currentSession={currentSession}
          activeView={activeView}
          setActiveView={setActiveView}
          dualViewOpen={dualViewOpen}
          setDualViewOpen={setDualViewOpen}
          onExportDocx={handleExportDocx}
          onPrintPdf={handlePrintPdf}
          parasCount={currentSession?.paras.length || 0}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />

        {/* View Switcher: Interactive Audit Workspace vs Commercial Audit Word */}
        {activeView === 'workspace' ? (
          <AuditWorkspace
            currentSession={currentSession}
            selectedModel={selectedModel}
            onOpenInWord={handleOpenInWord}
            onAppendToWord={handleAppendToWord}
            dualViewOpen={dualViewOpen}
            setDualViewOpen={setDualViewOpen}
            selectedDoc={selectedDoc}
            setSelectedDoc={setSelectedDoc}
            onUpdateSessionParas={handleUpdateSessionParas}
            onAddDocuments={handleAddDocuments}
            onOpenNewSession={() => setIsNewSessionOpen(true)}
          />
        ) : (
          <CommercialAuditWord
            currentSession={currentSession}
            activeParas={currentSession?.paras || []}
            onBackToWorkspace={() => setActiveView('workspace')}
            selectedModel={selectedModel}
          />
        )}
      </div>

      {/* Modals */}
      <NewSessionModal
        isOpen={isNewSessionOpen}
        onClose={() => setIsNewSessionOpen(false)}
        onCreateSession={handleCreateSession}
      />

      <AuditVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        sessions={sessions}
        activeSessionId={currentSession?.id || ''}
        onSelectSession={handleSelectSession}
      />
    </div>
  );
}
