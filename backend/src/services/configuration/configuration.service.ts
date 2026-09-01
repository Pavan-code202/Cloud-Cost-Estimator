import type { PricedConfiguration } from '../pricing/pricing.provider.js';
import type { NormalizedWorkload } from '../workload/workload.service.js';

/**
 * Filter configurations that can handle the workload requirements.
 * 
 * Configurations must satisfy:
 * 1. vcpu >= required CPU (base requirement)
 * 2. ram >= required RAM (base requirement)
 * 3. vcpu >= peakCpuDemand (can handle peak load)
 * 4. ram >= peakRamDemand (can handle peak load)
 * 5. storageGb >= required storage (if applicable)
 * 
 * The peak demand checks ensure the configuration is capable of handling
 * the expected workload at peak hours.
 */
export function filterCompatible(configurations: PricedConfiguration[], workload: NormalizedWorkload) {
  return configurations.filter(c => {
    // Base requirements must always be met
    const cpuSufficient = c.vcpu >= workload.cpu;
    const ramSufficient = c.ramGb >= workload.ram;
    
    // Peak workload capability check
    // Configuration must be able to handle the peak resource demand
    const cpuCanHandlePeak = c.vcpu >= workload.peakCpuDemand;
    const ramCanHandlePeak = c.ramGb >= workload.peakRamDemand;
    
    // Storage check (only if configuration has attached storage)
    const storageSufficient = c.storageGb === 0 || c.storageGb >= workload.storage;

    return cpuSufficient && ramSufficient && cpuCanHandlePeak && ramCanHandlePeak && storageSufficient;
  });
}
