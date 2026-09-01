-- CreateTable "users"
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable "projects"
CREATE TABLE `projects` (
    `project_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `project_name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_projects_user`(`user_id`),
    PRIMARY KEY (`project_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable "cloud_providers"
CREATE TABLE `cloud_providers` (
    `provider_id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider_name` VARCHAR(100) NOT NULL,
    `provider_code` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `provider_name`(`provider_name`),
    UNIQUE INDEX `provider_code`(`provider_code`),
    PRIMARY KEY (`provider_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable "services"
CREATE TABLE `services` (
    `service_id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider_id` INTEGER NOT NULL,
    `service_name` VARCHAR(100) NOT NULL,
    `service_type` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `uq_provider_service`(`provider_id`, `service_name`),
    PRIMARY KEY (`service_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable "regions"
CREATE TABLE `regions` (
    `region_id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider_id` INTEGER NOT NULL,
    `region_name` VARCHAR(100) NOT NULL,
    `region_code` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `uq_provider_region`(`provider_id`, `region_code`),
    PRIMARY KEY (`region_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable "configurations"
CREATE TABLE `configurations` (
    `configuration_id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_id` INTEGER NOT NULL,
    `region_id` INTEGER NOT NULL,
    `configuration_name` VARCHAR(150) NOT NULL,
    `vcpu` DECIMAL(6,2) NOT NULL,
    `ram_gb` DECIMAL(8,2) NOT NULL,
    `storage_gb` DECIMAL(10,2) NULL DEFAULT 0.00,
    `availability_percent` DECIMAL(5,2) NULL,

    INDEX `fk_config_region`(`region_id`),
    INDEX `fk_config_service`(`service_id`),
    PRIMARY KEY (`configuration_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable "workload_requirements"
CREATE TABLE `workload_requirements` (
    `workload_id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `cpu_vcpu` DECIMAL(6,2) NOT NULL,
    `ram_gb` DECIMAL(8,2) NOT NULL,
    `storage_gb` DECIMAL(10,2) NOT NULL,
    `network_gb` DECIMAL(10,2) NULL DEFAULT 0.00,
    `expected_users` INTEGER NULL DEFAULT 0,
    `usage_pattern` ENUM('CONSTANT','BUSINESS_HOURS','VARIABLE','HIGH_PEAK') NOT NULL,
    `usage_hours_per_day` DECIMAL(5,2) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_workload_project`(`project_id`),
    PRIMARY KEY (`workload_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable "pricing"
CREATE TABLE `pricing` (
    `pricing_id` INTEGER NOT NULL AUTO_INCREMENT,
    `configuration_id` INTEGER NOT NULL,
    `pricing_model` ENUM('ON_DEMAND','RESERVED','SPOT') NOT NULL,
    `price` DECIMAL(18,8) NOT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `effective_date` DATE NOT NULL,
    `source` VARCHAR(100) NULL DEFAULT 'MANUAL',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_pricing_configuration`(`configuration_id`),
    PRIMARY KEY (`pricing_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable "constraints"
CREATE TABLE `constraints` (
    `constraint_id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `max_monthly_budget` DECIMAL(12,2) NULL,
    `currency` VARCHAR(10) NULL DEFAULT 'USD',
    `min_cpu_vcpu` DECIMAL(6,2) NULL,
    `min_ram_gb` DECIMAL(8,2) NULL,
    `min_storage_gb` DECIMAL(10,2) NULL,
    `required_region` VARCHAR(100) NULL,
    `min_availability_percent` DECIMAL(5,2) NULL,
    `max_latency_ms` DECIMAL(8,2) NULL,

    INDEX `fk_constraints_project`(`project_id`),
    PRIMARY KEY (`constraint_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable "estimation_results"
CREATE TABLE `estimation_results` (
    `result_id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `workload_id` INTEGER NOT NULL,
    `configuration_id` INTEGER NOT NULL,
    `estimated_monthly_cost` DECIMAL(12,2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `is_feasible` BOOLEAN NULL DEFAULT true,
    `ranking` INTEGER NULL,
    `is_recommended` BOOLEAN NULL DEFAULT false,
    `recommendation_reason` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_result_configuration`(`configuration_id`),
    INDEX `fk_result_project`(`project_id`),
    INDEX `fk_result_workload`(`workload_id`),
    PRIMARY KEY (`result_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
