import React, { useMemo, useEffect, useRef, useState } from 'react';
import { TimeRecord, Employee, EmployeeService } from '../../../services/EmployeeService';
import { translations } from '../../../utils/translations';
import { Language } from '../../../App';

declare const google: any;

interface EmployeeHomeProps {
  time: Date;
  isCheckedIn: boolean;
  statusText: string;
  onAction: (type: 'CHECK_IN' | 'CHECK_OUT') => void;
  history: TimeRecord[];
  lang: Language;
  user: Employee;
  onJobUpdate: () => void;
  refreshTrigger: number;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
}

export const EmployeeHome: React.FC<EmployeeHomeProps> = ({ 
  time, isCheckedIn, statusText, onAction, history, lang, user, onJobUpdate, refreshTrigger, setRefreshTrigger 
}) => {
  const t = translations[lang];
  const headCls = lang === 'TH' ? 'font-prompt font-bold' : 'font-montserrat font-bold';
  const subHeadCls = lang === 'TH' ? 'font-prompt font-medium' : 'font-montserrat font-semibold';
  const bodyCls = lang === 'TH' ? 'font-prompt font-normal' : 'font-montserrat font-normal';

  const mapRef = useRef<HTMLDivElement>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const pendingAssignments = useMemo(() => {
    return EmployeeService.getAssignments(user.id).filter(a => a.status === 'PENDING');
  }, [user.id, refreshTrigger]);

  const handleAssignmentStatus = (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    EmployeeService.updateAssignmentStatus(id, status);
    setRefreshTrigger(prev => prev + 1);
    onJobUpdate();
  };

  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCurrentLocation(coords);
            
            if (typeof google !== 'undefined' && google.maps && mapRef.current) {
                const map = new google.maps.Map(mapRef.current, {
                    center: coords,
                    zoom: 16,
                    disableDefaultUI: true,
                    draggable: false,
                    zoomControl: false,
                    scrollwheel: false,
                    disableDoubleClickZoom: true,
                    styles: [
                        { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
                        { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
                    ]
                });
                
                new google.maps.Marker({
                    position: coords,
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: "#D0342C",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 3,
                    }
                });
            }
        }, (err) => {
            console.error("GPS Error", err);
        }, { enableHighAccuracy: true });
    }
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full animate-in pb-10">
        {/* Map & Check-In Section */}
        <div className="w-full bg-white rounded-[2.5rem] md:rounded-[40px] shadow-sm border border-slate-100 overflow-hidden relative min-h-[450px] flex flex-col">
            
            {/* Map Background */}
            <div className="absolute inset-0 z-0 bg-slate-100">
               <div ref={mapRef} className="w-full h-full opacity-90" />
               {!currentLocation && (
                   <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-400 text-sm font-bold">
                       <div className="flex flex-col items-center gap-2">
                           <div className="w-5 h-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
                           <span>{translations[lang].geo_fetching}</span>
                       </div>
                   </div>
               )}
            </div>

            {/* Overlay Gradient for Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/90 z-0 pointer-events-none"></div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col justify-between flex-1 p-6 md:p-8 pointer-events-none">
                
                {/* Header: Date & Status */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white/50">
                        <div className={`text-primary font-bold text-xs md:text-sm uppercase tracking-wider mb-1 ${subHeadCls}`}>
                            {time.toLocaleDateString(lang === 'TH' ? 'th-TH' : 'en-GB', { weekday: 'long' })}
                        </div>
                        <div className={`text-2xl md:text-3xl text-charcoal font-bold ${headCls}`}>
                            {time.getDate()} {time.toLocaleDateString(lang === 'TH' ? 'th-TH' : 'en-GB', { month: 'short', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md px-5 py-3 rounded-full shadow-sm border border-white/50 flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <span className={`text-xs font-bold text-charcoal uppercase tracking-wider ${bodyCls}`}>
                            {isCheckedIn ? statusText : t.status_not_checked_in}
                        </span>
                    </div>
                </div>

                {/* Bottom: Clock & Actions */}
                <div className="mt-auto pointer-events-auto">
                    <div className="bg-white/85 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-white/60 flex flex-col items-center gap-6">
                        <div className="text-5xl md:text-7xl font-montserrat font-bold text-charcoal tracking-tight leading-none text-center">
                            {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            <span className="text-xl md:text-2xl text-slate-400 ml-2 font-medium">{time.toLocaleTimeString('en-GB', { second: '2-digit' })}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button 
                                onClick={() => onAction('CHECK_IN')} 
                                disabled={isCheckedIn}
                                className={`py-4 rounded-2xl text-sm md:text-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isCheckedIn ? 'bg-slate-100 text-slate-300' : 'bg-primary text-white hover:bg-red-700 active:scale-95 shadow-red-200'} ${headCls}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {t.check_in_btn}
                            </button>
                            <button 
                                onClick={() => onAction('CHECK_OUT')} 
                                disabled={!isCheckedIn}
                                className={`py-4 rounded-2xl text-sm md:text-lg font-bold border-2 transition-all flex items-center justify-center gap-2 ${!isCheckedIn ? 'border-slate-100 text-slate-200' : 'border-charcoal text-charcoal hover:bg-slate-50 active:scale-95'} ${headCls}`}
                            >
                                {t.check_out_btn}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* History Table - Scrollable on Mobile */}
        <div className="w-full flex-1 bg-white rounded-[2.5rem] md:rounded-[40px] shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col min-h-[350px]">
             <div className="flex items-center justify-between mb-4 md:mb-6 pb-4 border-b border-slate-50">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className={`text-base md:text-xl text-charcoal ${headCls}`}>{t.history_title}</h2>
                 </div>
             </div>
             <div className="flex-1 overflow-x-auto no-scrollbar min-h-0">
                 {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                        <span className={bodyCls}>{t.no_data}</span>
                    </div>
                 ) : (
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                            <tr>
                                <th className={`pb-3 pt-1 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider ${subHeadCls}`}>{t.table_date}</th>
                                <th className={`pb-3 pt-1 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider ${subHeadCls}`}>{t.table_time}</th>
                                <th className={`pb-3 pt-1 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider ${subHeadCls}`}>{t.table_location}</th>
                                <th className={`pb-3 pt-1 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider text-right ${subHeadCls}`}>{t.table_status}</th>
                            </tr>
                        </thead>
                        <tbody className={`text-[12px] md:text-sm ${bodyCls}`}>
                            {history.map((record) => {
                                const date = new Date(record.timestamp);
                                return (
                                    <tr key={record.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="py-4 text-slate-600">
                                            {date.toLocaleDateString(lang === 'TH' ? 'th-TH' : 'en-GB', { day: '2-digit', month: '2-digit' })}
                                        </td>
                                        <td className="py-4 font-bold text-charcoal">
                                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-4 max-w-[150px] md:max-w-[200px] truncate text-slate-500" title={record.location}>
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${record.type === 'CHECK_IN' ? 'bg-blue-400' : 'bg-slate-300'}`}></span>
                                                {record.location}
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            {record.status !== 'NONE' && (
                                                <span className={`text-[8px] md:text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${record.status === 'LATE' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                                    {record.status === 'LATE' ? t.status_late : t.status_normal}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                 )}
             </div>
        </div>
    </div>
  );
};