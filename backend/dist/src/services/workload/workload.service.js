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
export function normalizeWorkload(input) {
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
