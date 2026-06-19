import type { ReservationState, Purpose } from "./reservation_types";
import type { State } from "./is_performed_types";

export interface VehicleWithMake {
  id: number;
  description: string | null;
  make_name: string;
  model_name: string;
  version_name: string;
}

export interface VehiclesWithMakePublic {
  data: VehicleWithMake[];
  count: number;
}

export interface PanelReservationPublic {
  id: number;
  date_start_planned: string;
  date_end_planned: string;
  price: number;
  distance: number | null;
  purpose: Purpose;
  date_start: string | null;
  date_end: string | null;
  state: ReservationState;
  state_start: string | null;
  state_end: string | null;
  service_name?: string | null;
  vehicle_id: number;
  worker_id: number;
  worker_name: string;
  is_performed_state?: State | null;
  is_performed_id?: number | null;
}

export interface PanelReservationsPublic {
  data: PanelReservationPublic[];
  count: number;
}

export interface PanelExploitationPublic {
  id: number;
  price: number;
  date: string;
  state: State;
  action_id: number;
  action_name: string;
  reservation_id: number;
  reservation_start: string;
  reservation_end: string;
  worker_name: string;
}

export interface PanelExploitationsPublic {
  data: PanelExploitationPublic[];
  count: number;
}
