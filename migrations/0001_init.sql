-- 一个创始人，下面挂若干产品；每个产品有三层：灵魂的钉子、骨架、血肉。
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  one_liner TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX products_slug ON products (slug);
CREATE INDEX products_owner ON products (owner_user_id);

-- 灵魂：每一颗钉子钉住轮廓上的一个点。statement 就是那句不能交给别人的话。
CREATE TABLE soul_pins (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  statement TEXT NOT NULL,
  angle REAL NOT NULL,
  reach REAL NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX soul_pins_product ON soul_pins (product_id);

-- 骨架：概念、术语、表、对外对象、技术栈。粗、少、难变。
CREATE TABLE skeleton_parts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  slot INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX skeleton_parts_product ON skeleton_parts (product_id);

-- 血肉：功能连线、字段、页面。每天都在换，没有人守着。
CREATE TABLE flesh_tiles (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'growing',
  note TEXT NOT NULL DEFAULT '',
  slot INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX flesh_tiles_product ON flesh_tiles (product_id);
