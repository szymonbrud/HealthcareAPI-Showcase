create type user_role as enum ('user', 'doctor', 'secretary');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name varchar(255) not null,
  surname varchar(255) not null,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create UNIQUE index idx_users_email on users(email);

create table if not exists refresh_tokens (
  id SERIAL PRIMARY KEY,
  token_id uuid not null,
  user_id integer not null,
  token_hash varchar(255) unique not null,
  expires_at timestamptz not null,
  create_at timestamptz default NOW()
);

alter table refresh_tokens
  add constraint fk_refresh_tokens_user_id foreign key (user_id) references users(id) on delete CASCADE;

create index idx_refresh_token_expires_at on refresh_tokens(expires_at);
create UNIQUE index idx_refresh_token_token_id on refresh_tokens(token_id);

create table doctor_weekly_schedules(
  id bigserial primary key,
  user_id integer not null,
  day_of_week smallint not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz default NOW(),
  updated_at timestamptz not null
);

alter table doctor_weekly_schedules
  add constraint fk_doctor_weekly_schedules_user_id foreign key (user_id) references users(id) on delete restrict,
  add constraint check_day_of_week check (day_of_week between 1 and 7),
  add constraint check_schedule_times check (end_time > start_time);

create index idx_doctor_weekly_schedules_user_id on doctor_weekly_schedules(user_id);

create table visits(
  id serial Primary key,
  patient_id integer not null,
  doctor_id integer not null,
  start_time timestamptz not null,
  end_time TIMESTAMPTZ not null,
  recommendations_for_patient text
);


alter table visits
  add constraint fk_visits_patient_id foreign key (patient_id) references users(id) on delete restrict,
  add constraint fk_visits_doctor_id foreign key (doctor_id) references users(id) on delete restrict,
  add constraint check_visits_time_validation check (end_time > start_time);

create index idx_visits_patient_id on visits(patient_id);
create index idx_visits_doctor_id on visits(doctor_id);
