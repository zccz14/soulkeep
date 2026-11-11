-- 把 19 条产品线的机器层补上：骨架来自各仓库真实的建表语句与声明外键，血肉是各仓库已上线的那几片。
-- 灵魂不在这里：那是创始人自己的话，AI 不代笔。

-- p_cybion
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"threads","note":"一次智能任务的执行单元：配置、生命周期与上下文都挂在它身上"},{"name":"manuals","note":"长期维护的提示文本，可以挂子手册"},{"name":"notes","note":"线程级便签：目标与待办，没划完就把线程交回来"},{"name":"workers","note":"配对的设备执行端，工具调用在它上面跑"},{"name":"machines","note":"终极机器：一条命令按周期检查，失败就开修复线程"},{"name":"history_records","note":"线程的历史记录：消息、工具调用与结果"},{"name":"custom_tool_calls","note":"自定义工具的调用与结果"},{"name":"worker_calls","note":"派到 Worker 的一次 bash、浏览器或截图调用"},{"name":"thread_manual_loads","note":"线程装了哪些手册"},{"name":"api_keys","note":"调 Agent API 的机器凭证"}],"relations":[{"from":"manuals","to":"manuals","cardinality":"one-to-many"},{"from":"threads","to":"manuals","cardinality":"many-to-many"},{"from":"threads","to":"history_records","cardinality":"one-to-many"},{"from":"threads","to":"notes","cardinality":"one-to-many"},{"from":"threads","to":"custom_tool_calls","cardinality":"one-to-many"},{"from":"threads","to":"worker_calls","cardinality":"one-to-many"},{"from":"workers","to":"worker_calls","cardinality":"one-to-many"},{"from":"workers","to":"machines","cardinality":"one-to-many"},{"from":"machines","to":"threads","cardinality":"one-to-one"},{"from":"api_keys","to":"threads","cardinality":"one-to-many"}]}' WHERE id = 'p_cybion';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_cybion_1', 'p_cybion', '线程运行与续跑', 'growing', '一次输入一轮，跑完自己接着跑下一轮', 0, strftime('%s','now')),
  ('tile_cybion_2', 'p_cybion', '手册热更新', 'growing', '手册改了自动补发，压缩之后也不会丢', 1, strftime('%s','now')),
  ('tile_cybion_3', 'p_cybion', '便签与达成', 'growing', '没划完的便签到点把线程交回来，最多 12 轮', 2, strftime('%s','now')),
  ('tile_cybion_4', 'p_cybion', '终极机器', 'growing', '周期命令失败才开修复线程，成功时零 Token', 3, strftime('%s','now')),
  ('tile_cybion_5', 'p_cybion', 'Worker 协议', 'growing', 'bash、Browser Control、Computer Use、View Image', 4, strftime('%s','now')),
  ('tile_cybion_6', 'p_cybion', 'Agent API 与 Thread Token', 'growing', '外部服务凭线程令牌认出这是哪个线程', 5, strftime('%s','now'));

-- p_normai
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"providers","note":"一家上游模型厂：自己的地址与凭据"},{"name":"provider_models","note":"上游提供的模型：价格、模态与可见性"},{"name":"model_prices","note":"模型价格表"},{"name":"consumers","note":"消费凭证：谁可以用哪些模型"},{"name":"api_calls","note":"逐次调用审计：谁、用哪个模型、花了多少美元"},{"name":"request_archives","note":"请求原文归档"},{"name":"users","note":"平台用户"}],"relations":[{"from":"providers","to":"provider_models","cardinality":"one-to-many"},{"from":"providers","to":"api_calls","cardinality":"one-to-many"},{"from":"consumers","to":"api_calls","cardinality":"one-to-many"},{"from":"users","to":"consumers","cardinality":"one-to-many"},{"from":"api_calls","to":"request_archives","cardinality":"one-to-one"},{"from":"users","to":"providers","cardinality":"one-to-many"}]}' WHERE id = 'p_normai';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_normai_1', 'p_normai', '统一入口与负载均衡', 'growing', '一个地址收下各家请求，按亲和性挑上游', 0, strftime('%s','now')),
  ('tile_normai_2', 'p_normai', '上游与模型目录', 'growing', '模型清单、价格与模态都收在一处', 1, strftime('%s','now')),
  ('tile_normai_3', 'p_normai', '按美元计费', 'growing', '扣费以美元记账，不对厂商单独适配', 2, strftime('%s','now')),
  ('tile_normai_4', 'p_normai', '逐次调用审计', 'growing', '每一次请求留下用量与花费', 3, strftime('%s','now'));

-- p_exe
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"devices","note":"一台设备：公钥即地址，trust 列表在设备本地"},{"name":"calls","note":"一次调用信封：谁调的、跑了什么、结果如何"}],"relations":[{"from":"devices","to":"calls","cardinality":"one-to-many"}]}' WHERE id = 'p_exe';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_exe_1', 'p_exe', '设备配对与公钥地址', 'growing', '公钥即地址，云端只认这把钥匙', 0, strftime('%s','now')),
  ('tile_exe_2', 'p_exe', '本地 trust 列表', 'growing', '设备自己校验调用方，云端说了不算', 1, strftime('%s','now')),
  ('tile_exe_3', 'p_exe', '信封中转', 'growing', '云端只转发信封，结果用派生密钥封回去', 2, strftime('%s','now')),
  ('tile_exe_4', 'p_exe', 'shell 与读图', 'growing', '给任何 harness 提供命令与看屏', 3, strftime('%s','now')),
  ('tile_exe_5', 'p_exe', '签名升级与回滚', 'growing', '每小时拉签名清单，站不住就回滚并拉黑', 4, strftime('%s','now'));

-- p_docs
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"documents","note":"一篇文档：归作者，可以挂父文档，指向当前修订与已发布修订"},{"name":"document_revisions","note":"一次不可变修订"},{"name":"document_comments","note":"挂在某次修订上的评论"},{"name":"document_metadata","note":"文档元数据"},{"name":"document_readers","note":"谁读过这篇文档"},{"name":"document_view_daily","note":"按日留一份浏览量"},{"name":"document_view_stats","note":"累计浏览统计"},{"name":"document_translations","note":"某次修订的译文"},{"name":"ai_requests","note":"一次 AI 请求，走的是 OpenAI LB"},{"name":"ai_runs","note":"一次 AI 运行"},{"name":"contexts","note":"一个上下文：文档的组织单位"},{"name":"api_keys","note":"个人 API Key"}],"relations":[{"from":"documents","to":"documents","cardinality":"one-to-many"},{"from":"documents","to":"document_revisions","cardinality":"one-to-many"},{"from":"document_revisions","to":"document_comments","cardinality":"one-to-many"},{"from":"document_revisions","to":"document_metadata","cardinality":"one-to-one"},{"from":"document_revisions","to":"document_translations","cardinality":"one-to-many"},{"from":"documents","to":"document_readers","cardinality":"one-to-many"},{"from":"documents","to":"document_view_daily","cardinality":"one-to-many"},{"from":"documents","to":"document_view_stats","cardinality":"one-to-one"},{"from":"documents","to":"ai_requests","cardinality":"one-to-many"},{"from":"documents","to":"ai_runs","cardinality":"one-to-many"}]}' WHERE id = 'p_docs';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_docs_1', 'p_docs', '文档归作者', 'growing', '谁写的就是谁的，不可转让', 0, strftime('%s','now')),
  ('tile_docs_2', 'p_docs', '不可变修订', 'growing', '每次发布留一份改不了的修订', 1, strftime('%s','now')),
  ('tile_docs_3', 'p_docs', '公共广场', 'growing', '发布出去的文档都在广场上', 2, strftime('%s','now')),
  ('tile_docs_4', 'p_docs', '评论与读者', 'growing', '评论挂在修订上，读者单独记', 3, strftime('%s','now')),
  ('tile_docs_5', 'p_docs', 'AI 原生写作', 'growing', '改写与翻译走 OpenAI LB，逐次留回执', 4, strftime('%s','now'));

-- p_linkit
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"users","note":"Auth Mini 的用户镜像"},{"name":"profiles","note":"个人资料：昵称、简介、头像、语言与主题"},{"name":"conversations","note":"私聊或群聊"},{"name":"conversation_members","note":"谁在哪个会话里"},{"name":"messages","note":"一条消息"},{"name":"attachments","note":"附件"},{"name":"message_mentions","note":"消息里 @ 了谁"},{"name":"bots","note":"Bot 账号"},{"name":"conversation_bots","note":"Bot 在哪些会话里"},{"name":"bark_devices","note":"Bark 推送设备"},{"name":"user_api_keys","note":"个人 API Key"},{"name":"user_notes","note":"通讯录备注"}],"relations":[{"from":"users","to":"profiles","cardinality":"one-to-one"},{"from":"users","to":"conversations","cardinality":"one-to-many"},{"from":"conversations","to":"conversation_members","cardinality":"one-to-many"},{"from":"users","to":"conversation_members","cardinality":"one-to-many"},{"from":"conversations","to":"messages","cardinality":"one-to-many"},{"from":"messages","to":"attachments","cardinality":"one-to-many"},{"from":"messages","to":"message_mentions","cardinality":"one-to-many"},{"from":"users","to":"message_mentions","cardinality":"one-to-many"},{"from":"bots","to":"conversation_bots","cardinality":"one-to-many"},{"from":"conversations","to":"conversation_bots","cardinality":"one-to-many"},{"from":"users","to":"bark_devices","cardinality":"one-to-many"},{"from":"users","to":"user_api_keys","cardinality":"one-to-many"},{"from":"users","to":"user_notes","cardinality":"one-to-many"}]}' WHERE id = 'p_linkit';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_linkit_1', 'p_linkit', '用户目录搜索', 'growing', '按名字与 ID 找人，带搜索索引', 0, strftime('%s','now')),
  ('tile_linkit_2', 'p_linkit', '私聊与群聊', 'growing', '消息、已读游标与紧急消息', 1, strftime('%s','now')),
  ('tile_linkit_3', 'p_linkit', '附件与头像', 'growing', '原件存下，头像另存衍生图', 2, strftime('%s','now')),
  ('tile_linkit_4', 'p_linkit', 'Bark 与 APNs 直推', 'growing', '不经过第三方推送服务', 3, strftime('%s','now')),
  ('tile_linkit_5', 'p_linkit', 'Bot API 与个人 API Key', 'growing', '机器人挂进群，个人凭 Key 调接口', 4, strftime('%s','now'));

-- p_ctpd
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"access_tokens","note":"调 HTTP 服务的访问令牌"},{"name":"instrument_specs","note":"合约规格：交易所里的合约长什么样"},{"name":"account_commission_rates","note":"账户手续费率"},{"name":"account_margin_rates","note":"账户保证金率"},{"name":"ticks","note":"行情快照"},{"name":"tick_subscriptions","note":"订阅了哪些合约的行情"},{"name":"order_history","note":"报单历史"},{"name":"trade_history","note":"成交历史"},{"name":"idempotency_ledger","note":"下单幂等台账：同一个请求只下一次"}],"relations":[{"from":"instrument_specs","to":"ticks","cardinality":"one-to-many"},{"from":"instrument_specs","to":"tick_subscriptions","cardinality":"one-to-many"},{"from":"instrument_specs","to":"account_commission_rates","cardinality":"one-to-many"},{"from":"instrument_specs","to":"account_margin_rates","cardinality":"one-to-many"},{"from":"instrument_specs","to":"order_history","cardinality":"one-to-many"},{"from":"instrument_specs","to":"trade_history","cardinality":"one-to-many"},{"from":"order_history","to":"trade_history","cardinality":"one-to-many"}]}' WHERE id = 'p_ctpd';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_ctpd_1', 'p_ctpd', '合约规格与费率同步', 'growing', '从柜台拉规格、手续费率与保证金率', 0, strftime('%s','now')),
  ('tile_ctpd_2', 'p_ctpd', '行情订阅与 Tick', 'growing', '订阅进内存，Tick 落进 SQLite', 1, strftime('%s','now')),
  ('tile_ctpd_3', 'p_ctpd', '报单与成交历史', 'growing', '写事务走进程内单队列', 2, strftime('%s','now')),
  ('tile_ctpd_4', 'p_ctpd', '幂等下单台账', 'growing', '重复的请求不会再下一单', 3, strftime('%s','now')),
  ('tile_ctpd_5', 'p_ctpd', 'Auth Mini 登录', 'growing', '首次启动只填 root_user_id', 4, strftime('%s','now'));

-- p_1exchange
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"users","note":"用户"},{"name":"user_profiles","note":"个人资料"},{"name":"credentials","note":"交易所 API 凭证，加密存"},{"name":"account_registry","note":"一个交易所账户"},{"name":"virtual_accounts","note":"虚拟子账户"},{"name":"manual_accounts","note":"手工记账账户"},{"name":"user_balances","note":"账户里某币种的余额"},{"name":"balance_ledger","note":"余额流水：每一笔都带变动前后"},{"name":"balance_transfers","note":"账户之间划转"},{"name":"account_equity_snapshots","note":"账户权益快照"},{"name":"currency_rate_daily","note":"日汇率"}],"relations":[{"from":"users","to":"user_profiles","cardinality":"one-to-one"},{"from":"users","to":"credentials","cardinality":"one-to-many"},{"from":"users","to":"account_registry","cardinality":"one-to-many"},{"from":"credentials","to":"account_registry","cardinality":"one-to-one"},{"from":"account_registry","to":"virtual_accounts","cardinality":"one-to-many"},{"from":"account_registry","to":"manual_accounts","cardinality":"one-to-many"},{"from":"account_registry","to":"user_balances","cardinality":"one-to-many"},{"from":"users","to":"balance_ledger","cardinality":"one-to-many"},{"from":"account_registry","to":"account_equity_snapshots","cardinality":"one-to-many"}]}' WHERE id = 'p_1exchange';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_1exchange_1', 'p_1exchange', '交易所凭证托管', 'growing', 'Credential 加密存，适配模型迁自 Yuan', 0, strftime('%s','now')),
  ('tile_1exchange_2', 'p_1exchange', '账户与虚拟子账户', 'growing', '一个交易所账户可以再拆出子账户', 1, strftime('%s','now')),
  ('tile_1exchange_3', 'p_1exchange', '余额与权益快照', 'growing', '按日留一份资产与权益', 2, strftime('%s','now')),
  ('tile_1exchange_4', 'p_1exchange', '余额流水的变动前后', 'growing', '每笔都写 before 与 after', 3, strftime('%s','now')),
  ('tile_1exchange_5', 'p_1exchange', '账户间划转', 'growing', '划转与对应流水一起落库', 4, strftime('%s','now')),
  ('tile_1exchange_6', 'p_1exchange', '手工记账账户', 'growing', '不在交易所里的钱也能记', 5, strftime('%s','now'));

-- p_tickets
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"projects","note":"一个产品项目，报障归到项目"},{"name":"project_grants","note":"谁能看哪个项目"},{"name":"tickets","note":"一张工单：现象、现场证据与推出的修复线程"},{"name":"users","note":"用户"},{"name":"cybion_accounts","note":"项目所有者绑定的 Cybion 账号"}],"relations":[{"from":"projects","to":"tickets","cardinality":"one-to-many"},{"from":"projects","to":"project_grants","cardinality":"one-to-many"},{"from":"users","to":"project_grants","cardinality":"one-to-many"},{"from":"users","to":"tickets","cardinality":"one-to-many"}]}' WHERE id = 'p_tickets';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_tickets_1', 'p_tickets', '报障提交', 'growing', '报障侧先查清现场，再写回证据', 0, strftime('%s','now')),
  ('tile_tickets_2', 'p_tickets', '推出修复线程', 'growing', '提交即用项目所有者的账号开线程，无队列无轮询', 1, strftime('%s','now')),
  ('tile_tickets_3', 'p_tickets', '项目授权', 'growing', '谁能给哪个项目报障', 2, strftime('%s','now')),
  ('tile_tickets_4', 'p_tickets', '单二进制 + SQLite', 'growing', '前端内嵌，状态都在本地库', 3, strftime('%s','now'));

-- p_openai_lb
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"providers","note":"一家上游模型厂"},{"name":"channels","note":"上游下的一个渠道或账号"},{"name":"users","note":"平台用户"},{"name":"api_keys","note":"调用凭证"},{"name":"consumers","note":"消费方：下游产品拿它来用"},{"name":"api_calls","note":"逐次调用审计"},{"name":"credit_ledger_entries","note":"余额流水：充值与扣费"},{"name":"payment_orders","note":"充值订单"},{"name":"provider_grants","note":"谁能用哪个上游"}],"relations":[{"from":"providers","to":"channels","cardinality":"one-to-many"},{"from":"providers","to":"provider_grants","cardinality":"one-to-many"},{"from":"users","to":"provider_grants","cardinality":"one-to-many"},{"from":"users","to":"api_keys","cardinality":"one-to-many"},{"from":"users","to":"payment_orders","cardinality":"one-to-many"},{"from":"api_keys","to":"api_calls","cardinality":"one-to-many"},{"from":"channels","to":"api_calls","cardinality":"one-to-many"},{"from":"payment_orders","to":"credit_ledger_entries","cardinality":"one-to-many"}]}' WHERE id = 'p_openai_lb';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_openai_lb_1', 'p_openai_lb', 'Responses 反向代理', 'growing', '只做 OpenAI / CodeX 自家的协议', 0, strftime('%s','now')),
  ('tile_openai_lb_2', 'p_openai_lb', '渠道与容量', 'growing', '一个上游下多个渠道，按容量挑', 1, strftime('%s','now')),
  ('tile_openai_lb_3', 'p_openai_lb', '逐次调用审计', 'growing', '每次调用留下请求与用量', 2, strftime('%s','now')),
  ('tile_openai_lb_4', 'p_openai_lb', '美元计费与充值', 'growing', '余额流水与充值订单', 3, strftime('%s','now')),
  ('tile_openai_lb_5', 'p_openai_lb', 'Consumer 与 API Key', 'growing', '谁能用、能用多少分开管', 4, strftime('%s','now'));

-- p_deepseek_lb
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"providers","note":"一家上游模型厂"},{"name":"consumers","note":"消费方：下游产品拿它来用"},{"name":"users","note":"平台用户"},{"name":"api_calls","note":"逐次调用审计"},{"name":"affinities","note":"请求与上游的亲和关系"},{"name":"request_archives","note":"请求原文归档"}],"relations":[{"from":"users","to":"consumers","cardinality":"one-to-many"},{"from":"consumers","to":"api_calls","cardinality":"one-to-many"},{"from":"providers","to":"api_calls","cardinality":"one-to-many"},{"from":"providers","to":"affinities","cardinality":"one-to-many"},{"from":"api_calls","to":"request_archives","cardinality":"one-to-one"}]}' WHERE id = 'p_deepseek_lb';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_deepseek_lb_1', 'p_deepseek_lb', '反向代理与负载均衡', 'growing', '只处理 DeepSeek 自家的协议', 0, strftime('%s','now')),
  ('tile_deepseek_lb_2', 'p_deepseek_lb', '上游与消费者', 'growing', '一个上游对多个下游，按亲和挑', 1, strftime('%s','now')),
  ('tile_deepseek_lb_3', 'p_deepseek_lb', '逐次调用审计', 'growing', '每次调用留下用量与花费', 2, strftime('%s','now')),
  ('tile_deepseek_lb_4', 'p_deepseek_lb', '余额扣费', 'growing', '按美元扣费，余额不足就拒', 3, strftime('%s','now'));

-- p_qwen_lb
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"providers","note":"一家上游模型厂"},{"name":"consumers","note":"消费方：下游产品拿它来用"},{"name":"users","note":"平台用户"},{"name":"api_calls","note":"逐次调用审计"},{"name":"affinities","note":"请求与上游的亲和关系"},{"name":"request_archives","note":"请求原文归档"}],"relations":[{"from":"users","to":"consumers","cardinality":"one-to-many"},{"from":"consumers","to":"api_calls","cardinality":"one-to-many"},{"from":"providers","to":"api_calls","cardinality":"one-to-many"},{"from":"providers","to":"affinities","cardinality":"one-to-many"},{"from":"api_calls","to":"request_archives","cardinality":"one-to-one"}]}' WHERE id = 'p_qwen_lb';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_qwen_lb_1', 'p_qwen_lb', '反向代理与负载均衡', 'growing', '只处理 Qwen 自家的协议', 0, strftime('%s','now')),
  ('tile_qwen_lb_2', 'p_qwen_lb', '上游与消费者', 'growing', '一个上游对多个下游，按亲和挑', 1, strftime('%s','now')),
  ('tile_qwen_lb_3', 'p_qwen_lb', '逐次调用审计', 'growing', '每次调用留下用量与花费', 2, strftime('%s','now')),
  ('tile_qwen_lb_4', 'p_qwen_lb', '余额扣费', 'growing', '按美元扣费，余额不足就拒', 3, strftime('%s','now'));

-- p_opencode_lb
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"providers","note":"一家上游模型厂"},{"name":"provider_grants","note":"谁能用哪个上游"},{"name":"model_prices","note":"模型价格表"},{"name":"consumers","note":"消费方"},{"name":"requests","note":"逐次请求审计"},{"name":"users","note":"平台用户"}],"relations":[{"from":"users","to":"providers","cardinality":"one-to-many"},{"from":"providers","to":"provider_grants","cardinality":"one-to-many"},{"from":"users","to":"provider_grants","cardinality":"one-to-many"},{"from":"providers","to":"requests","cardinality":"one-to-many"},{"from":"consumers","to":"requests","cardinality":"one-to-many"}]}' WHERE id = 'p_opencode_lb';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_opencode_lb_1', 'p_opencode_lb', '反向代理与负载均衡', 'growing', '只处理 OpenCode 自家的协议', 0, strftime('%s','now')),
  ('tile_opencode_lb_2', 'p_opencode_lb', '上游与消费者', 'growing', '一个上游对多个下游，按亲和挑', 1, strftime('%s','now')),
  ('tile_opencode_lb_3', 'p_opencode_lb', '逐次调用审计', 'growing', '每次调用留下用量与花费', 2, strftime('%s','now')),
  ('tile_opencode_lb_4', 'p_opencode_lb', '余额扣费', 'growing', '按美元扣费，余额不足就拒', 3, strftime('%s','now'));

-- p_antigravity_lb
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"accounts","note":"上游账号与项目、套餐档位"},{"name":"api_keys","note":"调用凭证"},{"name":"conversations","note":"一个调用方的会话"},{"name":"audit","note":"逐次请求审计"},{"name":"call_signatures","note":"调用签名：每次调用取一次"},{"name":"users","note":"平台用户"}],"relations":[{"from":"users","to":"api_keys","cardinality":"one-to-many"},{"from":"api_keys","to":"conversations","cardinality":"one-to-many"},{"from":"accounts","to":"audit","cardinality":"one-to-many"},{"from":"conversations","to":"audit","cardinality":"one-to-many"}]}' WHERE id = 'p_antigravity_lb';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_antigravity_lb_1', 'p_antigravity_lb', '账号与套餐档位', 'growing', '上游账号带上项目与 tier', 0, strftime('%s','now')),
  ('tile_antigravity_lb_2', 'p_antigravity_lb', '调用签名', 'growing', '每次调用先取签名再用', 1, strftime('%s','now')),
  ('tile_antigravity_lb_3', 'p_antigravity_lb', '会话与审计', 'growing', '一个 Key 一条会话线，逐次留痕', 2, strftime('%s','now')),
  ('tile_antigravity_lb_4', 'p_antigravity_lb', 'OAuth 待办', 'growing', '授权没走完的先落一条', 3, strftime('%s','now'));

-- p_autolabs
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"projects","note":"一个研究项目，一族 Domain-Labs"},{"name":"runs","note":"一次实验：输入快照、输出快照与回执"},{"name":"snapshots","note":"冻结的源码快照，内容寻址"},{"name":"snapshot_entries","note":"快照里的一条条目"},{"name":"blobs","note":"内容寻址的字节块"},{"name":"project_blobs","note":"项目引用了哪些块"},{"name":"project_metrics","note":"项目级指标契约"},{"name":"sota_events","note":"SOTA 账本的一次改写"},{"name":"dataset_pins","note":"项目钉住的数据集版本"},{"name":"project_members","note":"谁能看哪个项目"},{"name":"project_tokens","note":"项目级访问令牌"},{"name":"events","note":"项目动态"}],"relations":[{"from":"projects","to":"runs","cardinality":"one-to-many"},{"from":"projects","to":"snapshots","cardinality":"one-to-many"},{"from":"snapshots","to":"snapshots","cardinality":"one-to-many"},{"from":"snapshots","to":"snapshot_entries","cardinality":"one-to-many"},{"from":"projects","to":"project_blobs","cardinality":"one-to-many"},{"from":"blobs","to":"project_blobs","cardinality":"one-to-many"},{"from":"projects","to":"project_metrics","cardinality":"one-to-many"},{"from":"projects","to":"sota_events","cardinality":"one-to-many"},{"from":"runs","to":"sota_events","cardinality":"one-to-many"},{"from":"projects","to":"dataset_pins","cardinality":"one-to-many"},{"from":"projects","to":"project_members","cardinality":"one-to-many"},{"from":"projects","to":"project_tokens","cardinality":"one-to-many"},{"from":"projects","to":"events","cardinality":"one-to-many"}]}' WHERE id = 'p_autolabs';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_autolabs_1', 'p_autolabs', '研究地图', 'growing', '一个项目一族实验室，项目级指标与 SOTA', 0, strftime('%s','now')),
  ('tile_autolabs_2', 'p_autolabs', '内容寻址的实验快照', 'growing', '快照冻结，可回放', 1, strftime('%s','now')),
  ('tile_autolabs_3', 'p_autolabs', '门禁判定', 'growing', '实验过不过由判定说了算', 2, strftime('%s','now')),
  ('tile_autolabs_4', 'p_autolabs', 'SOTA 账本', 'growing', '谁把记录改写了，留一条账', 3, strftime('%s','now')),
  ('tile_autolabs_5', 'p_autolabs', '数据集钉版本', 'growing', '项目对数据集的版本钉住', 4, strftime('%s','now')),
  ('tile_autolabs_6', 'p_autolabs', '执行交给 Cybion', 'growing', '跑实验的线程在用户自己的机器上', 5, strftime('%s','now'));

-- p_midas
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"users","note":"用户"},{"name":"evm_networks","note":"支持的一条 EVM 链"},{"name":"supported_assets","note":"链上支持的一种资产"},{"name":"wallet_addresses","note":"用户的充值地址"},{"name":"wallet_private_keys","note":"地址对应的私钥，加密存"},{"name":"deposits","note":"一笔链上充值"},{"name":"deposit_sweeps","note":"把散地址的钱归集到一处"},{"name":"withdrawals","note":"一笔提现"},{"name":"internal_transfers","note":"站内转账"},{"name":"ledger_entries","note":"美元账本：每一笔都带变动前后"},{"name":"payment_agreements","note":"一份支付协议：谁按期扣谁的钱"},{"name":"payment_agreement_charges","note":"协议的一次扣款"},{"name":"payment_agreement_payouts","note":"扣款之后的结算"},{"name":"address_book_entries","note":"地址簿里的一个地址"}],"relations":[{"from":"evm_networks","to":"supported_assets","cardinality":"one-to-many"},{"from":"evm_networks","to":"wallet_addresses","cardinality":"one-to-many"},{"from":"users","to":"wallet_addresses","cardinality":"one-to-many"},{"from":"wallet_addresses","to":"wallet_private_keys","cardinality":"one-to-one"},{"from":"wallet_addresses","to":"deposits","cardinality":"one-to-many"},{"from":"users","to":"deposits","cardinality":"one-to-many"},{"from":"deposits","to":"deposit_sweeps","cardinality":"one-to-many"},{"from":"users","to":"withdrawals","cardinality":"one-to-many"},{"from":"users","to":"ledger_entries","cardinality":"one-to-many"},{"from":"users","to":"internal_transfers","cardinality":"one-to-many"},{"from":"users","to":"payment_agreements","cardinality":"one-to-many"},{"from":"payment_agreements","to":"payment_agreement_charges","cardinality":"one-to-many"},{"from":"payment_agreement_charges","to":"payment_agreement_payouts","cardinality":"one-to-many"},{"from":"users","to":"address_book_entries","cardinality":"one-to-many"}]}' WHERE id = 'p_midas';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_midas_1', 'p_midas', '美元账本', 'growing', '纳美元记账，每笔带 pre 与 post 余额', 0, strftime('%s','now')),
  ('tile_midas_2', 'p_midas', '链上充值发现', 'growing', '扫地址发现充值，再归集', 1, strftime('%s','now')),
  ('tile_midas_3', 'p_midas', '提现', 'growing', '提现与账本流水一起落库', 2, strftime('%s','now')),
  ('tile_midas_4', 'p_midas', '站内转账', 'growing', '两个用户之间转，双边流水', 3, strftime('%s','now')),
  ('tile_midas_5', 'p_midas', '支付协议扣款', 'growing', '按期扣款并结算给收款方', 4, strftime('%s','now')),
  ('tile_midas_6', 'p_midas', '地址簿', 'growing', '常用地址记下来，提现时选', 5, strftime('%s','now'));

-- p_hit
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"traders","note":"一个交易执行器实例"},{"name":"credentials","note":"交易所与模型的凭证"},{"name":"signal_history","note":"交易意图的历史"},{"name":"trader_runs","note":"执行器的一次运行"},{"name":"samples","note":"执行样本"},{"name":"linkit_settings","note":"与 Linkit 的对接设置"}],"relations":[{"from":"credentials","to":"traders","cardinality":"one-to-many"},{"from":"traders","to":"signal_history","cardinality":"one-to-many"},{"from":"traders","to":"trader_runs","cardinality":"one-to-many"},{"from":"traders","to":"linkit_settings","cardinality":"one-to-one"}]}' WHERE id = 'p_hit';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_hit_1', 'p_hit', '交易意图接收', 'growing', '按模型给的意图下单', 0, strftime('%s','now')),
  ('tile_hit_2', 'p_hit', '执行器运行', 'growing', '一次运行一份记录', 1, strftime('%s','now')),
  ('tile_hit_3', 'p_hit', '信号历史', 'growing', '每个执行器的意图都留档', 2, strftime('%s','now')),
  ('tile_hit_4', 'p_hit', '目标杠杆状态', 'growing', 'OKX 永续的目标杠杆按账户记', 3, strftime('%s','now')),
  ('tile_hit_5', 'p_hit', 'Linkit 对接', 'growing', '状态推回聊天里', 4, strftime('%s','now'));

-- p_lol_live
UPDATE products SET skeleton = '{"version":1,"tables":[],"relations":[]}' WHERE id = 'p_lol_live';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_lol_live_1', 'p_lol_live', '数据源接入', 'growing', '独立订阅 GRID Hub 与 PolyMarket，不二次 relay', 0, strftime('%s','now')),
  ('tile_lol_live_2', 'p_lol_live', '实时可回放看板', 'growing', '信息尽可能丰富，为审计与回放保留', 1, strftime('%s','now')),
  ('tile_lol_live_3', 'p_lol_live', '授权名单', 'growing', 'root 管谁能看', 2, strftime('%s','now')),
  ('tile_lol_live_4', 'p_lol_live', '关注账户回放', 'growing', '公开账户的活动与持仓，只读', 3, strftime('%s','now')),
  ('tile_lol_live_5', 'p_lol_live', '关键事件语音播报', 'growing', '浏览器本机语音，跟随播放头', 4, strftime('%s','now')),
  ('tile_lol_live_6', 'p_lol_live', '手动下单面板', 'growing', '浏览器端签名，凭据只存本标签页', 5, strftime('%s','now'));

-- p_pmr
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"subscriptions","note":"一个订阅：盯哪个赛事"},{"name":"events","note":"赛事元数据"},{"name":"event_tokens","note":"赛事下的可交易代币与市场"},{"name":"recordings","note":"一天的录制产物与归档位置"},{"name":"users","note":"授权查看的用户"}],"relations":[{"from":"subscriptions","to":"events","cardinality":"one-to-one"},{"from":"subscriptions","to":"event_tokens","cardinality":"one-to-many"},{"from":"subscriptions","to":"recordings","cardinality":"one-to-many"}]}' WHERE id = 'p_pmr';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_pmr_1', 'p_pmr', '订阅赛事与代币', 'growing', '一个赛事下挂多个市场', 0, strftime('%s','now')),
  ('tile_pmr_2', 'p_pmr', '逐笔盘口录制', 'growing', '逐条 JSONL，只读不碰密钥', 1, strftime('%s','now')),
  ('tile_pmr_3', 'p_pmr', '转 Parquet 归档', 'growing', '盘口结束转 Parquet 再进 S3', 2, strftime('%s','now')),
  ('tile_pmr_4', 'p_pmr', '网页下载', 'growing', '归档之后从网页取回', 3, strftime('%s','now'));

-- p_lol_recorder
UPDATE products SET skeleton = '{"version":1,"tables":[{"name":"sessions","note":"一场对局的中继会话"},{"name":"gaps","note":"会话中间断掉的一段"},{"name":"settings","note":"服务端设置"},{"name":"users","note":"授权查看的用户"}],"relations":[{"from":"sessions","to":"gaps","cardinality":"one-to-many"}]}' WHERE id = 'p_lol_recorder';
INSERT INTO flesh_tiles (id, product_id, name, state, note, slot, created_at) VALUES
  ('tile_lol_recorder_1', 'p_lol_recorder', '中继会话录制', 'growing', 'GRID Hub 中继的全部数据逐行落库', 0, strftime('%s','now')),
  ('tile_lol_recorder_2', 'p_lol_recorder', '断档记录', 'growing', '断了就记一段，复盘时看得见', 1, strftime('%s','now')),
  ('tile_lol_recorder_3', 'p_lol_recorder', '复盘下载', 'growing', '按会话取回原始行', 2, strftime('%s','now'));
