-- =====================================================================
--  San Andrés Vibes · Encuestas de satisfacción
--  Ejecuta TODO este archivo en Supabase → SQL Editor → New query → Run
--  Es idempotente: se puede volver a ejecutar sin perder datos.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Administradores (usuarios de Supabase Auth con acceso al panel)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 2. Trabajadores: cada uno tiene un TAG único → su propio QR
-- ---------------------------------------------------------------------
create table if not exists public.workers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 80),
  role       text,
  tag        text not null unique check (tag ~ '^[A-Z0-9_-]{2,32}$'),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Preguntas (las administra el admin desde el panel)
--    type: rating (1-5 estrellas) | single (una opción) | multiple (varias)
--          yes_no (Sí/No)         | text (comentario libre)
-- ---------------------------------------------------------------------
create table if not exists public.questions (
  id         uuid primary key default gen_random_uuid(),
  position   int  not null default 0,
  type       text not null check (type in ('rating', 'single', 'multiple', 'yes_no', 'text')),
  title      text not null check (char_length(title) between 1 and 200),
  subtitle   text,
  options    jsonb not null default '[]'::jsonb,
  required   boolean not null default true,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists questions_position_idx on public.questions (position);

-- ---------------------------------------------------------------------
-- 4. Respuestas (una fila por encuesta) + detalle por pregunta
-- ---------------------------------------------------------------------
create table if not exists public.responses (
  id         uuid primary key default gen_random_uuid(),
  worker_id  uuid references public.workers (id) on delete set null,
  tag        text,                 -- TAG escaneado (null = QR genérico)
  score      numeric(3, 2),        -- promedio de las preguntas tipo rating (1-5)
  recommend  boolean,              -- primera pregunta Sí/No
  comment    text,                 -- respuestas de texto unidas
  created_at timestamptz not null default now()
);
create index if not exists responses_created_idx on public.responses (created_at desc);
create index if not exists responses_worker_idx  on public.responses (worker_id);

create table if not exists public.answers (
  id             uuid primary key default gen_random_uuid(),
  response_id    uuid not null references public.responses (id) on delete cascade,
  question_id    uuid references public.questions (id) on delete set null,
  question_title text not null,    -- copia del texto (por si la pregunta cambia)
  question_type  text not null,
  value          jsonb
);
create index if not exists answers_response_idx on public.answers (response_id);
create index if not exists answers_question_idx on public.answers (question_id);

-- ---------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------
alter table public.admins    enable row level security;
alter table public.workers   enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.answers   enable row level security;

drop policy if exists "admins read self"    on public.admins;
create policy "admins read self" on public.admins
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "questions public read" on public.questions;
create policy "questions public read" on public.questions
  for select to anon, authenticated using (active or public.is_admin());

drop policy if exists "questions admin write" on public.questions;
create policy "questions admin write" on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "workers admin all" on public.workers;
create policy "workers admin all" on public.workers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "responses admin all" on public.responses;
create policy "responses admin all" on public.responses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "answers admin all" on public.answers;
create policy "answers admin all" on public.answers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Los clientes (anon) NO leen ni escriben tablas directamente:
-- usan las dos funciones de abajo.

-- ---------------------------------------------------------------------
-- 6. RPC públicas
-- ---------------------------------------------------------------------

-- Devuelve el nombre del trabajador de un TAG (para saludar al cliente)
create or replace function public.get_worker_public(p_tag text)
returns table (name text, tag text)
language sql stable security definer
set search_path = public
as $$
  select w.name, w.tag from public.workers w
  where w.tag = upper(trim(p_tag)) and w.active
  limit 1;
$$;

-- Guarda una encuesta completa.
-- p_answers = [{ "question_id": "...", "value": 5 }, { "question_id": "...", "value": ["A","B"] }, ...]
create or replace function public.submit_response(p_tag text, p_answers jsonb)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_worker    public.workers%rowtype;
  v_tag       text := nullif(upper(trim(coalesce(p_tag, ''))), '');
  v_resp_id   uuid;
  v_item      jsonb;
  v_q         public.questions%rowtype;
  v_val       jsonb;
  v_sum       numeric := 0;
  v_n         int := 0;
  v_recommend boolean;
  v_comments  text[] := '{}';
begin
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) = 0 then
    raise exception 'answers required';
  end if;
  if jsonb_array_length(p_answers) > 50 then
    raise exception 'too many answers';
  end if;

  if v_tag is not null then
    select * into v_worker from public.workers where tag = v_tag limit 1;
  end if;

  insert into public.responses (worker_id, tag)
  values (v_worker.id, case when v_worker.id is null then null else v_tag end)
  returning id into v_resp_id;

  for v_item in select * from jsonb_array_elements(p_answers) loop
    select * into v_q from public.questions
      where id = nullif(v_item ->> 'question_id', '')::uuid;
    if not found then continue; end if;

    v_val := v_item -> 'value';
    if v_val is null or v_val = 'null'::jsonb then continue; end if;

    if v_q.type = 'rating' then
      if jsonb_typeof(v_val) <> 'number' or (v_val #>> '{}')::numeric not between 1 and 5 then continue; end if;
      v_sum := v_sum + (v_val #>> '{}')::numeric;
      v_n := v_n + 1;
    elsif v_q.type = 'yes_no' then
      if jsonb_typeof(v_val) <> 'boolean' then continue; end if;
      if v_recommend is null then v_recommend := (v_val #>> '{}')::boolean; end if;
    elsif v_q.type = 'text' then
      if jsonb_typeof(v_val) <> 'string' or btrim(v_val #>> '{}') = '' then continue; end if;
      v_val := to_jsonb(left(btrim(v_val #>> '{}'), 2000));
      v_comments := array_append(v_comments, v_val #>> '{}');
    elsif v_q.type = 'single' then
      if jsonb_typeof(v_val) <> 'string' then continue; end if;
      v_val := to_jsonb(left(v_val #>> '{}', 200));
    elsif v_q.type = 'multiple' then
      if jsonb_typeof(v_val) <> 'array' or jsonb_array_length(v_val) = 0 then continue; end if;
    end if;

    insert into public.answers (response_id, question_id, question_title, question_type, value)
    values (v_resp_id, v_q.id, v_q.title, v_q.type, v_val);
  end loop;

  update public.responses set
    score     = case when v_n > 0 then round(v_sum / v_n, 2) end,
    recommend = v_recommend,
    comment   = nullif(array_to_string(v_comments, E'\n\n'), '')
  where id = v_resp_id;

  return v_resp_id;
end;
$$;

revoke all on function public.submit_response(text, jsonb) from public;
revoke all on function public.get_worker_public(text) from public;
grant execute on function public.submit_response(text, jsonb) to anon, authenticated;
grant execute on function public.get_worker_public(text)      to anon, authenticated;
grant execute on function public.is_admin()                   to anon, authenticated;

grant select on public.questions to anon;
grant select, insert, update, delete on public.questions, public.workers, public.responses, public.answers to authenticated;
grant select on public.admins to authenticated;

-- Tiempo real: el panel se actualiza solo cuando llega una encuesta
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'responses') then
    alter publication supabase_realtime add table public.responses;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 7. Preguntas iniciales (solo si la tabla está vacía)
-- ---------------------------------------------------------------------
insert into public.questions (position, type, title, subtitle, options, required)
select * from (values
  (1, 'rating',   '¿Cómo calificarías nuestro servicio en general?', 'Selecciona la puntuación', '[]'::jsonb, true),
  (2, 'single',   '¿Qué servicio tomaste con nosotros?', null,
      '["Buggy / Mula", "Bote pontón", "Ambos"]'::jsonb, true),
  (3, 'rating',   '¿Qué tan satisfecho estás con el estado del vehículo?', null, '[]'::jsonb, true),
  (4, 'rating',   '¿Cómo calificarías la atención de nuestro equipo?', null, '[]'::jsonb, true),
  (5, 'multiple', '¿Qué fue lo que más te gustó?', 'Puedes seleccionar varias opciones',
      '["La experiencia de manejo", "La atención del personal", "El estado del vehículo", "Los paisajes y rutas", "La relación calidad-precio"]'::jsonb, false),
  (6, 'yes_no',   '¿Recomendarías San Andrés Vibes?', null, '[]'::jsonb, true),
  (7, 'text',     'Comentarios adicionales', 'Cuéntanos más sobre tu experiencia (opcional)', '[]'::jsonb, false)
) as seed(position, type, title, subtitle, options, required)
where not exists (select 1 from public.questions);

-- ---------------------------------------------------------------------
-- 8. Crear tu usuario administrador
--    a) Supabase → Authentication → Users → "Add user" (email + contraseña,
--       marca "Auto Confirm User").
--    b) Ejecuta (cambiando el correo):
--
--    insert into public.admins (user_id)
--    select id from auth.users where email = 'tu-correo@ejemplo.com'
--    on conflict do nothing;
-- ---------------------------------------------------------------------
