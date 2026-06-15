import Link from "next/link";

export default function Home() {
  return (
    <main className="homePage">
      <div className="homePattern" />

      <section className="heroPanel">
        <div className="heroBadge">留不留 · Keep or Let Go</div>

        <h1 className="heroTitle">
          别再对着
          <br />
          一件衣服纠结
        </h1>

        <p className="heroText">
          上传一张试穿照或衣服图。AI 会帮你判断它适不适合、值不值得留，
          以及可以怎么搭。
        </p>

        <Link className="heroButton" href="/decision-helper?reset=1">
          开始判断一件衣服
        </Link>

        <div className="heroTags">
          <span>留不留</span>
          <span>适合度</span>
          <span>怎么搭</span>
        </div>

        <div className="heroFlow">
          <span>上传图片</span>
          <i />
          <span>选择问题</span>
          <i />
          <span>得到建议</span>
        </div>

        <p className="heroNote">
          它不替你做决定，只帮你看清：适不适合、值不值得留，以及能不能搭好。
        </p>
      </section>
    </main>
  );
}