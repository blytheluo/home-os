const pillars = [
  {
    title: '装修期控场',
    desc: '记录每一个决定、报价、交付节点，避免信息散落在聊天记录里。',
  },
  {
    title: '入住后继续用',
    desc: '把家变成长期系统，而不是只在装修时热闹一次的项目。',
  },
  {
    title: '一个页面就能看懂',
    desc: '预算、清单、进度、维护和灵感都在同一套语言里。',
  },
];

const upcoming = [
  '装修时间线',
  '预算与付款',
  '材料 / 家具清单',
  '收纳与维护',
  '入住后年度盘点',
];

function App() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">HOME OS / 新家</p>
          <h1>把装修一年和入住后的生活，放进同一个系统里。</h1>
          <p className="lead">
            这是《新家》的第一版骨架。先搭一个能长期扩展的首页，再逐步接入装修记录、清单、维护和家庭协作。
          </p>

          <div className="hero__actions">
            <a href="#roadmap" className="button button--primary">
              看看接下来做什么
            </a>
            <a href="#principles" className="button button--secondary">
              先看设计原则
            </a>
          </div>
        </div>

        <aside className="hero__panel">
          <div className="status-card">
            <span className="status-card__label">当前阶段</span>
            <strong>基础结构已建立</strong>
            <p>React + Vite + GitHub Pages 的起点版本。</p>
          </div>

          <div className="metric-grid">
            <div className="metric">
              <span>1</span>
              <p>主页</p>
            </div>
            <div className="metric">
              <span>3</span>
              <p>核心原则</p>
            </div>
            <div className="metric">
              <span>5</span>
              <p>首批模块</p>
            </div>
            <div className="metric">
              <span>0</span>
              <p>复杂功能负担</p>
            </div>
          </div>
        </aside>
      </section>

      <section id="principles" className="section">
        <div className="section__heading">
          <p className="eyebrow">Design Principles</p>
          <h2>先做清晰，再做完整。</h2>
        </div>

        <div className="card-grid">
          {pillars.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="roadmap" className="section section--split">
        <div className="section__heading">
          <p className="eyebrow">Roadmap</p>
          <h2>下一步只补最有用的东西。</h2>
        </div>

        <div className="roadmap">
          {upcoming.map((item, index) => (
            <div className="roadmap__item" key={item}>
              <span className="roadmap__index">0{index + 1}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
