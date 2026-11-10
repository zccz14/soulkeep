-- 「示范」是标签，「归属」是权力：示范产品也归创始人，改它的人和改别的产品的人是同一个。
ALTER TABLE products ADD COLUMN is_sample INTEGER NOT NULL DEFAULT 0;

UPDATE products
   SET is_sample = 1,
       owner_user_id = '031a393d-8a0a-4ca0-8cb1-313e0d71dfa9'
 WHERE id = 'p_soulkeep';
