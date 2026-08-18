CREATE TABLE IF NOT EXISTS "eval_items" (
	"id" text PRIMARY KEY NOT NULL,
	"eval_set_id" text NOT NULL,
	"name" text NOT NULL,
	"input_vars_json" jsonb NOT NULL,
	"grader" text DEFAULT 'substring' NOT NULL,
	"expected" text DEFAULT '' NOT NULL,
	"judge_prompt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eval_results" (
	"id" text PRIMARY KEY NOT NULL,
	"eval_run_id" text NOT NULL,
	"eval_item_id" text NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"actual" text DEFAULT '' NOT NULL,
	"grader" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"cost_usd" real DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eval_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"eval_set_id" text NOT NULL,
	"prompt_version_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"passed_items" integer DEFAULT 0 NOT NULL,
	"failed_items" integer DEFAULT 0 NOT NULL,
	"error_items" integer DEFAULT 0 NOT NULL,
	"total_cost_usd" real DEFAULT 0 NOT NULL,
	"total_tokens_in" integer DEFAULT 0 NOT NULL,
	"total_tokens_out" integer DEFAULT 0 NOT NULL,
	"triggered_by" text DEFAULT 'system' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "eval_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"prompt_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eval_items" ADD CONSTRAINT "eval_items_eval_set_id_eval_sets_id_fk" FOREIGN KEY ("eval_set_id") REFERENCES "public"."eval_sets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eval_results" ADD CONSTRAINT "eval_results_eval_run_id_eval_runs_id_fk" FOREIGN KEY ("eval_run_id") REFERENCES "public"."eval_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eval_results" ADD CONSTRAINT "eval_results_eval_item_id_eval_items_id_fk" FOREIGN KEY ("eval_item_id") REFERENCES "public"."eval_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_eval_set_id_eval_sets_id_fk" FOREIGN KEY ("eval_set_id") REFERENCES "public"."eval_sets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eval_runs" ADD CONSTRAINT "eval_runs_prompt_version_id_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."prompt_versions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eval_sets" ADD CONSTRAINT "eval_sets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eval_sets" ADD CONSTRAINT "eval_sets_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eval_items_set_idx" ON "eval_items" USING btree ("eval_set_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eval_results_run_idx" ON "eval_results" USING btree ("eval_run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eval_runs_version_idx" ON "eval_runs" USING btree ("prompt_version_id","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eval_runs_set_idx" ON "eval_runs" USING btree ("eval_set_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "eval_sets_prompt_slug_unique" ON "eval_sets" USING btree ("prompt_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "eval_sets_prompt_idx" ON "eval_sets" USING btree ("prompt_id");