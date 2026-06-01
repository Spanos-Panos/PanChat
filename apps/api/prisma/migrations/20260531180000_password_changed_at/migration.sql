-- Revoke JWT sessions when password changes (reset or change-password).
ALTER TABLE "users" ADD COLUMN "password_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "users" SET "password_changed_at" = "created_at";
