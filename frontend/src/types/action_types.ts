export enum ActionType {
    SERVICE = "service",
    EXPLOITATION = "exploitation"
}

export interface ActionBase {
    name: string;
}

export interface ActionPublic extends ActionBase {
    id: number;
    type: ActionType;
}

export interface ActionCreate extends ActionBase {
    type: ActionType;
}

export interface ActionUpdate {
    name?: string;
    type?: ActionType;
}

export interface ActionsPublic {
    // Uwaga: Twój model Pydantic zwraca `data` i `count`,
    // ale interfejsy frontendowe (jak VehModelsPublic) oczekują `items` i `total`.
    // Upewnij się, że mapujesz te pola poprawnie w warstwie pobierania danych (np. w Axios/Fetch interceptor).
    items: ActionPublic[];
    total: number;
    skip: number;
    limit: number;
}