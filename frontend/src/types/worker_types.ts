export interface WorkerBase {
	name: string;
	email: string;
}

export interface WorkerPublic extends WorkerBase {
	id: number;
}

export interface WorkerCreate extends WorkerBase {}

export type WorkerUpdate = Partial<WorkerBase>;

export interface WorkersPublic {
	data: WorkerPublic[];
	count: number;
}
