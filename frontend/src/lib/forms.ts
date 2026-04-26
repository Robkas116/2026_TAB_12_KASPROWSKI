import { EntityType } from "@/types"

export const INITIAL_STATES: Record<EntityType, any> = {
    Makes: { name: "" },
    Workers: { name: "", email: "" },
    Vehicles: { state: "" },
    Models: { name: "", make_id: "" },
    Reservations: {},
    Actions: { name: "", type: "" }
};

