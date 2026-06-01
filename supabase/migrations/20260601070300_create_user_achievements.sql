-- Persists achievement unlock timestamps so celebrations fire exactly once.
-- Achievement catalog (definitions + predicates) lives in lib/pile/achievements.ts;
-- this table only records WHEN each badge was first earned per user.
-- The unique constraint is the "already celebrated" gate: a successful insert =
-- newly unlocked (show confetti); a conflict = already had it (stay quiet).
create table user_achievements (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users (id) on delete cascade,
  achievement_id text        not null,
  unlocked_at    timestamptz not null default now(),

  constraint user_achievements_unique unique (user_id, achievement_id)
);
