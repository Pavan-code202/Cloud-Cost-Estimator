-- Add new pricing_category enum type
ALTER TABLE `pricing` ADD COLUMN `category` VARCHAR(50) NOT NULL DEFAULT 'COMPUTE_HOURLY' AFTER `pricing_model`;

-- Add unique constraint on (configuration_id, pricing_model, category, effective_date)
ALTER TABLE `pricing` ADD UNIQUE KEY `uk_pricing_config_model_category_date` (`configuration_id`, `pricing_model`, `category`, `effective_date`);

-- Drop usage_pattern column from workload_requirements
ALTER TABLE `workload_requirements` DROP COLUMN `usage_pattern`;

-- Add new workload percentage columns to workload_requirements
ALTER TABLE `workload_requirements` ADD COLUMN `minimum_workload_percent` DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER `expected_users`;
ALTER TABLE `workload_requirements` ADD COLUMN `average_workload_percent` DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER `minimum_workload_percent`;
ALTER TABLE `workload_requirements` ADD COLUMN `peak_workload_percent` DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER `average_workload_percent`;
ALTER TABLE `workload_requirements` ADD COLUMN `peak_hours_per_day` DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER `usage_hours_per_day`;
