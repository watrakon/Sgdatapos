import React, { useState, useRef, useEffect } from 'react';
import { EmployeeService } from '../../services/EmployeeService';
import { translations } from '../../utils/translations';
import { Language } from '../../App';

declare const google: any;

interface CheckInModalProps {
  userEmail: string;
  modalType: 'CHECK_IN' | 'CHECK_OUT';
  onClose: () => void;
  onSuccess: () => void;
  lang: Language;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ userEmail, modalType, onClose, onSuccess, lang }) => {
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationName, setLocationName] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isApiBroken, setIsApiBroken] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];
  const headCls = lang === 'TH' ? 'font-prompt font-bold' : 'font-montserrat font-bold';
  const bodyCls = lang === 'TH' ? 'font-prompt font-normal' : 'font-montserrat font-normal';

  useEffect(() => {
    setLocationName(t.geo_fetching);
    
    const handleAuthError = () => {
      setMapError('BILLING_OR_AUTH_ERROR');
      setIsApiBroken(true);
      fetchBasicCoords();
    };
    window.addEventListener('google-maps-auth-error', handleAuthError);

    fetchBasicCoords();

    return () => {
       window.removeEventListener('google-maps-auth-error', handleAuthError);
    };
  }, []);

  const fetchBasicCoords = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const coords = { lat, lng };
        setCurrentLocation(coords);
        updateAddressName(lat, lng);
        
        if (!isApiBroken) {
          setTimeout(() => initMap(lat, lng), 200);
        }
      }, (err) => {
        console.warn("GPS Access Denied or Timed out", err);
        setMapError('GPS_ACCESS_DENIED');
        setCurrentLocation({ lat: 13.7563, lng: 100.5018 }); // Default BKK
        setLocationName(lang === 'TH' ? 'กรุณาระบุสถานที่ด้วยตนเอง' : 'Manual entry required');
        setIsEditingLocation(true);
      }, { timeout: 10000, enableHighAccuracy: true });
    } else {
      setMapError('GEOLOCATION_UNSUPPORTED');
    }
  };

  const fetchOSMLocation = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
          headers: { 'Accept-Language': lang === 'TH' ? 'th' : 'en' }
      });
      const data = await res.json();
      if (data && data.address) {
          const addr = data.address;
          const parts = [];
          if (addr.road) parts.push(addr.road);
          if (addr.suburb || addr.neighbourhood) parts.push(addr.suburb || addr.neighbourhood);
          if (addr.city || addr.town || addr.province) parts.push(addr.city || addr.town || addr.province);
          return parts.length > 0 ? parts.join(', ') : data.display_name;
      }
      return null;
    } catch (e) { return null; }
  };

  const updateAddressName = async (lat: number, lng: number) => {
    if (isEditingLocation) return;
    
    if (!isApiBroken && typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results?.[0]) {
          setLocationName(response.results[0].formatted_address);
          return;
        }
      } catch (e: any) {
        console.warn("Google Geocoder Failed", e);
        if (e.code === 'REQUEST_DENIED') setIsApiBroken(true);
      }
    }

    const osmName = await fetchOSMLocation(lat, lng);
    if (osmName) {
      setLocationName(osmName);
    } else {
      setLocationName(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const initMap = (lat: number, lng: number) => {
    if (isApiBroken || !mapRef.current || typeof google === 'undefined' || !google.maps) return;
    try {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat, lng }, 
        zoom: 17, 
        disableDefaultUI: true, 
        gestureHandling: 'greedy' // ทำให้เลื่อนแผนที่บนมือถือได้ง่ายขึ้น
      });
      const marker = new google.maps.Marker({ position: { lat, lng }, map, draggable: true });
      marker.addListener('dragend', (e: any) => {
         const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
         setCurrentLocation(newPos);
         updateAddressName(newPos.lat, newPos.lng);
         map.panTo(newPos);
      });
    } catch (e) {
      setIsApiBroken(true);
      setMapError('MAP_INIT_FAILED');
    }
  };

  const handleConfirm = () => {
    const now = new Date();
    let status: 'NORMAL' | 'LATE' | 'NONE' = 'NONE';
    if (modalType === 'CHECK_IN') {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      status = (hours > 9 || (hours === 9 && minutes > 0)) ? 'LATE' : 'NORMAL';
    }
    EmployeeService.saveTimeRecord({
      id: Date.now().toString(),
      email: userEmail,
      type: modalType,
      status: status,
      timestamp: now.toISOString(),
      location: locationName || (lang === 'TH' ? 'ระบุพิกัด GPS' : 'GPS Coordinates'),
      coords: currentLocation ? { latitude: currentLocation.lat, longitude: currentLocation.lng } : null
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-white animate-in overflow-y-auto">
        <div className="w-full flex-1 flex flex-col items-center p-6 md:p-10">
            <div className="w-full max-w-5xl flex flex-col items-center text-center shrink-0">
                <h1 className={`text-2xl md:text-4xl text-charcoal mb-2 ${headCls}`}>
                    {modalType === 'CHECK_IN' ? t.modal_checkin_title : t.modal_checkout_title}
                </h1>
                <p className="text-slate-400 text-xs md:text-base mb-6 md:mb-12">{t.confirm_sub}</p>
            </div>

            <div className="w-full bg-slate-50 rounded-[2rem] md:rounded-[40px] flex-1 min-h-[300px] mb-8 md:mb-12 relative overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
                {isApiBroken || mapError ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="text-4xl md:text-5xl mb-4">📍</div>
                    <p className="text-[10px] md:text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                      Manual Location Entry Active
                    </p>
                  </div>
                ) : (
                  <div ref={mapRef} className="absolute inset-0 w-full h-full opacity-60 mix-blend-multiply"></div>
                )}
                
                <div className="relative z-10 flex flex-col items-center justify-center p-4 max-w-2xl w-full">
                    <span className="text-[10px] md:text-[11px] text-slate-400 uppercase tracking-widest mb-2 font-bold">{t.location_label}</span>
                    {!currentLocation && !mapError ? (
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-6 py-3 rounded-full shadow-sm">
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
                            <span className="text-slate-500 text-xs md:text-sm">{t.geo_fetching}</span>
                        </div>
                    ) : (
                        <div className="w-full px-2">
                            {isEditingLocation || isApiBroken ? (
                              <div className="flex flex-col items-center gap-4">
                                <input 
                                  type="text" 
                                  autoFocus
                                  value={locationName} 
                                  onChange={(e) => setLocationName(e.target.value)}
                                  className="text-lg md:text-2xl text-charcoal font-bold text-center bg-white border-2 border-primary/20 focus:border-primary outline-none w-full px-6 py-4 rounded-2xl shadow-xl"
                                  placeholder={lang === 'TH' ? 'พิมพ์ระบุสถานที่...' : 'Enter location...'}
                                />
                                <button onClick={() => setIsEditingLocation(false)} className="px-10 py-3 bg-emerald-500 text-white rounded-full text-xs font-bold uppercase shadow-lg">Done</button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <h2 className={`text-lg md:text-2xl text-charcoal px-4 md:px-10 drop-shadow-sm line-clamp-3 md:line-clamp-2 ${headCls}`}>{locationName || t.geo_fetching}</h2>
                                <button onClick={() => setIsEditingLocation(true)} className="text-[10px] md:text-xs text-primary font-bold underline mt-4 hover:text-red-700 tracking-wider uppercase">{t.edit_location}</button>
                              </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full max-w-5xl flex flex-col-reverse md:flex-row items-center justify-between gap-4 md:gap-8 px-2 shrink-0 pb-6 md:pb-0">
                <button onClick={onClose} className="text-slate-400 text-base md:text-lg hover:text-charcoal transition-colors font-bold uppercase tracking-widest py-3">{t.btn_cancel}</button>
                <button onClick={handleConfirm} className={`w-full md:flex-1 bg-primary text-white text-xl md:text-2xl py-5 md:py-6 rounded-2xl md:rounded-[2rem] shadow-2xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all ${headCls}`}>{t.btn_confirm}</button>
            </div>
        </div>
    </div>
  );
};