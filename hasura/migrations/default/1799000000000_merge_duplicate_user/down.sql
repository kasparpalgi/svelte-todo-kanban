-- Cannot automatically reverse a user merge without a full backup
-- Data would need to be manually restored from backup if needed
SELECT 'This migration cannot be automatically reversed' as note;
