import type { EquipmentPublic } from "./equipment_types";

export interface SetOfEquipmentBase {
	name: string;
	version_id?: number;
}

export interface SetOfEquipmentPublic extends SetOfEquipmentBase {
	id: number;
	equipments: EquipmentPublic[];
}

export interface SetOfEquipmentCreate extends SetOfEquipmentBase {}

export type SetOfEquipmentUpdate = Partial<SetOfEquipmentBase>;

export interface SetOfEquipmentsPublic {
	items: SetOfEquipmentPublic[];
	total: number;
	skip: number;
	limit: number;
}
