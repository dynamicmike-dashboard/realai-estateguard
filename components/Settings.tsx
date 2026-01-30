import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AgentSettings } from '../types';

interface SettingsProps {
  settings: AgentSettings;
  onUpdate: (s: AgentSettings) => void;
  onSave: (s: AgentSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onSave }) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(settings);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-950 p-10 text-white flex justify-between items-center border-b-2 border-gold/30">
          <div>
            <h2 className="text-2xl font-luxury font-bold">{t('settings.title')}</h2>
            <p className="text-slate-400 text-sm mt-1">{t('settings.subtitle')}</p>
          </div>
          <div className="bg-gold text-slate-950 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
             {t('settings.tier_badge')}
          </div>
        </div>
        
        <div className="p-10 space-y-12">
          
          {/* Identity Section */}
          <section>
            <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-4 text-lg">
              <i className="fa-solid fa-palette text-gold"></i> 
              {t('settings.whitelabel_title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.agency_name')}</label>
                <input 
                  type="text" 
                  value={settings.businessName}
                  onChange={(e) => onUpdate({...settings, businessName: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.brand_color')}</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={settings.primaryColor}
                    onChange={(e) => onUpdate({...settings, primaryColor: e.target.value})}
                    className="w-16 h-16 rounded-2xl border-0 cursor-pointer p-0 overflow-hidden shadow-sm hover:scale-105 transition-transform"
                  />
                  <div>
                    <p className="text-xs font-mono text-slate-400 font-bold uppercase">{settings.primaryColor}</p>
                    <p className="text-xs text-slate-400">{t('settings.hints.color')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.intro')}</label>
              <textarea 
                rows={2}
                value={settings.conciergeIntro}
                onChange={(e) => onUpdate({...settings, conciergeIntro: e.target.value})}
                placeholder={t('concierge.intro_default')}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm"
              />
              <p className="text-[10px] text-slate-400">{t('settings.hints.intro')}</p>
            </div>
          </section>

          {/* AI Provisioning Section */}
          <section className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-4 text-lg">
              <i className="fa-solid fa-microchip text-gold"></i> 
              {t('settings.ai_provision_title')}
            </h3>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-tight">{t('settings.labels.api_key')}</p>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                   {t('settings.hints.api')}
                   <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-gold font-bold ml-1 hover:underline">Get key here →</a>
                </p>
                <div className="relative">
                    <i className="fa-solid fa-key absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input 
                        type="password" 
                        placeholder={t('settings.labels.api_key') + "..."}
                        value={settings.apiKey}
                        onChange={(e) => onUpdate({...settings, apiKey: e.target.value})}
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none text-sm font-mono"
                    />
                </div>
            </div>
            </section>

            {/* Business Knowledge Base */}
            <section>
                <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-4 text-lg">
                  <i className="fa-solid fa-briefcase text-gold"></i> 
                  {t('settings.knowledge_base_title')}
                </h3>
                <p className="text-sm text-slate-500 mb-6">{t('settings.knowledge_base_desc')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.terms')}</label>
                        <textarea rows={3} value={settings.termsAndConditions} onChange={(e) => onUpdate({...settings, termsAndConditions: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.privacy')}</label>
                        <textarea rows={3} value={settings.privacyPolicy} onChange={(e) => onUpdate({...settings, privacyPolicy: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.nda')}</label>
                        <textarea rows={3} value={settings.nda} onChange={(e) => onUpdate({...settings, nda: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.location')}</label>
                        <textarea rows={3} value={settings.locationHours} onChange={(e) => onUpdate({...settings, locationHours: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.areas')}</label>
                        <textarea rows={3} value={settings.serviceAreas} onChange={(e) => onUpdate({...settings, serviceAreas: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.commission')}</label>
                        <textarea rows={3} value={settings.commissionRates} onChange={(e) => onUpdate({...settings, commissionRates: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.marketing')}</label>
                        <textarea rows={3} value={settings.marketingStrategy} onChange={(e) => onUpdate({...settings, marketingStrategy: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.team')}</label>
                        <textarea rows={3} value={settings.teamMembers} onChange={(e) => onUpdate({...settings, teamMembers: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.awards')}</label>
                        <textarea rows={3} value={settings.awards} onChange={(e) => onUpdate({...settings, awards: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('settings.labels.legal')}</label>
                        <textarea rows={3} value={settings.legalDisclaimer} onChange={(e) => onUpdate({...settings, legalDisclaimer: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-gold outline-none transition-all font-medium text-sm" />
                    </div>
                </div>
            </section>

          <div className="pt-10 border-t border-slate-100 flex justify-end items-center gap-6">
             {saveSuccess && (
                 <span className="text-emerald-600 text-sm font-bold animate-fade-in flex items-center gap-2">
                    <i className="fa-solid fa-circle-check"></i> {t('settings.buttons.saved')}
                 </span>
             )}
            
             <button 
                onClick={handleSave}
                disabled={isSaving}
                className="gold-button px-12 py-4 rounded-2xl font-bold text-sm shadow-2xl shadow-gold/20 flex items-center gap-3 transition-transform active:scale-95 disabled:opacity-50"
             >
                {isSaving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                {isSaving ? t('settings.buttons.saving') : t('settings.buttons.save')}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;