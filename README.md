# Workload-Aware Multi-Cloud Deployment Planning Platform

A cloud computing project that helps users evaluate suitable cloud configurations and estimate deployment costs before deploying an application.

The platform takes application resource requirements such as CPU, RAM, storage, network usage, expected users, usage duration, and expected minimum, average, and peak workload. It then evaluates available configurations from Amazon Web Services (AWS), Microsoft Azure, and Google Cloud Platform (GCP), filters configurations that do not satisfy the requirements, and compares their estimated costs.

This project focuses on workload-aware cloud resource planning and multi-cloud cost comparison rather than machine learning or automatic deployment.

## Key Features

- Workload-aware resource requirement analysis
- Minimum, average, and peak workload modelling
- Multi-cloud configuration evaluation
- AWS, Azure, and GCP comparison
- CPU and RAM based configuration filtering
- Monthly compute cost estimation
- Cloud pricing data management
- Pre-deployment cost comparison
- Extensible pricing layer for future cloud-provider API integration

## Cloud Platforms

- Amazon Web Services (AWS)
- Microsoft Azure
- Google Cloud Platform (GCP)

## Current Scope

The current implementation focuses on two primary objectives:

1. **Workload-Aware Cost Estimation**
   - Uses expected workload characteristics and resource requirements to estimate deployment cost.

2. **Multi-Cloud Configuration Evaluation**
   - Identifies suitable configurations across AWS, Azure, and GCP and compares their estimated costs.

Future enhancements include constraint-based configuration selection, complete storage and network pricing, official cloud pricing API integration, and advanced cost optimization.

## Technology Stack

- React
- Node.js
- Express
- TypeScript
- MySQL
- Prisma ORM

## Project Goal

The goal is to provide a simple pre-deployment decision-support system that helps users answer:

> **"Which cloud configuration can handle my expected workload, and how much will it approximately cost?"**
