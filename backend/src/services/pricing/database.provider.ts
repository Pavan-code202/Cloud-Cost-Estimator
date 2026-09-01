import { prisma } from '../../lib/prisma.js';
import type { PricingProvider, PricedConfiguration } from './pricing.provider.js';

export class DatabasePricingProvider implements PricingProvider {
  async listConfigurations(): Promise<PricedConfiguration[]> {
    type Row = {
      id: number;
      provider: string;
      service: string;
      region: string;
      regionCode: string;
      configuration: string;
      vcpu: number;
      ramGb: number;
      storageGb: number | null;
      price: number;
      category: string;
      currency: string;
      unit: string;
      effectiveDate: Date;
      source: string | null;
    };

    const rows = await prisma.$queryRaw<Row[]>`
      SELECT
        c.configuration_id id,
        cp.provider_code provider,
        s.service_name service,
        r.region_name region,
        r.region_code regionCode,
        c.configuration_name configuration,
        c.vcpu vcpu,
        c.ram_gb ramGb,
        c.storage_gb storageGb,
        p.price price,
        p.category category,
        p.currency currency,
        p.unit unit,
        p.effective_date effectiveDate,
        p.source source
      FROM configurations c
      JOIN services s ON s.service_id = c.service_id
      JOIN cloud_providers cp ON cp.provider_id = s.provider_id
      JOIN regions r ON r.region_id = c.region_id
      JOIN pricing p ON p.configuration_id = c.configuration_id
      WHERE p.pricing_model = 'ON_DEMAND'
    `;

    // Group pricing by configuration
    const configMap = new Map<number, Row[]>();
    for (const row of rows) {
      if (!configMap.has(row.id)) {
        configMap.set(row.id, []);
      }
      configMap.get(row.id)!.push(row);
    }

    // Transform grouped data into PricedConfiguration objects
    const configurations: PricedConfiguration[] = [];
    for (const [id, configRows] of configMap.entries()) {
      const first = configRows[0]!;
      configurations.push({
        id,
        provider: first.provider,
        service: first.service,
        region: first.region,
        regionCode: first.regionCode,
        configuration: first.configuration,
        vcpu: Number(first.vcpu),
        ramGb: Number(first.ramGb),
        storageGb: Number(first.storageGb ?? 0),
        prices: configRows.map(row => ({
          category: row.category as 'COMPUTE_HOURLY' | 'STORAGE_GB_MONTH' | 'NETWORK_GB' | 'IP_HOURLY' | 'OTHER',
          amount: Number(row.price),
          currency: row.currency,
          unit: row.unit,
          effectiveDate: row.effectiveDate,
          source: (row.source?.includes('OFFICIAL') ? 'OFFICIAL_PROVIDER_DATA' : 'DEMO_DATA') as 'OFFICIAL_PROVIDER_DATA' | 'DEMO_DATA',
          sourceUrl: row.source ?? 'See PRICING_DATA.md'
        }))
      });
    }

    return configurations;
  }
}

