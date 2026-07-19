## Prisma Baseline Workflow

This project uses Prisma migrations for schema history and `DIRECT_URL` for migration commands.

### Current baseline status

- The existing Supabase database was aligned to the Prisma schema and the migration `20260714_profile_fields_and_user_files` was marked as applied with `prisma migrate resolve`.
- Future schema changes should now use normal Prisma migrations instead of `prisma db push`.

### Environment rules

- `DATABASE_URL`: runtime connection string for the app.
- `DIRECT_URL`: direct migration connection string used by Prisma CLI.

Keep `DIRECT_URL` on a migration-capable Postgres host. If it points to an incompatible pooler, `migrate` commands may fail even when `generate` and `build` succeed.

### Normal workflow for new schema changes

1. Update files in `prisma/schema`.
2. Create a migration locally:
   `npm run db:migrate -- --name your_change_name`
3. Commit both the schema change and generated folder in `prisma/migrations`.
4. Deploy schema changes in target environments with:
   `npm run db:deploy`
5. Verify status with:
   `npx prisma migrate status`

### Only if onboarding an existing non-empty database

Use this once when Prisma migration history is missing but the schema already exists:

1. Align schema carefully.
2. Mark the matching migration as applied:
   `npx prisma migrate resolve --applied <migration_name>`

Do not use `db push` as the steady-state deployment workflow after baseline is established.
