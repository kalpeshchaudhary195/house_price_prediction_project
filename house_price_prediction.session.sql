
SELECT current_database();

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


SELECT * FROM house_prices
ORDER BY id DESC;


SELECT * FROM prediction_history
ORDER BY id DESC;


SELECT id, full_name, email, role, created_at
FROM users
ORDER BY id DESC;



SELECT 'house_prices' AS table_name,
       COUNT(*) AS total_entries
FROM house_prices

UNION ALL

SELECT 'prediction_history',
       COUNT(*)
FROM prediction_history

UNION ALL

SELECT 'users',
       COUNT(*)
FROM users;
