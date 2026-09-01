export type CommonPrice = { category: 'COMPUTE_HOURLY' | 'STORAGE_GB_MONTH' | 'NETWORK_GB' | 'IP_HOURLY' | 'OTHER'; amount: number; currency: string; unit: string; effectiveDate: Date; source: 'OFFICIAL_PROVIDER_DATA' | 'DEMO_DATA'; sourceUrl: string };
export type PricedConfiguration = { id: number; provider: string; service: string; region: string; regionCode: string; configuration: string; vcpu: number; ramGb: number; storageGb: number; prices: CommonPrice[] };
export interface PricingProvider { listConfigurations(): Promise<PricedConfiguration[]>; }
