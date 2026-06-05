CREATE TABLE "admin_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"admin_email" varchar(255) NOT NULL,
	"admin_role" varchar(50) NOT NULL,
	"ip_address" varchar(50),
	"user_agent" text,
	"action" varchar(100) NOT NULL,
	"old_payload" text,
	"new_payload" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_api_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"write_id" text,
	"prompt_id" text,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" real DEFAULT 0 NOT NULL,
	"is_error" boolean DEFAULT false NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_prompt" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"system_prompt" text NOT NULL,
	"user_prompt_template" text NOT NULL,
	"temperature" real DEFAULT 0.7 NOT NULL,
	"max_tokens" integer DEFAULT 1000 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_order" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"rejection_reason" text,
	"admin_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"assignee_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket_message" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_setting" (
	"key" varchar(50) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"amount" integer NOT NULL,
	"old_status" varchar(20) NOT NULL,
	"new_status" varchar(20) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"admin_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ai_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"usage_date" varchar(10) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"activated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_review_ticket" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"user_id" text NOT NULL,
	"user_message" text,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"teacher_score" integer,
	"teacher_feedback" text,
	"assigned_teacher_id" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"ban_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"level" varchar(50) NOT NULL,
	"thumbnail_url" text,
	"certificate_template_url" text,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"is_free" boolean DEFAULT true NOT NULL,
	"original_price" integer DEFAULT 0,
	"selling_price" integer DEFAULT 0,
	"access_duration_days" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_review" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"admin_reply" text,
	"admin_reply_at" timestamp,
	"status" varchar(20) DEFAULT 'VISIBLE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"order_index" integer NOT NULL,
	"has_read" boolean DEFAULT false NOT NULL,
	"has_write" boolean DEFAULT false NOT NULL,
	"has_quiz" boolean DEFAULT false NOT NULL,
	"has_video" boolean DEFAULT false NOT NULL,
	"has_vocabulary" boolean DEFAULT false NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_video" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"cloudinary_public_id" text NOT NULL,
	"cloudinary_url" text NOT NULL,
	"duration_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_vocabulary" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"vocabulary_id" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_vocabulary" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
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
CREATE TABLE "quiz" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"answers" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_question" (
	"id" text PRIMARY KEY NOT NULL,
	"quiz_id" text NOT NULL,
	"question" text NOT NULL,
	"options" text NOT NULL,
	"correct_option" integer NOT NULL,
	"explanation" text NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "read" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"keywords" text,
	"learning_objectives" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"read_completed" boolean DEFAULT false NOT NULL,
	"write_completed" boolean DEFAULT false NOT NULL,
	"quiz_completed" boolean DEFAULT false NOT NULL,
	"video_completed" boolean DEFAULT false NOT NULL,
	"vocabulary_reviewed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_vocabulary" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"vocabulary_id" text NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocabulary" (
	"id" text PRIMARY KEY NOT NULL,
	"word" varchar(255) NOT NULL,
	"phonetic" text,
	"part_of_speech" varchar(50) NOT NULL,
	"meaning" text NOT NULL,
	"examples" text,
	"level" varchar(20),
	"topic" varchar(100),
	"audio_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "write" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"prompt" text NOT NULL,
	"grading_criteria" text,
	"word_count_guidance" integer,
	"ai_prompt_id" text,
	"max_ai_revisions" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"write_id" text NOT NULL,
	"content" text NOT NULL,
	"ai_feedback" text,
	"ai_score" integer,
	"teacher_feedback" text,
	"teacher_score" integer,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"ai_revisions_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_api_log" ADD CONSTRAINT "ai_api_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_order" ADD CONSTRAINT "course_order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_order" ADD CONSTRAINT "course_order_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_message" ADD CONSTRAINT "support_ticket_message_ticket_id_support_ticket_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_ticket"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_message" ADD CONSTRAINT "support_ticket_message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ai_usage" ADD CONSTRAINT "user_ai_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_review_ticket" ADD CONSTRAINT "writing_review_ticket_submission_id_writing_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."writing_submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_review_ticket" ADD CONSTRAINT "writing_review_ticket_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_review_ticket" ADD CONSTRAINT "writing_review_ticket_assigned_teacher_id_user_id_fk" FOREIGN KEY ("assigned_teacher_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_review" ADD CONSTRAINT "course_review_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_review" ADD CONSTRAINT "course_review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_module_id_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."module"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_video" ADD CONSTRAINT "lesson_video_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_vocabulary" ADD CONSTRAINT "lesson_vocabulary_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_vocabulary" ADD CONSTRAINT "lesson_vocabulary_vocabulary_id_vocabulary_id_fk" FOREIGN KEY ("vocabulary_id") REFERENCES "public"."vocabulary"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module" ADD CONSTRAINT "module_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_vocabulary" ADD CONSTRAINT "module_vocabulary_module_id_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."module"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt" ADD CONSTRAINT "quiz_attempt_quiz_id_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_quiz_id_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "read" ADD CONSTRAINT "read_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_vocabulary_id_vocabulary_id_fk" FOREIGN KEY ("vocabulary_id") REFERENCES "public"."vocabulary"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write" ADD CONSTRAINT "write_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_submission" ADD CONSTRAINT "writing_submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_submission" ADD CONSTRAINT "writing_submission_write_id_write_id_fk" FOREIGN KEY ("write_id") REFERENCES "public"."write"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "course_status_idx" ON "course" USING btree ("status");--> statement-breakpoint
CREATE INDEX "course_review_course_idx" ON "course_review" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_review_user_idx" ON "course_review" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lesson_module_idx" ON "lesson" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_module_order_unique" ON "lesson" USING btree ("module_id","order_index");--> statement-breakpoint
CREATE INDEX "lesson_video_lesson_idx" ON "lesson_video" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_vocabulary_lesson_idx" ON "lesson_vocabulary" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_vocabulary_vocab_idx" ON "lesson_vocabulary" USING btree ("vocabulary_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_vocabulary_unique" ON "lesson_vocabulary" USING btree ("lesson_id","vocabulary_id");--> statement-breakpoint
CREATE INDEX "module_course_idx" ON "module" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "module_course_order_unique" ON "module" USING btree ("course_id","order_index");--> statement-breakpoint
CREATE INDEX "module_vocabulary_module_idx" ON "module_vocabulary" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "module_vocabulary_module_order_unique" ON "module_vocabulary" USING btree ("module_id","order_index");--> statement-breakpoint
CREATE INDEX "quiz_lesson_idx" ON "quiz" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "quiz_attempt_user_idx" ON "quiz_attempt" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_attempt_quiz_idx" ON "quiz_attempt" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_question_quiz_idx" ON "quiz_question" USING btree ("quiz_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_question_quiz_order_unique" ON "quiz_question" USING btree ("quiz_id","order_index");--> statement-breakpoint
CREATE INDEX "read_lesson_idx" ON "read" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "student_progress_user_idx" ON "student_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "student_progress_lesson_idx" ON "student_progress" USING btree ("lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_progress_unique" ON "student_progress" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "user_vocabulary_user_idx" ON "user_vocabulary" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_vocabulary_vocab_idx" ON "user_vocabulary" USING btree ("vocabulary_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_vocabulary_unique" ON "user_vocabulary" USING btree ("user_id","vocabulary_id");--> statement-breakpoint
CREATE INDEX "vocabulary_word_idx" ON "vocabulary" USING btree ("word");--> statement-breakpoint
CREATE INDEX "vocabulary_level_idx" ON "vocabulary" USING btree ("level");--> statement-breakpoint
CREATE INDEX "vocabulary_topic_idx" ON "vocabulary" USING btree ("topic");--> statement-breakpoint
CREATE UNIQUE INDEX "vocabulary_word_pos_unique" ON "vocabulary" USING btree ("word","part_of_speech");--> statement-breakpoint
CREATE INDEX "write_lesson_idx" ON "write" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "writing_submission_user_idx" ON "writing_submission" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "writing_submission_write_idx" ON "writing_submission" USING btree ("write_id");