-- status: pending (default) | accepted | rejected
-- submitter_email is indexed for DSGVO data-export and deletion requests.

create table submissions (
  id                 uuid        primary key default gen_random_uuid(),
  paint_a_id         text        not null references paints (id),
  paint_b_id         text        not null references paints (id),
  submitter_email    text        not null,
  email_verified_at  timestamptz,
  photo_url          text,
  notes              text,
  status             text        not null default 'pending',
  created_at         timestamptz not null default now(),
  reviewed_at        timestamptz,

  constraint submissions_status_check check (status in ('pending', 'accepted', 'rejected'))
);

create index submissions_submitter_email_idx on submissions (submitter_email);
