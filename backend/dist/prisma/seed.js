import { PrismaClient, PriceCategory, PricingModel, PricingSource } from '@prisma/client';
const prisma = new PrismaClient();
/**
 * Curated, static snapshot for the initial demo. Prices are verified against
 * the linked official source on 2026-08-30; this script never calls live APIs.
 * VM disks are separately attachable and have no storage bundled (storageGb=0).
 */
const officialSources = {
    aws: 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/ap-south-1/index.json',
    azure: 'https://prices.azure.com/api/retail/prices?$filter=serviceName%20eq%20%27Virtual%20Machines%27%20and%20armRegionName%20eq%20%27centralindia%27',
    gcp: 'https://cloud.google.com/products/compute/pricing/general-purpose'
};
const records = [
    { provider: 'AWS', providerName: 'Amazon Web Services', service: 'EC2', region: 'Mumbai', regionCode: 'ap-south-1', name: 't3.medium', vcpu: 2, ram: 4, price: '0.05280000', effective: '2025-12-01' },
    { provider: 'AWS', providerName: 'Amazon Web Services', service: 'EC2', region: 'Mumbai', regionCode: 'ap-south-1', name: 't3.large', vcpu: 2, ram: 8, price: '0.10560000', effective: '2025-12-01' },
    { provider: 'AWS', providerName: 'Amazon Web Services', service: 'EC2', region: 'Mumbai', regionCode: 'ap-south-1', name: 't3.xlarge', vcpu: 4, ram: 16, price: '0.21120000', effective: '2025-12-01' },
    { provider: 'AWS', providerName: 'Amazon Web Services', service: 'EC2', region: 'Mumbai', regionCode: 'ap-south-1', name: 't3.2xlarge', vcpu: 8, ram: 32, price: '0.42240000', effective: '2025-12-01' },
    { provider: 'AZURE', providerName: 'Microsoft Azure', service: 'Virtual Machines', region: 'Central India', regionCode: 'centralindia', name: 'Standard_D2s_v5', vcpu: 2, ram: 8, price: '0.10100000', effective: '2021-11-01' },
    { provider: 'AZURE', providerName: 'Microsoft Azure', service: 'Virtual Machines', region: 'Central India', regionCode: 'centralindia', name: 'Standard_D4s_v5', vcpu: 4, ram: 16, price: '0.20200000', effective: '2021-11-01' },
    { provider: 'AZURE', providerName: 'Microsoft Azure', service: 'Virtual Machines', region: 'Central India', regionCode: 'centralindia', name: 'Standard_D8s_v5', vcpu: 8, ram: 32, price: '0.40400000', effective: '2021-11-01' },
    { provider: 'AZURE', providerName: 'Microsoft Azure', service: 'Virtual Machines', region: 'Central India', regionCode: 'centralindia', name: 'Standard_D16s_v5', vcpu: 16, ram: 64, price: '0.80800000', effective: '2021-11-01' },
    { provider: 'GCP', providerName: 'Google Cloud', service: 'Compute Engine', region: 'Mumbai', regionCode: 'asia-south1', name: 'e2-standard-2', vcpu: 2, ram: 8, price: '0.06701142', effective: '2026-08-30' },
    { provider: 'GCP', providerName: 'Google Cloud', service: 'Compute Engine', region: 'Mumbai', regionCode: 'asia-south1', name: 'e2-standard-4', vcpu: 4, ram: 16, price: '0.13402284', effective: '2026-08-30' },
    { provider: 'GCP', providerName: 'Google Cloud', service: 'Compute Engine', region: 'Mumbai', regionCode: 'asia-south1', name: 'e2-standard-8', vcpu: 8, ram: 32, price: '0.26804568', effective: '2026-08-30' },
    { provider: 'GCP', providerName: 'Google Cloud', service: 'Compute Engine', region: 'Mumbai', regionCode: 'asia-south1', name: 'e2-standard-16', vcpu: 16, ram: 64, price: '0.53609136', effective: '2026-08-30' }
];
async function main() {
    for (const item of records) {
        const provider = await prisma.cloudProvider.upsert({ where: { code: item.provider }, update: { name: item.providerName }, create: { code: item.provider, name: item.providerName } });
        const service = await prisma.service.upsert({ where: { providerId_name: { providerId: provider.id, name: item.service } }, update: {}, create: { providerId: provider.id, name: item.service, type: 'COMPUTE' } });
        const region = await prisma.region.upsert({ where: { providerId_code: { providerId: provider.id, code: item.regionCode } }, update: { name: item.region }, create: { providerId: provider.id, name: item.region, code: item.regionCode } });
        const configuration = await prisma.configuration.upsert({
            where: { serviceId_regionId_name: { serviceId: service.id, regionId: region.id, name: item.name } },
            update: { vcpu: item.vcpu, ramGb: item.ram },
            create: { serviceId: service.id, regionId: region.id, name: item.name, vcpu: item.vcpu, ramGb: item.ram, storageGb: 0 }
        });
        const sourceUrl = item.provider === 'AWS' ? officialSources.aws : item.provider === 'AZURE' ? officialSources.azure : officialSources.gcp;
        await prisma.pricing.upsert({
            where: { configurationId_pricingModel_category_effectiveDate: { configurationId: configuration.id, pricingModel: PricingModel.ON_DEMAND, category: PriceCategory.COMPUTE_HOURLY, effectiveDate: new Date(`${item.effective}T00:00:00.000Z`) } },
            update: { price: item.price, sourceUrl, source: PricingSource.OFFICIAL_PROVIDER_DATA },
            create: { configurationId: configuration.id, pricingModel: PricingModel.ON_DEMAND, category: PriceCategory.COMPUTE_HOURLY, price: item.price, unit: 'HOUR', currency: 'USD', effectiveDate: new Date(`${item.effective}T00:00:00.000Z`), source: PricingSource.OFFICIAL_PROVIDER_DATA, sourceUrl }
        });
    }
}
main().then(() => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
