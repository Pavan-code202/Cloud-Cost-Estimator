import { Router, type RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { DatabasePricingProvider } from '../services/pricing/database.provider.js';
import { EstimationService } from '../services/estimation/estimation.service.js';
import { signInUser } from '../services/auth/auth.service.js';

const router = Router();
const asyncHandler = (handler: RequestHandler): RequestHandler => (req, res, next) => { Promise.resolve(handler(req, res, next)).catch(next); };
const estimation = new EstimationService(new DatabasePricingProvider());

/**
 * Workload schema: collect actual workload characteristics
 * Percentages represent expected resource demand (0-100)
 * Hours represent actual usage/peak hours per day
 */
const workloadSchema = z.object({
  cpu: z.number().int().positive(),
  ram: z.number().positive(),
  storage: z.number().nonnegative(),
  network: z.number().nonnegative(),
  users: z.number().int().nonnegative(),
  minimumWorkloadPercent: z.number().min(0).max(100),
  averageWorkloadPercent: z.number().min(0).max(100),
  peakWorkloadPercent: z.number().min(0).max(100),
  usageHoursPerDay: z.number().positive().max(24),
  peakHoursPerDay: z.number().nonnegative().max(24)
}).refine(
  data => data.minimumWorkloadPercent <= data.averageWorkloadPercent,
  { message: 'Minimum workload must be <= average workload' }
).refine(
  data => data.averageWorkloadPercent <= data.peakWorkloadPercent,
  { message: 'Average workload must be <= peak workload' }
).refine(
  data => data.peakHoursPerDay <= data.usageHoursPerDay,
  { message: 'Peak hours per day must be <= usage hours per day' }
);

router.get('/health', (_, res) => res.json({ status: 'ok' }));

router.post('/users', asyncHandler(async (req,res) => {
  const body = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8)
  }).parse(req.body);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await bcrypt.hash(body.password, 12)
    },
    select: { id: true, name: true, email: true }
  });
  res.status(201).json(user);
}));

router.post('/signin', asyncHandler(async (req,res) => {
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }).parse(req.body);

  try {
    const user = await signInUser(body.email, body.password);
    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid email or password';
    res.status(401).json({ error: message });
  }
}));

router.get('/projects', asyncHandler(async (_, res) => res.json(await prisma.project.findMany({ orderBy: { createdAt: 'desc' } }))));

router.post('/projects', asyncHandler(async (req, res) => {
  const body = z.object({
    userId: z.coerce.number().int().positive(),
    name: z.string().min(1),
    description: z.string().optional()
  }).parse(req.body);
  res.status(201).json(await prisma.project.create({ data: { userId: body.userId, name: body.name, description: body.description } }));
}));

router.get('/configurations', asyncHandler(async (_, res) => res.json(await new DatabasePricingProvider().listConfigurations())));

router.post('/estimations', asyncHandler(async (req, res) => {
  const body = z.object({
    projectId: z.coerce.number().int().positive(),
    workload: workloadSchema
  }).parse(req.body);
  
  const project = await prisma.project.findUnique({ where: { id: body.projectId } });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  
  const saved = await prisma.workloadRequirement.create({
    data: {
      projectId: body.projectId,
      cpuVcpu: body.workload.cpu,
      ramGb: body.workload.ram,
      storageGb: body.workload.storage,
      networkGb: body.workload.network,
      expectedUsers: body.workload.users,
      minimumWorkloadPercent: body.workload.minimumWorkloadPercent,
      averageWorkloadPercent: body.workload.averageWorkloadPercent,
      peakWorkloadPercent: body.workload.peakWorkloadPercent,
      usageHoursPerDay: body.workload.usageHoursPerDay,
      peakHoursPerDay: body.workload.peakHoursPerDay
    }
  });
  
  res.status(201).json({
    projectId: body.projectId,
    workloadId: saved.id,
    ...await estimation.estimate(body.workload)
  });
}));

export default router;
