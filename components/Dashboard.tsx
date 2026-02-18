import React, { useState, useEffect, useMemo } from 'react';
import { Employee, EmployeeService, TimeRecord, Job } from '../services/EmployeeService';
import { translations } from '../utils/translations';
import { Language } from '../App';

// Views
import { HomeView } from './views/HomeView';
import { DashboardView } from './views/DashboardView';
import { HistoryView } from './views/HistoryView';
import { TeamMapView } from './views/TeamMapView';
import { CalendarView } from './views/CalendarView';
import { FieldServiceView } from './views/FieldServiceView';
import { RequestView } from './views/RequestView';
import { HolidayView } from './views/HolidayView';
import { ProfileView } from './views/ProfileView';
import { EmployeeManagementView } from './views/EmployeeManagementView';
import { TaskAssignmentView } from './views/TaskAssignmentView';
import { EasyPassView } from './views/admin/EasyPassView';
import { ReportView } from './views/employee/ReportView';

// Modals
import { CheckInModal } from './modals/CheckInModal';

interface DashboardProps {
  user: Employee;
  onLogout: () => void;
  lang: Language;
  onLangToggle: () => void;
  selectedOffice: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, lang, onLangToggle, selectedOffice }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [requestInitialTab, setRequestInitialTab] = useState<'LEAVE' | 'OT' | 'JOBS' | undefined>(undefined);
  const [time, setTime] = useState(new Date());
  const [history, setHistory] = useState<TimeRecord[]>([]);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInModalType, setCheckInModalType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const t = translations[lang];
  const headCls = lang === 'TH' ? 'font-prompt font-bold' : 'font-montserrat font-bold';
  const bodyCls = lang === 'TH' ? 'font-prompt font-normal' : 'font-montserrat font-normal';

  const isHR = user.role === 'HR' || user.role === 'EXECUTIVE';

  const refreshEmployees = async () => {
    const data = await EmployeeService.getAllEmployees();
    setAllEmployees(data);
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    setHistory(EmployeeService.getTimeHistory(user.email));
    refreshEmployees();
    setJobs(EmployeeService.getJobs());
    return () => clearInterval(timer);
  }, [user.email]);

  const isCheckedIn = useMemo(() => history.length > 0 && history[0].type === 'CHECK_IN', [history]);

  const latestLocation = useMemo(() => {
    if (history.length > 0 && history[0].location) return history[0].location;
    return t.no_location;
  }, [history, t.no_location]);

  const getHeaderStatusText = () => {
     if (!isCheckedIn) return t.status_not_checked_in;
     const latestRecord = history[0];
     if (latestRecord.status === 'LATE') {
         return `${t.status_checked_in_late} ${new Date(latestRecord.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
     }
     return `${t.status_checked_in} ${new Date(latestRecord.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  const handleCheckInAction = (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setCheckInModalType(type);
    setIsCheckInModalOpen(true);
  };

  const handleCheckInSuccess = () => {
    setHistory(EmployeeService.getTimeHistory(user.email));
    setIsCheckInModalOpen(false);
  };

  const handleJobUpdate = () => {
      setJobs(EmployeeService.getJobs());
  };

  const handleEmployeeUpdate = () => {
      refreshEmployees();
  };

  const handleNavigateToRequest = (tab: 'LEAVE' | 'OT' | 'JOBS') => {
    setRequestInitialTab(tab);
    setActiveTab('request');
  };

  const icons = {
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    dashboard: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    employees: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    assignment: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z',
    field_service: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    easy_pass: 'M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zM3 12c0 4.97 4.03 9 9 9s9-4.03 9-9-4.03-9-9-9-9 4.03-9 9z',
    request: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    holiday: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    profile: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z',
    report: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    team_calendar: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  };

  const menuItems = useMemo(() => {
    if (isHR) {
      return [
        { key: 'home', icon: icons.home },
        { key: 'dashboard', icon: icons.dashboard },
        { key: 'request', icon: icons.request, label: lang === 'TH' ? 'ศูนย์อนุมัติ' : 'Approvals' },
        { key: 'assignment', icon: icons.assignment },
        { key: 'calendar', icon: icons.calendar },
        { key: 'field_service', icon: icons.field_service },
        { key: 'easy_pass', icon: icons.easy_pass },
        { key: 'holiday', icon: icons.holiday },
        { key: 'employees', icon: icons.employees, label: lang === 'TH' ? 'พนักงาน' : 'Staff' },
        { key: 'profile', icon: icons.profile },
      ];
    } else {
      return [
        { key: 'home', icon: icons.home },
        { key: 'dashboard', icon: icons.dashboard },
        { key: 'calendar', icon: icons.calendar },
        { key: 'team_calendar', icon: icons.team_calendar, label: lang === 'TH' ? 'ปฏิทินทีม' : 'Team Calendar' },
        { key: 'field_service', icon: icons.field_service },
        { key: 'request', icon: icons.request },
        { key: 'holiday', icon: icons.holiday },
        { key: 'report', icon: icons.report },
        { key: 'profile', icon: icons.profile },
      ];
    }
  }, [isHR, lang]);

  const handleTabChange = (key: string) => {
    if (key !== 'request') setRequestInitialTab(undefined);
    setActiveTab(key);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch(activeTab) {
        case 'home': 
            return <HomeView time={time} isCheckedIn={isCheckedIn} statusText={getHeaderStatusText()} onAction={handleCheckInAction} history={history} lang={lang} user={user} allEmployees={allEmployees} onJobUpdate={handleJobUpdate} />;
        case 'dashboard':
            return <DashboardView isCheckedIn={isCheckedIn} allEmployees={allEmployees} history={history} user={user} lang={lang} jobs={jobs} selectedOffice={selectedOffice} onJobUpdate={handleJobUpdate} onNavigateToRequest={handleNavigateToRequest} />;
        case 'employees':
            return <EmployeeManagementView lang={lang} onUpdate={handleEmployeeUpdate} />;
        case 'assignment':
            return <TaskAssignmentView user={user} allEmployees={allEmployees} lang={lang} />;
        case 'history': 
            return <HistoryView history={history} lang={lang} />;
        case 'team_map': 
            return <TeamMapView lang={lang} />;
        case 'calendar': 
            return <CalendarView jobs={jobs} user={user} allEmployees={allEmployees} lang={lang} onJobUpdate={handleJobUpdate} />;
        case 'team_calendar':
            return <CalendarView jobs={jobs} user={user} allEmployees={allEmployees} lang={lang} onJobUpdate={handleJobUpdate} forceTeamView={true} />;
        case 'field_service': 
            return <FieldServiceView user={user} allEmployees={allEmployees} lang={lang} onJobUpdate={handleJobUpdate} />;
        case 'easy_pass':
            return <EasyPassView lang={lang} />;
        case 'request': 
            return <RequestView user={user} lang={lang} initialTabFromDashboard={requestInitialTab} />;
        case 'holiday': 
            return <HolidayView user={user} lang={lang} />;
        case 'report':
            return <ReportView user={user} lang={lang} />;
        case 'profile':
            return <ProfileView user={user} lang={lang} />;
        default: 
            return <HomeView time={time} isCheckedIn={isCheckedIn} statusText={getHeaderStatusText()} onAction={handleCheckInAction} history={history} lang={lang} user={user} allEmployees={allEmployees} onJobUpdate={handleJobUpdate} />;
    }
  };

  return (
    <div className={`flex min-h-screen bg-[#F8F9FB] ${bodyCls} text-charcoal flex-col md:flex-row relative overflow-x-hidden`}>
      
      {/* Sidebar - Desktop (Hidden on small screens) */}
      <aside className="hidden md:flex w-[260px] lg:w-[300px] flex-col py-8 px-6 space-y-2 shrink-0 border-r border-slate-100 no-print h-screen sticky top-0 overflow-y-auto">
        <div className="mb-10 flex items-center gap-3 px-2">
           <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-montserrat font-bold text-2xl shadow-lg shadow-red-200">S</div>
           <div>
             <div className="font-montserrat font-bold text-xl leading-none flex items-center">
                <span className="text-[#D0342C]">SGDATA</span>
                <span className="text-[#4A4A4A] ml-1">POS</span>
             </div>
             <p className="text-[10px] tracking-[0.1em] text-slate-400 font-bold uppercase mt-1">Professional HR</p>
           </div>
        </div>
        {menuItems.map((item) => (
          <button key={item.key} onClick={() => handleTabChange(item.key)} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === item.key ? 'bg-primary text-white shadow-xl shadow-red-200' : 'text-slate-400 hover:bg-slate-50'}`}>
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
            <span className={`text-[15px] truncate ${activeTab === item.key ? headCls : bodyCls}`}>
              {(item as any).label || t.menu[item.key as keyof typeof t.menu]}
            </span>
          </button>
        ))}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="absolute left-0 top-0 bottom-0 w-[80%] max-w-[300px] bg-white p-6 shadow-2xl animate-in flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
                  <span className="font-montserrat font-bold text-lg">SGDATA<span className="text-slate-400">POS</span></span>
               </div>
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {menuItems.map((item) => (
                <button key={item.key} onClick={() => handleTabChange(item.key)} className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all ${activeTab === item.key ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                  <span className={`text-sm truncate ${activeTab === item.key ? headCls : bodyCls}`}>
                    {(item as any).label || t.menu[item.key as keyof typeof t.menu]}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50">
               <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span>Logout</span>
               </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Header - Fixed on top for Mobile */}
        <header className="h-[70px] md:h-[120px] flex items-center justify-between px-4 md:px-10 shrink-0 no-print bg-white/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none z-[100] border-b border-slate-100 md:border-none">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Hamburger Button */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-400 bg-slate-50 rounded-xl active:scale-90 transition-all">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            
            <button onClick={() => handleTabChange('profile')} className="w-10 h-10 md:w-14 md:h-14 bg-slate-200 rounded-full overflow-hidden flex items-center justify-center hover:ring-4 hover:ring-primary/20 transition-all cursor-pointer shrink-0">
              <svg className="w-6 h-6 md:w-10 md:h-10 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            </button>
            
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className={`text-base md:text-xl ${headCls} cursor-pointer hover:text-primary transition-colors`} onClick={() => handleTabChange('profile')}>{lang === 'TH' ? user.nicknameTh : user.nicknameEn}</span>
                <span className="bg-black text-white text-[8px] md:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{user.position}</span>
              </div>
              <div className="flex flex-col text-[10px] md:text-[12px] text-slate-400 mt-0.5">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isHR ? 'bg-blue-400' : (isCheckedIn ? (history[0].status === 'LATE' ? 'bg-amber-400' : 'bg-green-500') : 'bg-slate-300')}`}></span>
                  {isHR ? (
                    <span className="flex gap-2">
                      <span className="font-bold text-slate-500">{time.toLocaleDateString('th-TH')}</span>
                      <span className="font-bold text-primary">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  ) : getHeaderStatusText()}
                </span>
              </div>
            </div>

            {/* Mobile Mini Title */}
            <div className="sm:hidden flex flex-col">
               <span className={`text-sm font-bold text-charcoal truncate max-w-[120px] ${headCls}`}>{lang === 'TH' ? user.nicknameTh : user.nicknameEn}</span>
               <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">{user.position}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={onLangToggle} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 font-montserrat font-bold text-[11px] md:text-[13px] text-charcoal active:scale-95 transition-all">{lang}</button>
            <button onClick={onLogout} className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 items-center justify-center bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 text-primary active:scale-95 transition-all"><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
          </div>
        </header>

        {/* Content Area - Adjusted Padding for Mobile Bottom Bar */}
        <main className="flex-1 px-4 md:px-10 pb-24 md:pb-10 pt-4 md:pt-0 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Bottom Navigation for Mobile (Thumb-accessible) */}
        <nav className="fixed bottom-0 left-0 right-0 h-[75px] bg-white border-t border-slate-100 flex items-center justify-around px-2 z-[150] md:hidden no-print">
            <button onClick={() => handleTabChange('home')} className={`flex flex-col items-center gap-1 px-3 ${activeTab === 'home' ? 'text-primary' : 'text-slate-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icons.home} /></svg>
                <span className="text-[10px] font-bold">Home</span>
            </button>
            <button onClick={() => handleTabChange('calendar')} className={`flex flex-col items-center gap-1 px-3 ${activeTab === 'calendar' ? 'text-primary' : 'text-slate-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icons.calendar} /></svg>
                <span className="text-[10px] font-bold">Jobs</span>
            </button>
            
            {/* Quick Action Button in Center */}
            <button 
                onClick={() => handleCheckInAction(isCheckedIn ? 'CHECK_OUT' : 'CHECK_IN')}
                className={`w-14 h-14 -mt-10 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-200 transition-all active:scale-90 ring-4 ring-[#F8F9FB] ${isCheckedIn ? 'bg-charcoal' : 'bg-primary'}`}
            >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            </button>
            
            <button onClick={() => handleTabChange('request')} className={`flex flex-col items-center gap-1 px-3 ${activeTab === 'request' ? 'text-primary' : 'text-slate-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={icons.request} /></svg>
                <span className="text-[10px] font-bold">Requests</span>
            </button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-1 px-3 text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                <span className="text-[10px] font-bold">More</span>
            </button>
        </nav>
      </div>

      {isCheckInModalOpen && (
        <CheckInModal 
            userEmail={user.email}
            modalType={checkInModalType}
            onClose={() => setIsCheckInModalOpen(false)}
            onSuccess={handleCheckInSuccess}
            lang={lang}
        />
      )}
    </div>
  );
};