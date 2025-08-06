CREATE TABLE "admin_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar NOT NULL,
	"controlType" varchar NOT NULL,
	"sector" varchar,
	"categoryId" varchar,
	"isLocked" boolean DEFAULT true,
	"lockReason" varchar,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" varchar NOT NULL,
	"company_name" varchar NOT NULL,
	"company_logo" text,
	"building_name" text,
	"street_name" text,
	"street_name_2" text,
	"town" varchar(100),
	"city" varchar(100),
	"county" varchar(100),
	"postcode" varchar(10),
	"country" varchar(100) DEFAULT 'United Kingdom',
	"phone_number" varchar,
	"email" varchar,
	"website" varchar,
	"address" text,
	"street_address" text,
	"email_domain" varchar,
	"max_users" integer DEFAULT 1,
	"current_users" integer DEFAULT 1,
	"price_per_user" numeric(10, 2) DEFAULT '25.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "depot_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" varchar NOT NULL,
	"depot_name" varchar NOT NULL,
	"same_as_company" boolean DEFAULT false,
	"building_name" text,
	"street_name" text,
	"street_name_2" text,
	"town" varchar(100),
	"city" varchar(100),
	"county" varchar(100),
	"postcode" varchar(10) NOT NULL,
	"country" varchar(100) DEFAULT 'United Kingdom',
	"phone_number" varchar,
	"email" varchar,
	"address" text,
	"street_address" text,
	"travel_rate_per_mile" numeric(10, 2) DEFAULT '0.45',
	"standard_travel_time" numeric(5, 2) DEFAULT '30.0',
	"max_travel_distance" numeric(8, 2) DEFAULT '50.0',
	"operating_hours" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_category_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar DEFAULT 'CCTV' NOT NULL,
	"min_pipe_size" integer,
	"max_pipe_size" integer,
	"sector" varchar,
	"cost_per_day" numeric(10, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fuel_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"fuel_type" varchar NOT NULL,
	"price_per_litre" numeric(5, 3) NOT NULL,
	"region" varchar DEFAULT 'UK',
	"source" varchar NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "pr2_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"category_name" varchar NOT NULL,
	"pipe_size" varchar DEFAULT '150' NOT NULL,
	"description" text,
	"pricing_options" jsonb DEFAULT '[]',
	"quantity_options" jsonb DEFAULT '[]',
	"min_quantity_options" jsonb DEFAULT '[]',
	"range_options" jsonb DEFAULT '[]',
	"range_values" jsonb DEFAULT '{}',
	"math_operators" jsonb DEFAULT '[]',
	"vehicle_travel_rates" jsonb DEFAULT '[]',
	"vehicle_travel_rates_stack_order" jsonb DEFAULT '[]',
	"mm_data" jsonb DEFAULT '{}',
	"sector" varchar DEFAULT 'utilities' NOT NULL,
	"category_color" varchar DEFAULT '#93c5fd',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"work_category_id" integer NOT NULL,
	"sector" varchar NOT NULL,
	"mscc5_code" varchar(10),
	"recommendation_type" varchar NOT NULL,
	"percentage" integer NOT NULL,
	"quantity_rule" integer NOT NULL,
	"length_of_runs" integer NOT NULL,
	"equipment_options" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"default_equipment" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"folder_name" varchar NOT NULL,
	"project_address" text NOT NULL,
	"project_postcode" varchar(10),
	"project_number" varchar,
	"travel_distance" numeric(5, 2),
	"travel_time" integer,
	"address_validated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "repair_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "repair_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"sector" varchar NOT NULL,
	"work_category_id" integer,
	"repair_method_id" integer,
	"pipe_size" varchar NOT NULL,
	"depth" varchar,
	"description" text,
	"cost" varchar NOT NULL,
	"rule" text,
	"minimum_quantity" integer DEFAULT 1,
	"option1_cost" varchar,
	"option2_cost" varchar,
	"option3_cost" varchar,
	"option4_cost" varchar,
	"selected_option" varchar,
	"option1_per_shift" varchar,
	"option2_per_shift" varchar,
	"option3_per_shift" varchar,
	"option4_per_shift" varchar,
	"length_of_repair" varchar DEFAULT '1000mm',
	"min_installation_per_day" varchar,
	"travel_time_allowance" varchar DEFAULT '2.0',
	"travel_included_hours" numeric(4, 2) DEFAULT '0.00',
	"additional_travel_rate" numeric(8, 2) DEFAULT '0.00',
	"day_rate" numeric(10, 2) DEFAULT '0.00',
	"hourly_rate" numeric(8, 2) DEFAULT '0.00',
	"vehicle_id" integer,
	"pricing_structure" jsonb,
	"math_operators" jsonb,
	"custom_options" jsonb,
	"meterage" varchar,
	"setup_rate" varchar,
	"min_charge" varchar,
	"number_per_shift" varchar,
	"meters_per_shift" varchar,
	"runs_per_shift" varchar,
	"min_units_per_shift" varchar,
	"min_meters_per_shift" varchar,
	"min_inspections_per_shift" varchar,
	"min_setup_count" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "section_defects" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_upload_id" integer NOT NULL,
	"item_no" integer NOT NULL,
	"defect_sequence" integer NOT NULL,
	"defect_code" varchar NOT NULL,
	"meterage" varchar,
	"percentage" varchar,
	"description" text,
	"mscc5_grade" integer,
	"defect_type" varchar,
	"recommendation" text,
	"operation_type" varchar,
	"estimated_cost" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "section_inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_upload_id" integer NOT NULL,
	"item_no" integer NOT NULL,
	"letter_suffix" varchar,
	"inspection_no" integer DEFAULT 1,
	"project_no" varchar,
	"date" varchar,
	"time" varchar,
	"start_mh" varchar,
	"start_mh_depth" varchar,
	"finish_mh" varchar,
	"finish_mh_depth" varchar,
	"pipe_size" varchar,
	"pipe_material" varchar,
	"total_length" varchar,
	"length_surveyed" varchar,
	"defects" text,
	"defect_type" varchar,
	"severity_grade" varchar,
	"severity_grades" jsonb,
	"recommendations" text,
	"adoptable" varchar,
	"cost" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sector_standards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"sector" varchar NOT NULL,
	"standard_name" varchar NOT NULL,
	"belly_threshold" integer NOT NULL,
	"description" text NOT NULL,
	"authority" varchar NOT NULL,
	"reference_document" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "standard_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" varchar NOT NULL,
	"category_name" varchar NOT NULL,
	"description" text,
	"icon_name" varchar DEFAULT 'Settings',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "standard_categories_category_id_unique" UNIQUE("category_id")
);
--> statement-breakpoint
CREATE TABLE "team_billing_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" varchar NOT NULL,
	"team_member_user_id" varchar,
	"action" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"stripe_payment_intent_id" varchar,
	"description" text,
	"status" varchar DEFAULT 'pending',
	"billing_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"role" varchar DEFAULT 'user',
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"is_accepted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "team_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "travel_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_postcode" varchar(10) NOT NULL,
	"to_postcode" varchar(10) NOT NULL,
	"distance_miles" numeric(8, 2),
	"travel_time_minutes" numeric(8, 2),
	"route_type" varchar DEFAULT 'driving',
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_cost_bands" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"grade" integer NOT NULL,
	"cost_band" varchar NOT NULL,
	"sector" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"equipment_type_id" integer NOT NULL,
	"sectors" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"cost_per_hour" numeric(10, 2),
	"cost_per_day" numeric(10, 2),
	"meterage_range_min" numeric(8, 2),
	"meterage_range_max" numeric(8, 2),
	"sections_per_day" numeric(5, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vehicle_travel_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"category_id" integer,
	"vehicle_type" varchar NOT NULL,
	"additional_travel_rate_per_hour" numeric(8, 2) NOT NULL,
	"hours_travel_allowed" numeric(5, 2) DEFAULT '10.00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "file_uploads" ADD COLUMN "folder_id" integer;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD COLUMN "project_number" varchar;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD COLUMN "visit_number" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD COLUMN "site_address" text;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD COLUMN "site_postcode" varchar(10);--> statement-breakpoint
ALTER TABLE "file_uploads" ADD COLUMN "extracted_data" text;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD COLUMN "database_format" varchar;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "admin_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payment_method_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_test_user" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "depot_settings" ADD CONSTRAINT "depot_settings_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_types" ADD CONSTRAINT "equipment_types_work_category_id_work_categories_id_fk" FOREIGN KEY ("work_category_id") REFERENCES "public"."work_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr2_configurations" ADD CONSTRAINT "pr2_configurations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_work_category_id_work_categories_id_fk" FOREIGN KEY ("work_category_id") REFERENCES "public"."work_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_folders" ADD CONSTRAINT "project_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_pricing" ADD CONSTRAINT "repair_pricing_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_pricing" ADD CONSTRAINT "repair_pricing_work_category_id_work_categories_id_fk" FOREIGN KEY ("work_category_id") REFERENCES "public"."work_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_pricing" ADD CONSTRAINT "repair_pricing_repair_method_id_repair_methods_id_fk" FOREIGN KEY ("repair_method_id") REFERENCES "public"."repair_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_pricing" ADD CONSTRAINT "repair_pricing_vehicle_id_vehicle_travel_rates_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicle_travel_rates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_inspections" ADD CONSTRAINT "section_inspections_file_upload_id_file_uploads_id_fk" FOREIGN KEY ("file_upload_id") REFERENCES "public"."file_uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sector_standards" ADD CONSTRAINT "sector_standards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_billing_records" ADD CONSTRAINT "team_billing_records_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_billing_records" ADD CONSTRAINT "team_billing_records_team_member_user_id_users_id_fk" FOREIGN KEY ("team_member_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pricing" ADD CONSTRAINT "user_pricing_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_pricing" ADD CONSTRAINT "user_pricing_equipment_type_id_equipment_types_id_fk" FOREIGN KEY ("equipment_type_id") REFERENCES "public"."equipment_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_travel_rates" ADD CONSTRAINT "vehicle_travel_rates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_folder_id_project_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."project_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;