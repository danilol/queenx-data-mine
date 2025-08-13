CREATE TABLE "appearances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contestant_id" varchar NOT NULL,
	"season_id" varchar NOT NULL,
	"age" integer,
	"outcome" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contestants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drag_name" text NOT NULL,
	"real_name" text,
	"hometown" text,
	"biography" text,
	"photo_url" text,
	"age" integer,
	"source_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "contestants_drag_name_unique" UNIQUE("drag_name")
);
--> statement-breakpoint
CREATE TABLE "franchises" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"source_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "franchises_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "scraping_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0,
	"total_items" integer DEFAULT 0,
	"current_item" text,
	"error_message" text,
	"screenshots" text[],
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"franchise_id" varchar NOT NULL,
	"year" integer,
	"source_url" text,
	"is_scraped" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "seasons_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "appearances" ADD CONSTRAINT "appearances_contestant_id_contestants_id_fk" FOREIGN KEY ("contestant_id") REFERENCES "public"."contestants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appearances" ADD CONSTRAINT "appearances_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;