-- RLS policy intent:
--   paints, conversions, conversion_evidence_photos: public read (anon + authenticated), no public write.
--   submissions: anon may INSERT (public submission form); no public SELECT (submitters can't list each other).
--   Writes to all tables go via the service-role client (admin tooling) which bypasses RLS entirely.

alter table paints                    enable row level security;
alter table conversions               enable row level security;
alter table conversion_evidence_photos enable row level security;
alter table submissions               enable row level security;

-- paints: public read
create policy "paints_public_read"
  on paints for select
  to anon, authenticated
  using (true);

-- conversions: public read
create policy "conversions_public_read"
  on conversions for select
  to anon, authenticated
  using (true);

-- conversion_evidence_photos: public read
create policy "evidence_photos_public_read"
  on conversion_evidence_photos for select
  to anon, authenticated
  using (true);

-- submissions: anon insert only (email must be present; verified later via magic link)
create policy "submissions_anon_insert"
  on submissions for insert
  to anon
  with check (submitter_email is not null and submitter_email <> '');
