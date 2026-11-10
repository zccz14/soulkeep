-- 钉子改用分数索引排序：键是字符串，任意两把键之间永远还能再塞一把。
-- 存量按原来的 slot 顺序换成 'b' + 三位序号（头字符决定整数位长度，b 对应三位）。
ALTER TABLE soul_pins ADD COLUMN rank TEXT NOT NULL DEFAULT '';

UPDATE soul_pins SET rank = 'b' || printf('%03d', slot / 1024);

ALTER TABLE soul_pins DROP COLUMN slot;
