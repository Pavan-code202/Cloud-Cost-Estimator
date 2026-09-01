import { prisma } from '../../lib/prisma.js';
export class DatabasePricingProvider {
    async listConfigurations() {
        const rows = await prisma.$queryRaw `
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
        const configMap = new Map();
        for (const row of rows) {
            if (!configMap.has(row.id)) {
                configMap.set(row.id, []);
            }
            configMap.get(row.id).push(row);
        }
        // Transform grouped data into PricedConfiguration objects
        const configurations = [];
        for (const [id, configRows] of configMap.entries()) {
            const first = configRows[0];
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
                    category: row.category,
                    amount: Number(row.price),
                    currency: row.currency,
                    unit: row.unit,
                    effectiveDate: row.effectiveDate,
                    source: (row.source?.includes('OFFICIAL') ? 'OFFICIAL_PROVIDER_DATA' : 'DEMO_DATA'),
                    sourceUrl: row.source ?? 'See PRICING_DATA.md'
                }))
            });
        }
        return configurations;
    }
}
