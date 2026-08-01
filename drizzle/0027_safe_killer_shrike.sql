CREATE TYPE "public"."yellow_priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TABLE "yellow_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"text" text NOT NULL,
	"priority" "yellow_priority" DEFAULT 'medium' NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yellow_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'To-Do' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yellow_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"impersonator_user_id" uuid,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "yellow_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "yellow_subnotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yellow_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"must_reset" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "yellow_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "yellow_notes" ADD CONSTRAINT "yellow_notes_page_id_yellow_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."yellow_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yellow_pages" ADD CONSTRAINT "yellow_pages_user_id_yellow_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."yellow_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yellow_sessions" ADD CONSTRAINT "yellow_sessions_user_id_yellow_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."yellow_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yellow_subnotes" ADD CONSTRAINT "yellow_subnotes_note_id_yellow_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."yellow_notes"("id") ON DELETE cascade ON UPDATE no action;