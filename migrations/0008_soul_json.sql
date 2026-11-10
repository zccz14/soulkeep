-- 灵魂不是一堆实体，是受 Schema 约束的一份 JSON：顺序就是数组顺序，不再需要序号。
ALTER TABLE products ADD COLUMN soul TEXT NOT NULL DEFAULT '{"version":1,"statements":[]}';

UPDATE products
   SET soul = json_object(
     'version', 1,
     'statements', (
       SELECT json_group_array(statement) FROM (
         SELECT statement FROM soul_pins WHERE soul_pins.product_id = products.id ORDER BY rank
       )
     )
   );

DROP TABLE soul_pins;
