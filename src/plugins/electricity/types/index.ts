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

/** Which funding source settles the purchase. */
export type ElectricityTender = "wallet" | "gateway";

export interface PurchaseQuoteCreate {
  meter_id: string;
  amount: string;
}

/** Advisory quote: the purchase reprices and re-checks policy server-side. */
export interface PurchaseQuote {
  meter_id: string;
  place_id: string;
  site_id?: string | null;
  amount: number;
  currency: string;
  tenders: ElectricityTender[];
  default_tender: ElectricityTender;
  policy: Record<string, unknown>;
  wallet?: {
    available: string;
    available_minor: number;
    held: string;
    posted: string;
    currency: string;
  } | null;
  provider?: string | null;
  expires_at: string;
}

export interface PurchaseTokenCreate {
  meter_id: string;
  amount: string;
  email?: string;
  /** Omitted means the payment policy's default tender. */
  tender?: ElectricityTender;
}

/**
 * The purchase attempt. A wallet purchase returns `pending` because vending
 * happens in a worker; a gateway purchase returns `awaiting_payment` plus the
 * provider checkout payload. Neither is proof that electricity was delivered.
 */
export interface PurchaseToken {
  purchase_id: string;
  reference: string;
  tender: ElectricityTender;
  status: string;
  amount: number;
  currency: string;
  token?: string | null;
  payment?: Record<string, unknown> | null;
  wallet?: Record<string, unknown> | null;
}

/** The durable purchase record shown in history. */
export interface ElectricityPurchase {
  id: string;
  meter_id: string;
  amount: number;
  currency: string;
  reference?: string | null;
  tender?: ElectricityTender | null;
  status?: string | null;
  place_id?: string | null;
  email?: string | null;
  token?: string | null;
  units?: string | null;
  provider_reference?: string | null;
  failure_reason?: string | null;
  transaction_id?: string | null;
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
