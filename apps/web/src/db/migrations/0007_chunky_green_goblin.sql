CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"order_code" varchar(30) NOT NULL,
	"package_type" varchar(20) NOT NULL,
	"amount" integer NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"payment_method" varchar(50) DEFAULT 'SEPAY' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"subscription_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_code_unique" UNIQUE("order_code")
);
--> statement-breakpoint
CREATE TABLE "sepay_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"order_code" varchar(30) NOT NULL,
	"amount_received" integer NOT NULL,
	"gateway" varchar(50),
	"transaction_date" timestamp,
	"transfer_type" varchar(10),
	"account_number" varchar(30),
	"reference_code" varchar(100),
	"description" text,
	"content" text,
	"raw_payload" jsonb NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sepay_transactions" ADD CONSTRAINT "sepay_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_expires_idx" ON "orders" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sepay_tx_order_idx" ON "sepay_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "sepay_tx_order_code_idx" ON "sepay_transactions" USING btree ("order_code");--> statement-breakpoint
CREATE INDEX "sepay_tx_received_idx" ON "sepay_transactions" USING btree ("received_at");