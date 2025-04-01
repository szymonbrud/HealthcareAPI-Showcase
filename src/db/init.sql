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

create table if not exists refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id integer references users(id) not null,
  token_hash varchar(255) unique not null,
  expires_at timestamptz not null,
  create_at timestamptz default NOW()
)
