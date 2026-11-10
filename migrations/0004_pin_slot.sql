-- 画布没了，钉子只剩「第几颗」：创始人排的是轻重，不是角度。
ALTER TABLE soul_pins ADD COLUMN slot INTEGER NOT NULL DEFAULT 0;

UPDATE soul_pins
   SET slot = (
     SELECT COUNT(*) FROM soul_pins AS earlier
      WHERE earlier.product_id = soul_pins.product_id
        AND earlier.rowid < soul_pins.rowid
   );

ALTER TABLE soul_pins DROP COLUMN angle;
ALTER TABLE soul_pins DROP COLUMN reach;
