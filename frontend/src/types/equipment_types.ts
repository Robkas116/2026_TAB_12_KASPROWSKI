export interface EquipmentBase {
	name: string;
}

export interface EquipmentPublic extends EquipmentBase {
	id: number;
}

export interface EquipmentCreate extends EquipmentBase {}

export type EquipmentUpdate = Partial<EquipmentBase>;

export interface EquipmentsPublic {
	items: EquipmentPublic[];
	total: number;
	skip: number;
	limit: number;
}
