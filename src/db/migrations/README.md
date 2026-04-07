# Database Migrations

Purple Glow Social uses [Drizzle ORM](https://orm.drizzle.team/) with Neon PostgreSQL.

## Schema

The complete database schema is defined in `src/db/schema.ts`. It includes:

### Enums (10)
- `platform` — instagram, facebook, twitter, linkedin, tiktok, whatsapp, google_business
- `post_status` — draft, scheduled, publishing, published, failed
- `tier` — seedling, hustler, grower, mogul
- `credit_transaction_type` — allocation, deduction, purchase, rollover, expiry, bonus
- `subscription_status` — active, past_due, canceled, trialing
- `media_type` — image, video, gif
- `org_member_role` — owner, admin, member
- `notification_type` — info, warning, success, error, system
- `content_rating` — thumbs_up, thumbs_down, edited
- `content_type` — text, image, video

### Tables (17)
1. `user` — Better-auth managed user accounts
2. `session` — Better-auth session management
3. `account` — Better-auth OAuth provider accounts
4. `verification` — Better-auth email verification tokens
5. `organization` — Multi-tenant organizations (teams)
6. `organization_member` — Organization membership with roles
7. `social_account` — Connected social media accounts (encrypted tokens)
8. `brand_profile` — AI-analyzed brand voice profiles
9. `post` — Social media posts (draft through published)
10. `post_media` — Media attachments on posts
11. `post_schedule` — Scheduled post publishing jobs
12. `credit` — Per-org credit balances
13. `credit_transaction` — Credit usage audit trail
14. `subscription` — Polar.sh subscription state
15. `analytic` — Post performance metrics
16. `notification` — User notification inbox
17. `ai_feedback` — User feedback on AI-generated content

## Generating Migrations

Generate a new migration from schema changes:

```bash
npx drizzle-kit generate
```

This reads `drizzle.config.ts` and compares the current schema (`src/db/schema.ts`) against the migration history, outputting a new SQL migration file and metadata snapshot into this directory.

### Options

```bash
# Generate with a custom name
npx drizzle-kit generate --name add_tiktok_scraper

# Preview what SQL would be generated (dry run)
npx drizzle-kit generate --dry-run
```

## Running Migrations

Apply all pending migrations to the database:

```bash
npx drizzle-kit migrate
```

This runs all unapplied SQL files in order against the database configured in `drizzle.config.ts`.

### Important Notes

- **Always review generated SQL** before applying to production. Drizzle generates SQL that may need manual adjustment for data migrations.
- **Better-auth tables** (`user`, `session`, `account`, `verification`) are defined in the schema for type safety but are managed by Better-auth at runtime. Do not drop/recreate these if they already exist.
- **Backup before migrating production.** Neon supports point-in-time restore, but always verify.

## Pushing Schema Directly (Development Only)

For rapid development, you can push schema changes directly without generating migration files:

```bash
npx drizzle-kit push
```

⚠️ **Do not use `push` in production.** It does not create migration files and cannot be tracked/reverted.

## Drizzle Studio

Inspect and edit data in the database with a visual UI:

```bash
npx drizzle-kit studio
```

Opens a browser-based GUI connected to your Neon database.

## Configuration

See `drizzle.config.ts` at the project root for database connection settings. The config reads from these environment variables:

- `DATABASE_URL` — Neon PostgreSQL connection string
- `ENCRYPTION_KEY` — AES-256 key for encrypting OAuth tokens (used by the app, not migrations)

## Troubleshooting

### "relation already exists"
If a table already exists (e.g., from Better-auth setup), wrap the CREATE TABLE in `IF NOT EXISTS` or skip those tables in the migration.

### "column does not exist"
Run `npx drizzle-kit generate` first to ensure migration files are up to date with the schema.

### Connection issues
Verify `DATABASE_URL` is set correctly. For Neon, ensure you're using the pooled connection string for migrations.
