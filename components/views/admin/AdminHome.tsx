import React, { useMemo, useState, useEffect } from 'react';
import { TimeRecord, Employee, EmployeeService } from '../../../services/EmployeeService';
import { translations } from '../../../utils/translations';
import { Language } from '../../../App';
import * as XLSX from 'xlsx';

interface AdminHomeProps {
  lang: Language;
  allEmployees: Employee[];
  refreshTrigger: number;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
  user: Employee;
}

export const AdminHome: React.FC<AdminHomeProps> = ({ lang, allEmployees, refreshTrigger, setRefreshTrigger, user }) => {
  const t = translations[lang];
  const headCls = lang === 'TH' ? 'font-prompt font-bold' : 'font-montserrat font-bold';
  const subHeadCls = lang === 'TH' ? 'font-prompt font-medium' : 'font-montserrat font-semibold';
  const bodyCls = lang === 'TH' ? 'font-prompt font-normal' : 'font-montserrat font-normal';

  const [hrViewMode, setHrViewMode] = useState<'TODAY' | 'HISTORY'>('TODAY');
  const todayDateString = new Date().toDateString();
  const todayLocalStr = new Date().toLocaleDateString('en-CA');

  const filteredEmployees = useMemo(() => {
    return allEmployees.filter(emp => emp.id !== user.id);
  }, [allEmployees, user.id]);

  const todayAttendance = useMemo(() => {
    return filteredEmployees.map(emp => {
      const empHistory = EmployeeService.getTimeHistory(emp.email);
      const todayRecord = empHistory.find(r => 
        r.type === 'CHECK_IN' && 
        new Date(r.timestamp).toDateString() === todayDateString
      );
      
      const session = EmployeeService.getDailySessions()
        .find(s => s.employeeId === emp.id && s.date === todayLocalStr);

      return {
        employee: emp,
        record: todayRecord || null,
        loginOffice: session ? session.office : 'OFFLINE'
      };
    });
  }, [filteredEmployees, refreshTrigger, todayDateString, todayLocalStr]);

  const historicalAttendanceValues = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const groups: Record<string, { employee: Employee, records: TimeRecord[] }> = {};
    
    filteredEmployees.forEach(emp => {
      const empHistory = EmployeeService.getTimeHistory(emp.email);
      const filtered = empHistory.filter(r => new Date(r.timestamp) >= thirtyDaysAgo);
      if (filtered.length > 0) {
        groups[emp.id] = {
          employee: emp,
          records: filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        };
      }
    });

    return Object.values(groups) as { employee: Employee, records: TimeRecord[] }[];
  }, [filteredEmployees, refreshTrigger]);

  const exportToExcel = () => {
    const data: any[] = [];
    const headers = [
      lang === 'TH' ? 'วันที่' : 'Date',
      lang === 'TH' ? 'ชื่อพนักงาน' : 'Name',
      lang === 'TH' ? 'เวลา' : 'Time',
      lang === 'TH' ? 'ประเภท' : 'Type',
      lang === 'TH' ? 'สถานที่' : 'Location',
      lang === 'TH' ? 'สถานะ' : 'Status'
    ];
    data.push(headers);

    historicalAttendanceValues.forEach(group => {
      group.records.forEach(record => {
        const d = new Date(record.timestamp);
        data.push([
          d.toLocaleDateString('th-TH'),
          group.employee.nameTh,
          d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          record.type === 'CHECK_IN' ? 'เข้างาน' : 'ออกงาน',
          record.location,
          record.status === 'LATE' ? 'สาย' : 'ปกติ'
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
    XLSX.writeFile(wb, `SGDATA_Attendance_Report.xlsx`);
  };

  const checkedInCount = todayAttendance.filter(a => a.record !== null).length;

  return (
    <div className="flex flex-col gap-6 md:gap-8 h-full animate-in pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
           <div>
              <h1 className={`text-2xl lg:text-4xl text-charcoal ${headCls}`}>{lang === 'TH' ? 'จัดการพนักงาน' : 'Staff Management'}</h1>
              <div className="flex items-center gap-2 mt-3 lg:mt-2">
                <button 
                  onClick={() => setHrViewMode('TODAY')}
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-2xl text-[10px] md:text-xs font-bold transition-all ${hrViewMode === 'TODAY' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                >
                  {t.hr_home_today}
                </button>
                <button 
                  onClick={() => setHrViewMode('HISTORY')}
                  className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-2xl text-[10px] md:text-xs font-bold transition-all ${hrViewMode === 'HISTORY' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                >
                  {t.hr_home_monthly}
                </button>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              {hrViewMode === 'HISTORY' && (
                <button onClick={exportToExcel} className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className={`text-[11px] md:text-xs ${headCls}`}>{t.btn_export_csv}</span>
                </button>
              )}
           </div>
        </div>

        {hrViewMode === 'TODAY' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 animate-in">
             <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-sm border border-slate-100 flex items-center justify-between group overflow-hidden relative">
                <div className="relative z-10">
                    <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1 block">Check-in Today</span>
                    <span className={`text-2xl md:text-3xl text-primary ${headCls}`}>{checkedInCount} / {filteredEmployees.length}</span>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-50 flex items-center justify-center text-primary relative z-10">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z" /></svg>
                </div>
             </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] md:rounded-[40px] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col flex-1 overflow-hidden">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${hrViewMode === 'TODAY' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'}`}>
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={hrViewMode === 'TODAY' ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"} /></svg>
                </div>
                <h2 className={`text-lg md:text-xl text-charcoal ${headCls}`}>
                   {hrViewMode === 'TODAY' ? (lang === 'TH' ? 'รายการเข้างานวันนี้' : 'Check-in List') : t.hr_attendance_history}
                </h2>
             </div>

             <div className="overflow-x-auto no-scrollbar flex-1">
                {hrViewMode === 'TODAY' ? (
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead className="sticky top-0 bg-white z-10">
                        <tr>
                          <th className={`py-4 px-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider ${subHeadCls}`}>Staff</th>
                          <th className={`py-4 px-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider text-center ${subHeadCls}`}>Time</th>
                          <th className={`py-4 px-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider ${subHeadCls}`}>Location</th>
                          <th className={`py-4 px-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider text-right ${subHeadCls}`}>Status</th>
                        </tr>
                    </thead>
                    <tbody className={`text-xs md:text-sm ${bodyCls}`}>
                        {todayAttendance.map((item) => (
                          <tr key={item.employee.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] md:text-xs">
                                      {item.employee.nicknameEn.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-bold text-charcoal leading-tight">{lang === 'TH' ? item.employee.nicknameTh : item.employee.nicknameEn}</div>
                                      <div className="text-[9px] text-slate-400 font-bold uppercase">{item.employee.position}</div>
                                    </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                {item.record ? (
                                    <span className="font-montserrat font-bold text-sm md:text-base text-charcoal">
                                      {new Date(item.record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                ) : (
                                    <span className="text-slate-300 italic">-- : --</span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                {item.record ? (
                                    <span className="text-charcoal font-medium text-xs max-w-[200px] truncate block" title={item.record.location}>{item.record.location}</span>
                                ) : (
                                    <span className="text-slate-300">N/A</span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right">
                                {item.record ? (
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase ${item.record.status === 'LATE' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                      {item.record.status === 'LATE' ? t.status_late : t.status_normal}
                                    </span>
                                ) : (
                                    <span className="text-slate-300 text-[9px] font-bold uppercase">Absent</span>
                                )}
                              </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="space-y-8 pb-10">
                     {historicalAttendanceValues.map(group => (
                        <div key={group.employee.id} className="animate-in">
                           <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-xl bg-charcoal text-white flex items-center justify-center font-bold text-lg">{group.employee.nicknameEn.charAt(0)}</div>
                              <div>
                                 <h3 className={`text-base font-bold text-charcoal ${headCls}`}>{lang === 'TH' ? group.employee.nameTh : group.employee.nameEn}</h3>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{group.employee.position}</p>
                              </div>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {group.records.slice(0, 4).map(record => (
                                 <div key={record.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">{new Date(record.timestamp).toLocaleDateString()}</p>
                                       <p className="font-bold text-charcoal text-sm">{new Date(record.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase ${record.status === 'LATE' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                       {record.status === 'LATE' ? 'Late' : 'OK'}
                                    </span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
                )}
             </div>
        </div>
    </div>
  );
};