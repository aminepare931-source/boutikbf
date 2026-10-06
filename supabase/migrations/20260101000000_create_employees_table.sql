-- (Neutralisée) Cette migration référençait la table "shops" avant sa création
-- (migration 20260706...), ce qui faisait échouer toute installation à neuf.
-- La table "employees" est créée par 20260709000000_employee_anon_access.sql.
SELECT 1;
