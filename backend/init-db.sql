-- creates 3 dbs for the 3 services
-- auto-runs in /docker-entrypoint-initdb.d/ on first start

SELECT 'CREATE DATABASE orders_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'orders_db')\gexec

SELECT 'CREATE DATABASE inventory_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'inventory_db')\gexec

SELECT 'CREATE DATABASE notifications_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'notifications_db')\gexec
