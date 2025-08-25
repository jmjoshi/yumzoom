-- Check table structure first
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
ORDER BY ordinal_position;

-- Check a sample restaurant record
SELECT * FROM restaurants LIMIT 1;
