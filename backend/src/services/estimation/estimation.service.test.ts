import { describe, expect, it } from 'vitest';
import { EstimationService } from './estimation.service.js';
import type { PricingProvider } from '../pricing/pricing.provider.js';

const provider: PricingProvider = { listConfigurations: async () => [{ id:1, provider:'AWS',service:'EC2',region:'Mumbai',regionCode:'ap-south-1',configuration:'demo',vcpu:4,ramGb:8,storageGb:0,prices:[{category:'COMPUTE_HOURLY',amount:.2,currency:'USD',unit:'HOUR',effectiveDate:new Date(),source:'OFFICIAL_PROVIDER_DATA',sourceUrl:'https://example.test'}] },{id:2,provider:'AWS',service:'EC2',region:'Mumbai',regionCode:'ap-south-1',configuration:'small',vcpu:2,ramGb:4,storageGb:0,prices:[]}] };
describe('EstimationService',()=>{
  it('uses deterministic billable hours and filters incompatible configurations',async()=>{
    const output=await new EstimationService(provider).estimate({cpu:4,ram:8,storage:100,network:10,users:1,minimumWorkloadPercent:20,averageWorkloadPercent:50,peakWorkloadPercent:80,usageHoursPerDay:10,peakHoursPerDay:2});
    expect(output.configurationsPassed).toBe(1);
    expect(output.workloadProfile.billableHoursPerMonth).toBe(300);
    expect(output.results[0].costs.computeCost).toBeCloseTo(60);
    expect(output.results[0].coverageWarnings).toHaveLength(3);
  });
});
