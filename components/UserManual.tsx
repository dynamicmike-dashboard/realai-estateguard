import React from 'react';
import { useTranslation } from 'react-i18next';

const UserManual: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-slate-950 p-12 rounded-[3rem] text-white shadow-2xl border border-white/5 relative overflow-hidden">
         <div className="absolute right-0 top-0 p-16 opacity-5">
            <i className="fa-solid fa-book-open text-[15rem] text-white"></i>
         </div>
         <div className="relative z-10">
            <h2 className="text-4xl font-luxury font-bold mb-4">{t('manual.title')}</h2>
            <p className="text-slate-400 text-lg max-w-xl leading-relaxed">{t('manual.subtitle')}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Search Feature */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-magnifying-glass text-2xl text-blue-600"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('manual.features.search.title')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
                {t('manual.features.search.desc')}
            </p>
        </div>

        {/* Property Training */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-graduation-cap text-2xl text-purple-600"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('manual.features.training.title')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
                {t('manual.features.training.desc')}
            </p>
        </div>

        {/* Business Settings */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-briefcase text-2xl text-emerald-600"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('manual.features.knowledge.title')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
                {t('manual.features.knowledge.desc')}
            </p>
        </div>

        {/* Mobile App */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-mobile-screen text-2xl text-gold"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t('manual.features.mobile.title')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
                {t('manual.features.mobile.desc')}
            </p>
        </div>

      </div>

      <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 text-center">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{t('manual.support.title')}</p>
        <p className="text-slate-900 font-bold mb-2">{t('manual.support.subtitle')}</p>
        <a href="mailto:support@estateguard.ai" className="text-gold font-bold hover:underline">support@estateguard.ai</a>
      </div>
    </div>
  );
};

export default UserManual;
