import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import DashboardStats from './components/DashboardStats';
import PropertyCard from './components/PropertyCard';
import IngestionPortal from './components/IngestionPortal';
import AgentChat from './components/AgentChat';
import Modal from './components/Modal';
import Kanban from './components/Kanban';
import Settings from './components/Settings';
import PropertyDetails from './components/PropertyDetails';
import UserManual from './components/UserManual';
import LeadDetailsModal from './components/LeadDetailsModal';
import LeadDetailsModal from './components/LeadDetailsModal'; // Added import
import { PropertySchema, Lead, PropertyTier, AgentSettings, LeadStatus } from './types';

// Auth & Database Imports
import { supabase, useAuth } from './components/Auth/AuthProvider';
import { Login } from './components/Auth/Login';

// --- VITE-ONLY KEY RETRIEVAL ---
const GOOGLE_API_KEY = (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';

// --- INITIAL APP SETTINGS ---
const INITIAL_SETTINGS: AgentSettings = {
  businessName: 'EstateGuard AI',
  primaryColor: '#d4af37',
  apiKey: GOOGLE_API_KEY, 
  highSecurityMode: true,
  subscriptionTier: 'Enterprise',
  monthlyPrice: 0,
  businessAddress: '77 Ocean Drive, Miami FL',
  contactEmail: 'hq@estateguard.ai',
  contactPhone: '+1 (800) ESTATE-AI',
  specialties: ['Luxury Waterfront', 'Commercial High-Rise', 'Exclusive Land'],
  agentCount: 12,
  conciergeIntro: 'Ask our happy assistant about any of our properties 24/7'
};

const MOCK_PROPERTIES: PropertySchema[] = [
  {
    property_id: "EG-770",
    category: 'Residential',
    transaction_type: 'Sale',
    status: "Active",
    tier: PropertyTier.ESTATE_GUARD,
    visibility_protocol: {
      public_fields: ["address", "hero_narrative", "key_stats"],
      gated_fields: ["private_appraisal", "seller_concessions"]
    },
    listing_details: {
      address: "The Glass House, Aspen Peaks",
      price: 18500000, 
      video_tour_url: "https://www.w3schools.com/html/mov_bbb.mp4",
      key_stats: {
        bedrooms: 7,
        bathrooms: 9,
        sq_ft: 18200,
        lot_size: "12 Acres"
      },
      hero_narrative: "A seamless fusion of glass and stone, this peak-side masterpiece offers unparalleled alpine luxury."
    },
    deep_data: {},
    agent_notes: { motivation: "Private", showing_instructions: "Proof of Funds required" }
  },
  {
    property_id: "EG-212",
    category: 'Commercial',
    transaction_type: 'Lease',
    status: "Active",
    tier: PropertyTier.STANDARD,
    visibility_protocol: { public_fields: ["address"], gated_fields: ["mechanical_specs"] },
    listing_details: {
      address: "Tech Plaza Tower, Austin TX",
      price: 4200000,
      key_stats: { sq_ft: 120000, lot_size: "2.5 Acres", zoning: "Commercial-A" },
      hero_narrative: "Premium class-A office space with LEED Platinum certification."
    },
    deep_data: {},
    agent_notes: { motivation: "Downsizing portfolio", showing_instructions: "Appt only" }
  }
];

const App: React.FC = () => {
  const { user, loading, signOut } = useAuth(); // Auth Hook

  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState<AgentSettings>(INITIAL_SETTINGS);
  const [properties, setProperties] = useState<PropertySchema[]>(MOCK_PROPERTIES);
  const [searchTerm, setSearchTerm] = useState(''); // Search State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{title: string, content: React.ReactNode} | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // FIXED: Mapping helper to match 'name' and 'phone' columns in Supabase schema
  const mapLead = (d: any): Lead => ({
    id: d.id,
    name: d.name || "New Prospect",
    phone: d.phone || "N/A",
    financing_status: 'Unverified',
    property_id: 'General',
    property_address: d.property_address || "N/A",
    status: (d.status as LeadStatus) || 'New',
    timestamp: d.created_at,
    notes: [d.chat_summary || ""]
  });

  // --- SYNC & REALTIME SUBSCRIPTION ---
  useEffect(() => {
    // Only run if we have a user
    if (!user || !supabase) return;
    
    const initSync = async () => {
      // Fetch leads for THIS user only (RLS handles filtering)
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setLeads(data.map(mapLead));

      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes',{ event: 'INSERT', schema: 'public', table: 'leads' },(payload: any) => {
            if (payload.new.user_id === user.id) {
               setLeads((prev) => {
                  // Prevent Duplicate: If lead is already known (by ID), ignore
                  if (prev.some(l => l.id === payload.new.id)) return prev;
                  return [mapLead(payload.new), ...prev];
               });
               setNotifications((prev) => prev + 1);
            }
          }).subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    initSync();
  }, [user?.id]); // Safe optional chaining

  const selectedProperty = properties.find(p => p.property_id === selectedPropertyId) || null;

  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    if (!supabase) return;
    await supabase.from('leads').update({ status: newStatus }).eq('id', id);
    setLeads(prev => prev.map(l => l.id === id ? {...l, status: newStatus} : l));
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    // Optimistic Update
    setLeads(prev => prev.map(l => l.id === id ? {...l, ...updates} : l));
    if (selectedLead && selectedLead.id === id) {
        setSelectedLead(prev => prev ? {...prev, ...updates} : null);
    }
    // DB Update
    if(supabase) await supabase.from('leads').update(updates).eq('id', id);
  };
  
  const deleteLead = async (id: string) => {
    if(!supabase) return;
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelectedLead(null);
    await supabase.from('leads').delete().eq('id', id);
  };

    // --- PROPERTY SYNC ---
    useEffect(() => {
      // (unchanged)
      if (!user || !supabase) return;
      // ... (fetching logic shortened for replacement match) ...
      const fetchProperties = async () => {
        const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
        if (data && data.length > 0) {
            const dbProperties: PropertySchema[] = data.map((d: any) => d.data);
            const combined = [...dbProperties, ...MOCK_PROPERTIES].filter((p, index, self) => 
               index === self.findIndex((t) => t.property_id === p.property_id)
            );
            setProperties(combined);
        }
      };
      fetchProperties();
    }, [user?.id]);

  const handleCaptureLead = async (leadPart: Partial<Lead>, silent: boolean = false) => {
    console.log("Attempting capture:", leadPart); // Debug log
    if (!supabase || !user) {
        alert("System Error: Auth or Database connection missing.");
        return; 
    }

    // FIXED: Insert with user_id to enforce ownership
    const tempId = `temp-${Date.now()}`;
    const leadData = {
      user_id: user.id, // <--- Key for Multi-Tenancy
      name: leadPart.name || "New Prospect",
      phone: leadPart.phone || "N/A",
      property_address: leadPart.property_address || "N/A",
      property_id: leadPart.property_id || "General", // ADDED: Critical for DB constraints
      chat_summary: leadPart.notes?.[0] || "Captured via AI Concierge",
      status: 'New' as LeadStatus,
      created_at: new Date().toISOString(), // Mock timestamp for optimistic
      id: tempId // Temp ID
    };

    // 1. Optimistic Update (Immediate Feedback)
    const optimisticLead: Lead = mapLead(leadData);
    setLeads(prev => [optimisticLead, ...prev]);
    if (!silent) setNotifications(prev => prev + 1);
    
    // Show Feedback Modal ONLY if NOT silent
    if (!silent) {
        setModalContent({
            title: 'Pipeline Update',
            content: (
                <div className="text-center p-6">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 text-2xl animate-bounce">
                        <i className="fa-solid fa-check"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Lead Captured!</h3>
                    <p className="text-sm text-slate-500 mb-6">You have successfully secured a new prospect for <b>{leadData.property_address}</b>.</p>
                    <button 
                        onClick={() => { setModalContent(null); setActiveTab('leads'); }}
                        className="gold-button w-full py-4 rounded-xl font-bold text-sm shadow-xl"
                    >
                        View Pipeline
                    </button>
                </div>
            )
        });
    }

    // 2. Persist to Supabase
    const { data, error } = await supabase.from('leads').insert([{
        user_id: leadData.user_id,
        name: leadData.name,
        phone: leadData.phone,
        property_address: leadData.property_address,
        property_id: leadData.property_id, // ADDED: Persist ID
        chat_summary: leadData.chat_summary,
        status: leadData.status
    }]).select(); // Select the returned row
    
    if (error) {
      console.error("Supabase Save Error:", error.message);
      // alert("Note: Cloud sync failed, but lead is saved locally for this session.");
       alert(`CRITICAL DATABASE ERROR: Lead not saved to cloud.\n\nError: ${error.message}\n\nHint: Check if the 'leads' table has the 'property_id' column. You likely need to run the SQL migration script.`);
    } else if (data) {
      // 3. Replace Optimistic ID with Real ID from DB
      // SAFE HANDLE RACE CONDITION:
      // If 'Realtime Subscription' already added the new lead (by ID), we should just REMOVE the temp one.
      // Otherwise, we swap Temp -> Real.
      const realLead = mapLead(data[0]);
      
      setLeads(prev => {
         const exists = prev.some(l => l.id === realLead.id);
         if (exists) {
             // Realtime beat us to it. Just remove the temp duplicate.
             return prev.filter(l => l.id !== tempId);
         } else {
             // We beat Realtime. Swap it out.
             return prev.map(l => l.id === tempId ? realLead : l);
         }
      });
    }
  };


  const handlePropertyAdded = async (newProp: PropertySchema) => {
      // 1. Optimistic Update
      setProperties([newProp, ...properties]); 
      setActiveTab('properties');

      // 2. Persist to Supabase
      if (!user || !supabase) return;

      const { error } = await supabase.from('properties').insert([{
          property_id: newProp.property_id,
          user_id: user.id,
          address: newProp.listing_details.address,
          price: newProp.listing_details.price,
          status: newProp.status,
          data: newProp // Store full JSON blob
      }]);

      if (error) {
          console.error("Failed to save property:", error);
          alert("Backup failed: " + error.message);
      }
  };

  // --- FETCH SETTINGS ---
  useEffect(() => {
    if (!user || !supabase) return;
    const loadSettings = async () => {
        const { data } = await supabase.from('agent_settings').select('*').single();
        if (data) {
            setSettings(prev => ({
                ...prev,
                businessName: data.business_name || prev.businessName,
                primaryColor: data.primary_color || prev.primaryColor,
                conciergeIntro: data.concierge_intro || prev.conciergeIntro,
                apiKey: data.api_key || prev.apiKey,
                highSecurityMode: data.high_security_mode ?? prev.highSecurityMode,
                termsAndConditions: data.terms_and_conditions || "",
                privacyPolicy: data.privacy_policy || "",
                nda: data.nda || "",
                locationHours: data.location_hours || "",
                serviceAreas: data.service_areas || "",
                commissionRates: data.commission_rates || "",
                marketingStrategy: data.marketing_strategy || "",
                teamMembers: data.team_members || "",
                awards: data.awards || "",
                legalDisclaimer: data.legal_disclaimer || ""
            }));
        }
    };
    loadSettings();
  }, [user?.id]);

  const handleSaveSettings = async (newSettings: AgentSettings) => {
      setSettings(newSettings); // Optimistic
      if (!user || !supabase) return;

      const dbPayload = {
          user_id: user.id,
          business_name: newSettings.businessName,
          primary_color: newSettings.primaryColor,
          concierge_intro: newSettings.conciergeIntro,
          api_key: newSettings.apiKey,
          high_security_mode: newSettings.highSecurityMode,
          terms_and_conditions: newSettings.termsAndConditions,
          privacy_policy: newSettings.privacyPolicy,
          nda: newSettings.nda,
          location_hours: newSettings.locationHours,
          service_areas: newSettings.serviceAreas,
          commission_rates: newSettings.commissionRates,
          marketing_strategy: newSettings.marketingStrategy,
          team_members: newSettings.teamMembers,
          awards: newSettings.awards,
          legal_disclaimer: newSettings.legalDisclaimer
      };

      const { error } = await supabase.from('agent_settings').upsert(dbPayload);
      if (error) {
          console.error("Settings Save Failed:", error);
          alert("Failed to save settings: " + error.message);
      }
  };

  const updateProperty = async (updated: PropertySchema) => {
    // 1. Optimistic Update
    setProperties(prev => prev.map(p => p.property_id === updated.property_id ? updated : p));
    
    // 2. Persist to DB
    if (!user || !supabase) return;

    // We store the FULL JSON object in the 'data' column, plus top-level columns for querying
    const { error } = await supabase.from('properties').update({
        category: updated.category,
        transaction_type: updated.transaction_type,
        status: updated.status,
        price: updated.listing_details.price,
        address: updated.listing_details.address,
        data: updated 
    }).eq('property_id', updated.property_id);

    if (error) {
        console.error("Property Update Failed:", error);
        alert("Failed to save property changes: " + error.message);
    }
  };

  const showFooterModal = (type: string) => {
    // ... (rest of function unchanged, just need to make sure I don't delete it)
    switch(type) {
      case 'manual':
        setModalContent({
            title: 'Agent Operating Manual',
            content: (
              <div className="space-y-6 text-sm">
                <section>
                  <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-xs">1. Property Ingestion</h4>
                  <p>Use the <b>Ingest</b> tab to onboard new assets. Structure residential, commercial, or land listings instantly via Gemini AI.</p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-xs">2. Concierge Deployment</h4>
                  <p>Navigate to the <b>Concierge</b> tab to find your unique website embed code. This places the AI chatbot on your agency site.</p>
                </section>
                <section>
                  <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-xs">3. The Two-Strike Rule</h4>
                  <p>The bot is programmed to answer two specific questions about any property. Upon the third, it will pivot to secure lead capture.</p>
                </section>
              </div>
            )
          });
          break;
      case 'privacy':
        setModalContent({
            title: 'Privacy & Sovereignty',
            content: (
              <div className="space-y-4 text-sm">
                <p>EstateGuard utilizes <b>Zero-Trust</b> architecture. Your property data and lead transcripts are your agency's private assets.</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><b>Encryption:</b> AES-256 standard at rest.</li>
                  <li><b>Model Sovereignty:</b> Your data is NOT used to train global models.</li>
                </ul>
              </div>
            )
          });
          break;
      case 'terms':
        setModalContent({
            title: 'Terms of Engagement',
            content: (
              <div className="space-y-4 text-sm">
                <p>Usage of the EstateGuard AI platform requires compliance with local property disclosure regulations and maintenance of a valid personal Gemini API Key.</p>
              </div>
            )
          });
          break;
      case 'legal':
        setModalContent({
            title: 'Legal Disclaimer',
            content: (
              <div className="space-y-4 text-sm border-l-4 border-gold pl-4 italic">
                <p>RealAi EstateGuard is an AI-driven facilitation tool. All outputs must be verified by a licensed professional.</p>
                <p>© 2026 EstateGuard AI.</p>
              </div>
            )
          });
          break;
    }
  };

  // FIXED: Using user.id (UUID) ensures the API can map leads to the correct database row
  const embedCode = `<script \n  src="https://app.estateguard.ai/widget.js" \n  data-agent-id="${user?.id}" \n  data-theme="gold" \n  async>\n</script>`;

  // --- AUTH CHECKMOVED TO RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden flex-col md:flex-row">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        brandColor={settings.primaryColor} 
        onSignOut={signOut}
      />

      <main className="flex-1 overflow-y-auto main-content no-scrollbar flex flex-col">
        {/* PWA Install Notification */}
        <div className="fixed top-6 right-8 z-[60] hidden md:block">
           <div className="pwa-install-pill" onClick={() => setModalContent({title: 'Elite Agent Dashboard Installation', content: <div className="text-center p-4">
               <div className="bg-slate-950 p-10 rounded-[2.5rem] mb-8 border border-gold/20 shadow-2xl">
                  <i className="fa-solid fa-mobile-screen text-6xl text-gold mb-4"></i>
                  <p className="font-luxury text-2xl font-bold text-white tracking-wide">Mobile Access Setup</p>
                  <p className="text-sm text-slate-400 mt-2 tracking-tight font-medium uppercase">Native Agent Performance</p>
               </div>
               
               <div className="space-y-6 text-left">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-1 bg-gold"></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                       <i className="fa-brands fa-apple text-slate-900"></i> iOS (iPhone / iPad)
                    </p>
                    <ol className="text-xs text-slate-700 leading-relaxed font-semibold space-y-2">
                      <li>1. Open this page in <b>Safari</b>.</li>
                      <li>2. Tap the <b>'Share'</b> button <i className="fa-solid fa-arrow-up-from-bracket text-gold mx-1"></i> (square with arrow).</li>
                      <li>3. Scroll down and tap <b>'Add to Home Screen'</b>.</li>
                      <li>4. Open the <b>EstateGuard</b> app icon from your home screen.</li>
                    </ol>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1 bg-slate-900"></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                       <i className="fa-brands fa-android text-emerald-500"></i> Android (Chrome)
                    </p>
                    <ol className="text-xs text-slate-700 leading-relaxed font-semibold space-y-2">
                      <li>1. Tap the <b>'Menu'</b> <i className="fa-solid fa-ellipsis-vertical mx-1"></i> icon (3 dots) top right.</li>
                      <li>2. Select <b>'Install App'</b> or <b>'Add to Home Screen'</b>.</li>
                      <li>3. Confirm the installation and find it in your drawer.</li>
                    </ol>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 shadow-sm text-white">
                    <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                       <i className="fa-solid fa-laptop text-gold"></i> Desktop (Chrome / Edge)
                    </p>
                    <p className="text-xs leading-relaxed font-medium">
                        Click the <b>Install</b> icon <i className="fa-solid fa-download mx-1 text-gold"></i> in your address bar, OR open the <b>Browser Menu</b> <i className="fa-solid fa-ellipsis-vertical mx-1"></i> and select <b>"Install App"</b>.
                    </p>
                  </div>
               </div>
           </div>})}>
              <div className="text-left pr-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">COMMAND CENTER</p>
                <p className="text-sm text-white font-bold leading-none">Install Studio</p>
              </div>
              <div className="pwa-icon-box shadow-xl shadow-gold/20">
                 <i className="fa-solid fa-mobile-screen"></i>
              </div>
           </div>
        </div>

        <div className="p-4 md:p-10 flex-1">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">{settings.businessName}</span>
                {notifications > 0 && (
                  <div 
                      className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg shadow-red-500/30 animate-in zoom-in cursor-pointer"
                      onClick={() => { setActiveTab('leads'); setNotifications(0); }}
                  >
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                      {notifications} PRIORITY LEADS - VIEW PIPELINE
                  </div>
                )}
              </div>
              <h2 className="text-4xl font-luxury font-bold text-slate-950">
                {activeTab === 'dashboard' && 'Market Command'}
                {activeTab === 'properties' && 'Portfolio Control'}
                {activeTab === 'leads' && 'Pipeline Management'}
                {activeTab === 'settings' && 'Identity & Branding'}
                {activeTab === 'chat' && 'Concierge Deployment'}
                {activeTab === 'ingestion' && 'Asset Onboarding'}
                {activeTab === 'manual' && 'Operating Manual'}
              </h2>
            </div>
          </header>

          <div className="pb-20">
            {activeTab === 'dashboard' && <DashboardStats properties={properties} leads={leads} />}
            {activeTab === 'properties' && (
                <div className="space-y-6">
                    {/* Search Bar */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <i className="fa-solid fa-magnifying-glass text-slate-400 ml-2"></i>
                        <input 
                            type="text" 
                            placeholder="Search portfolio by address, price, or status..." 
                            className="flex-1 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {properties.filter(p => 
                            p.listing_details.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.listing_details.price.toString().includes(searchTerm) ||
                            p.status.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(p => (
                            <PropertyCard 
                              key={p.property_id} 
                              property={p} 
                              onSelect={(p) => { 
                                setSelectedPropertyId(p.property_id); 
                                setIsDetailsOpen(true); 
                              }} 
                            />
                        ))}
                    </div>
                </div>
            )}
            {activeTab === 'leads' && (
                <>
                  <Kanban leads={leads} onStatusChange={handleStatusChange} onSelect={setSelectedLead} />
                  {selectedLead && (
                      <LeadDetailsModal 
                          lead={selectedLead} 
                          onClose={() => setSelectedLead(null)} 
                          onUpdate={updateLead}
                          onDelete={deleteLead}
                      />
                  )}
                </>
            )}
            {activeTab === 'manual' && <UserManual />}
            
            {activeTab === 'ingestion' && (
              <IngestionPortal 
                onPropertyAdded={handlePropertyAdded} 
                apiKey={settings.apiKey} 
              />
            )}

            {activeTab === 'settings' && <Settings settings={settings} onUpdate={setSettings} onSave={handleSaveSettings} />}
            {activeTab === 'chat' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-7 space-y-12">
                        <div className="bg-slate-950 p-12 rounded-[3rem] text-white shadow-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                               <i className="fa-solid fa-code text-[10rem]"></i>
                            </div>
                            <h3 className="text-2xl font-luxury font-bold mb-6 flex items-center gap-3">
                                <i className="fa-solid fa-rocket text-gold"></i>
                                Deployment Sync
                            </h3>
                            <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-lg font-medium">
                                Embed your proprietary concierge instance. This snippet synchronizes visitor enquiries directly with your lead pipeline.
                            </p>
                            <div className="bg-slate-900/80 p-8 rounded-[1.5rem] font-mono text-xs text-gold border border-gold/10 break-all select-all mb-8 shadow-inner relative">
                                <div className="absolute top-4 right-4 text-[10px] font-black text-slate-800 uppercase tracking-widest bg-gold/10 px-2 py-1 rounded">Active Endpoint</div>
                                {embedCode}
                            </div>
                            <button 
                                onClick={() => { navigator.clipboard.writeText(embedCode); alert("Snippet copied to secure clipboard."); }}
                                className="gold-button px-12 py-5 rounded-2xl font-bold text-sm shadow-2xl transition-transform active:scale-95"
                            >
                                <i className="fa-solid fa-copy mr-2"></i> Copy Snippet
                            </button>
                        </div>
                        <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
                             <h3 className="text-2xl font-luxury font-bold mb-10 flex items-center gap-4">
                                <i className="fa-solid fa-shield-halved text-gold"></i>
                                Intelligence Guard
                            </h3>
                            <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-200">
                                <div className="flex items-center justify-between gap-10">
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-950 text-xl flex items-center gap-3">
                                            Estate Guard Protocol
                                            <span className={`text-[10px] px-3 py-1 rounded-full font-black ${settings.highSecurityMode ? 'bg-gold/20 text-gold shadow-lg shadow-gold/10' : 'bg-slate-200 text-slate-500'}`}>
                                              {settings.highSecurityMode ? 'SECURE' : 'OPEN'}
                                            </span>
                                        </p>
                                        <p className="text-sm text-slate-600 mt-4 leading-relaxed font-medium">
                                           <b className="text-slate-900">SECURE:</b> Gates sensitive fields (appraisals, notes) until qualification.<br/>
                                           <b className="text-slate-900">OPEN:</b> Removes all friction; all property data is public.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setSettings({...settings, highSecurityMode: !settings.highSecurityMode})}
                                        className={`flex-shrink-0 w-24 h-12 rounded-full transition-all duration-500 relative border-2 ${settings.highSecurityMode ? 'bg-gold border-gold shadow-2xl shadow-gold/30' : 'bg-slate-300 border-slate-300 shadow-inner'}`}
                                    >
                                        <div className={`absolute top-1 w-10 h-10 bg-white rounded-full shadow-xl transition-transform duration-500 ease-in-out ${settings.highSecurityMode ? 'translate-x-12' : 'translate-x-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-5">
                        <div className="sticky top-10">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <span className="w-2 h-2 bg-gold rounded-full animate-pulse"></span>
                              Concierge Sandbox
                           </p>
                           <AgentChat 
                                property={selectedProperty || properties[0]} 
                                onLeadCaptured={handleCaptureLead} 
                                settings={settings}
                           />
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>

        <footer className="mt-auto px-10 py-16 bg-slate-950 text-white text-[11px] font-bold border-t border-white/5 uppercase tracking-[0.2em]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-wrap justify-center gap-12">
              <button onClick={() => showFooterModal('manual')} className="hover:text-gold transition-colors">Operating Manual</button>
              <button onClick={() => showFooterModal('privacy')} className="hover:text-gold transition-colors">Privacy Cloud</button>
              <button onClick={() => showFooterModal('terms')} className="hover:text-gold transition-colors">Terms</button>
              <button onClick={() => showFooterModal('legal')} className="hover:text-gold transition-colors">Legal Sovereignty</button>
            </div>
            <p className="text-gold font-luxury text-base lowercase normal-case italic tracking-tight opacity-60">EstateGuard AI — Synchronized Intelligence</p>
          </div>
        </footer>
      </main>

      <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)} title={modalContent?.title || ''}>
        {modalContent?.content}
      </Modal>

      <Modal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        title=""
      >
        {selectedProperty && (
          <PropertyDetails 
            property={selectedProperty} 
            onUpdate={updateProperty}
            onDelete={async () => {
              // 1. Optimistic Update
              setProperties(properties.filter(p => p.property_id !== selectedProperty.property_id));
              setIsDetailsOpen(false);
              setSelectedPropertyId(null);

              // 2. Persist to DB
              if (user && supabase) {
                 const { error } = await supabase.from('properties').delete().eq('property_id', selectedProperty.property_id);
                 if (error) {
                    console.error("Delete failed:", error);
                    alert("Failed to delete from database: " + error.message);
                 }
              }
            }}
            onTest={() => {
              setIsDetailsOpen(false);
              setActiveTab('chat');
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default App;