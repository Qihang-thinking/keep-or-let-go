import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.homePage}>
      <section className={styles.homeCover}>
        <header className={styles.homeMasthead}>
          <span>留不留</span>
          <em>|</em>
          <strong>PERSONAL FIT REVIEW</strong>
        </header>

        <section className={styles.homeHero}>
          <p className={styles.homeEyebrow}>KEEP OR LET GO</p>
          <h1>
            别再为了一件衣服
            <br />
            <span>反复纠结</span>
          </h1>
          <p>
            上传试穿照或单品图，从版型、比例、搭配空间与保留价值，帮你看清它适不适合、值不值得留、还能怎么搭。
          </p>
          <Link className={styles.homeCta} href="/decision-helper?reset=1">
            <span>开始判断一件衣服</span>
            <em>→</em>
          </Link>
        </section>

        <section className={styles.homeEditorialPanel} aria-label="判断维度">
          <div className={styles.homeIssueRow}>
            <span>No.0617</span>
            <span>WARDROBE EDIT</span>
          </div>

          <div className={styles.homeKeywordStack}>
            <div>
              <em>01</em>
              <strong>适合度</strong>
              <span>FIT</span>
            </div>
            <div>
              <em>02</em>
              <strong>保留价值</strong>
              <span>KEEP</span>
            </div>
            <div>
              <em>03</em>
              <strong>搭配空间</strong>
              <span>STYLE</span>
            </div>
          </div>
        </section>

        <p className={styles.homeFooterLine}>上传图片 · 得到建议 · 做出决定</p>
      </section>
    </main>
  );
}
