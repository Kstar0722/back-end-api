INSERT INTO users (email, password, first_name, last_name, permission) VALUES (${email}, ${password}, ${first_name}, ${last_name}, ${permission}) RETURNING email, first_name, last_name, permission;