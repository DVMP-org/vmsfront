import { Residency } from "@/types";

export interface Meter {
    id: string;
    meter_number: string;
    meter_type: string;
    disco: string;
    residency_id: string;
    residency?: Residency | null;
    created_at: string;
    updated_at: string;
}

export interface PurchaseToken {
    id: string;
    token: string;
    meter_id: string;
    meter?: Meter | null;
    residency_id: string;
    residency?: Residency | null;
    email: string | null;
    amount: number;
    units: number;
    created_at: string;
    updated_at: string;
    transaction_id: string;
    transaction?: Transaction | null;
}

export interface Transaction {
    id: string;
    reference: string;
    amount: number;
    description: string;
    status: string;
    paid_at: string | null;
    ip_address: string | null;
    customer_code: string | null;
    processor_charge: number | null;
    currency: string | null;
    created_at: string;
    updated_at: string;
}

export interface MeterCreate {
    meter_number: string;
    meter_type: string;
    disco: string;
    residency_id: string;
}

export interface PurchaseTokenCreate {
    meter_id: string;
    amount: number;
    description?: string | null;
    residency_id: string;
    email: string;
}

export interface ElectricityStats {
    total_meters: number;
    active_meters: number;
    total_purchases: number;
    total_revenue: number;
    residencies: Array<{
        id: string;
        name: string;
        meters: Array<Meter>;
    }>;
    recent_purchases: Array<{
        id: string;
        meter_number: string;
        resident_name: string;
        residency_name: string;
        amount: number;
        units: number;
        date: string;
        status: "success" | "pending" | "failed";
    }>;
}