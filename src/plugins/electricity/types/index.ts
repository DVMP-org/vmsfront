// Electricity Plugin Types

/** A unit that can carry a meter: house, apartment, shop, office, room. */
export interface ElectricityPlace {
  id: string;
  name: string;
  kind: string;
  building_type?: string | null;
  site_id?: string | null;
}

/** A distribution company, expressed independently of any vending provider. */
export interface Disco {
  code: string;
  name: string;
  label: string;
  state: string;
  meter_types: string[];
}

export interface Meter {
  id: string;
  meter_number: string;
  meter_type: string;
  disco: string;
  disco_name?: string;
  place_id?: string | null;
  site_id?: string | null;
  meter_name?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  place?: ElectricityPlace | null;
}

export interface MeterCreate {
  meter_number: string;
  meter_type: string;
  /** Canonical DISCO code, not a provider's private service id. */
  disco: string;
  place_id: string;
  site_id: string;
}

/** Partial meter change; an omitted field keeps its stored value. */
export interface MeterUpdate {
  meter_number?: string;
  meter_type?: string;
  disco?: string;
  place_id?: string;
  meter_name?: string;
  is_active?: boolean;
}

export interface PurchaseTokenCreate {
  meter_id: string;
  amount: string;
  email?: string;
}

export interface PurchaseToken {
  id: string;
  meter_id: string;
  amount: number;
  place_id?: string | null;
  email?: string | null;
  token?: string;
  units?: string | null;
  transaction_id: string;
  transaction?: {
    reference?: string | null;
    status?: string | null;
    amount?: number | null;
  } | null;
  created_at?: string;
  updated_at?: string;
  meter?: Meter;
}

export interface ElectricityPlaceWithMeters {
  id: string;
  name: string;
  kind: string;
  building_type?: string | null;
  site_id: string;
  meters: Meter[];
}

export interface ElectricityStats {
  total_meters: number;
  active_meters: number;
  total_purchases: number;
  total_revenue: number;
  places: ElectricityPlaceWithMeters[];
  recent_purchases: Array<{
    id: string;
    meter_number: string | null;
    place_name: string | null;
    amount: number;
    units: string | null;
    date: string;
    status: string | null;
  }>;
}
