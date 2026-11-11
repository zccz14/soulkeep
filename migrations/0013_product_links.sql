-- 一个产品对外有两个地址：能点开的那个（公开访问地址），和能翻源码的那个（Git 地址）。
-- 都属于产品的资料，不写进灵魂：灵魂只放不能交给别人的话。
ALTER TABLE products ADD COLUMN url TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN repo TEXT NOT NULL DEFAULT '';
