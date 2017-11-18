INSERT INTO users (email, password, first_name, last_name, permission) (
	SELECT ${email}, ${password}, ${first_name}, ${last_name}, ${permission}
	WHERE NOT EXISTS (
		SELECT 1 FROM users WHERE email = ${email}
	)
);

SELECT * FROM users WHERE email = ${email};
