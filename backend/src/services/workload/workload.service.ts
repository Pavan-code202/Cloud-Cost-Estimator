/**
 * Workload Input: Defines actual workload characteristics.
 * These percentages represent expected resource demand characteristics,
 * NOT direct cloud billing percentages.
 */
export type WorkloadInput = {
  cpu: number;
  ram: number;
  storage: number;
  network: number;
  users: number;
  minimumWorkloadPercent: number; // 0-100: minimum expected resource utilization
  averageWorkloadPercent: number; // 0-100: average expected resource utilization
  peakWorkloadPercent: number; // 0-100: peak expected resource utilization
  usageHoursPerDay: number; // actual usage hours per day
  peakHoursPerDay: number; // hours per day when peak workload is expected
};

/**
 * Workload Profile: Structured representation of workload characteristics
 * and billable runtime.
 */
export type WorkloadProfile = {
  // Resource demand characteristics (percentages)
  minimumWorkloadPercent: number;
  averageWorkloadPercent: number;
  peakWorkloadPercent: number;

  // Billable runtime calculation
  usageHoursPerDay: number;
  peakHoursPerDay: number;
  billableHoursPerMonth: number; // usageHoursPerDay * 30 (NOT multiplied by percentages)

  // Peak resource demands (used for configuration evaluation)
  peakCpuDemand: number; // cpu * peakWorkloadPercent
  peakRamDemand: number; // ram * peakWorkloadPercent
};

export type NormalizedWorkload = WorkloadInput & WorkloadProfile;

/**
 * Generate workload profile from user inputs.
 * 
 * IMPORTANT: Billable runtime hours are calculated independently from workload percentages.
 * Billable runtime = usageHoursPerDay * 30
 * 
 * Workload percentages represent expected resource demand characteristics,
 * used for configuration evaluation (e.g., can this instance handle peak demand?)
 * but NOT for arbitrarily reducing billable hours.
 * 
 * Cloud billing is based on billable hours, not on utilization percentages.
 */
export function normalizeWorkload(input: WorkloadInput): NormalizedWorkload {
  // Calculate billable runtime: usage hours per day × 30 days
  // DO NOT multiply by workload percentages
  const billableHoursPerMonth = Number((input.usageHoursPerDay * 30).toFixed(2));

  // Calculate peak resource demands for configuration evaluation
  // These represent what the configuration needs to handle at peak load
  const peakCpuDemand = Number((input.cpu * (input.peakWorkloadPercent / 100)).toFixed(2));
  const peakRamDemand = Number((input.ram * (input.peakWorkloadPercent / 100)).toFixed(2));

  return {
    ...input,
    billableHoursPerMonth,
    peakCpuDemand,
    peakRamDemand,
  };
}
