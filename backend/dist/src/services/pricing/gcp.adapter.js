/** Future adapter: converts GCP Billing Catalog results to CommonPrice. */
export class GcpPricingProvider {
    async refresh() { throw new Error('Live GCP pricing is intentionally not enabled.'); }
}
