export interface VehicleBase {
	veh_model_id: number;
	version_id: number;
	description?: string | null;
}

export interface VehiclePublic extends VehicleBase {
	id: number;
}

export interface VehicleCreate extends VehicleBase {}

export type VehicleUpdate = Partial<VehicleBase>;

export interface VehiclesPublic {
	items: VehiclePublic[];
	total: number;
	skip: number;
	limit: number;
}
