import type { EntityType } from "@/types";

export const INITIAL_STATES: Record<EntityType, any> = {
	Makes: { name: "" },
	Workers: { name: "", email: "" },
	Vehicles: { veh_model_id: "", version_id: "", description: "" },
	Models: { name: "", make_id: "" },
	Reservations: {date_start_planned: "", date_end_planned: "", price: "", purpose: "business", vehicle_id: "", worker_id: "" },
	Caretakers: { worker_id: "", vehicle_id: "", date_start: "", date_end: "" },
	Actions: { name: "", type: "" },
	Equipments: { name: "" },
	SetOfEquipments: { name: "", version_id: "" },
	Versions: { destination: "" },
};

// Fields that are optional (can be left empty) for each entity type
export const OPTIONAL_FIELDS: Record<EntityType, Set<string>> = {
	Makes: new Set(),
	Workers: new Set(),
	Vehicles: new Set(["description"]),
	Models: new Set(),
	Caretakers: new Set(["date_end"]), // date_end can be null for active caretakers
	Reservations: new Set(["distance", "date_start", "date_end", "state", "state_start", "state_end", "service_name"]),
	Actions: new Set(),
	Equipments: new Set(),
	SetOfEquipments: new Set(),
	Versions: new Set(),
};
