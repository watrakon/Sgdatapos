import React, { useState, useEffect } from 'react';
import { EmployeeService, Employee } from '../services/EmployeeService';
import { Language } from '../App';
import { translations } from '../utils/translations';

type Team = 'BANGKOK' | 'CHONBURI';

interface LoginFormProps {
  onLogin: (employee: Employee, team: Team) => void;
  lang: Language;
  onLangToggle: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, lang, onLangToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [team, setTeam] = useState<Team>('BANGKOK');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const [fEmail, setFEmail] = useState('');
  const [fNewPass, setFNewPass] = useState('');
  const [fConfirmPass, setFConfirmPass] = useState('');
  const [fStatus, setFStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const t = (translations as any)[lang];
  const headCls = lang === 'TH' ? 'font-prompt font-bold' : 'font-montserrat font-bold';
  const subHeadCls = lang === 'TH' ? 'font-prompt font-medium' : 'font-montserrat font-semibold';
  const bodyCls = lang === 'TH' ? 'font-prompt font-normal' : 'font-montserrat font-normal';

  useEffect(() => {
    const saved = EmployeeService.getSavedCredentials();
    if (saved) {
      setEmail(saved.email);
      setPassword(saved.pass);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const employee = await EmployeeService.authenticate(email, password);
      if (employee) {
        EmployeeService.saveCredentials(email, password, rememberMe);
        EmployeeService.saveLoginSession(employee.id, team);
        onLogin(employee, team);
      } else {
        setError(t.errorAuth || (lang === 'TH' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'Invalid email or password'));
      }
    } catch (err) {
      setError('System Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (fNewPass !== fConfirmPass) {
        setFStatus({ type: 'error', msg: lang === 'TH' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match' });
        return;
    }
    const success = await EmployeeService.updatePassword(fEmail, fNewPass);
    if (success) {
        setFStatus({ type: 'success', msg: lang === 'TH' ? 'เปลี่ยนรหัสผ่านสำเร็จ' : 'Password updated successfully' });
        setTimeout(() => { 
          setIsForgotOpen(false); 
          setFStatus(null); 
          setFEmail(''); 
          setFNewPass(''); 
          setFConfirmPass(''); 
        }, 2000);
    } else {
        setFStatus({ type: 'error', msg: lang === 'TH' ? 'ไม่พบอีเมลในระบบ' : 'Email not found' });
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl p-8 md:p-14 relative animate-in w-full max-w-[480px]">
      <button 
        onClick={onLangToggle}
        className="absolute top-6 right-6 md:top-10 md:right-10 w-10 h-8 md:w-12 md:h-10 rounded-xl bg-[#F8F9FB] flex items-center justify-center font-montserrat font-bold text-[11px] md:text-[13px] text-charcoal border border-slate-50 uppercase"
      >
        {lang === 'TH' ? 'EN' : 'TH'}
      </button>

      <div className="flex flex-col items-center mb-6 md:mb-10 mt-2 select-none">
        <div className="flex items-center justify-center font-montserrat font-bold text-[32px] md:text-[48px] tracking-tight leading-tight">
          <span className="text-[#D0342C]">SGDATA</span>
          <span className="text-[#4A4A4A]">POS</span>
        </div>
        <p className="text-[10px] md:text-[11px] tracking-[0.3em] md:tracking-[0.4em] font-montserrat font-bold text-[#A1ADB9] uppercase mt-2">HR Management Portal</p>
      </div>

      <div className="text-center mb-6 md:mb-10">
        <h1 className={`text-[28px] md:text-[42px] leading-tight text-charcoal mb-1 ${headCls}`}>
          {t.loginTitle}
        </h1>
        <p className={`text-[13px] md:text-[15px] font-medium text-[#A1ADB9] ${subHeadCls}`}>
          {t.loginSub}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="space-y-2 md:space-y-3">
          <label className={`block text-[12px] md:text-[14px] font-medium text-[#A1ADB9] ml-1 ${bodyCls}`}>
            {t.office}
          </label>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {(['BANGKOK', 'CHONBURI'] as Team[]).map((tValue) => (
              <button
                key={tValue}
                type="button"
                onClick={() => setTeam(tValue)}
                className={`py-3 md:py-5 rounded-[1.2rem] md:rounded-[1.8rem] text-[13px] md:text-[15px] font-bold transition-all ${
                  team === tValue 
                  ? 'bg-[#4A4A4A] text-white shadow-lg' 
                  : 'bg-[#F8F9FB] text-[#A1ADB9] hover:bg-slate-50'
                } font-montserrat`}
              >
                {tValue}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className={`block text-[12px] md:text-[14px] font-medium text-[#A1ADB9] ml-1 ${bodyCls}`}>
            {t.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full h-[56px] md:h-[68px] px-6 md:px-8 rounded-[1.2rem] md:rounded-[1.8rem] bg-[#F8F9FB] border-none outline-none text-[#4A4A4A] text-[15px] md:text-[16px] transition-all font-medium placeholder:text-slate-200 ${bodyCls}`}
            placeholder="example@sgdatahub.com"
            required
          />
        </div>

        <div className="space-y-1">
          <label className={`block text-[12px] md:text-[14px] font-medium text-[#A1ADB9] ml-1 ${bodyCls}`}>
            {t.password}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full h-[56px] md:h-[68px] px-6 md:px-8 rounded-[1.2rem] md:rounded-[1.8rem] bg-[#F8F9FB] border-none outline-none text-[#4A4A4A] text-[15px] md:text-[16px] transition-all font-medium placeholder:text-slate-200 font-montserrat tracking-widest`}
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex items-center px-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                className="peer h-5 w-5 md:h-6 md:w-6 cursor-pointer appearance-none rounded-md bg-[#F8F9FB] border border-slate-200 checked:bg-[#4A4A4A] transition-all"
              />
              <svg className="absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className={`text-[13px] md:text-[15px] text-[#A1ADB9] ${bodyCls}`}>
              {t.rememberMe}
            </span>
          </label>
        </div>

        {error && (
          <div className={`bg-red-50 text-primary p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.8rem] text-[12px] md:text-[13px] ${bodyCls} text-center font-bold border border-red-100 animate-in`}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 md:py-6 bg-[#D0342C] text-white rounded-[1.2rem] md:rounded-[1.8rem] text-[18px] md:text-[20px] shadow-xl md:shadow-2xl shadow-red-100 transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-50 ${headCls}`}
        >
          {isLoading ? t.processing : t.signInBtn}
        </button>

        <div className="text-center pt-2 md:pt-4">
          <button 
            type="button" 
            onClick={() => setIsForgotOpen(true)}
            className={`text-[13px] md:text-[15px] font-medium text-[#A1ADB9] hover:text-[#D0342C] underline underline-offset-4 ${bodyCls}`}
          >
            {t.forgotLink}
          </button>
        </div>
      </form>

      {isForgotOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm animate-in">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl p-8 md:p-12 flex flex-col relative border border-slate-100">
              <button 
                onClick={() => setIsForgotOpen(false)} 
                className="absolute top-6 right-6 md:top-10 md:right-10 text-slate-300 hover:text-charcoal transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h2 className={`text-xl md:text-2xl text-charcoal mb-2 ${headCls}`}>
                {t.forgotLink}
              </h2>
              <p className={`text-xs md:text-sm text-slate-400 mb-8 md:mb-10 leading-relaxed ${bodyCls}`}>
                {lang === 'TH' ? 'กรุณากรอกอีเมลของคุณเพื่อตั้งรหัสผ่านใหม่' : 'Please enter your email to reset your password.'}
              </p>
              
              <div className="space-y-4 md:space-y-6">
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 ${subHeadCls}`}>Email</label>
                  <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} className="w-full px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl bg-[#F8F9FB] outline-none font-bold text-charcoal shadow-inner" placeholder="user@sgdatahub.com" />
                </div>
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 ${subHeadCls}`}>New Password</label>
                  <input type="password" value={fNewPass} onChange={e => setFNewPass(e.target.value)} className="w-full px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl bg-[#F8F9FB] outline-none font-bold text-charcoal shadow-inner" placeholder="••••••••" />
                </div>
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 ${subHeadCls}`}>Confirm</label>
                  <input type="password" value={fConfirmPass} onChange={e => setFConfirmPass(e.target.value)} className="w-full px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl bg-[#F8F9FB] outline-none font-bold text-charcoal shadow-inner" placeholder="••••••••" />
                </div>

                {fStatus && (
                   <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold text-center border animate-in ${fStatus.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-primary border-red-100'}`}>
                      {fStatus.msg}
                   </div>
                )}

                <button onClick={handleResetPassword} className={`w-full py-4 md:py-5 bg-charcoal text-white rounded-xl md:rounded-[1.8rem] font-bold shadow-xl hover:bg-black transition-all mt-2 tracking-widest ${headCls}`}>
                  RESET PASSWORD
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};