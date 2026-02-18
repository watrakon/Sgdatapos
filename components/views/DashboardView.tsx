import React, { useMemo, useState } from 'react';
import { Employee, TimeRecord, Job, EmployeeService } from '../../services/EmployeeService';
import { translations } from '../../utils/translations';
import { Language } from '../../App';

interface DashboardViewProps {
  isCheckedIn: boolean;
  allEmployees: Employee[];
  history: TimeRecord[];
  user: Employee;
  lang: Language;
  jobs: Job[];
  selectedOffice: string;
  onJobUpdate: () => void;
  onNavigateToRequest: (tab: 'LEAVE' | 'OT' | 'JOBS') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ isCheckedIn, allEmployees, history, user, lang, jobs, selectedOffice, onJobUpdate, onNavigateToRequest }) => {
  const t = translations[lang];
  const headCls = lang === 'TH' ? 'font-prompt font-bold' : 'font-montserrat font-bold';
  const bodyCls = lang === 'TH' ? 'font-prompt font-normal' : 'font-montserrat font-normal';
  const subHeadCls = lang === 'TH' ? 'font-prompt font-medium' : 'font-montserrat font-semibold';

  const [openRequestType, setOpenRequestType] = useState<'PENDING' | 'APPROVED' | null>(null);

  const isHR = user.role === 'HR' || user.role === 'EXECUTIVE';
  const todayDateString = new Date().toDateString();
  const todayStr = new Date().toLocaleDateString('en-CA');

  const displayedEmployees = useMemo(() => {
    return allEmployees.filter(emp => emp.role === 'EMPLOYEE');
  }, [allEmployees]);

  const activeEmployeesCount = useMemo(() => {
    return displayedEmployees.filter(emp => {
      const empHistory = EmployeeService.getTimeHistory(emp.email);
      const latest = empHistory[0];
      return latest && latest.type === 'CHECK_IN' && new Date(latest.timestamp).toDateString() === todayDateString;
    }).length;
  }, [displayedEmployees, todayDateString]);

  const missionStats = useMemo(() => {
    const todayJobs = jobs.filter(j => j.date === todayStr && (isHR ? true : j.employeeId === user.id));
    return { total: todayJobs.length, done: todayJobs.filter(j => j.status === 'DONE').length };
  }, [jobs, isHR, user.id, todayStr]);

  const leaveRequests = useMemo(() => EmployeeService.getAllLeaveRequests(), []);
  const otRequests = useMemo(() => EmployeeService.getAllOTRequests(), []);

  // ดึงข้อมูลคำขอของ User ปัจจุบันเพื่อนำไปคำนวณใน My Requests
  const myLeaves = useMemo(() => EmployeeService.getLeaveRequests(user.id), [user.id]);
  const myOTs = useMemo(() => EmployeeService.getOTRequests(user.id), [user.id]);

  const leaveCountToday = useMemo(() => {
    return leaveRequests.filter(r => r.status === 'APPROVED' && todayStr >= r.startDate && todayStr <= r.endDate).length;
  }, [leaveRequests, todayStr]);

  const otPendingCount = useMemo(() => {
    return otRequests.filter(r => r.status === 'PENDING').length;
  }, [otRequests]);

  const weeklyJobStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
    endOfWeek.setHours(23,59,59,999);

    const myWeeklyJobs = jobs.filter(j => {
      const jobDate = new Date(j.date);
      return j.employeeId === user.id && jobDate >= startOfWeek && jobDate <= endOfWeek;
    });

    const total = myWeeklyJobs.length;
    const done = myWeeklyJobs.filter(j => j.status === 'DONE').length;
    const inProgress = myWeeklyJobs.filter(j => j.status === 'IN_PROGRESS').length;
    const notStarted = myWeeklyJobs.filter(j => j.status === 'NOT_STARTED').length;

    return { total, done, inProgress, notStarted };
  }, [jobs, user.id]);

  // คำนวณสถิติคำขอของฉัน (รวม งาน, ลา, OT)
  const myRequestStats = useMemo(() => {
    // 1. Jobs (Team Merge)
    const pendingJob = jobs.filter(j => j.employeeId === user.id && j.id.startsWith('REQ_MERGE_') && j.status === 'NOT_STARTED').length;
    const approvedJob = jobs.filter(j => j.employeeId === user.id && j.id.startsWith('REQ_MERGE_') && j.status === 'IN_PROGRESS').length;

    // 2. Leaves
    const pendingLeave = myLeaves.filter(l => l.status === 'PENDING').length;
    const approvedLeave = myLeaves.filter(l => l.status === 'APPROVED').length;

    // 3. OT
    const pendingOT = myOTs.filter(o => o.status === 'PENDING').length;
    const approvedOT = myOTs.filter(o => o.status === 'APPROVED').length;

    return { 
        pending: pendingJob + pendingLeave + pendingOT, 
        approved: approvedJob + approvedLeave + approvedOT 
    };
  }, [jobs, user.id, myLeaves, myOTs]);

  // สร้างรายการสำหรับแสดงใน Popup (รวม Job, Leave, OT)
  const requestList = useMemo(() => {
    if (!openRequestType) return [];
    
    let list = [];

    // Add Jobs
    const relevantJobs = jobs.filter(j => j.employeeId === user.id && j.id.startsWith('REQ_MERGE_') && (openRequestType === 'PENDING' ? j.status === 'NOT_STARTED' : j.status === 'IN_PROGRESS'));
    list.push(...relevantJobs.map(j => ({
        id: j.id,
        type: 'JOB',
        title: j.customerName,
        subtitle: j.activity.replace('[ขออนุมัติรวมทีม] ', ''),
        date: j.date,
        remark: j.remark
    })));

    // Add Leaves
    const relevantLeaves = myLeaves.filter(l => openRequestType === 'PENDING' ? l.status === 'PENDING' : l.status === 'APPROVED');
    list.push(...relevantLeaves.map(l => ({
        id: l.id,
        type: 'LEAVE',
        title: lang === 'TH' ? `ขอลางาน: ${t[`req_leave_${l.type.toLowerCase()}` as any] || l.type}` : `Leave Request: ${l.type}`,
        subtitle: `${l.days} ${lang === 'TH' ? 'วัน' : 'Days'} (${new Date(l.startDate).toLocaleDateString()} - ${new Date(l.endDate).toLocaleDateString()})`,
        date: l.startDate,
        remark: l.reason
    })));

    // Add OT
    const relevantOTs = myOTs.filter(o => openRequestType === 'PENDING' ? o.status === 'PENDING' : o.status === 'APPROVED');
    list.push(...relevantOTs.map(o => ({
        id: o.id,
        type: 'OT',
        title: lang === 'TH' ? 'ขอทำ OT' : 'OT Request',
        subtitle: `${lang === 'TH' ? 'เวลา' : 'Time'}: ${o.startTime} - ${o.endTime}`,
        date: o.date,
        remark: o.reason
    })));

    // Sort by date descending
    return list.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [openRequestType, jobs, user.id, myLeaves, myOTs, lang, t]);

  const pendingApprovals = useMemo(() => {
    const leavePending = leaveRequests.filter(r => r.status === 'PENDING').length;
    const otPending = otRequests.filter(r => r.status === 'PENDING').length;
    const jobPending = jobs.filter(j => 
        (j.status === 'DONE' && !j.remark.includes('[APPROVED]')) || 
        (j.id.startsWith('REQ_MERGE_') && j.status === 'NOT_STARTED')
    ).length;
    return { leave: leavePending, ot: otPending, job: jobPending };
  }, [leaveRequests, otRequests, jobs]);

  const dailySessions = useMemo(() => EmployeeService.getDailySessions(), []);

  return (
    <div className="w-full flex flex-col gap-6 lg:gap-8 animate-in pb-10">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-4xl text-charcoal ${headCls}`}>{t.dashboard_title}</h1>
            <p className={`text-slate-400 text-xs lg:text-sm mt-1 ${bodyCls}`}>Real-time activity overview</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 w-fit">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest ${bodyCls}`}>{selectedOffice}</span>
          </div>
       </div>

       {/* Top Summary Cards - Removed OT Card */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-[#EBF5FF] rounded-[2rem] lg:rounded-[30px] p-6 lg:p-8 flex flex-col justify-between h-[130px] lg:h-[160px] relative overflow-hidden group border border-blue-100/50">
             <div className="flex items-center gap-3 text-blue-600 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <span className="text-[10px] lg:text-[12px] tracking-widest font-bold uppercase">{t.card_attendance}</span>
             </div>
             <div className={`text-3xl lg:text-5xl text-blue-600 relative z-10 ${headCls}`}>
                {activeEmployeesCount} <span className="text-xl lg:text-2xl opacity-40 ml-1">/{displayedEmployees.length}</span>
             </div>
          </div>

          <div className="bg-[#F0FDF4] rounded-[2rem] lg:rounded-[30px] p-6 lg:p-8 flex flex-col justify-between h-[130px] lg:h-[160px] relative overflow-hidden group border border-green-100/50">
             <div className="flex items-center gap-3 text-green-600 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <span className="text-[10px] lg:text-[12px] tracking-widest font-bold uppercase">{t.card_mission}</span>
             </div>
             <div className={`text-3xl lg:text-5xl text-green-600 relative z-10 ${headCls}`}>
                {missionStats.done} <span className="text-xl lg:text-2xl opacity-40 ml-1">/{missionStats.total}</span>
             </div>
          </div>

          <div className="bg-[#FFF7ED] rounded-[2rem] lg:rounded-[30px] p-6 lg:p-8 flex flex-col justify-between h-[130px] lg:h-[160px] relative overflow-hidden group border border-orange-100/50">
             <div className="flex items-center gap-3 text-orange-600 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                </div>
                <span className="text-[10px] lg:text-[12px] tracking-widest font-bold uppercase">{t.card_leave}</span>
             </div>
             <div className={`text-3xl lg:text-5xl text-orange-600 relative z-10 ${headCls}`}>{leaveCountToday}</div>
          </div>
       </div>

       {isHR ? (
          <div className="w-full bg-white rounded-[2rem] lg:rounded-[40px] p-6 lg:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
               <h2 className={`text-lg lg:text-2xl font-bold text-charcoal ${headCls}`}>{lang === 'TH' ? 'รายการที่รอการอนุมัติ (คลิกเพื่อดำเนินการ)' : 'Pending Approvals (Click to act)'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <button onClick={() => onNavigateToRequest('LEAVE')} className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100 flex flex-col items-start hover:bg-orange-100 transition-all active:scale-95 group">
                  <span className="text-orange-400 text-[9px] lg:text-[11px] font-bold uppercase tracking-widest mb-1 group-hover:text-orange-600">{lang === 'TH' ? 'ขอลางาน' : 'Leave'}</span>
                  <span className={`text-2xl lg:text-4xl text-orange-600 ${headCls}`}>{pendingApprovals.leave}</span>
               </button>
               <button onClick={() => onNavigateToRequest('OT')} className="bg-red-50/50 rounded-2xl p-5 border border-red-100 flex flex-col items-start hover:bg-red-100 transition-all active:scale-95 group">
                  <span className="text-red-400 text-[9px] lg:text-[11px] font-bold uppercase tracking-widest mb-1 group-hover:text-red-600">{lang === 'TH' ? 'ขอ OT' : 'OT'}</span>
                  <span className={`text-2xl lg:text-4xl text-red-600 ${headCls}`}>{pendingApprovals.ot}</span>
               </button>
               <button onClick={() => onNavigateToRequest('JOBS')} className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 flex flex-col items-start hover:bg-blue-100 transition-all active:scale-95 group">
                  <span className="text-blue-400 text-[9px] lg:text-[11px] font-bold uppercase tracking-widest mb-1 group-hover:text-blue-600">{lang === 'TH' ? 'งาน' : 'Jobs'}</span>
                  <span className={`text-2xl lg:text-4xl text-blue-600 ${headCls}`}>{pendingApprovals.job}</span>
               </button>
            </div>
          </div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
             {/* Approval Status Card */}
             <div className="w-full bg-white rounded-[2rem] lg:rounded-[40px] p-6 lg:p-8 shadow-sm border border-slate-100">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                   <h2 className={`text-lg lg:text-2xl font-bold text-charcoal ${headCls}`}>{lang === 'TH' ? 'สถานะคำขออนุมัติ' : 'My Requests'}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setOpenRequestType('PENDING')} className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex flex-col items-start relative overflow-hidden hover:bg-amber-100 transition-all text-left">
                      <span className="text-amber-600 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest mb-1 z-10">{lang === 'TH' ? 'รออนุมัติ' : 'Pending'}</span>
                      <span className={`text-3xl text-amber-700 z-10 ${headCls}`}>{myRequestStats.pending}</span>
                   </button>
                   <button onClick={() => setOpenRequestType('APPROVED')} className="bg-green-50 rounded-2xl p-5 border border-green-100 flex flex-col items-start relative overflow-hidden hover:bg-green-100 transition-all text-left">
                      <span className="text-green-600 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest mb-1 z-10">{lang === 'TH' ? 'อนุมัติแล้ว' : 'Approved'}</span>
                      <span className={`text-3xl text-green-700 z-10 ${headCls}`}>{myRequestStats.approved}</span>
                   </button>
                </div>
             </div>

             {/* Weekly Summary Card */}
             <div className="w-full bg-white rounded-[2rem] lg:rounded-[40px] p-6 lg:p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-1 h-6 bg-primary rounded-full"></div>
                   <h2 className={`text-lg lg:text-2xl font-bold text-charcoal ${headCls}`}>{lang === 'TH' ? 'สรุปงานรายสัปดาห์' : 'Weekly Summary'}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col items-start">
                      <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-1">Total</span>
                      <span className={`text-2xl text-charcoal ${headCls}`}>{weeklyJobStats.total}</span>
                   </div>
                   <div className="bg-green-50/50 rounded-2xl p-4 border border-green-100 flex flex-col items-start">
                      <span className="text-green-600 text-[9px] font-bold uppercase tracking-widest mb-1">Done</span>
                      <span className={`text-2xl text-green-600 ${headCls}`}>{weeklyJobStats.done}</span>
                   </div>
                   <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 flex flex-col items-start">
                      <span className="text-amber-600 text-[9px] font-bold uppercase tracking-widest mb-1">Active</span>
                      <span className={`text-2xl text-amber-600 ${headCls}`}>{weeklyJobStats.inProgress}</span>
                   </div>
                   <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex flex-col items-start">
                      <span className="text-blue-600 text-[9px] font-bold uppercase tracking-widest mb-1">Pending</span>
                      <span className={`text-2xl text-blue-600 ${headCls}`}>{weeklyJobStats.notStarted}</span>
                   </div>
                </div>
             </div>
          </div>
       )}

       <div className="bg-white rounded-[2rem] lg:rounded-[40px] p-6 lg:p-10 shadow-sm border border-slate-100">
           <div className="flex items-center gap-3 lg:gap-4 mb-6 lg:mb-8">
               <div className="w-1 h-6 lg:w-1.5 lg:h-8 bg-blue-600 rounded-full"></div>
               <h2 className={`text-lg lg:text-xl font-bold uppercase tracking-wider text-charcoal ${headCls}`}>{t.team_status_title}</h2>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
               {displayedEmployees.map((emp) => {
                   const empHistory = EmployeeService.getTimeHistory(emp.email);
                   const todayCheckIn = empHistory.find(r => r.type === 'CHECK_IN' && new Date(r.timestamp).toDateString() === todayDateString);
                   const empSession = dailySessions.find(s => s.employeeId === emp.id && s.date === todayStr);
                   const activeJob = jobs.find(j => 
                       j.employeeId === emp.id && 
                       j.date === todayStr && 
                       j.status !== 'DONE' && 
                       !(j.id.startsWith('REQ_MERGE_') && j.status === 'NOT_STARTED')
                   );

                   return (
                       <div key={emp.id} className="bg-slate-50 rounded-[2rem] p-5 flex flex-col gap-4 relative overflow-hidden group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                           <div className={`absolute top-0 right-0 w-1.5 h-full ${todayCheckIn ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-base font-bold text-white ${todayCheckIn ? 'bg-primary' : 'bg-slate-400'}`}>
                                   {emp.nicknameEn?.charAt(0).toUpperCase() || '?'}
                               </div>
                               <div className="min-w-0 flex-1">
                                   <div className={`text-sm lg:text-base text-charcoal font-bold truncate ${headCls}`}>{lang === 'TH' ? emp.nicknameTh : emp.nicknameEn}</div>
                                   <div className="text-[8px] font-bold uppercase text-slate-400 truncate">{emp.position}</div>
                               </div>
                           </div>

                           <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                 <span className={`uppercase tracking-widest ${todayCheckIn ? 'text-blue-600' : 'text-slate-300'}`}>
                                    {empSession?.office || 'Offline'}
                                 </span>
                                 <div className={`tracking-wider ${todayCheckIn ? 'text-charcoal' : 'text-slate-300'}`}>
                                     {todayCheckIn ? new Date(todayCheckIn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                                 </div>
                              </div>
                              <div className={`p-2 rounded-xl border flex flex-col gap-1.5 ${activeJob ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100/50 shadow-sm'}`}>
                                 <div className="flex items-center gap-2">
                                     <div className={`w-2 h-2 rounded-full ${activeJob ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                     <span className={`text-[10px] font-black tracking-tight ${activeJob ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {activeJob ? 'BUSY' : 'READY'}
                                     </span>
                                 </div>
                                 {activeJob && (
                                     <div className="w-full pt-1 border-t border-red-100/50">
                                         <div className={`text-[10px] font-bold text-charcoal truncate ${headCls}`}>{activeJob.customerName}</div>
                                         <div className={`text-[9px] text-slate-500 truncate ${bodyCls}`}>{activeJob.activity}</div>
                                     </div>
                                 )}
                              </div>
                           </div>
                       </div>
                   );
               })}
           </div>
       </div>

       {openRequestType && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={() => setOpenRequestType(null)}></div>
             <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 flex flex-col animate-in max-h-[80vh]">
                <div className="flex justify-between items-center mb-6">
                   <h3 className={`text-xl font-bold ${openRequestType === 'PENDING' ? 'text-amber-600' : 'text-green-600'} ${headCls}`}>
                      {openRequestType === 'PENDING' ? (lang === 'TH' ? 'รายการที่รออนุมัติ' : 'Pending Requests') : (lang === 'TH' ? 'รายการที่อนุมัติแล้ว' : 'Approved Requests')}
                   </h3>
                   <button onClick={() => setOpenRequestType(null)} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                <div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar">
                   {requestList.length === 0 ? (
                      <div className="text-center text-slate-300 py-10 flex flex-col items-center">
                         <div className="text-4xl mb-2 opacity-50">📂</div>
                         <p className={bodyCls}>{t.no_data}</p>
                      </div>
                   ) : (
                      requestList.map(item => (
                        <div key={item.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                           <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <div className={`font-bold text-charcoal text-base ${headCls}`}>{item.title}</div>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${item.type === 'OT' ? 'text-red-500' : item.type === 'LEAVE' ? 'text-amber-500' : 'text-blue-500'}`}>{item.type}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-white px-2 py-1 rounded-lg border border-slate-100">{new Date(item.date).toLocaleDateString()}</span>
                           </div>
                           <div className={`text-xs text-slate-500 font-medium ${bodyCls} mt-1`}>{item.subtitle}</div>
                           <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-200/50 italic">{item.remark}</div>
                        </div>
                      ))
                   )}
                </div>
             </div>
          </div>
       )}
    </div>
  );
};