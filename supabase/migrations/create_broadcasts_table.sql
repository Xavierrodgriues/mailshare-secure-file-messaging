create table public.broadcasts (
  id uuid not null default gen_random_uuid (),
  title text not null,
  message text not null,
  created_at timestamp with time zone not null default now(),
  created_by uuid not null references profiles (id),
  constraint broadcasts_pkey primary key (id)
);

alter table public.broadcasts enable row level security;

create policy "Admins can insert broadcasts"
on public.broadcasts
for insert
to authenticated
with check (true); -- In a real app, check for admin role

create policy "Everyone can read broadcasts"
on public.broadcasts
for select
to authenticated
using (true);
