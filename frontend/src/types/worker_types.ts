export interface WorkerBase {
	name: string;
	email: string;
	is_superuser: boolean;
}

export interface WorkerPublic extends WorkerBase {
	id: number;
	onboarding_completed: boolean;
}

export interface WorkerCreate extends WorkerBase {}

export type WorkerUpdate = Partial<WorkerBase> & {
	onboarding_completed?: boolean;
};

export interface WorkersPublic {
	data: WorkerPublic[];
	count: number;
}
