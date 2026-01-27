-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Public profile info linked to Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text check (role in ('saas', 'influencer', 'admin')) default 'saas',
  onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

-- 2. SAAS COMPANIES (Details for SaaS clients)
create table public.saas_companies (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  company_name text not null,
  description text,
  website text,
  industry text,
  logo_url text,
  commission_rate decimal(5,2), -- Percentage (e.g., 15.00 for 15%)
  media_pack_url text, -- URL to uploaded media pack file
  conditions text, -- Terms and conditions for collaboration
  -- Basic VAT/Billing info
  country text, -- ISO country code, e.g. 'FR', 'DE', 'US'
  vat_number text, -- Optional VAT number for EU B2B
  is_vat_registered boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.saas_companies enable row level security;

create policy "SaaS companies viewable by everyone"
  on saas_companies for select
  using ( true );

create policy "Users can insert their own company"
  on saas_companies for insert
  with check ( auth.uid() = profile_id );

create policy "Users can update their own company"
  on saas_companies for update
  using ( auth.uid() = profile_id );

create policy "Users can delete their own company"
  on saas_companies for delete
  using ( auth.uid() = profile_id );

-- 3. CREATOR PROFILES (Details for Influencers/Creators)
create table public.creator_profiles (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  bio text,
  linkedin_url text,
  followers_count integer default 0,
  engagement_rate decimal(5,2), -- Percentage (e.g., 3.50 for 3.5%)
  expertise_sectors text[], -- Array of sectors like ['tech', 'marketing', 'finance']
  hourly_rate integer, -- In cents or whole currency units
  stripe_account_id text, -- Stripe Connect account ID
  stripe_onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.creator_profiles enable row level security;

create policy "Creator profiles viewable by everyone"
  on creator_profiles for select
  using ( true );

create policy "Users can insert their own creator profile"
  on creator_profiles for insert
  with check ( auth.uid() = profile_id );

create policy "Users can update their own creator profile"
  on creator_profiles for update
  using ( auth.uid() = profile_id );

create policy "Users can delete their own creator profile"
  on creator_profiles for delete
  using ( auth.uid() = profile_id );

-- 4. APPLICATIONS (Creators apply to SaaS companies)
create table public.applications (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.creator_profiles(id) on delete cascade not null,
  saas_id uuid references public.saas_companies(id) on delete cascade not null,
  message text, -- Application message from creator
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(creator_id, saas_id) -- One application per creator per SaaS
);

alter table public.applications enable row level security;

-- Creators can see their own applications
create policy "Creators can view their own applications"
  on applications for select
  using ( 
    auth.uid() in (
      select profile_id from creator_profiles where id = applications.creator_id
    )
  );

-- SaaS can see applications to their company
create policy "SaaS can view applications to their company"
  on applications for select
  using ( 
    auth.uid() in (
      select profile_id from saas_companies where id = applications.saas_id
    )
  );

-- Creators can insert applications
create policy "Creators can create applications"
  on applications for insert
  with check ( 
    auth.uid() in (
      select profile_id from creator_profiles where id = applications.creator_id
    )
  );

-- SaaS can update application status
create policy "SaaS can update application status"
  on applications for update
  using ( 
    auth.uid() in (
      select profile_id from saas_companies where id = applications.saas_id
    )
  );

-- 5. COLLABORATIONS (Active partnerships after application accepted)
create table public.collaborations (
  id uuid default uuid_generate_v4() primary key,
  application_id uuid references public.applications(id) on delete cascade not null unique,
  status text check (status in ('active', 'completed', 'cancelled')) default 'active',
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.collaborations enable row level security;

-- Both parties can view their collaborations
create policy "Users can view their collaborations"
  on collaborations for select
  using ( 
    auth.uid() in (
      select cp.profile_id from creator_profiles cp
      join applications a on a.creator_id = cp.id
      where a.id = collaborations.application_id
    )
    or
    auth.uid() in (
      select sc.profile_id from saas_companies sc
      join applications a on a.saas_id = sc.id
      where a.id = collaborations.application_id
    )
  );

-- 6. PUBLICATION PROOFS (Proof of LinkedIn posts)
create table public.publication_proofs (
  id uuid default uuid_generate_v4() primary key,
  collaboration_id uuid references public.collaborations(id) on delete cascade not null,
  linkedin_post_url text not null,
  screenshot_url text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  validated boolean default false,
  validated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.publication_proofs enable row level security;

create policy "Users can view proofs for their collaborations"
  on publication_proofs for select
  using ( 
    collaboration_id in (
      select c.id from collaborations c
      join applications a on a.id = c.application_id
      join creator_profiles cp on cp.id = a.creator_id
      where cp.profile_id = auth.uid()
    )
    or
    collaboration_id in (
      select c.id from collaborations c
      join applications a on a.id = c.application_id
      join saas_companies sc on sc.id = a.saas_id
      where sc.profile_id = auth.uid()
    )
  );

create policy "Creators can submit proofs"
  on publication_proofs for insert
  with check ( 
    collaboration_id in (
      select c.id from collaborations c
      join applications a on a.id = c.application_id
      join creator_profiles cp on cp.id = a.creator_id
      where cp.profile_id = auth.uid()
    )
  );

create policy "SaaS can validate proofs"
  on publication_proofs for update
  using ( 
    collaboration_id in (
      select c.id from collaborations c
      join applications a on a.id = c.application_id
      join saas_companies sc on sc.id = a.saas_id
      where sc.profile_id = auth.uid()
    )
  );

-- 7. CONVERSATIONS (Messaging)
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  collaboration_id uuid references public.collaborations(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.conversations enable row level security;

create table public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  primary key (conversation_id, user_id)
);

alter table public.conversation_participants enable row level security;

create policy "Users can view their conversations"
  on conversations for select
  using ( 
    id in (
      select conversation_id from conversation_participants where user_id = auth.uid()
    )
  );

create policy "Users can view their participation"
  on conversation_participants for select
  using ( user_id = auth.uid() );

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Users can view messages in their conversations"
  on messages for select
  using ( 
    conversation_id in (
      select conversation_id from conversation_participants where user_id = auth.uid()
    )
  );

create policy "Users can send messages to their conversations"
  on messages for insert
  with check ( 
    sender_id = auth.uid() 
    and conversation_id in (
      select conversation_id from conversation_participants where user_id = auth.uid()
    )
  );

-- 8. PAYMENTS (Stripe transactions)
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  collaboration_id uuid references public.collaborations(id) on delete cascade not null,
  amount integer not null, -- In cents
  currency text default 'eur',
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  paid_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payments enable row level security;

create policy "Users can view their payments"
  on payments for select
  using ( 
    collaboration_id in (
      select c.id from collaborations c
      join applications a on a.id = c.application_id
      join creator_profiles cp on cp.id = a.creator_id
      where cp.profile_id = auth.uid()
    )
    or
    collaboration_id in (
      select c.id from collaborations c
      join applications a on a.id = c.application_id
      join saas_companies sc on sc.id = a.saas_id
      where sc.profile_id = auth.uid()
    )
  );

-- TRIGGER: Handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'saas')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TRIGGER: Update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure public.handle_updated_at();

create trigger saas_companies_updated_at
  before update on saas_companies
  for each row execute procedure public.handle_updated_at();

create trigger creator_profiles_updated_at
  before update on creator_profiles
  for each row execute procedure public.handle_updated_at();

create trigger applications_updated_at
  before update on applications
  for each row execute procedure public.handle_updated_at();

-- STORAGE BUCKET for media packs and screenshots
-- Run this in Supabase Dashboard > Storage
-- insert into storage.buckets (id, name, public) values ('media-packs', 'media-packs', true);
-- insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', true);
