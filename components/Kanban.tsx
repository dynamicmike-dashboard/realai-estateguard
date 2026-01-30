import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface KanbanProps {
  leads: Lead[];
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
  onSelect: (lead: Lead) => void;
  onAddLead: () => void;
}

const COLUMNS: LeadStatus[] = ['New', 'Discovery', 'Qualified', 'Showing', 'Negotiation', 'Closed'];

// Visual Card Component
const LeadCard: React.FC<{ lead: Lead; onClick?: () => void; isOverlay?: boolean }> = ({ lead, onClick, isOverlay }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 transition-shadow cursor-grab active:cursor-grabbing group relative ${isOverlay ? 'shadow-2xl rotate-2 scale-105 border-gold ring-2 ring-gold/20' : 'hover:shadow-md'}`}
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
    </div>
  </div>
);

// Draggable Wrapper
const DraggableLeadCard: React.FC<{ lead: Lead; onSelect: (lead: Lead) => void }> = ({ lead, onSelect }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: lead
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
      return (
          <div ref={setNodeRef} style={style} className="opacity-30 p-4 bg-slate-100 rounded-xl border border-dashed border-slate-300 h-[100px]">
          </div>
      );
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
       <LeadCard lead={lead} onClick={() => onSelect(lead)} />
    </div>
  );
};

// Droppable Column Wrapper
const DroppableColumn: React.FC<{ col: LeadStatus; leads: Lead[]; children: React.ReactNode }> = ({ col, leads, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: col,
  });

  return (
    <div 
        ref={setNodeRef} 
        className={`bg-slate-100/50 p-3 rounded-2xl min-h-[500px] space-y-3 border transition-colors ${isOver ? 'border-gold bg-gold/5' : 'border-slate-200/50'}`}
    >
        {children}
        {leads.length === 0 && (
            <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
            Drop here
            </div>
        )}
    </div>
  );
};

const Kanban: React.FC<KanbanProps> = ({ leads, onStatusChange, onSelect, onAddLead }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Drag starts after 5px movement (prevents accidental clicks)
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }) // Long press for mobile
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
       // Check if dropped on a column
       // Note: 'over.id' is the Droppable ID (which is the column name)
       const newStatus = over.id as LeadStatus;
       if (COLUMNS.includes(newStatus)) {
           // Find current lead
           const lead = leads.find(l => l.id === active.id);
           if (lead && lead.status !== newStatus) {
               onStatusChange(lead.id, newStatus);
           }
       }
    }
    setActiveId(null);
  };

  const activeLead = leads.find(l => l.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="relative">
        <div className="absolute top-0 right-0 z-10 px-4 md:px-0 -mt-12 md:-mt-16">
            <button 
                onClick={onAddLead}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg"
            >
                <i className="fa-solid fa-plus text-gold"></i> Add Manual Lead
            </button>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px] snap-x snap-mandatory px-4 md:px-0 pt-4">
        {COLUMNS.map(col => (
            <div key={col} className="flex-shrink-0 w-[85vw] md:w-80 snap-center">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                {col}
                </h3>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {leads.filter(l => l.status === col).length}
                </span>
            </div>
            
            <DroppableColumn col={col} leads={leads.filter(l => l.status === col)}>
                {leads.filter(l => l.status === col).map(lead => (
                    <DraggableLeadCard key={lead.id} lead={lead} onSelect={onSelect} />
                ))}
            </DroppableColumn>
            </div>
        ))}
        </div>
        
        <DragOverlay>
            {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
        </DragOverlay>
        </div>
    </DndContext>
  );
};

export default Kanban;