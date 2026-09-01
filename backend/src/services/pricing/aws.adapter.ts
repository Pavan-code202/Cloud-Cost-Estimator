/** Future adapter: converts AWS Price List API results to CommonPrice. */
export class AwsPricingProvider { async refresh() { throw new Error('Live AWS pricing is intentionally not enabled.'); } }
