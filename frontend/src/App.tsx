import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ScannerPage } from './pages/ScannerPage';
import { FindingsPage } from './pages/FindingsPage';
import { RemediationPage } from './pages/RemediationPage';
import { RepositoriesPage } from './pages/RepositoriesPage';
import { ReportsPage } from './pages/ReportsPage';
import { HistoryPage } from './pages/HistoryPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ChatbotPage } from './pages/ChatbotPage';
import { PullRequestsPage } from './pages/PullRequestsPage';
import { FindingModal } from './components/FindingModal';
import { Scan, Finding, Repository } from './types';
import {
  fetchScans,
  fetchFindings,
  fetchRepositories,
  fetchHealth,
  triggerScan,
  submitFindingFeedback
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [scans, setScans] = useState<Scan[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [selectedFindingForModal, setSelectedFindingForModal] = useState<Finding | null>(null);
  const [selectedFindingForRemediation, setSelectedFindingForRemediation] = useState<Finding | null>(null);

  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load all initial data from backend API
  const refreshData = async () => {
    try {
      const [scansData, findingsData, reposData, healthData] = await Promise.all([
        fetchScans().catch(() => []),
        fetchFindings().catch(() => []),
        fetchRepositories().catch(() => []),
        fetchHealth().catch(() => null),
      ]);

      setScans(scansData);
      setFindings(findingsData);
      setRepositories(reposData);
      setSystemStatus(healthData);

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

  // Quick action scan
  const handleRunDemo = async () => {
    setIsRunningDemo(true);
    try {
      const repoId = repositories[0]?.id || 'repo-shadow-code';
      const newScan = await triggerScan({
        repository_id: repoId,
        branch: 'main',
        trigger: 'dashboard_action'
      });
      setSelectedScan(newScan);
      await refreshData();
      setActiveTab('scanner');
    } catch (err: any) {
      alert('Failed to execute scan: ' + (err.message || 'Error'));
    } finally {
      setIsRunningDemo(false);
    }
  };

  const handleNavigateToRemediation = (finding: Finding) => {
    setSelectedFindingForRemediation(finding);
    setActiveTab('remediation');
  };

  const openFindingsCount = findings.filter(f => f.remediation_status === 'open' || (f as any).status === 'open').length;

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] flex flex-col font-sans selection:bg-cyan-500/20 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        status={systemStatus}
        onRunDemo={handleRunDemo}
        isRunningDemo={isRunningDemo}
        activeRepoName={repositories[0]?.name || 'Sachinshekhar82/Shadow-code'}
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
              onScanCompleted={(s: any) => {
                setSelectedScan(s);
                refreshData();
              }}
              onOpenFinding={(f: any) => setSelectedFindingForModal(f)}
              onNavigateToRemediation={handleNavigateToRemediation}
            />
          )}

          {activeTab === 'findings' && (
            <FindingsPage
              findings={findings}
              onOpenFinding={(f: any) => setSelectedFindingForModal(f)}
              onNavigateToRemediation={handleNavigateToRemediation}
              onFeedback={async (id, decision, reason) => {
                await submitFindingFeedback(id, decision, reason);
                refreshData();
              }}
            />
          )}

          {activeTab === 'remediation' && (
            <RemediationPage
              findings={findings}
              selectedFinding={selectedFindingForRemediation}
              onRefreshFindings={refreshData}
            />
          )}

          {activeTab === 'pull_requests' && (
            <PullRequestsPage />
          )}

          {activeTab === 'chatbot' && (
            <ChatbotPage />
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
        </main>
      </div>

      {/* Modal for detailed finding view */}
      <FindingModal
        finding={selectedFindingForModal}
        onClose={() => setSelectedFindingForModal(null)}
        onFeedback={async (id, decision, reason) => {
          await submitFindingFeedback(id, decision, reason);
          refreshData();
        }}
        onNavigateToRemediation={handleNavigateToRemediation}
      />
    </div>
  );
}

export default App;
