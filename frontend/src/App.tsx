import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ScannerPage } from './pages/ScannerPage';
import { FindingsPage } from './pages/FindingsPage';
import { PipelinePage } from './pages/PipelinePage';
import { RemediationPage } from './pages/RemediationPage';
import { RepositoriesPage } from './pages/RepositoriesPage';
import { ReportsPage } from './pages/ReportsPage';
import { HistoryPage } from './pages/HistoryPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { SettingsPage } from './pages/SettingsPage';
import { FindingModal } from './components/FindingModal';
import { Scan, Finding, Repository, SystemStatus } from './types';
import {
  fetchScans,
  fetchFindings,
  fetchRepositories,
  fetchSystemStatus,
  runDemoScan,
  submitFindingFeedback
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [scans, setScans] = useState<Scan[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [selectedFindingForModal, setSelectedFindingForModal] = useState<Finding | null>(null);
  const [selectedFindingForRemediation, setSelectedFindingForRemediation] = useState<Finding | null>(null);

  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load all initial data
  const refreshData = async () => {
    try {
      const [scansData, findingsData, reposData, statusData] = await Promise.all([
        fetchScans().catch(() => []),
        fetchFindings().catch(() => []),
        fetchRepositories().catch(() => []),
        fetchSystemStatus().catch(() => null),
      ]);

      setScans(scansData);
      setFindings(findingsData);
      setRepositories(reposData);
      setSystemStatus(statusData);

      if (scansData.length > 0 && !selectedScan) {
        setSelectedScan(scansData[0]);
      }
    } catch (err) {
      console.error('Data initialization error:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // One-click demo scan
  const handleRunDemo = async () => {
    setIsRunningDemo(true);
    try {
      const newScan = await runDemoScan();
      setSelectedScan(newScan);
      await refreshData();
      setActiveTab('scanner');
    } catch (err) {
      alert('Failed to run demo scan: ' + (err as any).message);
    } finally {
      setIsRunningDemo(false);
    }
  };

  const handleFeedback = async (findingId: string, decision: string, reason: string) => {
    await submitFindingFeedback(findingId, decision, reason);
    await refreshData();
  };

  const handleNavigateToRemediation = (finding: Finding) => {
    setSelectedFindingForRemediation(finding);
    setActiveTab('remediation');
  };

  const openFindingsCount = findings.filter(f => f.status === 'open').length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 flex flex-col font-sans cyber-grid selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar */}
      <Navbar
        status={systemStatus}
        onRunDemo={handleRunDemo}
        isRunningDemo={isRunningDemo}
        activeRepoName={repositories[0]?.name || 'Shadow-code'}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          openFindingsCount={openFindingsCount}
        />

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardPage
              scans={scans}
              findings={findings}
              onSelectScan={(s) => {
                setSelectedScan(s);
                setActiveTab('history');
              }}
              onOpenFinding={(f) => setSelectedFindingForModal(f)}
              onNavigate={setActiveTab}
              onRunDemo={handleRunDemo}
              isRunningDemo={isRunningDemo}
            />
          )}

          {activeTab === 'scanner' && (
            <ScannerPage
              onScanCompleted={(s) => {
                setSelectedScan(s);
                refreshData();
              }}
              onOpenFinding={(f) => setSelectedFindingForModal(f)}
              onNavigateToRemediation={handleNavigateToRemediation}
            />
          )}

          {activeTab === 'findings' && (
            <FindingsPage
              findings={findings}
              onOpenFinding={(f) => setSelectedFindingForModal(f)}
              onNavigateToRemediation={handleNavigateToRemediation}
              onFeedback={handleFeedback}
            />
          )}

          {activeTab === 'pipeline' && (
            <PipelinePage scan={selectedScan || scans[0] || null} />
          )}

          {activeTab === 'remediation' && (
            <RemediationPage
              findings={findings}
              selectedFinding={selectedFindingForRemediation}
              onRefreshFindings={refreshData}
            />
          )}

          {activeTab === 'repositories' && (
            <RepositoriesPage
              repositories={repositories}
              scans={scans}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage
              scans={scans}
              selectedScan={selectedScan}
              onSelectScan={setSelectedScan}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPage
              scans={scans}
              onSelectScan={setSelectedScan}
            />
          )}

          {activeTab === 'feedback' && (
            <FeedbackPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage status={systemStatus} />
          )}
        </main>
      </div>

      {/* Modal for detailed finding view & feedback */}
      <FindingModal
        finding={selectedFindingForModal}
        onClose={() => setSelectedFindingForModal(null)}
        onFeedback={handleFeedback}
        onNavigateToRemediation={handleNavigateToRemediation}
      />
    </div>
  );
}

export default App;
