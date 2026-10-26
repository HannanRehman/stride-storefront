begin;
create table public.site_content (
 id text primary key check (id='home'), draft jsonb not null default '{}' check(jsonb_typeof(draft)='object'),
 published jsonb not null default '{}' check(jsonb_typeof(published)='object'),version bigint not null default 0,published_at timestamptz
);
insert into public.site_content(id) values('home');
create table public.site_content_revisions(id uuid primary key default gen_random_uuid(),document jsonb not null,created_at timestamptz not null default clock_timestamp());
create index site_content_revisions_created_idx on public.site_content_revisions(created_at desc);
alter table public.site_content enable row level security;
alter table public.site_content_revisions enable row level security;
revoke all on public.site_content,public.site_content_revisions from anon,authenticated;
grant select on public.site_content,public.site_content_revisions to authenticated;
create policy "Owner content drafts" on public.site_content for select to authenticated using((select exists(select 1 from public.store_owners where user_id=(select auth.uid()))));
create policy "Owner content revisions" on public.site_content_revisions for select to authenticated using((select exists(select 1 from public.store_owners where user_id=(select auth.uid()))));
create function public.read_site_content() returns jsonb language sql stable security definer set search_path='' as $$select published from public.site_content where id='home'$$;
revoke all on function public.read_site_content() from public;
grant execute on function public.read_site_content() to anon,authenticated;
create function public.save_site_content(p_document jsonb,p_version bigint) returns boolean language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.store_owners where user_id=auth.uid()) then raise exception 'checkout:owner_only';end if;
 if jsonb_typeof(p_document) is distinct from 'object' or octet_length(p_document::text)>18000 then raise exception 'operations:content';end if;
 -- Plain JSON only. Rendering validates the supported fields/URLs again; no raw HTML is rendered.
 update public.site_content set draft=p_document,version=version+1 where id='home' and version=p_version;
 if not found then raise exception 'checkout:stale';end if;return true;
end;$$;
create function public.publish_site_content(p_version bigint) returns boolean language plpgsql security definer set search_path='' as $$
declare doc jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.store_owners where user_id=auth.uid()) then raise exception 'checkout:owner_only';end if;
 update public.site_content set published=draft,published_at=clock_timestamp(),version=version+1 where id='home' and version=p_version returning published into doc;
 if not found then raise exception 'checkout:stale';end if;
 insert into public.site_content_revisions(document) values(doc);return true;
end;$$;
create function public.restore_site_content(p_revision uuid,p_version bigint) returns boolean language plpgsql security definer set search_path='' as $$
declare doc jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.store_owners where user_id=auth.uid()) then raise exception 'checkout:owner_only';end if;
 select document into doc from public.site_content_revisions where id=p_revision;
 if not found then raise exception 'checkout:not_found';end if;
 update public.site_content set draft=doc,version=version+1 where id='home' and version=p_version;
 if not found then raise exception 'checkout:stale';end if;return true;
end;$$;
revoke all on function public.save_site_content(jsonb,bigint),public.publish_site_content(bigint),public.restore_site_content(uuid,bigint) from public,anon;
grant execute on function public.save_site_content(jsonb,bigint),public.publish_site_content(bigint),public.restore_site_content(uuid,bigint) to authenticated;

create table public.support_requests(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete restrict,
 order_id uuid references public.store_orders(id) on delete restrict,
 request_key uuid not null,kind text not null check(kind in('question','cancellation','return')),
 subject text not null check(length(subject) between 1 and 120),
 status text not null default 'open' check(status in('open','in_progress','resolved')),
 created_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp(),unique(user_id,request_key)
);
create index support_requests_user_created_idx on public.support_requests(user_id,created_at desc,id);
create index support_requests_order_idx on public.support_requests(order_id);
create index support_requests_status_created_idx on public.support_requests(status,created_at desc,id);
create table public.support_messages(
 id uuid primary key default gen_random_uuid(),request_id uuid not null references public.support_requests(id) on delete restrict,
 client_key uuid not null,author_role text not null check(author_role in('customer','owner')),
 body text not null check(length(body) between 1 and 2000),created_at timestamptz not null default clock_timestamp(),unique(request_id,client_key)
);
create index support_messages_request_created_idx on public.support_messages(request_id,created_at,id);
alter table public.support_requests enable row level security;
alter table public.support_messages enable row level security;
revoke all on public.support_requests,public.support_messages from anon,authenticated;
grant select on public.support_requests,public.support_messages to authenticated;
create policy "Read private support requests" on public.support_requests for select to authenticated using(user_id=(select auth.uid()) or (select exists(select 1 from public.store_owners where user_id=(select auth.uid()))));
create policy "Read private support messages" on public.support_messages for select to authenticated using(exists(select 1 from public.support_requests r where r.id=request_id));
create function public.open_support_request(p_key uuid,p_kind text,p_subject text,p_message text,p_order uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();existing public.support_requests%rowtype;oid uuid;order_status text;
begin
 if uid is null then raise exception 'checkout:sign_in';end if;
 if p_key is null or p_kind is null or p_kind not in('question','cancellation','return') or length(trim(coalesce(p_subject,''))) not between 1 and 120 or length(trim(coalesce(p_message,''))) not between 1 and 2000 then raise exception 'operations:request';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into existing from public.support_requests where user_id=uid and request_key=p_key;
 if found then
  if existing.kind<>p_kind or existing.subject<>trim(p_subject) or existing.order_id is distinct from p_order or not exists(select 1 from public.support_messages where request_id=existing.id and client_key=p_key and body=trim(p_message)) then raise exception 'checkout:request_changed';end if;
  return existing.id;
 end if;
 if(select count(*) from public.support_requests where user_id=uid and created_at>clock_timestamp()-interval '1 hour')>=3 then raise exception 'operations:rate_limit';end if;
 if p_order is not null then
  select status into order_status from public.store_orders where id=p_order and user_id=uid;
  if not found then raise exception 'checkout:not_found';end if;
 end if;
 if(p_kind='cancellation' and (p_order is null or order_status not in('pending','confirmed'))) or(p_kind='return' and(p_order is null or order_status<>'delivered')) then raise exception 'operations:order_status';end if;
 insert into public.support_requests(user_id,request_key,kind,subject,order_id) values(uid,p_key,p_kind,trim(p_subject),p_order) returning id into oid;
 insert into public.support_messages(request_id,client_key,author_role,body) values(oid,p_key,'customer',trim(p_message));return oid;
end;$$;
create function public.reply_support_request(p_id uuid,p_key uuid,p_body text) returns uuid
language plpgsql security definer set search_path='' as $$
declare req public.support_requests%rowtype;owner boolean;existing public.support_messages%rowtype;role_name text;
begin
 if auth.uid() is null then raise exception 'checkout:sign_in';end if;
 if p_key is null or length(trim(coalesce(p_body,''))) not between 1 and 2000 then raise exception 'operations:request';end if;
 select exists(select 1 from public.store_owners where user_id=auth.uid()) into owner;
 select * into req from public.support_requests where id=p_id for update;
 if not found or(not owner and req.user_id<>auth.uid()) then raise exception 'checkout:not_found';end if;
 role_name:=case when owner then 'owner' else 'customer' end;
 select * into existing from public.support_messages where request_id=p_id and client_key=p_key;
 if found then if existing.body<>trim(p_body) or existing.author_role<>role_name then raise exception 'checkout:request_changed';end if;return existing.id;end if;
 if req.status='resolved' then raise exception 'operations:resolved';end if;
 if(select count(*) from public.support_messages where request_id=p_id and created_at>clock_timestamp()-interval '1 hour')>=20 then raise exception 'operations:rate_limit';end if;
 insert into public.support_messages(request_id,client_key,author_role,body) values(p_id,p_key,role_name,trim(p_body)) returning id into p_key;
 update public.support_requests set updated_at=clock_timestamp() where id=p_id;return p_key;
end;$$;
create function public.set_support_status(p_id uuid,p_status text,p_updated_at timestamptz) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.store_owners where user_id=auth.uid()) then raise exception 'checkout:owner_only';end if;
 if p_status is null or p_status not in('open','in_progress','resolved') then raise exception 'operations:request';end if;
 update public.support_requests set status=p_status,updated_at=clock_timestamp() where id=p_id and updated_at=p_updated_at;
 if not found then raise exception 'checkout:stale';end if;return true;
end;$$;
revoke all on function public.open_support_request(uuid,text,text,text,uuid),public.reply_support_request(uuid,uuid,text),public.set_support_status(uuid,text,timestamptz) from public,anon;
grant execute on function public.open_support_request(uuid,text,text,text,uuid),public.reply_support_request(uuid,uuid,text),public.set_support_status(uuid,text,timestamptz) to authenticated;

create table public.launch_interest(
 id uuid primary key default gen_random_uuid(), email text not null unique check(length(email)<=254),
 status text not null default 'unconfirmed' check(status in('unconfirmed','confirmed','unsubscribed')),
 consent_version text not null default 'launch-v1',confirmation_token uuid not null default gen_random_uuid(),unsubscribe_token uuid not null default gen_random_uuid(),
 created_at timestamptz not null default clock_timestamp(),confirmed_at timestamptz,unsubscribed_at timestamptz
);
create index launch_interest_created_idx on public.launch_interest(created_at desc,id);
create unique index launch_interest_confirmation_idx on public.launch_interest(confirmation_token);
create unique index launch_interest_unsubscribe_idx on public.launch_interest(unsubscribe_token);
alter table public.launch_interest enable row level security;
revoke all on public.launch_interest from anon,authenticated;
grant select(id,email,status,consent_version,created_at,confirmed_at,unsubscribed_at) on public.launch_interest to authenticated;
create policy "Owner launch audience" on public.launch_interest for select to authenticated using((select exists(select 1 from public.store_owners where user_id=(select auth.uid()))));

create table public.email_jobs(
 id uuid primary key default gen_random_uuid(),dedupe_key text not null unique,kind text not null check(kind in('order_status','support_reply','launch_confirmation')),
 recipient text not null,payload jsonb not null,state text not null default 'queued' check(state in('queued','processing','sent','failed')),
 attempts integer not null default 0,lease uuid,lease_until timestamptz,created_at timestamptz not null default clock_timestamp(),sent_at timestamptz,last_error text
);
create index email_jobs_available_idx on public.email_jobs(created_at,id) where state in('queued','processing');
alter table public.email_jobs enable row level security;
revoke all on public.email_jobs from anon,authenticated;
grant select(id,kind,state,attempts,created_at,sent_at,last_error) on public.email_jobs to authenticated;
create policy "Owner email delivery state" on public.email_jobs for select to authenticated using((select exists(select 1 from public.store_owners where user_id=(select auth.uid()))));
create function public.register_launch_interest(p_email text,p_consent boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare saved public.launch_interest%rowtype;config jsonb;
begin
 p_email:=lower(trim(coalesce(p_email,'')));
 if p_consent is distinct from true or length(p_email) not between 3 and 254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'operations:email';end if;
 -- Global ingestion cap also applies to direct anonymous RPC calls. No email existence is exposed.
 select published into config from public.site_content where id='home' for update;
 if config->>'launchEnabled' is distinct from 'true' then raise exception 'operations:launch_closed';end if;
 if exists(select 1 from public.launch_interest where email=p_email) then return true;end if;
 if(select count(*) from public.launch_interest where created_at>clock_timestamp()-interval '1 day')>=100 then raise exception 'operations:rate_limit';end if;
 insert into public.launch_interest(email) values(p_email) returning * into saved;
 insert into public.email_jobs(dedupe_key,kind,recipient,payload) values('launch:'||saved.id,'launch_confirmation',saved.email,
  jsonb_build_object('confirmationToken',saved.confirmation_token,'unsubscribeToken',saved.unsubscribe_token));return true;
end;$$;
create function public.confirm_launch_interest(p_token uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin update public.launch_interest set status='confirmed',confirmed_at=coalesce(confirmed_at,clock_timestamp()) where confirmation_token=p_token and status='unconfirmed';return found;end;$$;
create function public.unsubscribe_launch_interest(p_token uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin update public.launch_interest set status='unsubscribed',unsubscribed_at=coalesce(unsubscribed_at,clock_timestamp()) where unsubscribe_token=p_token;return found;end;$$;
revoke all on function public.register_launch_interest(text,boolean),public.confirm_launch_interest(uuid),public.unsubscribe_launch_interest(uuid) from public;
grant execute on function public.register_launch_interest(text,boolean),public.confirm_launch_interest(uuid),public.unsubscribe_launch_interest(uuid) to anon,authenticated;

create function public.queue_order_email() returns trigger language plpgsql security definer set search_path='' as $$
declare recipient text;oid uuid;
begin
 select u.email,o.id into recipient,oid from public.store_orders o join auth.users u on u.id=o.user_id where o.id=new.order_id and u.email_confirmed_at is not null;
 if recipient is not null then insert into public.email_jobs(dedupe_key,kind,recipient,payload) values('order-event:'||new.id,'order_status',recipient,jsonb_build_object('orderId',oid,'status',new.status)) on conflict(dedupe_key) do nothing;end if;return new;
end;$$;
create trigger queue_order_email after insert on public.order_events for each row execute function public.queue_order_email();
create function public.queue_support_email() returns trigger language plpgsql security definer set search_path='' as $$
declare recipient text;
begin
 if new.author_role='owner' then
  select u.email into recipient from public.support_requests r join auth.users u on u.id=r.user_id where r.id=new.request_id and u.email_confirmed_at is not null;
  if recipient is not null then insert into public.email_jobs(dedupe_key,kind,recipient,payload) values('support-message:'||new.id,'support_reply',recipient,jsonb_build_object('requestId',new.request_id)) on conflict(dedupe_key) do nothing;end if;
 end if;return new;
end;$$;
create trigger queue_support_email after insert on public.support_messages for each row execute function public.queue_support_email();
revoke all on function public.queue_order_email(),public.queue_support_email() from public,anon,authenticated;

create function public.claim_email_jobs(p_limit integer default 10) returns setof public.email_jobs language plpgsql security definer set search_path='' as $$
begin
 update public.email_jobs set state='failed',last_error='lease_expired_after_max_attempts',lease=null,lease_until=null where state='processing' and attempts>=5 and lease_until<clock_timestamp();
 update public.email_jobs j set state='failed',last_error='unsubscribed' where j.state='queued' and j.kind='launch_confirmation'
   and exists(select 1 from public.launch_interest i where i.email=j.recipient and i.status='unsubscribed');
 update public.email_jobs j set state='failed',last_error='superseded' where j.state='queued' and j.kind='order_status'
   and exists(select 1 from public.store_orders o where o.id::text=j.payload->>'orderId' and o.status<>j.payload->>'status');
 return query with candidates as(select id from public.email_jobs where attempts<5 and(state='queued' or(state='processing' and lease_until<clock_timestamp())) order by created_at,id limit greatest(1,least(20,p_limit)) for update skip locked)
 update public.email_jobs j set state='processing',attempts=j.attempts+1,lease=gen_random_uuid(),lease_until=clock_timestamp()+interval '5 minutes' from candidates c where j.id=c.id returning j.*;
end;$$;
create function public.finish_email_job(p_id uuid,p_lease uuid,p_sent boolean,p_error text default '') returns boolean language plpgsql security definer set search_path='' as $$
begin update public.email_jobs set state=case when p_sent then 'sent' when attempts>=5 then 'failed' else 'queued' end,
 sent_at=case when p_sent then clock_timestamp() else null end,last_error=case when p_sent then null else left(p_error,80) end,lease=null,lease_until=null where id=p_id and state='processing' and lease=p_lease;
 return found;end;$$;
revoke all on function public.claim_email_jobs(integer),public.finish_email_job(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.claim_email_jobs(integer),public.finish_email_job(uuid,uuid,boolean,text) to service_role;
-- No backfill or mail delivery: migration only prepares private queues and defaults.
commit;
