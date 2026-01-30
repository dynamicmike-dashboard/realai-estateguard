
import React from 'react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: t('sidebar.dashboard') },
    { id: 'properties', icon: 'fa-home', label: t('sidebar.properties') },
    { id: 'leads', icon: 'fa-user-tie', label: t('sidebar.leads') },
    { id: 'ingestion', icon: 'fa-file-import', label: t('sidebar.ingestion') },
    { id: 'chat', icon: 'fa-shield-halved', label: t('sidebar.chat') },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-6 flex flex-col shadow-xl">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg">
            <i className="fa-solid fa-shield-halved text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight">EstateGuard <span className="text-indigo-400">AI</span></h1>
        </div>
        
        {/* Language Switcher */}
        <div className="flex gap-1 justify-center bg-slate-800 p-1.5 rounded-xl">
            {[
              { code: 'en', label: '🇺🇸 EN' },
              { code: 'es', label: '🇪🇸 ES' },
              { code: 'fr', label: '🇫🇷 FR' }
            ].map(({ code, label }) => (
                <button 
                  key={code}
                  onClick={() => changeLanguage(code)}
                  className={`text-[11px] font-bold px-2 py-1.5 rounded-lg transition-all ${i18n.language === code ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                    {label}
                </button>
            ))}
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <img src="https://picsum.photos/40/40?grayscale" className="rounded-full w-10 h-10 border border-slate-700" alt="Agent" />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">Westlake Premier</p>
            <p className="text-xs text-slate-500 truncate">{t('sidebar.agent_role')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
