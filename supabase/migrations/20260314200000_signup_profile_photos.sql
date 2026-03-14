insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update
set public = excluded.public;

create policy "profile_photos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'profile-photos');

create policy "profile_photos_authenticated_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy "profile_photos_authenticated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and auth.uid()::text = split_part(name, '/', 1)
)
with check (
  bucket_id = 'profile-photos'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy "profile_photos_authenticated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-photos'
  and auth.uid()::text = split_part(name, '/', 1)
);
