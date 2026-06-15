import Link from "next/link";

const useCases = ["留不留", "适合度", "怎么搭"];

const steps = [
  {
    number: "01",
    title: "上传一张图",
    text: "试穿照最准，商品图和平铺图也可以。",
  },
  {
    number: "02",
    title: "选择问题",
    text: "判断要不要留下、适不适合你，或者怎么搭。",
  },
  {
    number: "03",
    title: "得到建议",
    text: "看到结论、理由、风险点和搭配方向。",
  },
];

const highlights = ["看图判断", "给出理由", "搭配方向"];

export default function Home() {
  return (
    <main className="homePage">
      <section className="homeHero" aria-label="留不留首页介绍">
        <div className="homeHeroCopy">
          <div className="homeBadge">留不留 · 单件衣服判断</div>

          <h1 className="homeTitle">别再对着一件衣服纠结</h1>

          <p className="homeSubtitle">
            上传一张试穿照或衣服图。AI 会帮你判断它是否适合、值不值得留，以及可以怎么搭。
          </p>

          <div className="homeActions">
            <Link className="homeCta" href="/decision-helper?reset=1">
              开始判断一件衣服
            </Link>

            <p>只填图片、判断目的和单品类型，也能快速生成结果。</p>
          </div>

          <div className="homeUseCases" aria-label="适用场景">
            {useCases.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="homePreviewCard" aria-label="产品结果预览">
          <div className="homePreviewTop">
            <span>示例报告</span>
            <strong>AI 判断中</strong>
          </div>

          <div className="homePreviewImage">
            <div className="homeMockPhoto">
              <span>试穿照 / 商品图</span>
              <strong>先看清这件衣服</strong>
              <p>版型、颜色、长度、材质和整体比例。</p>
            </div>
          </div>

          <div className="homePreviewResult">
            <span>示例结论</span>
            <strong>适合度偏高</strong>
            <p>适合留下，但需要注意搭配门槛和闲置风险。</p>
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
        <span>
          它只是帮你看清：哪里不对劲，为什么喜欢，以及它是否真的适合你。
        </span>
      </section>
    </main>
  );
}