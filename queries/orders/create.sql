INSERT INTO orders (customer, product, price) VALUES (${customer}, ${product}, ${price}) RETURNING *;