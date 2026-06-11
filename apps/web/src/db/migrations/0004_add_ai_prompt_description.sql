-- Migration: Add description to ai_prompt table
ALTER TABLE "ai_prompt" ADD COLUMN "description" text;

