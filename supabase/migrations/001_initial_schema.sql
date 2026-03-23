-- JumpJMP initial schema

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id) not null,
  title text not null default 'Untitled',
  description text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists datasets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  file_path text not null,
  file_type text not null,
  row_count integer,
  column_schema jsonb not null default '[]'::jsonb,
  data jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  dataset_id uuid references datasets(id) on delete cascade,
  type text not null,
  config jsonb not null default '{}'::jsonb,
  results jsonb,
  position jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists shares (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  created_by uuid references users(id),
  permission text not null default 'view',
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null default 'viewer',
  primary key (workspace_id, user_id)
);

-- Indexes for common query patterns
create index idx_workspaces_owner on workspaces(owner_id);
create index idx_datasets_workspace on datasets(workspace_id);
create index idx_analyses_workspace on analyses(workspace_id);
create index idx_analyses_dataset on analyses(dataset_id);
create index idx_shares_workspace on shares(workspace_id);
create index idx_workspace_members_user on workspace_members(user_id);

-- Row level security
alter table users enable row level security;
alter table workspaces enable row level security;
alter table datasets enable row level security;
alter table analyses enable row level security;
alter table shares enable row level security;
alter table workspace_members enable row level security;

-- Users can read/update their own row
create policy "Users can view own profile" on users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

-- Workspace owner has full access; members can read
create policy "Owner full access to workspaces" on workspaces
  for all using (auth.uid() = owner_id);
create policy "Members can view workspaces" on workspaces
  for select using (
    exists (
      select 1 from workspace_members
      where workspace_members.workspace_id = workspaces.id
        and workspace_members.user_id = auth.uid()
    )
  );
create policy "Public workspaces are viewable" on workspaces
  for select using (is_public = true);

-- Dataset access follows workspace access
create policy "Workspace access for datasets" on datasets
  for all using (
    exists (
      select 1 from workspaces
      where workspaces.id = datasets.workspace_id
        and (workspaces.owner_id = auth.uid() or workspaces.is_public = true)
    )
  );

-- Analysis access follows workspace access
create policy "Workspace access for analyses" on analyses
  for all using (
    exists (
      select 1 from workspaces
      where workspaces.id = analyses.workspace_id
        and (workspaces.owner_id = auth.uid() or workspaces.is_public = true)
    )
  );

-- Share access
create policy "Owner can manage shares" on shares
  for all using (
    exists (
      select 1 from workspaces
      where workspaces.id = shares.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );
create policy "Anyone can view shares by id" on shares
  for select using (true);

-- Workspace members
create policy "Owner can manage members" on workspace_members
  for all using (
    exists (
      select 1 from workspaces
      where workspaces.id = workspace_members.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );
create policy "Members can view members" on workspace_members
  for select using (auth.uid() = user_id);

-- Auto-create user profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger workspaces_updated_at
  before update on workspaces
  for each row execute function update_updated_at();

create trigger analyses_updated_at
  before update on analyses
  for each row execute function update_updated_at();
