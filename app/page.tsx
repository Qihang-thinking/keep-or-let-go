import Link from "next/link";

export default function Home() {
  return (
    <main className="homePage">
      <section className="homeCover">
        <header className="homeMasthead">
          <span>留不留</span>
          <em>|</em>
          <strong>PERSONAL FIT REVIEW</strong>
        </header>

        <section className="homeHero">
          <p className="homeEyebrow">KEEP OR LET GO</p>
          <h1>
            这件衣服，
            <br />
            到底要不要留？
          </h1>
          <p>
            上传试穿照或单品图，从版型、比例、搭配空间与保留价值，为你写一份属于自己的 FIT REVIEW。
          </p>
          <Link className="homeCta" href="/decision-helper?reset=1">
            <span>开始判断一件衣服</span>
            <em>→</em>
          </Link>
        </section>

        <section className="homeEditorialPanel" aria-label="判断维度">
          <div className="homeIssueRow">
            <span>No.0617</span>
            <span>WARDROBE EDIT</span>
          </div>

          <div className="homeKeywordStack">
            <div>
              <em>01</em>
              <strong>FIT</strong>
              <span>适不适合</span>
            </div>
            <div>
              <em>02</em>
              <strong>KEEP</strong>
              <span>值不值得留</span>
            </div>
            <div>
              <em>03</em>
              <strong>STYLE</strong>
              <span>能不能搭好</span>
            </div>
          </div>
        </section>

        <p className="homeFooterLine">UPLOAD · REVIEW · DECIDE</p>
      </section>
    </main>
  );
}