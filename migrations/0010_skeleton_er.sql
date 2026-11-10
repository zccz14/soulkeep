-- 骨架也是文档：先只放 ER——表与表的关系，不写字段。
-- 老骨架表里的「表」搬进文档；「对外对象」「技术栈」不在这一版的范围里，没有搬。
ALTER TABLE products ADD COLUMN skeleton TEXT NOT NULL DEFAULT '{"version":1,"tables":[],"relations":[]}';

UPDATE products
   SET skeleton = json_object(
     'version', 1,
     'tables', COALESCE((
       SELECT json_group_array(json_object('name', name, 'note', note))
         FROM (
           SELECT name, note FROM skeleton_parts
            WHERE skeleton_parts.product_id = products.id AND kind = 'table'
            ORDER BY slot
         )
     ), json('[]')),
     'relations', json('[]')
   );

DROP TABLE skeleton_parts;
