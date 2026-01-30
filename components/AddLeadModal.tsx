import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PropertySchema, LeadStatus } from '../types';

interface AddLeadModalProps {
  properties: PropertySchema[];
  onClose: () => void;
  onSave: (lead: { name: string; phone: string; email: string; property_id: string; property_address: string; status: LeadStatus; notes: string[] }) => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ properties, onClose, onSave }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPropId, setSelectedPropId] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProp = properties.find(p => p.property_id === selectedPropId);
    
    onSave({
      name,
      phone,
      email,
      property_id: selectedPropId || 'General',
      property_address: selectedProp?.listing_details.address || 'General Inquiry',
      status,
      notes: note ? [note] : []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-950 p-6 text-white flex justify-between items-center">
            <h3 className="text-lg font-bold font-luxury">{t('add_lead.title')}</h3>
            <button onClick={onClose} className="hover:text-gold transition-colors"><i className="fa-solid fa-xmark"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('add_lead.labels.name')}</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-gold" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('add_lead.labels.phone')}</label>
                    <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-gold" placeholder="+1..." />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('add_lead.labels.email')}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-gold" placeholder="john@example.com" />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('add_lead.labels.property')}</label>
                <select value={selectedPropId} onChange={e => setSelectedPropId(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-gold bg-white">
                    <option value="">{t('add_lead.placeholders.general')}</option>
                    {properties.map(p => (
                        <option key={p.property_id} value={p.property_id}>{p.listing_details.address}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('add_lead.labels.status')}</label>
                <select value={status} onChange={e => setStatus(e.target.value as LeadStatus)} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-gold bg-white">
                    {['New', 'Discovery', 'Qualified', 'Showing', 'Negotiation', 'Closed'].map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('add_lead.labels.note')}</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-gold h-20 resize-none" placeholder={t('add_lead.placeholders.details')} />
            </div>

            <button type="submit" className="w-full bg-slate-950 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                {t('add_lead.submit')}
            </button>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;
