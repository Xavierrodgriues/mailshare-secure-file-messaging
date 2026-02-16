-- Create drafts table
create table if not exists public.drafts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  to_user_id uuid references auth.users(id) on delete set null,
  to_user_email text,
  to_user_name text,
  subject text,
  body text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.drafts enable row level security;

-- Create policies
create policy "Users can view their own drafts"
  on public.drafts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own drafts"
  on public.drafts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own drafts"
  on public.drafts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own drafts"
  on public.drafts for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create extension if not exists moddatetime schema extensions;

create trigger handle_updated_at before update on public.drafts
  for each row execute procedure moddatetime (updated_at);
