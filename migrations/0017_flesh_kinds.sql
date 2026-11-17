-- 血肉分化：一片血肉先要分清是哪一种肉。
-- kind = table 表设计（必须挂在骨架的一张表上）/ feature 功能 / page 页面。
-- anchor 只在表设计上有值，就是它挂的那张表的名字。
ALTER TABLE flesh_tiles ADD COLUMN kind TEXT NOT NULL DEFAULT 'feature';
ALTER TABLE flesh_tiles ADD COLUMN anchor TEXT NOT NULL DEFAULT '';
CREATE INDEX flesh_tiles_kind ON flesh_tiles (product_id, kind);

-- 已经长着的血肉都是功能连线：先把它们认下来，别让老数据掉出这一层。
UPDATE flesh_tiles SET kind = 'feature' WHERE kind = '';

-- 示范产品自己的表设计：这两张表就在骨架里，给它们各长一份血肉，顺便做个样子。
INSERT INTO flesh_tiles (id, product_id, name, kind, anchor, state, note, slot, created_at)
SELECT 'tile_soulkeep_products', id, 'products', 'table', 'products', 'growing',
       'id 主键 · owner_user_id 谁能改 · slug 唯一短名 · soul 与 skeleton 各是整份 JSON 列 · visibility 公开还是私有 · created_at 管桌面顺序',
       (SELECT COALESCE(MAX(slot), -1) + 1 FROM flesh_tiles WHERE product_id = products.id), strftime('%s','now')
  FROM products
 WHERE slug = 'soulkeep'
   AND NOT EXISTS (SELECT 1 FROM flesh_tiles WHERE id = 'tile_soulkeep_products');

INSERT INTO flesh_tiles (id, product_id, name, kind, anchor, state, note, slot, created_at)
SELECT 'tile_soulkeep_flesh_tiles', id, 'flesh_tiles', 'table', 'flesh_tiles', 'growing',
       'product_id 挂哪个产品 · kind 哪一种肉 · anchor 表设计挂的那张表 · state 长着 / 待补 / 已脱落 · slot 排列顺序',
       (SELECT COALESCE(MAX(slot), -1) + 1 FROM flesh_tiles WHERE product_id = products.id), strftime('%s','now')
  FROM products
 WHERE slug = 'soulkeep'
   AND NOT EXISTS (SELECT 1 FROM flesh_tiles WHERE id = 'tile_soulkeep_flesh_tiles');
