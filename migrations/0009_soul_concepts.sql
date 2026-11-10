-- 概念属于灵魂，不属于骨架：把骨架里的「概念」搬进灵魂文档，再从骨架删掉。
UPDATE products
   SET soul = json_set(
     soul,
     '$.concepts',
     COALESCE((
       SELECT json_group_array(json_object(
                'term', name,
                'definition', CASE WHEN trim(COALESCE(note, '')) = '' THEN name ELSE note END
              ))
         FROM (SELECT name, note FROM skeleton_parts
                WHERE skeleton_parts.product_id = products.id AND kind = 'concept'
                ORDER BY slot)
     ), json('[]'))
   )
 WHERE EXISTS (
   SELECT 1 FROM skeleton_parts WHERE skeleton_parts.product_id = products.id AND kind = 'concept'
 );

DELETE FROM skeleton_parts WHERE kind = 'concept';
