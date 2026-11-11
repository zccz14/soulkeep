-- 骨架换成产品真正有的表：products 与 flesh_tiles（soul_pins 与 skeleton_parts 都已 drop）。
UPDATE products
   SET skeleton = json_object(
     'version', 1,
     'tables', json_array(
       json_object('name', 'products', 'note', '一个产品：名字、一句话身份；灵魂与骨架都在这行的 JSON 列里'),
       json_object('name', 'flesh_tiles', 'note', '血肉：功能连线、字段、页面')
     ),
     'relations', json_array(
       json_object('from', 'products', 'to', 'flesh_tiles', 'cardinality', 'one-to-many')
     )
   )
 WHERE slug = 'soulkeep';
