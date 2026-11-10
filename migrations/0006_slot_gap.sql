-- 序号之间留出空档：挪动一颗钉子只改它自己那一行，不再整串重编。
UPDATE soul_pins SET slot = (slot + 1) * 1024;
