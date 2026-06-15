import Link from "next/link";

const useCases = ["留不留", "今天穿不穿", "怎么搭", "适不适合我"];

const steps = [
  {
    number: "01",
    title: "上传一张图",
    text: "试穿照、商品图或衣柜单品图都可以，尽量让版型、长度和比例清楚。",
  },
  {
    number: "02",
    title: "选择判断目的",
    text: "告诉我你想判断留不留、今天穿不穿、适不适合你，还是怎么搭。",
  },
  {
    number: "03",
    title: "获得具体建议",
    text: "看到结论、图片依据、风险提醒、搭配方向和下一步建议。",
  },
];

const highlights = ["快速判断", "图片依据", "搭配建议"];

export default function Home() {
  return (
    <main className="homePage">
      <section className="homeHero" aria-label="留不留首页介绍">
        <div className="homeHeroCopy">
          <div className="homeBadge">留不留 · 单件衣服判断</div>

          <h1 className="homeTitle">别再对着一件衣服纠结</h1>

          <p className="homeSubtitle">
            上传试穿照或衣服照片，选择你想判断的问题。AI 会结合图片、场景和穿着感受，帮你看清它适不适合你、怎么穿更好。
          </p>

          <div className="homeActions">
            <Link className="homeCta" href="/decision-helper?reset=1">
              开始判断一件衣服
            </Link>
            <p>只需要图片、判断目的和单品类型，也可以快速生成结果。</p>
          </div>

          <div className="homeUseCases" aria-label="适用场景">
            {useCases.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="homePreviewCard" aria-label="产品结果预览">
          <div className="homePreviewTop">
            <span>Quick report</span>
            <strong>AI 判断中</strong>
          </div>
          <div className="homePreviewImage">
            <div />
          </div>
          <div className="homePreviewResult">
            <span>最终倾向</span>
            <strong>有条件适合</strong>
            <p>保留亮点，同时看清闲置风险和搭配门槛。</p>
          </div>
          <div className="homePreviewTags">
            {highlights.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="homeSteps" aria-label="使用步骤">
        {steps.map((step) => (
          <article className="homeStepCard" key={step.number}>
            <span>{step.number}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="homePrinciple">
        <strong>不是替你决定审美。</strong>
        <span>它只是帮你看清：哪里不对劲，为什么喜欢，以及它是否真的适合你。</span>
      </section>
    </main>
  );
}
