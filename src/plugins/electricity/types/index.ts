
// Electricity Plugin Types
export interface Meter {
    id: string;
    meter_number: string;
    meter_type: string;
    disco: string;
    house_id: string;
    created_at?: string;
    updated_at?: string;
    house?: {
        id: string;
        name: string;
        address: string;
    };
}

export interface MeterCreate {
    meter_number: string;
    meter_type: string;
    disco: string;
    house_id: string;
}

export interface PurchaseTokenCreate {
    meter_id: string;
    amount: string;
    house_id: string;
    email: string;
}

export interface PurchaseToken {
    id: string;
    meter_id: string;
    amount: string;
    house_id: string;
    email: string;
    token?: string;
    units?: number;
    status?: string;
    transaction_id?: string;
    created_at?: string;
    updated_at?: string;
    meter?: Meter;
}
