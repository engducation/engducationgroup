CREATE TABLE "lesson_vocabulary_item" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"word" varchar(255) NOT NULL,
	"phonetic" text,
	"part_of_speech" varchar(50) NOT NULL,
	"meaning" text NOT NULL,
	"example" text,
	"notes" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_prompt" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "lesson_vocabulary_item" ADD CONSTRAINT "lesson_vocabulary_item_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_vocabulary_item_lesson_idx" ON "lesson_vocabulary_item" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_vocabulary_item_order_idx" ON "lesson_vocabulary_item" USING btree ("lesson_id","order_index");