-- Migration: Add images column to tours table
-- Description: Adds support for multiple image URLs per tour

alter table public.tours
  add column if not exists images text[] not null default '{}';

comment on column public.tours.images is 'Public image URLs (Supabase Storage or external)';
