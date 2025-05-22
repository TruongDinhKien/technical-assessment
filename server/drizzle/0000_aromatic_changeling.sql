CREATE TABLE "feedback" (
	"post_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"body" text NOT NULL
);
