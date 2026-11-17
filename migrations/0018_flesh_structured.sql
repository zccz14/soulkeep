-- 血肉不是一串名字，是一片一行、正文受 Schema 约束的 JSON。
-- 老的 flesh_tiles 整表搬进 flesh：老备注折进正文里，一个字都不丢；表名换成 flesh。
CREATE TABLE flesh (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'feature',
  anchor TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'growing',
  payload TEXT NOT NULL DEFAULT '{}',
  read_at INTEGER NOT NULL DEFAULT 0,
  slot INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX flesh_product ON flesh (product_id);
CREATE INDEX flesh_kind ON flesh (product_id, kind);

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT id, product_id, kind, anchor, name, state,
       CASE kind
         WHEN 'table' THEN json_object('columns', json('[]'), 'note', note, 'source', '')
         WHEN 'page' THEN json_object('route', '', 'actions', json('[]'), 'tables', json('[]'), 'note', note, 'source', '')
         ELSE json_object('does', note, 'entry', '', 'tables', json('[]'), 'note', '', 'source', '')
       END,
       created_at, slot, created_at
  FROM flesh_tiles;

DROP TABLE flesh_tiles;

-- 示范产品的骨架跟着换：血肉自己占一张表，一片一行。
UPDATE products
   SET skeleton = json_object(
     'version', 1,
     'tables', json_array(
       json_object('name', 'products', 'note', '一个产品：名字、一句话身份；灵魂与骨架都在这行的 JSON 列里'),
       json_object('name', 'flesh', 'note', '血肉：一片一行，正文是受 Schema 约束的 JSON')
     ),
     'relations', json_array(
       json_object('from', 'products', 'to', 'flesh', 'cardinality', 'one-to-many')
     )
   )
 WHERE slug = 'soulkeep';

-- 示范产品自己的血肉：照着实现在的样子读回来，当真结构看，不是当文案看。
DELETE FROM flesh WHERE product_id = (SELECT id FROM products WHERE slug = 'soulkeep');

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT 'f_sk_products', id, 'table', 'products', 'products', 'growing',
  '{"columns":[
     {"name":"id","type":"TEXT","key":"pk","note":"产品 id"},
     {"name":"owner_user_id","type":"TEXT","key":"","note":"谁养着它"},
     {"name":"slug","type":"TEXT","key":"unique","note":"短名，也是路由里那一段"},
     {"name":"name","type":"TEXT","key":"","note":""},
     {"name":"one_liner","type":"TEXT","key":"","note":"一句话身份"},
     {"name":"visibility","type":"TEXT","key":"","note":"public 才上广场"},
     {"name":"is_sample","type":"INTEGER","key":"","note":"示范产品"},
     {"name":"soul","type":"TEXT","key":"","note":"整份灵魂 JSON"},
     {"name":"skeleton","type":"TEXT","key":"","note":"整份骨架 JSON"},
     {"name":"url","type":"TEXT","key":"","note":""},
     {"name":"repo","type":"TEXT","key":"","note":""},
     {"name":"created_at","type":"INTEGER","key":"","note":"桌面上的顺序"},
     {"name":"updated_at","type":"INTEGER","key":"","note":""}
   ],"note":"一个产品一行，灵魂与骨架都塞在同一行的 JSON 列里","source":"migrations/0001_init.sql"}',
  strftime('%s','now'), 0, strftime('%s','now')
  FROM products WHERE slug = 'soulkeep';

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT 'f_sk_flesh', id, 'table', 'flesh', 'flesh', 'growing',
  '{"columns":[
     {"name":"id","type":"TEXT","key":"pk","note":""},
     {"name":"product_id","type":"TEXT","key":"fk","note":"挂哪个产品"},
     {"name":"kind","type":"TEXT","key":"","note":"table / feature / page"},
     {"name":"anchor","type":"TEXT","key":"","note":"表设计挂的那张表"},
     {"name":"name","type":"TEXT","key":"","note":""},
     {"name":"state","type":"TEXT","key":"","note":"长着 / 待补 / 已脱落"},
     {"name":"payload","type":"TEXT","key":"","note":"这一片的正文，受 Schema 约束的 JSON"},
     {"name":"read_at","type":"INTEGER","key":"","note":"机器最后一次读回它是什么时候"},
     {"name":"slot","type":"INTEGER","key":"","note":""},
     {"name":"created_at","type":"INTEGER","key":"","note":""}
   ],"note":"一片血肉一行；正文按种类各有各的形状","source":"migrations/0018_flesh_structured.sql"}',
  strftime('%s','now'), 1, strftime('%s','now')
  FROM products WHERE slug = 'soulkeep';

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT 'f_sk_read', id, 'feature', '', '读一份产品', 'growing',
  '{"does":"公开的谁都能看，私有的只有养它的人看得见；看不见的一律 404，不泄露存在性","entry":"GET /api/v1/products/:slug","tables":["products","flesh"],"note":"","source":"src/routes/products.ts"}',
  strftime('%s','now'), 2, strftime('%s','now')
  FROM products WHERE slug = 'soulkeep';

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT 'f_sk_soul', id, 'feature', '', '整份写回灵魂', 'growing',
  '{"does":"一句话一条，顺序就是轻重；写回前统一收拾干净，空行不是一句","entry":"PUT /api/v1/products/:slug/soul","tables":["products"],"note":"","source":"src/soul.ts"}',
  strftime('%s','now'), 3, strftime('%s','now')
  FROM products WHERE slug = 'soulkeep';

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT 'f_sk_skeleton', id, 'feature', '', '整份写回骨架', 'growing',
  '{"does":"只认一种形状：version 1 + 表 + 关系；关系两头必须落在已有的表上","entry":"PUT /api/v1/products/:slug/skeleton","tables":["products"],"note":"","source":"src/skeleton.ts"}',
  strftime('%s','now'), 4, strftime('%s','now')
  FROM products WHERE slug = 'soulkeep';

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT 'f_sk_feed', id, 'feature', '', '把血肉喂回来', 'growing',
  '{"does":"机器从真实产物里读回一片血肉，正文按种类过 Schema；表设计挂的表和功能动到的表都必须在骨架里","entry":"POST /api/v1/products/:slug/flesh","tables":["products","flesh"],"note":"这一层没有编辑页：人不在这里写血肉","source":"src/flesh.ts"}',
  strftime('%s','now'), 5, strftime('%s','now')
  FROM products WHERE slug = 'soulkeep';

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT 'f_sk_page_desk', id, 'page', '', '创始人桌面', 'growing',
  '{"route":"#/","actions":["看自己养着的产品","新建一个产品"],"tables":["products"],"note":"","source":"web/src/pages/desk.tsx"}',
  strftime('%s','now'), 6, strftime('%s','now')
  FROM products WHERE slug = 'soulkeep';

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT 'f_sk_page_product', id, 'page', '', '产品页', 'growing',
  '{"route":"#/p/:slug","actions":["看灵魂","看骨架","看血肉"],"tables":["products","flesh"],"note":"三层摊开在一屏里","source":"web/src/pages/product.tsx"}',
  strftime('%s','now'), 7, strftime('%s','now')
  FROM products WHERE slug = 'soulkeep';

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT 'f_sk_page_plaza', id, 'page', '', '产品广场', 'growing',
  '{"route":"#/plaza","actions":["一屏看所有公开的产品线"],"tables":["products"],"note":"不登录也能看","source":"web/src/pages/plaza.tsx"}',
  strftime('%s','now'), 8, strftime('%s','now')
  FROM products WHERE slug = 'soulkeep';

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT 'f_sk_page_soul', id, 'page', '', '灵魂编辑', 'growing',
  '{"route":"#/p/:slug/soul","actions":["一句话一条地写","⌘S 整份写回"],"tables":["products"],"note":"改动先落本地草稿","source":"web/src/pages/soul.tsx"}',
  strftime('%s','now'), 9, strftime('%s','now')
  FROM products WHERE slug = 'soulkeep';

INSERT INTO flesh (id, product_id, kind, anchor, name, state, payload, read_at, slot, created_at)
SELECT 'f_sk_page_skeleton', id, 'page', '', '骨架编辑', 'growing',
  '{"route":"#/p/:slug/skeleton","actions":["加一张表","连一条关系"],"tables":["products"],"note":"粗、少、难改","source":"web/src/pages/skeleton.tsx"}',
  strftime('%s','now'), 10, strftime('%s','now')
  FROM products WHERE slug = 'soulkeep';
