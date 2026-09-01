import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Record = { provider: string; providerName: string; service: string; region: string; regionCode: string; configuration: string; vcpu: number; ram: number; price: string; effectiveDate: string; source: string };

// Static verified snapshot. No live cloud pricing APIs are called by this script.
const records: Record[] = [
  { provider:'AWS', providerName:'Amazon Web Services', service:'EC2', region:'Mumbai', regionCode:'ap-south-1', configuration:'t3.medium', vcpu:2, ram:4, price:'0.05280000', effectiveDate:'2025-12-01', source:'OFFICIAL_PROVIDER_DATA: AWS EC2 Price List' },
  { provider:'AWS', providerName:'Amazon Web Services', service:'EC2', region:'Mumbai', regionCode:'ap-south-1', configuration:'t3.large', vcpu:2, ram:8, price:'0.10560000', effectiveDate:'2025-12-01', source:'OFFICIAL_PROVIDER_DATA: AWS EC2 Price List' },
  { provider:'AWS', providerName:'Amazon Web Services', service:'EC2', region:'Mumbai', regionCode:'ap-south-1', configuration:'t3.xlarge', vcpu:4, ram:16, price:'0.21120000', effectiveDate:'2025-12-01', source:'OFFICIAL_PROVIDER_DATA: AWS EC2 Price List' },
  { provider:'AWS', providerName:'Amazon Web Services', service:'EC2', region:'Mumbai', regionCode:'ap-south-1', configuration:'t3.2xlarge', vcpu:8, ram:32, price:'0.42240000', effectiveDate:'2025-12-01', source:'OFFICIAL_PROVIDER_DATA: AWS EC2 Price List' },
  { provider:'AZURE', providerName:'Microsoft Azure', service:'Virtual Machines', region:'Central India', regionCode:'centralindia', configuration:'Standard_D2s_v5', vcpu:2, ram:8, price:'0.10100000', effectiveDate:'2021-11-01', source:'OFFICIAL_PROVIDER_DATA: Azure Retail Prices API' },
  { provider:'AZURE', providerName:'Microsoft Azure', service:'Virtual Machines', region:'Central India', regionCode:'centralindia', configuration:'Standard_D4s_v5', vcpu:4, ram:16, price:'0.20200000', effectiveDate:'2021-11-01', source:'OFFICIAL_PROVIDER_DATA: Azure Retail Prices API' },
  { provider:'AZURE', providerName:'Microsoft Azure', service:'Virtual Machines', region:'Central India', regionCode:'centralindia', configuration:'Standard_D8s_v5', vcpu:8, ram:32, price:'0.40400000', effectiveDate:'2021-11-01', source:'OFFICIAL_PROVIDER_DATA: Azure Retail Prices API' },
  { provider:'AZURE', providerName:'Microsoft Azure', service:'Virtual Machines', region:'Central India', regionCode:'centralindia', configuration:'Standard_D16s_v5', vcpu:16, ram:64, price:'0.80800000', effectiveDate:'2021-11-01', source:'OFFICIAL_PROVIDER_DATA: Azure Retail Prices API' },
  { provider:'GCP', providerName:'Google Cloud', service:'Compute Engine', region:'Mumbai', regionCode:'asia-south1', configuration:'e2-standard-2', vcpu:2, ram:8, price:'0.06701142', effectiveDate:'2026-08-30', source:'OFFICIAL_PROVIDER_DATA: Google Compute pricing' },
  { provider:'GCP', providerName:'Google Cloud', service:'Compute Engine', region:'Mumbai', regionCode:'asia-south1', configuration:'e2-standard-4', vcpu:4, ram:16, price:'0.13402284', effectiveDate:'2026-08-30', source:'OFFICIAL_PROVIDER_DATA: Google Compute pricing' },
  { provider:'GCP', providerName:'Google Cloud', service:'Compute Engine', region:'Mumbai', regionCode:'asia-south1', configuration:'e2-standard-8', vcpu:8, ram:32, price:'0.26804568', effectiveDate:'2026-08-30', source:'OFFICIAL_PROVIDER_DATA: Google Compute pricing' },
  { provider:'GCP', providerName:'Google Cloud', service:'Compute Engine', region:'Mumbai', regionCode:'asia-south1', configuration:'e2-standard-16', vcpu:16, ram:64, price:'0.53609136', effectiveDate:'2026-08-30', source:'OFFICIAL_PROVIDER_DATA: Google Compute pricing' }
];

async function main() {
  // Approved change: preserves values while allowing exact 8-decimal GCP rates.
  await prisma.$executeRawUnsafe('ALTER TABLE pricing MODIFY price DECIMAL(18,8) NOT NULL');
  await prisma.$transaction(async (tx) => {
    for (const r of records) {
      await tx.$executeRaw`INSERT INTO cloud_providers (provider_name, provider_code) VALUES (${r.providerName}, ${r.provider}) ON DUPLICATE KEY UPDATE provider_name = VALUES(provider_name)`;
      const providers = await tx.$queryRaw<{ provider_id: number }[]>`SELECT provider_id FROM cloud_providers WHERE provider_code = ${r.provider} LIMIT 1`;
      const providerId = providers[0].provider_id;
      await tx.$executeRaw`INSERT INTO services (provider_id, service_name, service_type) VALUES (${providerId}, ${r.service}, 'COMPUTE') ON DUPLICATE KEY UPDATE service_type = VALUES(service_type)`;
      await tx.$executeRaw`INSERT INTO regions (provider_id, region_name, region_code) VALUES (${providerId}, ${r.region}, ${r.regionCode}) ON DUPLICATE KEY UPDATE region_name = VALUES(region_name)`;
      const [service] = await tx.$queryRaw<{ service_id: number }[]>`SELECT service_id FROM services WHERE provider_id = ${providerId} AND service_name = ${r.service} LIMIT 1`;
      const [region] = await tx.$queryRaw<{ region_id: number }[]>`SELECT region_id FROM regions WHERE provider_id = ${providerId} AND region_code = ${r.regionCode} LIMIT 1`;
      await tx.$executeRaw`INSERT INTO configurations (service_id, region_id, configuration_name, vcpu, ram_gb, storage_gb) SELECT ${service.service_id}, ${region.region_id}, ${r.configuration}, ${r.vcpu}, ${r.ram}, 0 WHERE NOT EXISTS (SELECT 1 FROM configurations WHERE service_id = ${service.service_id} AND region_id = ${region.region_id} AND configuration_name = ${r.configuration})`;
      const [configuration] = await tx.$queryRaw<{ configuration_id: number }[]>`SELECT configuration_id FROM configurations WHERE service_id = ${service.service_id} AND region_id = ${region.region_id} AND configuration_name = ${r.configuration} ORDER BY configuration_id LIMIT 1`;
      await tx.$executeRaw`INSERT INTO pricing (configuration_id, pricing_model, price, unit, currency, effective_date, source) SELECT ${configuration.configuration_id}, 'ON_DEMAND', ${r.price}, 'HOUR', 'USD', ${r.effectiveDate}, ${r.source} WHERE NOT EXISTS (SELECT 1 FROM pricing WHERE configuration_id = ${configuration.configuration_id} AND pricing_model = 'ON_DEMAND' AND effective_date = ${r.effectiveDate})`;
    }
  });
  const counts = await prisma.$queryRaw<{ providers: bigint; services: bigint; regions: bigint; configurations: bigint; pricing: bigint }[]>`SELECT (SELECT COUNT(*) FROM cloud_providers) providers, (SELECT COUNT(*) FROM services) services, (SELECT COUNT(*) FROM regions) regions, (SELECT COUNT(*) FROM configurations) configurations, (SELECT COUNT(*) FROM pricing) pricing`;
  console.log(counts[0]);
}

main().finally(() => prisma.$disconnect());
