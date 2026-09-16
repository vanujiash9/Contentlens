insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@contentlens.local', crypt('contentlens-demo', gen_salt('bf')), now(), now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member@contentlens.local', crypt('contentlens-demo', gen_salt('bf')), now(), now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider@contentlens.local', crypt('contentlens-demo', gen_salt('bf')), now(), now(), now())
on conflict (id) do nothing;

insert into public.profiles (user_id, display_name)
values
  ('00000000-0000-0000-0000-000000000001', 'ContentLens Owner'),
  ('00000000-0000-0000-0000-000000000002', 'ContentLens Member'),
  ('00000000-0000-0000-0000-000000000003', 'Outside User')
on conflict (user_id) do nothing;

insert into public.workspaces (id, name, slug, created_by)
values
  ('10000000-0000-0000-0000-000000000001', 'Piano Growth Studio', 'piano-growth-studio', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Competitor Workspace', 'competitor-workspace', '00000000-0000-0000-0000-000000000003')
on conflict (id) do nothing;

insert into public.workspace_members (workspace_id, user_id, role)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'member'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'owner')
on conflict (workspace_id, user_id) do nothing;

insert into public.topics (id, workspace_id, created_by, title, status, source, opportunity_score, priority, research_progress, current_step, completed_at)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Piano cơ hay piano điện?', 'completed', 'user', 92, 'high', 100, 'Brief ready', now()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Piano cho người mới bắt đầu', 'processing', 'user', 86, 'high', 45, 'Extracting findings', null),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Yamaha U1 vs Yamaha U3', 'pending', 'ai', 84, 'high', 0, null, null)
on conflict (id) do nothing;

insert into public.research_plans (workspace_id, topic_id, objective, approach, questions)
values (
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Xác định góc nội dung tốt nhất cho người mua piano lần đầu.',
  'Tổng hợp nguồn chính thống, review, diễn đàn và nhu cầu tìm kiếm.',
  '["Người mới nên chọn piano cơ hay điện?", "Chi phí dài hạn khác nhau thế nào?"]'::jsonb
)
on conflict (topic_id) do nothing;

insert into public.content_briefs (id, workspace_id, topic_id, title, search_intent, target_audience, objective, angle, key_questions, outline, key_facts, draft, review_status, approved_at, approved_by, word_count, sources_used, total_claims, cited_claims, quality_checks)
values (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Piano cơ hay piano điện: chọn theo nhu cầu thực tế',
  'Commercial investigation',
  'Người mua piano lần đầu tại Việt Nam',
  'Giúp người đọc chọn loại đàn phù hợp ngân sách và mục tiêu học.',
  'So sánh theo hoàn cảnh sử dụng thay vì chỉ thông số kỹ thuật.',
  '["Ngân sách bao nhiêu là hợp lý?", "Nhà nhỏ có nên mua piano cơ không?"]'::jsonb,
  '[{"section":"Mở bài","description":"Đặt vấn đề theo nhu cầu người mua."}]'::jsonb,
  '["Piano điện phù hợp không gian nhỏ và cần luyện yên tĩnh."]'::jsonb,
  'Bản nháp nội dung sẽ được AI hoàn thiện trong pipeline tiếp theo.',
  'approved',
  now(),
  '00000000-0000-0000-0000-000000000001',
  860,
  6,
  12,
  10,
  '[{"label":"Có dẫn chứng", "ok": true}]'::jsonb
)
on conflict (topic_id) do nothing;

insert into public.activity_events (workspace_id, actor_user_id, type, topic_id, topic_title, metadata)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'topic_created', '20000000-0000-0000-0000-000000000001', 'Piano cơ hay piano điện?', '{}'::jsonb),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'brief_approved', '20000000-0000-0000-0000-000000000001', 'Piano cơ hay piano điện?', '{"briefId":"30000000-0000-0000-0000-000000000001"}'::jsonb);
