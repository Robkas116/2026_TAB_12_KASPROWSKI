"use client";

import { useState, useEffect } from "react";
import { makeApi } from "@/lib/api/make";
import { vehicleApi } from "@/lib/api/vehicle";
import { actionApi } from "@/lib/api/action";
import { reservationApi } from "@/lib/api/reservation";
import { vehmodelApi } from "@/lib/api/vehmodel"; 
import { caretakerApi } from "@/lib/api/caretaker";
import { equipmentApi } from "@/lib/api/equipment";
import { setofequipmentApi } from "@/lib/api/set_of_equipment";
import { versionApi } from "@/lib/api/version";
import { workerApi } from "@/lib/api/worker";


import AddModal from "@/components/modals/AddModal";
import DataTable from "@/components/DataTable";
import { isPerformedApi } from "@/lib/api/is_performed";

type EntityType = "Makes" |  "Models"| "Equipment" | "Set_Of_Equipment" | "Versions" | "Vehicles"  | "Workers" | "Caretakers" | "Reservations" | "Actions" | "IsPerformed" ;

function extractItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object" && "items" in data) return (data as Record<string, unknown>).items as Record<string, unknown>[];
  if (data && typeof data === "object" && "data" in data) return (data as Record<string, unknown>).data as Record<string, unknown>[];
  return [];
}

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<EntityType>("Makes");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Record<string, unknown> | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const loadData = async (entity: EntityType) => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            let result;
            switch (entity) {
                case "Makes":
                    result = await makeApi.getAll();
                    break;
                case "Models":
                    result = await vehmodelApi.getAll();
                    break;
              
                case "Equipment":
                    result = await equipmentApi.getAll();
                    break;
                case "Set_Of_Equipment":
                    result = await setofequipmentApi.getAll();
                    break;
                case "Versions":
                    result = await versionApi.getAll();
                    break;
                case "Vehicles":
                    result = await vehicleApi.getAll();
                    break;
                case "Workers":
                    result = await workerApi.getAll();
                    break;
                case "Caretakers":
                    result = await caretakerApi.getAll();
                    break;
                    case "Reservations":
                    result = await reservationApi.getAll();
                    break;
                case "Actions":
                    result = await actionApi.getAll();
                    break;
                case "IsPerformed":
                    result = await isPerformedApi.getAll();
                    break;
               
               }
            setData(result);
        } catch (err: any) {
            setError(err.message || "Nie udało się pobrać danych z bazy.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(activeTab);
    }, [activeTab]);

const handleAddSubmit = async (normalizedData: Record<string, unknown>) => {
        setSaving(true);
        setError(null);
        try {
            const preparedData: Record<string, any> = { ...normalizedData};

            Object.keys(preparedData).forEach((key)=>{
                const value = preparedData[key];
                if(typeof value === "string"){
                    if(key.endsWith("_id")){
                        preparedData[key] = value.trim() !== "" ? Number(value) : null;
                    }
                    if(key === "price" || key === "distance"){
                        preparedData[key] = value.trim() !== "" ? Number(value) : 0;
                    }
                    if(key === "date_start" || key === "date"){
                        preparedData[key] = value.trim() !== "" ? value.substring(0,10): null;
                    }
                }
                
            });
            switch (activeTab) {
                case "Makes":
                   
                    await makeApi.create(normalizedData as any);
                    break;
                
                case "Models":
                   
                    await vehmodelApi.create(normalizedData as any);
                    break;

                case "Equipment":
                    await equipmentApi.create(normalizedData as any);
                    break;

                case "Set_Of_Equipment":
                    await setofequipmentApi.create(normalizedData as any);
                    break;

                case "Versions":
                    await versionApi.create(normalizedData as any);
                    break;

                case "Vehicles":
                    await vehicleApi.create(normalizedData as any);
                    break;

               
                case "Workers":
                    await workerApi.create(normalizedData as any);
                    break;  

                case "Caretakers":
                    await caretakerApi.create(normalizedData as any);
                    break;

                case "Reservations":
                    await reservationApi.create(normalizedData as any);
                    break;

                case "Actions":
                    await actionApi.create(normalizedData as any);
                    break;
                case "IsPerformed":
                    await isPerformedApi.create(normalizedData as any);
                    break;

            }

           
            setIsAddModalOpen(false); 
            await loadData(activeTab); 
        } catch (err: any) {
            
            setError(err.message || "Wystąpił błąd podczas dodawania rekordu.");
        } finally {
            setSaving(false);
        }
    };


    const tabs: EntityType[] = ["Makes","Models","Equipment", "Set_Of_Equipment", "Versions","Vehicles","Workers", "Caretakers", "Reservations", "Actions", "IsPerformed" ];

   
    const getSingularLabel = (entity: EntityType) => {
        if (entity === "Makes") return "Markę";
        if (entity === "Models") return "Model";
        if(entity === "Equipment") return "Wyposażenie";
        if(entity === "Set_Of_Equipment") return "Zestaw Wyposażenia";
        if(entity === "Versions") return "Wersję";
        if (entity === "Vehicles") return "Pojazd";
        if (entity === "Workers") return "Pracownika";
        if (entity === "Caretakers") return "Opiekuna pojazdu";
        if (entity === "Reservations") return "Rezerwację";
        if (entity === "Actions") return "Akcję";
        if (entity === "IsPerformed") return "Stan akcji";
       
        return entity;
    };

    const handleEditClick = (item: unknown) => {
        setItemToEdit(item as Record<string, unknown>);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        const items = extractItems(data);
        const item = items.find((i: unknown) => (i as Record<string, unknown>).id === id);
        if (item) {
            // Tutaj można dodać DeleteModal jeśli potrzebny
            handleDeleteSubmit(id);
        }
    };

    const handleDeleteSubmit = async (id: number) => {
        setSaving(true);
        try {
            switch (activeTab) {
                case "Makes":
                    await makeApi.delete(id);
                    break;
                case "Models":
                    await vehmodelApi.delete(id);
                    break;
                case "Equipment":
                    await equipmentApi.delete(id);
                    break;
                case "Set_Of_Equipment":
                    await setofequipmentApi.delete(id);
                    break;
                case "Versions":
                    await versionApi.delete(id);
                    break;
                case "Vehicles":
                    await vehicleApi.delete(id);
                    break;
                case "Workers":
                    await workerApi.delete(id);
                    break;
                case "Caretakers":
                    await caretakerApi.delete(id);
                    break;
                case "Reservations":
                    await reservationApi.delete(id);
                    break;
                case "Actions":
                    await actionApi.delete(id);
                    break;
                case "IsPerformed":
                    await isPerformedApi.delete(id);
                    break;
            }
            await loadData(activeTab);
        } catch (err: any) {
            setError(err.message || "Nie udało się usunąć rekordu.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 relative z-10 py-2">
            {/* Nagłówek Panelu */}
            <div className="space-y-2">
                <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400/80">
                    <span>Zarządzanie</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-white/40">Baza Danych</span>
                </nav>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                    Fleet Data <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Manager</span>
                </h2>
            </div>

            
            <div className="flex flex-wrap gap-2 border-b pb-2" style={{ borderColor: "var(--color-border)" }}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all duration-300 ${
                                isActive
                                    ? "text-white shadow-lg"
                                    : "hover:text-white"
                            }`}
                            style={{
                                color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                                background: isActive ? "var(--color-overlay)" : "transparent",
                                boxShadow: isActive ? "0 0 15px rgba(139, 92, 246, 0.15)" : "none",
                            }}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

           
            <div className="glass-elevated rounded-[2rem] p-6 sm:p-8 border border-white/5 relative overflow-hidden min-h-[400px]">
                
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/5">
                    <h3 className="text-lg font-black text-white tracking-tight">
                        Przeglądasz: <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{activeTab}</span>
                    </h3>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-[0_4px_15px_rgba(139,92,246,0.2)] transition-all duration-300 hover:-translate-y-0.5"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Dodaj {getSingularLabel(activeTab)}
                    </button>
                </div>

                {/* Stan Ładowania */}
                {loading && (
                    <div className="flex items-center gap-3 py-12 justify-center" style={{ color: "var(--color-accent-soft)" }}>
                        <div 
                            className="w-6 h-6 border-2 animate-spin rounded-full"
                            style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
                        />
                        <span className="text-sm font-medium">Pobieranie rekordów z bazy...</span>
                    </div>
                )}

                {/* Komunikat o błędzie */}
                {error && (
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm font-medium my-4">
                        <span className="font-bold">Błąd połączenia:</span> {error}
                    </div>
                )}

                {/* Tabela danych */}
                {!loading && !error && extractItems(data).length > 0 && (
                    <DataTable
                        items={extractItems(data)}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                    />
                )}

                {/* Brak danych */}
                {!loading && !error && extractItems(data).length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            Brak rekordów do wyświetlenia
                        </p>
                    </div>
                )}
            </div>

            {/* Modal dodawania nowych elementów */}
            <AddModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                entityType={activeTab}
                onSuccess={handleAddSubmit}
                initialState={
                    activeTab === "Makes" ? { name: "" } :
                    activeTab === "Models" ? { name: "", make_id: "" } :
                    activeTab === "Equipment" ? { name: ""} :
                    activeTab === "Set_Of_Equipment" ? { name: "", version_id: ""} :
                    activeTab === "Versions" ? { destination: ""} :
                    activeTab === "Vehicles" ? { veh_model_id: "", version_id: "", description: "" } :
                    activeTab === "Workers" ? { name: "", email: "", password: "" } :
                    activeTab === "Caretakers" ? { worker_id: "", vehicle_id: "", date_start: "" } :
                    
                    activeTab === "Reservations" ? { date_start_planned: "", date_end_planned: "", price: "", purpose: "business",  vehicle_id: "", worker_id: ""  } :
                    activeTab === "Actions" ? { name: "", type: "service" } :
                    activeTab === "IsPerformed" ? { action_id: "", reservation_id: "", price: "", date: "", state: "awaiting"} :
                    { name: "" }
                }
            />
           
        </div>
    );
}