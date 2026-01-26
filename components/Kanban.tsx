import React from 'react';
import { Lead, LeadStatus } from '../types';

interface KanbanProps {
  leads: Lead[];
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
}

const COLUMNS: LeadStatus[] = ['New', 'Discovery', 'Qualified', 'Showing', 'Negotiation', 'Closed'];

const Kanban: React.FC<KanbanProps> = ({ leads, onStatusChange }) => {
  return (
    <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar min-h-[600px]">
      {COLUMNS.map(col => (
        <div key={col} className="flex-shrink-0 w-80">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold"></span>
              {col}
            </h3>
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {leads.filter(l => l.status === col).length}
            </span>
          </div>
          
          <div className="bg-slate-100/50 p-3 rounded-2xl min-h-[500px] space-y-3 border border-slate-200/50">
            {leads.filter(l => l.status === col).map(lead => (
              <div 
                key={lead.id} 
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-slate-800 text-sm">{lead.name}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    lead.financing_status === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {lead.financing_status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-3 truncate">{lead.property_address}</p>
                <div className="flex justify-between items-center">
                   <div className="flex -space-x-1">
                      {lead.notes.length > 0 && <span className="w-5 h-5 bg-gold/10 text-gold rounded-full flex items-center justify-center text-[8px] border border-gold/20"><i className="fa-solid fa-comment"></i></span>}
                   </div>
                   <div className="flex gap-1">
                      {col !== 'Closed' && (
                        <button 
                          onClick={() => onStatusChange(lead.id, COLUMNS[COLUMNS.indexOf(col) + 1])}
                          className="w-7 h-7 bg-slate-50 text-slate-400 hover:text-gold hover:bg-gold/10 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <i className="fa-solid fa-chevron-right text-[10px]"></i>
                        </button>
                      )}
                   </div>
                </div>
              </div>
            ))}
            {leads.filter(l => l.status === col).length === 0 && (
              <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                No leads here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Kanban;