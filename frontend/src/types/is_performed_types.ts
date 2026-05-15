export enum State {
	AWAITING = "awaiting",
	PERFORMED = "performed",
	COMPLETED = "completed",
}

export interface IsPerformedBase {
	price: number;
	date: string; // YYYY-MM-DD format
	state: State;
}

export interface IsPerformedPublic extends IsPerformedBase {
	id: number;
	action_id: number;
	reservation_id: number;
}

export interface IsPerformedCreate extends IsPerformedBase {
	action_id: number;
	reservation_id: number;
}

export interface IsPerformedUpdate {
	price?: number;
	date?: string;
	state?: State;
	action_id?: number;
	reservation_id?: number;
}

export interface IsPerformedsPublic {
	items: IsPerformedPublic[];
	total: number;
	skip: number;
	limit: number;
}
