create table if not exists admin_controls (
  "id" integer default nextval('admin_controls_id_seq'::regclass) not null,
  "userId" character varying not null,
  "controlType" character varying not null,
  "sector" character varying not null,
  "categoryId" character varying not null,
  "isLocked" boolean default false,
  "lockReason" character varying,
  "createdAt" timestamp without time zone default now(),
  "updatedAt" timestamp without time zone default now(),
  , primary key ("id")
);

create table if not exists company_settings (
  "id" integer default nextval('company_settings_id_seq'::regclass) not null,
  "admin_user_id" character varying not null,
  "company_name" character varying not null,
  "company_logo" text,
  "address" text,
  "phone_number" character varying,
  "email_domain" character varying,
  "max_users" integer default 1,
  "current_users" integer default 1,
  "price_per_user" numeric(10,2) default 25.00,
  "created_at" timestamp without time zone default now(),
  "updated_at" timestamp without time zone default now(),
  "postcode" character varying(10),
  "street_address" text,
  "town" character varying(100),
  "city" character varying(100),
  "county" character varying(100),
  "country" character varying(100) default 'United Kingdom'::character varying,
  "email" character varying,
  "website" character varying,
  "building_name" text,
  "street_name" text,
  "street_name_2" text,
  , primary key ("id")
);

create table if not exists depot_settings (
  "id" integer default nextval('depot_settings_id_seq'::regclass) not null,
  "admin_user_id" character varying not null,
  "depot_name" character varying not null,
  "same_as_company" boolean default false,
  "address" text,
  "postcode" character varying(10) not null,
  "phone_number" character varying,
  "created_at" timestamp without time zone default now(),
  "updated_at" timestamp without time zone default now(),
  "travel_rate_per_mile" numeric(10,2) default 0.45,
  "standard_travel_time" numeric(5,2) default 30.0,
  "max_travel_distance" numeric(8,2) default 50.0,
  "operating_hours" text,
  "is_active" boolean default true not null,
  "street_address" text,
  "town" character varying(100),
  "city" character varying(100),
  "county" character varying(100),
  "country" character varying(100) default 'United Kingdom'::character varying,
  "email" character varying,
  "building_name" text,
  "street_name" text,
  "street_name_2" text,
  , primary key ("id")
);

create table if not exists equipment_types (
  "id" integer default nextval('equipment_types_id_seq'::regclass) not null,
  "work_category_id" integer not null,
  "name" character varying not null,
  "description" text,
  "min_pipe_size" integer,
  "max_pipe_size" integer,
  "created_at" timestamp without time zone default now(),
  "sector" character varying,
  "cost_per_day" numeric(10,2),
  "category" character varying default 'CCTV'::character varying not null,
  , primary key ("id")
);

create table if not exists file_uploads (
  "id" integer default nextval('file_uploads_id_seq'::regclass) not null,
  "user_id" character varying not null,
  "file_name" character varying not null,
  "file_size" integer not null,
  "file_type" character varying not null,
  "file_path" character varying not null,
  "sector" character varying not null,
  "status" character varying default 'pending'::character varying,
  "report_url" character varying,
  "created_at" timestamp without time zone default now(),
  "project_number" character varying,
  "folder_id" integer,
  "visit_number" integer default 1,
  "site_address" text,
  "site_postcode" character varying(10),
  "extracted_data" text,
  "updated_at" timestamp without time zone default now(),
  "database_format" character varying,
  , primary key ("id")
);

create table if not exists fuel_prices (
  "id" integer default nextval('fuel_prices_id_seq'::regclass) not null,
  "fuel_type" character varying not null,
  "price_per_litre" numeric(5,3) not null,
  "region" character varying default 'UK'::character varying,
  "source" character varying not null,
  "recorded_at" timestamp without time zone default now() not null,
  "is_active" boolean default true,
  , primary key ("id")
);

create table if not exists pr2_configurations (
  "id" integer default nextval('pr2_configurations_id_seq'::regclass) not null,
  "user_id" character varying not null,
  "category_id" character varying not null,
  "category_name" character varying not null,
  "description" text,
  "pricing_options" jsonb default '[]'::jsonb,
  "quantity_options" jsonb default '[]'::jsonb,
  "min_quantity_options" jsonb default '[]'::jsonb,
  "range_options" jsonb default '[]'::jsonb,
  "range_values" jsonb default '{}'::jsonb,
  "math_operators" jsonb default '[]'::jsonb,
  "sector" character varying default 'utilities'::character varying not null,
  "is_active" boolean default true,
  "created_at" timestamp without time zone default now(),
  "updated_at" timestamp without time zone default now(),
  "category_color" character varying default '#2563eb'::character varying,
  "vehicle_travel_rates" jsonb default '[]'::jsonb,
  "vehicle_travel_rates_stack_order" jsonb default '[]'::jsonb,
  "pipe_size" character varying default '150'::character varying,
  "mm_data" jsonb default '{}'::jsonb,
  , primary key ("id")
);

create table if not exists pricing_rules (
  "id" integer default nextval('pricing_rules_id_seq'::regclass) not null,
  "user_id" character varying not null,
  "work_category_id" integer not null,
  "created_at" timestamp without time zone default now(),
  "recommendation_type" character varying not null,
  "percentage" integer not null,
  "quantity_rule" integer not null,
  "equipment_options" text[] default ARRAY[]::text[] not null,
  "default_equipment" character varying,
  "is_active" boolean default true,
  "updated_at" timestamp without time zone default now(),
  "mscc5_code" character varying(10),
  "sector" character varying not null,
  "length_of_runs" integer not null,
  , primary key ("id")
);

create table if not exists project_folders (
  "id" integer default nextval('project_folders_id_seq'::regclass) not null,
  "user_id" character varying not null,
  "folder_name" character varying not null,
  "project_address" text not null,
  "project_number" character varying,
  "created_at" timestamp without time zone default now(),
  "updated_at" timestamp without time zone default now(),
  "project_postcode" character varying(10),
  "travel_distance" numeric(5,2),
  "travel_time" integer,
  "address_validated" boolean default false,
  , primary key ("id")
);

create table if not exists repair_methods (
  "id" integer default nextval('repair_methods_id_seq'::regclass) not null,
  "name" character varying not null,
  "description" text,
  "category" character varying not null,
  "is_active" boolean default true,
  "created_at" timestamp without time zone default now(),
  , primary key ("id")
);

create table if not exists repair_pricing (
  "id" integer default nextval('repair_pricing_id_seq'::regclass) not null,
  "user_id" character varying not null,
  "sector" character varying not null,
  "repair_method_id" integer,
  "pipe_size" character varying not null,
  "depth" character varying,
  "description" text,
  "cost" character varying not null,
  "rule" text,
  "minimum_quantity" integer default 1,
  "is_active" boolean default true,
  "created_at" timestamp without time zone default now(),
  "updated_at" timestamp without time zone default now(),
  "work_category_id" integer,
  "travel_included_hours" numeric(4,2) default 0.00,
  "additional_travel_rate" numeric(8,2) default 0.00,
  "day_rate" numeric(10,2) default 0.00,
  "hourly_rate" numeric(8,2) default 0.00,
  "option1_cost" character varying,
  "option2_cost" character varying,
  "option3_cost" character varying,
  "option4_cost" character varying,
  "selected_option" character varying,
  "option1_per_shift" character varying,
  "option2_per_shift" character varying,
  "option3_per_shift" character varying,
  "option4_per_shift" character varying,
  "length_of_repair" character varying default '1000mm'::character varying,
  "min_installation_per_day" character varying,
  "travel_time_allowance" character varying default '2.0'::character varying,
  "vehicle_id" integer,
  "pricing_structure" jsonb,
  "meterage" character varying,
  "setup_rate" character varying,
  "min_charge" character varying,
  "number_per_shift" character varying,
  "meters_per_shift" character varying,
  "runs_per_shift" character varying,
  "min_units_per_shift" character varying,
  "min_meters_per_shift" character varying,
  "min_inspections_per_shift" character varying,
  "min_setup_count" character varying,
  "range_pipesize_min" text,
  "range_pipesize_max" text,
  "range_percentage_min" text,
  "range_percentage_max" text,
  "range_fields" jsonb default '{}'::jsonb,
  "math_operators" jsonb,
  "custom_options" jsonb,
  , primary key ("id")
);

create table if not exists report_pricing (
  "id" integer default nextval('report_pricing_id_seq'::regclass) not null,
  "section_range" character varying not null,
  "price" numeric(10,2) not null,
  "stripe_price_id" character varying not null,
  "is_active" boolean default true,
  , primary key ("id")
);

create table if not exists section_defects (
  "id" integer default nextval('section_defects_id_seq'::regclass) not null,
  "file_upload_id" integer not null,
  "item_no" integer not null,
  "defect_sequence" integer not null,
  "defect_code" character varying not null,
  "meterage" character varying,
  "percentage" character varying,
  "description" text,
  "mscc5_grade" integer,
  "defect_type" character varying,
  "recommendation" text,
  "operation_type" character varying,
  "estimated_cost" character varying,
  "created_at" timestamp without time zone default now(),
  , primary key ("id")
);

create table if not exists section_inspections (
  "id" integer default nextval('section_inspections_id_seq'::regclass) not null,
  "file_upload_id" integer not null,
  "item_no" integer not null,
  "inspection_no" integer default 1,
  "date" character varying,
  "time" character varying,
  "start_mh" character varying,
  "finish_mh" character varying,
  "pipe_size" character varying,
  "pipe_material" character varying,
  "total_length" character varying,
  "length_surveyed" character varying,
  "defects" text,
  "severity_grade" character varying,
  "recommendations" text,
  "adoptable" character varying,
  "cost" character varying,
  "created_at" timestamp without time zone default now(),
  "start_mh_depth" character varying,
  "finish_mh_depth" character varying,
  "defect_type" character varying,
  "project_no" character varying(255),
  "letter_suffix" character varying,
  "tp2_config_id" integer,
  "severity_grades" jsonb,
  , primary key ("id")
);

create table if not exists sector_standards (
  "id" integer default nextval('sector_standards_id_seq'::regclass) not null,
  "user_id" character varying not null,
  "sector" character varying not null,
  "standard_name" character varying not null,
  "belly_threshold" integer not null,
  "description" text not null,
  "authority" character varying not null,
  "reference_document" character varying not null,
  "is_active" boolean default true,
  "created_at" timestamp without time zone default now(),
  "updated_at" timestamp without time zone default now(),
  , primary key ("id")
);

create table if not exists sessions (
  "sid" character varying not null,
  "sess" jsonb not null,
  "expire" timestamp without time zone not null,
  , primary key ("sid")
);

create table if not exists standard_categories (
  "id" integer default nextval('standard_categories_id_seq'::regclass) not null,
  "category_id" character varying(255) not null,
  "category_name" character varying(255) not null,
  "description" text,
  "icon_name" character varying(100) default 'Settings'::character varying,
  "is_default" boolean default false,
  "is_active" boolean default true,
  "created_at" timestamp without time zone default CURRENT_TIMESTAMP,
  , primary key ("id")
);

create table if not exists subscription_plans (
  "id" integer default nextval('subscription_plans_id_seq'::regclass) not null,
  "name" character varying not null,
  "stripe_price_id" character varying not null,
  "price" numeric(10,2) not null,
  "billing_period" character varying not null,
  "features" jsonb,
  "is_active" boolean default true,
  "created_at" timestamp without time zone default now(),
  , primary key ("id")
);

create table if not exists system_snapshots (
  "id" integer default nextval('system_snapshots_id_seq'::regclass) not null,
  "revision_name" character varying(50) not null,
  "total_sections" integer,
  "defective_sections" integer,
  "multi_defect_sections" integer,
  "dataset_description" text,
  "created_at" timestamp without time zone default now(),
  , primary key ("id")
);

create table if not exists team_billing_records (
  "id" integer default nextval('team_billing_records_id_seq'::regclass) not null,
  "admin_user_id" character varying not null,
  "team_member_user_id" character varying,
  "action" character varying not null,
  "amount" numeric(10,2) not null,
  "stripe_payment_intent_id" character varying,
  "description" text,
  "status" character varying default 'pending'::character varying,
  "billing_date" timestamp without time zone default now(),
  "created_at" timestamp without time zone default now(),
  , primary key ("id")
);

create table if not exists team_invitations (
  "id" integer default nextval('team_invitations_id_seq'::regclass) not null,
  "admin_user_id" character varying not null,
  "email" character varying not null,
  "role" character varying default 'user'::character varying,
  "token" character varying not null,
  "expires_at" timestamp without time zone not null,
  "accepted_at" timestamp without time zone,
  "is_accepted" boolean default false,
  "created_at" timestamp without time zone default now(),
  , primary key ("id")
);

create table if not exists travel_calculations (
  "id" integer default nextval('travel_calculations_id_seq'::regclass) not null,
  "from_postcode" character varying(10) not null,
  "to_postcode" character varying(10) not null,
  "distance_miles" numeric(8,2),
  "travel_time_minutes" numeric(8,2),
  "route_type" character varying default 'driving'::character varying,
  "calculated_at" timestamp without time zone default now() not null,
  "is_active" boolean default true not null,
  , primary key ("id")
);

create table if not exists user_cost_bands (
  "id" integer default nextval('user_cost_bands_id_seq'::regclass) not null,
  "user_id" character varying not null,
  "grade" integer not null,
  "cost_band" character varying not null,
  "sector" character varying not null,
  "is_active" boolean default true,
  "created_at" timestamp without time zone default now(),
  "updated_at" timestamp without time zone default now(),
  , primary key ("id")
);

create table if not exists user_pricing (
  "id" integer default nextval('user_pricing_id_seq'::regclass) not null,
  "user_id" character varying not null,
  "equipment_type_id" integer not null,
  "cost_per_hour" numeric(10,2),
  "cost_per_day" numeric(10,2),
  "sections_per_day" numeric(5,2),
  "created_at" timestamp without time zone default now(),
  "updated_at" timestamp without time zone default now(),
  "sectors" text[] default ARRAY[]::text[] not null,
  "meterage_range_min" numeric(8,2),
  "meterage_range_max" numeric(8,2),
  , primary key ("id")
);

create table if not exists users (
  "id" character varying not null,
  "email" character varying,
  "first_name" character varying,
  "last_name" character varying,
  "profile_image_url" character varying,
  "company" character varying,
  "company_address" text,
  "phone_number" character varying,
  "stripe_customer_id" character varying,
  "stripe_subscription_id" character varying,
  "subscription_status" character varying default 'none'::character varying,
  "trial_reports_used" integer default 0,
  "created_at" timestamp without time zone default now(),
  "updated_at" timestamp without time zone default now(),
  "is_test_user" boolean default false,
  "role" character varying default 'user'::character varying,
  "admin_id" character varying,
  "payment_method_id" character varying,
  "is_active" boolean default true,
  "last_login_at" timestamp without time zone,
  , primary key ("id")
);

create table if not exists vehicle_travel_rates (
  "id" integer default nextval('vehicle_travel_rates_id_seq'::regclass) not null,
  "user_id" character varying not null,
  "vehicle_type" character varying not null,
  "fuel_consumption_mpg" numeric(5,2) not null,
  "fuel_cost_per_litre" numeric(5,2) not null,
  "driver_wage_per_hour" numeric(8,2) not null,
  "vehicle_running_cost_per_mile" numeric(8,2) not null,
  "created_at" timestamp without time zone default now() not null,
  "updated_at" timestamp without time zone default now() not null,
  "assistant_wage_per_hour" numeric(8,2) default 0.00,
  "has_assistant" boolean default false,
  "auto_update_fuel_price" boolean default true,
  "last_fuel_price_update" timestamp without time zone default now(),
  "hours_travel_allowed" numeric(5,2) default 2.00,
  "category_id" integer,
  "additional_travel_rate_per_hour" numeric(8,2) default 0 not null,
  , primary key ("id")
);

create table if not exists work_categories (
  "id" integer default nextval('work_categories_id_seq'::regclass) not null,
  "name" character varying not null,
  "description" text,
  "sort_order" integer default 0,
  "created_at" timestamp without time zone default now(),
  , primary key ("id")
);
