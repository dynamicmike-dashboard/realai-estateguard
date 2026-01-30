import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { PropertySchema, Lead } from '../types';

interface DashboardStatsProps {
  properties: PropertySchema[];
  leads: Lead[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ properties, leads }) => {
  const { t } = useTranslation();
  // --- REAL DATA AGGREGATION ---
  
  // 1. Calculate Weekly Heatmap Data
  const getLast7Days = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const last7: { name: string, leads: number, date: string }[] = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        last7.push({
            name: days[d.getDay()],
            leads: 0,
            date: d.toISOString().split('T')[0] // YYYY-MM-DD
        });
    }
    return last7;
  };

  const chartData = getLast7Days().map(day => {
      // Count leads that match this date
      const count = leads.filter(l => {
          if (!l.timestamp && !l.created_at) return false;
          // Handle both Supabase format (created_at) and local (timestamp)
          const dateStr = (l.created_at || l.timestamp).split('T')[0];
          return dateStr === day.date;
      }).length;
      return { name: day.name, leads: count };
  });

  // 2. Calculate Real Metrics
  const estateGuardCount = properties.filter(p => p.tier === 'Estate Guard').length;
  
  // Conversion Rate (Closed / Total)
  const closedCount = leads.filter(l => l.status === 'Closed').length;
  const conversionRate = leads.length > 0 
      ? Math.round((closedCount / leads.length) * 100) 
      : 0;
  
  // Real Capture (Leads in last 30 days) - Mocking "Sessions" is impossible without analytics, 
  // so we switch to "Monthly Volume"
  const leadsThisMonth = leads.filter(l => {
      const d = new Date(l.created_at || l.timestamp);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('dashboard.metrics.portfolio_volume')}</p>
          <p className="text-2xl font-bold mt-1">{properties.length} {t('dashboard.metrics.assets')}</p>
          <div className="mt-2 text-emerald-600 text-xs font-semibold">
            <i className="fa-solid fa-building mr-1"></i> {t('dashboard.metrics.active_listings')}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('dashboard.metrics.total_leads')}</p>
          <p className="text-2xl font-bold mt-1">{leads.length}</p>
          <div className="mt-2 text-gold text-xs font-semibold">
            <i className="fa-solid fa-fire mr-1"></i> {t('dashboard.metrics.all_time')}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('dashboard.metrics.gated_estates')}</p>
          <p className="text-2xl font-bold mt-1">{estateGuardCount}</p>
          <div className="mt-2 text-slate-400 text-xs font-semibold">
            {t('dashboard.metrics.high_security')}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t('dashboard.metrics.conversion_rate')}</p>
          <p className="text-2xl font-bold mt-1">{conversionRate}%</p>
          <div className="mt-2 text-emerald-600 text-xs font-semibold">
            <i className="fa-solid fa-chart-line mr-1"></i> {closedCount} {t('dashboard.metrics.closed_deals')}
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">{t('dashboard.heatmap_title')}</h3>
        {/* FIXED: Explicit height and min-height to prevent width(-1) warnings */}
        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
          <ResponsiveContainer width="99%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="leads" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lead Status Pipeline */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">{t('dashboard.pipeline_title')}</h3>
        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
          <ResponsiveContainer width="99%" height={300}>
            <BarChart data={[
                { name: 'New', count: leads.filter(l => l.status === 'New').length },
                { name: 'Qualified', count: leads.filter(l => l.status === 'Qualified').length },
                { name: 'Showing', count: leads.filter(l => l.status === 'Showing').length },
                { name: 'Closed', count: leads.filter(l => l.status === 'Closed').length },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} allowDecimals={false} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {['New', 'Qualified', 'Showing', 'Closed'].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 3 ? '#10b981' : '#d4af37'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;