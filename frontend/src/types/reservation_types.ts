export type Purpose = "business" | "private" | "service";
export type ReservationState = "created" | "accepted" | "in_progress" | "completed" | "canceled";

export interface ReservationBase {
    date_start_planned: string;
    date_end_planned: string;
    price: number;
    purpose: Purpose;
    vehicle_id: number | "";
    worker_id: number | "";
    service_name?: string | null;
}

export interface ReservationPublic extends ReservationBase {
    id: number;
    distance: number | null;
    date_start: string | null;
    date_end: string | null;
    state: ReservationState;
    state_start: string | null;
    state_end: string | null;
}

export interface ReservationCreate extends ReservationBase {}

export interface ReservationUpdate {
    date_start_planned?: string | null;
    date_end_planned?: string | null;
    purpose?: Purpose | null;
    date_start?: string | null;
    date_end?: string | null;
    price?: number | null;
    distance?: number | null;
    state?: ReservationState | null;
    state_start?: string | null;
    state_end?: string | null;
    service_name?: string | null;
}

export interface ReservationsPublic {
    data: ReservationPublic[];
    count: number;
}