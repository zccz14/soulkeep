-- 第一个居民是 Soulkeep 自己：这个工具先用它自己演示三层应该长什么样。
INSERT INTO products (id, owner_user_id, slug, name, one_liner, visibility, created_at, updated_at)
VALUES ('p_soulkeep', 'demo', 'soulkeep', 'Soulkeep',
        '给创始人的有机软件工作台：钉住灵魂，剩下的交给它自己长。', 'public',
        strftime('%s','now'), strftime('%s','now'));

INSERT INTO soul_pins (id, product_id, kind, statement, angle, reach, created_at) VALUES
 ('pin_1', 'p_soulkeep', 'why',   '只有创始人能做的判断，才值得占用创始人的时间。', 268, 1.06, strftime('%s','now')),
 ('pin_2', 'p_soulkeep', 'being', '产品是活物：灵魂由人写，血肉由机器养。',           332, 1.00, strftime('%s','now')),
 ('pin_3', 'p_soulkeep', 'being', '三层单向约束：灵魂管骨架，骨架管血肉。',           28,  1.03, strftime('%s','now')),
 ('pin_4', 'p_soulkeep', 'never', '绝不替创始人做身份决定。',                        92,  0.97, strftime('%s','now')),
 ('pin_5', 'p_soulkeep', 'never', '绝不用指标去改判灵魂。',                         152, 1.02, strftime('%s','now')),
 ('pin_6', 'p_soulkeep', 'who',   '称呼他：创始人。',                               208, 0.95, strftime('%s','now'));

INSERT INTO skeleton_parts (id, product_id, kind, name, note, slot, created_at) VALUES
 ('sk_1', 'p_soulkeep', 'concept', '产品',      '一个活着的个体，有名字、有一句话身份。', 0, strftime('%s','now')),
 ('sk_2', 'p_soulkeep', 'concept', '钉',        '灵魂轮廓上的一点，每一点是一句承诺。',   1, strftime('%s','now')),
 ('sk_3', 'p_soulkeep', 'table',   'soul_pins', '钉住轮廓的那张表。',                     2, strftime('%s','now')),
 ('sk_4', 'p_soulkeep', 'concept', '骨架',      '概念、术语、关系；小到一个人一小时读完。', 3, strftime('%s','now')),
 ('sk_5', 'p_soulkeep', 'object',  '对外接口',  '只暴露对象，不承诺字段。',               4, strftime('%s','now')),
 ('sk_6', 'p_soulkeep', 'stack',   '技术栈',    'Workers + D1 + React；单源部署。',       5, strftime('%s','now'));

INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
 ('fs_1', 'p_soulkeep', '钉下一条灵魂',     'growing', '写一句，轮廓立刻跟着变。', 0, strftime('%s','now')),
 ('fs_2', 'p_soulkeep', '轮廓随钉子变形',   'growing', '没有钉子，就没有形状。',   1, strftime('%s','now')),
 ('fs_3', 'p_soulkeep', '骨架环',           'growing', '粗线，少节点。',           2, strftime('%s','now')),
 ('fs_4', 'p_soulkeep', '血肉格子',         'growing', '每天在换，没有人守着。',   3, strftime('%s','now')),
 ('fs_5', 'p_soulkeep', '产品列表',         'growing', '一眼看见你养着几个产品。', 4, strftime('%s','now')),
 ('fs_6', 'p_soulkeep', '骨架变更提案',     'pending', '等创始人签。',            5, strftime('%s','now')),
 ('fs_7', 'p_soulkeep', '定期重读',         'pending', '换一代眼睛重新看一遍。',   6, strftime('%s','now')),
 ('fs_8', 'p_soulkeep', '手工维护的架构图', 'shed',    '骨架自己会说话，图不用人画。', 7, strftime('%s','now')),
 ('fs_9', 'p_soulkeep', '兼容旧字段',       'shed',    '改了就改到底。',           8, strftime('%s','now'));
