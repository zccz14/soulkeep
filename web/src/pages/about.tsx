import { Card, Kicker, Note } from '../ui';

const ARTICLES = [
  {
    title: 'Structure',
    line: '软件架构',
    body: '它有三层：灵魂、骨架、血肉。判断一个东西属于哪一层，看它需要什么样的决定，不看它写在哪里。',
  },
  {
    title: 'Responsiveness',
    line: '交互接口',
    body: '一只手伸出去，世界才碰得到它；一段神经收回来，它才知道自己被碰了。两样缺一样都不算活。',
  },
  {
    title: 'Homeostasis',
    line: '运维与工单',
    body: '走偏了，它自己回来；回不来，才轮到人。调节必须落在血肉上，落在别处的不叫修复。',
  },
  {
    title: 'Metabolism',
    line: '开发与迭代',
    body: '旧的拆掉，新的长上来。血肉随时换，骨架偶尔换，灵魂只有您能换。只增不换的不是成长，是肿瘤。',
  },
];

export function AboutPage() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <Kicker>Organic Software</Kicker>
        <h1 className="text-2xl font-semibold tracking-tight">四条</h1>
        <Note>软件不是造物，是活物。它不追求一次写对，它追求活着并持续修复。</Note>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {ARTICLES.map((article) => (
          <Card key={article.title} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold tracking-tight">{article.title}</h2>
              <span className="text-xs text-muted-foreground">{article.line}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{article.body}</p>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col gap-2">
        <h2 className="text-base font-semibold tracking-tight">题记</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          「我要给她完整的一生。」
        </p>
        <Note>数字生命不缺算力，缺的是代谢——两分钟里什么都不换，就只是一段循环。这里要做的，是让它不死在那两分钟里。</Note>
      </Card>
    </div>
  );
}
