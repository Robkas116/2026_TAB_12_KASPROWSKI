export interface VehModelPublic {
    id: number;
    name: string;
    make_id: number;
    make_name: string;
}

export interface VehModelsPublic {
    items: VehModelPublic[];
    total: number;
    skip: number;
    limit: number;
}

