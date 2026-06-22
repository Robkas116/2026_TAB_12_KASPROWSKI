export interface CaretakerBase {
    worker_id: number | ""; 
    date_start: string; 
    vehicle_id: number | "";
}

export interface CaretakerPublic extends CaretakerBase {
    id: number;
    date_end: string | null;
}

export interface CaretakerCreate extends CaretakerBase {
    date_end?: string | null;
}

export interface CaretakerUpdate {
    worker_id?: number | null;
    date_start?: string | null;
    date_end?: string | null;
    vehicle_id?: number | null;
}

export interface CaretakersPublic {
    data: CaretakerPublic[];
    count: number;
}

