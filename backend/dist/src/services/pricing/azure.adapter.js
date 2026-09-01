/** Future adapter: converts Azure Retail Prices API results to CommonPrice. */
export class AzurePricingProvider {
    async refresh() { throw new Error('Live Azure pricing is intentionally not enabled.'); }
}
