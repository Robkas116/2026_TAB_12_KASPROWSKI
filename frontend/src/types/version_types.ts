export interface VersionBase {
	destination: string;
}

export interface VersionPublic extends VersionBase {
	id: number;
}

export interface VersionCreate extends VersionBase {}

export type VersionUpdate = Partial<VersionBase>;

export interface VersionsPublic {
	items: VersionPublic[];
	total: number;
	skip: number;
	limit: number;
}
