alter table public.technician_profiles
  add column if not exists phone text,
  add column if not exists whatsapp_phone text,
  add column if not exists preferred_contact_channel text not null default 'phone';

alter table public.technician_profiles
  drop constraint if exists technician_profiles_preferred_contact_channel_check,
  add constraint technician_profiles_preferred_contact_channel_check check (
    preferred_contact_channel in ('phone', 'whatsapp')
  );

alter table public.technician_profiles
  drop constraint if exists technician_profiles_phone_not_empty,
  add constraint technician_profiles_phone_not_empty check (
    phone is null or length(trim(phone)) > 0
  );

alter table public.technician_profiles
  drop constraint if exists technician_profiles_whatsapp_phone_not_empty,
  add constraint technician_profiles_whatsapp_phone_not_empty check (
    whatsapp_phone is null or length(trim(whatsapp_phone)) > 0
  );

create index if not exists idx_technician_profiles_phone
  on public.technician_profiles (phone);

create index if not exists idx_technician_profiles_whatsapp_phone
  on public.technician_profiles (whatsapp_phone);

create index if not exists idx_technician_profiles_preferred_contact_channel
  on public.technician_profiles (preferred_contact_channel);
