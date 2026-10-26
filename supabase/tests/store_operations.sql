begin;
insert into auth.users(id,email,email_confirmed_at) values('d0c00000-0000-4000-8000-000000000001','owner@example.invalid',now()),('d0c00000-0000-4000-8000-000000000002','customer@example.invalid',now()),('d0c00000-0000-4000-8000-000000000003','other@example.invalid',now());
insert into public.store_owners(user_id) values('d0c00000-0000-4000-8000-000000000001');
set local role anon;
do $$ begin
 if public.read_site_content() <> '{}'::jsonb then raise exception 'Unexpected public content';end if;
 begin select draft from public.site_content;raise exception 'Anonymous draft exposure';exception when insufficient_privilege then null;end;
 begin perform public.claim_email_jobs(1);raise exception 'Anonymous mail worker';exception when insufficient_privilege then null;end;
 begin perform public.register_launch_interest('test@example.invalid',true);raise exception 'Closed signup accepted';exception when raise_exception then if sqlerrm<>'operations:launch_closed' then raise;end if;end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','d0c00000-0000-4000-8000-000000000002',true);
do $$ begin
 if exists(select 1 from public.site_content) then raise exception 'Customer read draft';end if;
 begin perform public.save_site_content('{}',0);raise exception 'Customer CMS write';exception when raise_exception then if sqlerrm<>'checkout:owner_only' then raise;end if;end;
 begin perform public.claim_email_jobs(1);raise exception 'Customer mail worker';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','d0c00000-0000-4000-8000-000000000001',true);
select public.save_site_content('{"heroLine1":"FIRST DRAFT","launchEnabled":true}',0);
do $$ begin
 if public.read_site_content() <> '{}'::jsonb then raise exception 'Draft became public';end if;
 begin perform public.publish_site_content(0);raise exception 'Stale publish accepted';exception when raise_exception then if sqlerrm<>'checkout:stale' then raise;end if;end;
 perform public.publish_site_content(1);
 if public.read_site_content()->>'heroLine1'<>'FIRST DRAFT' then raise exception 'Publication failed';end if;
 perform public.save_site_content('{"heroLine1":"SECOND DRAFT"}',2);
 if public.read_site_content()->>'heroLine1'<>'FIRST DRAFT' then raise exception 'Draft update leaked';end if;
 perform public.restore_site_content((select id from public.site_content_revisions limit 1),3);
 if(select draft->>'heroLine1' from public.site_content)<>'FIRST DRAFT' then raise exception 'Restore failed';end if;
end $$;
set local role anon;
select public.register_launch_interest('  Interest@Example.invalid ',true);
select public.register_launch_interest('interest@example.invalid',true);
do $$ begin
 begin perform public.register_launch_interest('other@example.invalid',false);raise exception 'Consent bypass';exception when raise_exception then if sqlerrm<>'operations:email' then raise;end if;end;
 begin select email from public.launch_interest;raise exception 'Anonymous audience exposure';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$ declare item public.launch_interest%rowtype;begin
 if(select count(*) from public.launch_interest)<>1 or(select count(*) from public.email_jobs where kind='launch_confirmation')<>1 then raise exception 'Signup duplicated';end if;
 select * into item from public.launch_interest limit 1;
 perform public.confirm_launch_interest(item.confirmation_token);
 if(select status from public.launch_interest where id=item.id)<>'confirmed' then raise exception 'Confirmation failed';end if;
 perform public.unsubscribe_launch_interest(item.unsubscribe_token);
 if(select status from public.launch_interest where id=item.id)<>'unsubscribed' then raise exception 'Unsubscribe failed';end if;
 perform public.confirm_launch_interest(item.confirmation_token);
 if(select status from public.launch_interest where id=item.id)<>'unsubscribed' then raise exception 'Confirmation resurrected unsubscribe';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','d0c00000-0000-4000-8000-000000000002',true);
select public.open_support_request('d0c00000-0000-4000-8000-000000000010','question','Sizing question','How should I measure?');
select public.open_support_request('d0c00000-0000-4000-8000-000000000010','question','Sizing question','How should I measure?');
do $$ declare rid uuid;begin
 if(select count(*) from public.support_requests)<>1 then raise exception 'Duplicate support request';end if;
 select id into rid from public.support_requests limit 1;
 perform public.reply_support_request(rid,'d0c00000-0000-4000-8000-000000000011','More detail');
 perform public.reply_support_request(rid,'d0c00000-0000-4000-8000-000000000011','More detail');
 if(select count(*) from public.support_messages where request_id=rid)<>2 then raise exception 'Duplicate reply';end if;
 begin perform public.set_support_status(rid,'resolved',now());raise exception 'Customer resolved request';exception when raise_exception then if sqlerrm<>'checkout:owner_only' then raise;end if;end;
 begin perform public.open_support_request(gen_random_uuid(),'return','Return','Please return',null);raise exception 'Return without delivered order';exception when raise_exception then if sqlerrm<>'operations:order_status' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','d0c00000-0000-4000-8000-000000000003',true);
do $$ begin if exists(select 1 from public.support_requests) or exists(select 1 from public.support_messages) then raise exception 'Foreign support exposed';end if;end $$;
select set_config('request.jwt.claim.sub','d0c00000-0000-4000-8000-000000000001',true);
do $$ declare req public.support_requests%rowtype;begin
 select * into req from public.support_requests limit 1;
 perform public.reply_support_request(req.id,'d0c00000-0000-4000-8000-000000000012','Measure chest circumference using the guide.');
 select * into req from public.support_requests where id=req.id;
 perform public.set_support_status(req.id,'resolved',req.updated_at);
 begin perform public.reply_support_request(req.id,gen_random_uuid(),'Late reply');raise exception 'Reply to resolved request';exception when raise_exception then if sqlerrm<>'operations:resolved' then raise;end if;end;
 begin select confirmation_token from public.launch_interest;raise exception 'Private confirmation token exposed';exception when insufficient_privilege then null;end;
 begin select recipient from public.email_jobs;raise exception 'Private queue recipient exposed';exception when insufficient_privilege then null;end;
end $$;
set local role service_role;
do $$ declare job public.email_jobs%rowtype;begin
 select * into job from public.claim_email_jobs(1) limit 1;
 if job.id is null or job.kind<>'support_reply' then raise exception 'Claim/unsubscribe suppression failed';end if;
 if public.finish_email_job(job.id,gen_random_uuid(),true,'') then raise exception 'Foreign lease acknowledged';end if;
 if not public.finish_email_job(job.id,job.lease,true,'') then raise exception 'Lease acknowledgement failed';end if;
end $$;
reset role;
do $$ begin
 if(select count(*) from public.email_jobs where state='sent')<>1 then raise exception 'Email state not saved';end if;
 if(select last_error from public.email_jobs where kind='launch_confirmation')<>'unsubscribed' then raise exception 'Unsubscribed job not suppressed';end if;
end $$;
rollback;
