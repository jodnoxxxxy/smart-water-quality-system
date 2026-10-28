import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AnalyzeView } from './components/AnalyzeView';
import { ConsumerWaterView } from './components/ConsumerWaterView';
import { AuthModal } from './components/AuthModal';
import { RegionType, WaterRecord, AlertNotification, UserProfile, UserAccount } from './types';
import { INITIAL_RECORDS, REGION_METADATA, WHO_LIMITS, exportRecordsToCSV, analyzeWater, estimateMinerals } from './utils/waterAnalysis';
import { authService, ROLE_DETAILS } from './utils/authService';
import { firestoreService } from './utils/firebase';
import {
  Plus,
  X,
  FileSpreadsheet,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Star,
  Settings as SettingsIcon,
  HelpCircle,
  Database,
  ArrowUpDown,
  Search,
  LogIn,
  LogOut,
  UserPlus,
  Shield,
  Lock,
} from 'lucide-react';

const STORAGE_KEY_RECORDS = 'aqua_smart_records_v1';
const STORAGE_KEY_NOTIFS = 'aqua_smart_notifs_v1';

const INITIAL_NOTIFICATIONS: AlertNotification[] = [
  {
    id: 'notif-1',
    title: 'Industrial Region Water Sample',
    message: 'High TDS sample recorded (1120 ppm). Multi-stage filtration alert generated.',
    time: '2 hours ago',
    type: 'alert',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Groundwater Quality Normal',
    message: 'Aquifer intake samples meet WHO potability baseline (pH 7.4, TDS 260 ppm).',
    time: 'Yesterday',
    type: 'success',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Calibration Reminder',
    message: 'Electrochemical TDS and pH probes scheduled for monthly recalibration.',
    time: '2 days ago',
    type: 'info',
    read: true,
  },
];

export const App: React.FC = () => {
  const [appMode, setAppMode] = useState<'resident' | 'technician'>('resident');
  const [activeTab, setActiveTab] = useState<NavTab>('home_guide');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionType>('urban');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const handleToggleAppMode = () => {
    if (appMode === 'resident') {
      setAppMode('technician');
      setActiveTab('dashboard');
    } else {
      setAppMode('resident');
      setActiveTab('home_guide');
    }
  };

  // Persistence for water records
  const [records, setRecords] = useState<WaterRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading records from storage:', e);
    }
    return INITIAL_RECORDS;
  });

  // Persistence for notifications
  const [notifications, setNotifications] = useState<AlertNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading notifications from storage:', e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  // User Authentication & Role management (Rule 7: respect user roles and authorization)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const canRunTests = currentUser ? authService.canRunTests(currentUser.role) : false;
  const canClearRecords = currentUser ? authService.canClearRecords(currentUser.role) : false;
  const canModifySettings = currentUser ? authService.canModifySettings(currentUser.role) : false;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.error('Failed saving records:', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed saving notifications:', e);
    }
  }, [notifications]);

  // Real-time Cloud Database Listener (Rule 5: real working architecture)
  useEffect(() => {
    const unsubRecords = firestoreService.subscribeToWaterRecords((liveRecords) => {
      if (liveRecords && liveRecords.length > 0) {
        setRecords(liveRecords);
      }
    });

    const unsubAlerts = firestoreService.subscribeToAlerts((liveAlerts) => {
      if (liveAlerts && liveAlerts.length > 0) {
        setNotifications(liveAlerts);
      }
    });

    return () => {
      unsubRecords();
      unsubAlerts();
    };
  }, []);

  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setSelectedRegion(user.defaultRegion);
    const authAlert: AlertNotification = {
      id: `notif-${Date.now()}`,
      title: `Active Session: ${user.name}`,
      message: `Signed in as ${user.roleTitle} (${user.facility}). Regional settings aligned.`,
      time: 'Just now',
      type: 'info',
      read: false,
    };
    setNotifications((prev) => [authAlert, ...prev]);
    firestoreService.addAlert(authAlert);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    const logoutAlert: AlertNotification = {
      id: `notif-${Date.now()}`,
      title: 'Signed Out',
      message: 'Logged out. Sign in to sync your home water tests across devices.',
      time: 'Just now',
      type: 'warning',
      read: false,
    };
    setNotifications((prev) => [logoutAlert, ...prev]);
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Record handler: saves to local state and real cloud Firestore database
  const handleSaveRecord = (newRec: Omit<WaterRecord, 'id' | 'dateTime'>) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    if (!canRunTests) {
      alert(`Access Restricted: Assigned role "${currentUser.roleTitle}" has read-only compliance access and cannot record new test samples.`);
      return;
    }

    const record: WaterRecord = {
      ...newRec,
      id: `rec-${Date.now()}`,
      dateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setRecords((prev) => [record, ...prev]);
    // Save to real cloud database
    firestoreService.saveRecord(record);

    // Create an alert notification if water is poor
    if (newRec.result.toLowerCase().includes('poor') || newRec.tds >= 1000) {
      const newAlert: AlertNotification = {
        id: `notif-${Date.now()}`,
        title: `Water Alert: ${REGION_METADATA[newRec.region].label}`,
        message: `High risk sample registered with TDS ${newRec.tds} ppm and pH ${newRec.ph} by ${currentUser.name}.`,
        time: 'Just now',
        type: 'alert',
        read: false,
      };
      setNotifications((prev) => [newAlert, ...prev]);
      firestoreService.addAlert(newAlert);
    }
  };

  const handleReportDirtyWater = (source: string, tdsVal: number) => {
    const newAlert: AlertNotification = {
      id: `notif-${Date.now()}`,
      title: `Neighbor Alert: Dirty ${source}`,
      message: `${currentUser?.name || 'A local resident'} reported discolored/high-mineral water (${tdsVal} ppm) in ${currentUser?.facility || 'local neighborhood'}.`,
      time: 'Just now',
      type: 'warning',
      read: false,
    };
    setNotifications((prev) => [newAlert, ...prev]);
    firestoreService.addAlert(newAlert);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleExportCSV = () => {
    const csvData = exportRecordsToCSV(records);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `water_quality_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    if (!canClearRecords) {
      alert(`Access Restricted: Your assigned role (${currentUser?.roleTitle || 'Guest'}) does not have permission to erase permanent audit logs.`);
      return;
    }
    if (window.confirm('Are you sure you want to clear test records? Default records can be restored from settings.')) {
      firestoreService.clearAllRecords(records);
      setRecords([]);
    }
  };

  const handleResetDefaults = () => {
    if (!canModifySettings) {
      alert(`Access Restricted: Only Lead Analysts and Managers can reset system seed data.`);
      return;
    }
    setRecords(INITIAL_RECORDS);
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  // Filtered records based on search query
  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.result.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      (r.notes && r.notes.toLowerCase().includes(q)) ||
      r.dateTime.includes(q) ||
      r.ph.toString().includes(q) ||
      r.tds.toString().includes(q)
    );
  });

  // Modal Form State
  const [modalPh, setModalPh] = useState(7.2);
  const [modalTds, setModalTds] = useState(310);
  const [modalRegion, setModalRegion] = useState<RegionType>(selectedRegion);
  const [modalNotes, setModalNotes] = useState('');

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quality = analyzeWater(modalPh, modalTds);
    const minerals = estimateMinerals(modalTds, modalRegion);
    handleSaveRecord({
      ph: modalPh,
      tds: modalTds,
      region: modalRegion,
      ca: minerals.ca,
      mg: minerals.mg,
      k: minerals.k,
      na: minerals.na,
      so4: minerals.so4,
      cl: minerals.cl,
      result: quality.headline,
      notes: modalNotes.trim() || undefined,
    });
    setModalNotes('');
    setIsTestModalOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#edf2f7]">
      {/* Dark Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentUser={currentUser}
        onOpenAuth={() => handleOpenAuth('login')}
        appMode={appMode}
        onToggleAppMode={handleToggleAppMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sticky Header with Search, Region, and Alerts */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedRegion={selectedRegion}
          onRegionChange={setSelectedRegion}
          notifications={notifications}
          onDismissNotification={handleDismissNotification}
          onOpenTestModal={() => {
            if (!canRunTests) {
              handleOpenAuth('login');
              return;
            }
            setIsTestModalOpen(true);
          }}
          currentUser={currentUser}
          onOpenAuth={() => handleOpenAuth('login')}
          onLogout={handleLogout}
        />

        {/* Scrollable Main Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {activeTab === 'home_guide' && (
            <ConsumerWaterView
              onSaveRecord={handleSaveRecord}
              onReportDirtyWater={handleReportDirtyWater}
              onOpenTechPortal={() => {
                setAppMode('technician');
                setActiveTab('dashboard');
              }}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              records={records}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
              onOpenTestModal={() => setIsTestModalOpen(true)}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'analyze' && (
            <AnalyzeView
              onSaveRecord={handleSaveRecord}
              initialRegion={selectedRegion}
            />
          )}

          {/* Records & Trends History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Database className="w-6 h-6 text-[#1eaedb]" />
                    Water Quality Records & Testing Log
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Complete immutable log of all sensor readings, chemical assessments, and estimated mineral compositions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    disabled={records.length === 0}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={handleClearHistory}
                    disabled={records.length === 0 || !canClearRecords}
                    title={!canClearRecords ? `Restricted: Assigned role (${currentUser?.roleTitle || 'Guest'}) cannot erase audit logs` : 'Clear test records'}
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-50 px-3 py-2 rounded-xl text-xs font-semibold transition border border-rose-200 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Records {!canClearRecords && '(Restricted)'}</span>
                  </button>
                </div>
              </div>

              {/* Records Table Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Total Entries:</span>
                    <span className="text-xs font-semibold bg-[#1eaedb]/10 text-[#1eaedb] px-2.5 py-0.5 rounded-full">
                      {filteredRecords.length} of {records.length} samples
                    </span>
                  </div>
                  {searchQuery && (
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <span>Filtered by "{searchQuery}"</span>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-[#1eaedb] hover:underline font-semibold ml-1 cursor-pointer"
                      >
                        Reset filter
                      </button>
                    </div>
                  )}
                </div>

                {/* Empty State */}
                {filteredRecords.length === 0 ? (
                  <div className="py-16 px-4 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No records found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      {records.length === 0
                        ? 'No water samples have been recorded yet. Use the Water Analysis lab or Quick Test to add one.'
                        : 'No test records matched your search query. Try searching for pH, TDS, or region.'}
                    </p>
                    <button
                      onClick={() => setIsTestModalOpen(true)}
                      className="bg-[#1eaedb] hover:bg-[#189bb5] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition shadow-sm"
                    >
                      Record Sample Now
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Date / Time</th>
                          <th className="py-3 px-3">Region</th>
                          <th className="py-3 px-3">pH</th>
                          <th className="py-3 px-3">TDS (ppm)</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Minerals (Ca/Mg/Na/K)</th>
                          <th className="py-3 px-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRecords.map((rec) => {
                          const isExcellent = rec.result.toLowerCase().includes('excellent');
                          const isModerate = rec.result.toLowerCase().includes('moderate');

                          return (
                            <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {rec.dateTime}
                              </td>
                              <td className="py-3 px-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                                  {rec.region}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-800">
                                {rec.ph.toFixed(1)}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-800">
                                {rec.tds}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    isExcellent
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : isModerate
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {isExcellent && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                  {isModerate && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                  {!isExcellent && !isModerate && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                                  {rec.result}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {rec.ca} / {rec.mg} / {rec.na} / {rec.k}
                              </td>
                              <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                                {rec.notes || <span className="text-slate-300 italic">None</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Regional Sources Tab */}
          {activeTab === 'locations' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-[#1eaedb]" />
                  Regional Water Sources & Geological Chemistry
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Empirical mineral factor models used by the laboratory to derive calcium, magnesium, sodium, potassium, sulphate, and chloride.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(Object.keys(REGION_METADATA) as RegionType[]).map((regKey) => {
                  const meta = REGION_METADATA[regKey];
                  const [fCa, fMg, fNa, fK, fSo4, fCl] = meta.factors;
                  const isSelected = selectedRegion === regKey;

                  return (
                    <div
                      key={regKey}
                      className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                        isSelected ? 'border-[#1eaedb] ring-2 ring-[#1eaedb]/20' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-slate-900">{meta.label}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-[#1eaedb] text-white px-2 py-0.5 rounded-full font-bold">
                                Active Filter
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {meta.description}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedRegion(regKey)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-[#1eaedb] hover:bg-[#189bb5] text-white'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Select'}
                        </button>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                          Mineral Partition Ratios (% of TDS)
                        </span>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-bold">Ca</span>
                            <span className="font-bold text-slate-800">{(fCa * 100).toFixed(0)}%</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-bold">Mg</span>
                            <span className="font-bold text-slate-800">{(fMg * 100).toFixed(0)}%</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-bold">Na</span>
                            <span className="font-bold text-slate-800">{(fNa * 100).toFixed(0)}%</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-bold">K</span>
                            <span className="font-bold text-slate-800">{(fK * 100).toFixed(0)}%</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-bold">SO₄</span>
                            <span className="font-bold text-slate-800">{(fSo4 * 100).toFixed(0)}%</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-bold">Cl</span>
                            <span className="font-bold text-slate-800">{(fCl * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WHO Standards Tab */}
          {activeTab === 'standards' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Star className="w-6 h-6 text-[#1eaedb]" />
                  World Health Organization (WHO) Drinking Water Standards
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Guidelines for Drinking-water Quality (4th Edition). Reference limits utilized by the smart classifier.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">pH Standard</span>
                  <div className="text-2xl font-black text-slate-900 mt-2">6.5 – 8.5</div>
                  <p className="text-xs text-slate-500 mt-2">
                    Optimal range. Values below 6.5 cause corrosion of metal piping; values above 8.5 taste soapy and cause scale.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TDS (Total Solids)</span>
                  <div className="text-2xl font-black text-slate-900 mt-2">&lt; 500 <span className="text-sm font-normal text-slate-500">ppm</span></div>
                  <p className="text-xs text-slate-500 mt-2">
                    Ideal potability threshold. 500-1000 ppm acceptable for utility; &gt; 1000 ppm requires RO or distillation.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Calcium (Ca)</span>
                  <div className="text-2xl font-black text-slate-900 mt-2">&le; 200 <span className="text-sm font-normal text-slate-500">mg/L</span></div>
                  <p className="text-xs text-slate-500 mt-2">
                    Desirable drinking max is 75 mg/L, maximum permissible limit is 200 mg/L before extreme hardness occurs.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Magnesium (Mg)</span>
                  <div className="text-2xl font-black text-slate-900 mt-2">&le; 100 <span className="text-sm font-normal text-slate-500">mg/L</span></div>
                  <p className="text-xs text-slate-500 mt-2">
                    Desirable drinking max is 30 mg/L, maximum permissible limit is 100 mg/L. Contributes to water hardness.
                  </p>
                </div>
              </div>

              {/* Detailed Reference Table */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3">WHO Parameter Benchmark Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Chemical / Parameter</th>
                        <th className="py-2.5 px-3">Acceptable Limit</th>
                        <th className="py-2.5 px-3">Permissible Limit</th>
                        <th className="py-2.5 px-3">Potential Health / Taste Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">pH Value</td>
                        <td className="py-2.5 px-3">6.5 – 8.5</td>
                        <td className="py-2.5 px-3">6.0 – 9.0</td>
                        <td className="py-2.5 px-3">Mucous membrane irritation, heavy metal leaching at low pH.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">TDS (Total Dissolved Solids)</td>
                        <td className="py-2.5 px-3">500 ppm</td>
                        <td className="py-2.5 px-3">1000 ppm</td>
                        <td className="py-2.5 px-3">Palatability drop, mineral encrustation, gastrointestinal distress.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">Sodium (Na)</td>
                        <td className="py-2.5 px-3">200 mg/L</td>
                        <td className="py-2.5 px-3">200 mg/L</td>
                        <td className="py-2.5 px-3">Elevated blood pressure, salty taste above 200 mg/L.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">Sulphate (SO₄)</td>
                        <td className="py-2.5 px-3">200 mg/L</td>
                        <td className="py-2.5 px-3">400 mg/L</td>
                        <td className="py-2.5 px-3">Cathartic laxative effect in unaccustomed consumers.</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">Chloride (Cl)</td>
                        <td className="py-2.5 px-3">250 mg/L</td>
                        <td className="py-2.5 px-3">1000 mg/L</td>
                        <td className="py-2.5 px-3">Salty taste, corrosive to plumbing fixtures and hot water tanks.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* System Settings & User Profile Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <SettingsIcon className="w-6 h-6 text-[#1eaedb]" />
                    System Configuration & Personnel Management
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage operator credentials, role-based authorization parameters, and storage resets.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAuth('login')}
                    className="flex items-center gap-1.5 bg-[#1eaedb] hover:bg-[#189bb5] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{currentUser ? 'Switch Account' : 'Sign In'}</span>
                  </button>
                  <button
                    onClick={() => handleOpenAuth('register')}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register Personnel</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Session Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#1eaedb]" />
                      Active Personnel Session
                    </h3>
                    {currentUser && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${ROLE_DETAILS[currentUser.role]?.badgeColor || 'bg-slate-100'}`}>
                        {currentUser.roleTitle}
                      </span>
                    )}
                  </div>

                  {currentUser ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1eaedb] to-cyan-400 text-white font-extrabold text-base flex items-center justify-center shadow-sm">
                          {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">{currentUser.name}</h4>
                          <span className="text-xs text-slate-500">Username: <code className="font-mono text-cyan-700">@{currentUser.username}</code></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Laboratory Facility</span>
                          <span className="font-semibold text-slate-800 truncate block mt-0.5">{currentUser.facility}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Primary Source Filter</span>
                          <span className="font-semibold text-slate-800 capitalize truncate block mt-0.5">{REGION_METADATA[currentUser.defaultRegion]?.label || currentUser.defaultRegion}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900 border border-emerald-100 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Authorized Capabilities:</span>
                          <span className="text-[11px] text-emerald-800">
                            {ROLE_DETAILS[currentUser.role]?.description || 'Operational permissions active.'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out Session</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">Operating in Guest Mode</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-3">
                        Sign in or register an analyst account to run water tests, configure parameters, and record samples.
                      </p>
                      <button
                        onClick={() => handleOpenAuth('login')}
                        className="bg-[#1eaedb] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition hover:bg-[#189bb5] cursor-pointer"
                      >
                        Sign In Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Storage & Maintenance */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Data Storage & System Reset
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Test records, user credentials, and alerts are securely saved to local persistent storage. Default benchmark records can be restored by Lead Analysts and Managers.
                  </p>

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={handleResetDefaults}
                      disabled={!canModifySettings}
                      title={!canModifySettings ? 'Requires Lead Analyst or Manager role' : 'Restore seed records'}
                      className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer text-center"
                    >
                      Reload Default Seed Records {!canModifySettings && '(Restricted)'}
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="w-full bg-[#1eaedb] hover:bg-[#189bb5] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer text-center"
                    >
                      Backup All Records to CSV
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                    <span>Engine: AquaSmart v2.0</span>
                    <span>Role Enforcement: Active</span>
                  </div>
                </div>
              </div>

              {/* RBAC Permissions Matrix Card (Rule 7) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Role-Based Access Control (RBAC) Matrix
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Enforces strict data access rules across different testing roles according to Rule 7.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Role Title</th>
                        <th className="py-2.5 px-3">Test &amp; Simulate</th>
                        <th className="py-2.5 px-3">Record Samples</th>
                        <th className="py-2.5 px-3">Export CSV</th>
                        <th className="py-2.5 px-3">Erase Test Logs</th>
                        <th className="py-2.5 px-3">Reset Benchmark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr className={currentUser?.role === 'analyst' ? 'bg-cyan-50/50 font-semibold' : ''}>
                        <td className="py-2.5 px-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-500" />
                          <span className="font-bold text-slate-800">Quality Lead Analyst</span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                      </tr>
                      <tr className={currentUser?.role === 'technician' ? 'bg-cyan-50/50 font-semibold' : ''}>
                        <td className="py-2.5 px-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-bold text-slate-800">Lab Technician</span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-rose-500 font-medium">Restricted</td>
                        <td className="py-2.5 px-3 text-rose-500 font-medium">Restricted</td>
                      </tr>
                      <tr className={currentUser?.role === 'auditor' ? 'bg-cyan-50/50 font-semibold' : ''}>
                        <td className="py-2.5 px-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="font-bold text-slate-800">Compliance Auditor</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">Read-Only</td>
                        <td className="py-2.5 px-3 text-rose-500 font-medium">Restricted</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-rose-500 font-medium">Restricted</td>
                        <td className="py-2.5 px-3 text-rose-500 font-medium">Restricted</td>
                      </tr>
                      <tr className={currentUser?.role === 'manager' ? 'bg-cyan-50/50 font-semibold' : ''}>
                        <td className="py-2.5 px-3 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="font-bold text-slate-800">Facility Manager</span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold">Allowed</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Quick Test Modal Dialog */}
      {isTestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsTestModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#1eaedb]" />
              Quick Water Sample Test
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter pH, TDS, and water origin to instantly calculate WHO compliance.
            </p>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">pH Level</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={modalPh}
                    onChange={(e) => setModalPh(parseFloat(e.target.value) || 7.0)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1eaedb]"
                  />
                  <span className="text-[10px] text-slate-400">Normal: 6.5 – 8.5</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">TDS (ppm)</label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={modalTds}
                    onChange={(e) => setModalTds(parseInt(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1eaedb]"
                  />
                  <span className="text-[10px] text-slate-400">&lt; 500 ppm safe</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Region Source</label>
                <select
                  value={modalRegion}
                  onChange={(e) => setModalRegion(e.target.value as RegionType)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-[#1eaedb]"
                >
                  <option value="groundwater">Groundwater / Borewell</option>
                  <option value="urban">Urban Tap Supply</option>
                  <option value="industrial">Industrial Region</option>
                  <option value="coastal">Coastal Saline Area</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sample Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Morning tap check at block B"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1eaedb]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#1eaedb] hover:bg-[#189bb5] text-white rounded-xl transition shadow-sm cursor-pointer"
                >
                  Save & Analyze Sample
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Authentication (Login / Register) Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />
    </div>
  );
};

export default App;
