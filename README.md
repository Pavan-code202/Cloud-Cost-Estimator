# Workload-Aware Multi-Cloud Deployment Planner

Full-stack student project for deterministic workload-aware cost comparison across AWS EC2 Mumbai, Azure Virtual Machines Central India, and Google Compute Engine Mumbai. It does not use ML, live pricing calls, or a frontend database connection.

## Run locally

1. Install Node.js 20+ and Docker Desktop (or provide a MySQL 8 database).
2. In `backend`, copy `.env.example` to `.env` and set `DATABASE_URL` if needed.
3. Start MySQL: `docker compose up -d mysql`.
4. Run `npm install` in `backend` and `frontend`.
5. In `backend`: `npx prisma migrate dev --name init`, then `npm run prisma:seed`, then `npm run dev`.
6. In `frontend`, copy `.env.example` to `.env`, then run `npm run dev`.

Open `http://localhost:5173`, create an account, add a project, enter a workload, and compare configurations.

## Validation

- `backend`: `npm run build` and `npm test`
- `frontend`: `npm run build`

See [PRICING_DATA.md](PRICING_DATA.md) for the exact scope and provenance of the static verified snapshot. Prices are not claimed to be live. Storage, egress/network, public IP, and support remain modelled cost categories but are shown as zero with a warning until records verified from an official source are seeded.

## Architecture

`React → Express REST API → workload/configuration/estimation services → PricingProvider → Prisma → MySQL`

`DatabasePricingProvider` is the current implementation. Placeholder AWS, Azure, and GCP adapter classes isolate future price-catalog integrations from the common pricing format and cost engine.
