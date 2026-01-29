import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';

interface LeadDetailsModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Lead>) => void;
  onDelete: (id: string) => void;
}

const STATUS_OPTIONS: LeadStatus[] = ['New', 'Discovery', 'Qualified', 'Showing', 'Negotiation', 'Closed', 'Archived'];

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ lead, onClose, onUpdate, onDelete }) => {
  const [note, setNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Parse Timestamp
  const dateStr = lead.created_at || lead.timestamp;
  const formattedDate = dateStr ? new Date(dateStr).toLocaleString() : 'N/A';

  const handleAddNote = () => {
    if (!note.trim()) return;
    const newNotes = [...(lead.notes || []), `${new Date().toLocaleDateString()}: ${note}`];
    onUpdate(lead.id, { notes: newNotes });
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-950 p-8 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h2 className="text-2xl font-luxury font-bold">{lead.name}</h2>
               <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                 lead.status === 'New' ? 'bg-blue-500' : 
                 lead.status === 'Closed' ? 'bg-emerald-500' : 'bg-gold text-slate-950'
               }`}>
                 {lead.status}
               </span>
            </div>
            <p className="text-slate-400 text-xs flex items-center gap-2">
              <i className="fa-solid fa-clock"></i> Captured: {formattedDate}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
            
            {/* Quick Actions / Status */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Pipeline Stage</label>
               <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(status => (
                    <button
                      key={status}
                      onClick={() => onUpdate(lead.id, { status })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        lead.status === status 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-gold hover:text-gold'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
               </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100">
                        <i className="fa-solid fa-phone text-gold"></i>
                        <span className="font-mono text-sm font-bold text-slate-700">{lead.phone}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Interest</label>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100">
                        <i className="fa-solid fa-house text-emerald-500"></i>
                        <span className="text-sm font-bold text-slate-700 truncate">{lead.property_address}</span>
                    </div>
                </div>
            </div>

            {/* Notes Section */}
            <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Concierge Notes</label>
               <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 min-h-[150px] space-y-4">
                  {lead.notes?.length === 0 && <p className="text-slate-400 text-sm italic">No notes recorded yet.</p>}
                  {lead.notes?.map((n, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-600 shadow-sm">
                        {n}
                    </div>
                  ))}
               </div>
               <div className="mt-4 flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Add a manual note..." 
                    className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-gold text-sm"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button onClick={handleAddNote} className="bg-slate-900 text-white px-6 rounded-xl font-bold text-xs hover:bg-slate-800">
                    Add
                  </button>
               </div>
            </div>

            {/* Delete Zone */}
            <div className="pt-8 border-t border-slate-100 flex justify-end">
               <button 
                 onClick={() => { if(window.confirm('Delete this lead forever?')) onDelete(lead.id); }}
                 className="text-red-400 text-xs font-bold hover:text-red-600 flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
               >
                 <i className="fa-solid fa-trash"></i> DELETE LEAD RECORD
               </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsModal;
