import type { PricingProvider, PricedConfiguration } from '../pricing/pricing.provider.js';
import { normalizeWorkload, type WorkloadInput, type WorkloadProfile } from '../workload/workload.service.js';
import { filterCompatible } from '../configuration/configuration.service.js';

function amount(c: PricedConfiguration, category: string) { 
  return c.prices.find(p => p.category === category)?.amount ?? 0; 
}

export class EstimationService {
  constructor(private pricing: PricingProvider) {}
  
  async estimate(workloadInput: WorkloadInput) {
    const workload = normalizeWorkload(workloadInput);
    const all = await this.pricing.listConfigurations();
    const compatible = filterCompatible(all, workload);
    
    const results = compatible.map(c => {
      // Compute cost: hourly price × billable hours per month (NOT reduced by workload percentages)
      const computeCost = amount(c, 'COMPUTE_HOURLY') * workload.billableHoursPerMonth;
      
      // Storage cost: storage GB × price per GB per month
      const storageCost = amount(c, 'STORAGE_GB_MONTH') * workload.storage;
      
      // Network cost: data transfer GB × price per GB
      const networkCost = amount(c, 'NETWORK_GB') * workload.network;
      
      // IP cost: hourly price × billable hours per month
      const ipCost = amount(c, 'IP_HOURLY') * workload.billableHoursPerMonth;
      
      // Other costs
      const otherCost = amount(c, 'OTHER');
      
      // Pricing coverage detection
      const categories = new Set(c.prices.map(p => p.category));
      const coverageWarnings = ['STORAGE_GB_MONTH', 'NETWORK_GB', 'IP_HOURLY']
        .filter(category => !categories.has(category as never))
        .map(category => `${category} is not priced in the verified seed dataset; shown as USD 0.00.`);
      
      return {
        provider: c.provider,
        service: c.service,
        region: c.region,
        regionCode: c.regionCode,
        configuration: c.configuration,
        vcpu: c.vcpu,
        ramGb: c.ramGb,
        storageGb: c.storageGb,
        pricing: c.prices,
        costs: {
          computeCost,
          storageCost,
          networkCost,
          ipCost,
          otherCost,
          totalMonthlyCost: computeCost + storageCost + networkCost + ipCost + otherCost
        },
        currency: c.prices[0]?.currency ?? 'USD',
        coverageWarnings
      };
    }).sort((a, b) => a.costs.totalMonthlyCost - b.costs.totalMonthlyCost);
    
    return {
      workloadProfile: extractWorkloadProfile(workload),
      configurationsEvaluated: all.length,
      configurationsPassed: results.length,
      results
    };
  }
}

/**
 * Extract workload profile for display in results
 */
function extractWorkloadProfile(workload: WorkloadInput & WorkloadProfile): WorkloadProfile {
  return {
    minimumWorkloadPercent: workload.minimumWorkloadPercent,
    averageWorkloadPercent: workload.averageWorkloadPercent,
    peakWorkloadPercent: workload.peakWorkloadPercent,
    usageHoursPerDay: workload.usageHoursPerDay,
    peakHoursPerDay: workload.peakHoursPerDay,
    billableHoursPerMonth: workload.billableHoursPerMonth,
    peakCpuDemand: workload.peakCpuDemand,
    peakRamDemand: workload.peakRamDemand
  };
}
