export type Project = { id: string; name: string; description?: string };

export type Workload = {
  cpu: number;
  ram: number;
  storage: number;
  network: number;
  users: number;
  minimumWorkloadPercent: number;
  averageWorkloadPercent: number;
  peakWorkloadPercent: number;
  usageHoursPerDay: number;
  peakHoursPerDay: number;
};

export type WorkloadProfile = {
  minimumWorkloadPercent: number;
  averageWorkloadPercent: number;
  peakWorkloadPercent: number;
  usageHoursPerDay: number;
  peakHoursPerDay: number;
  billableHoursPerMonth: number;
  peakCpuDemand: number;
  peakRamDemand: number;
};

export type Estimate = {
  projectId: string;
  workloadId: string;
  workloadProfile: WorkloadProfile;
  configurationsEvaluated: number;
  configurationsPassed: number;
  results: Array<{
    provider: string;
    service: string;
    region: string;
    regionCode: string;
    configuration: string;
    vcpu: number;
    ramGb: number;
    storageGb: number;
    currency: string;
    coverageWarnings: string[];
    costs: {
      computeCost: number;
      storageCost: number;
      networkCost: number;
      ipCost: number;
      otherCost: number;
      totalMonthlyCost: number;
    };
  }>;
};
