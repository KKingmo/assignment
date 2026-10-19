import Image from "next/image";
import { Badge } from "../ui/badge";
import { Icon } from "../ui/icon";
import styles from "./promo-banner.module.css";

const highlights = [
  ["실전 적중", "출제 경향을 꿰뚫는 문제"],
  ["난이도별 구성", "단계별로 완성하는 실력"],
  ["검증된 결과", "합격생이 증명한 선택"],
];

export function PromoBanner() {
  return (
    <section className={styles.banner} aria-labelledby="promo-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>HIDDEN KICE <span aria-hidden="true">—</span></p>
          <h2 id="promo-title">히든카이스</h2>
          <p className={styles.headline}>모두가 푸는 건 이유가 있습니다</p>
          <p className={styles.description}>상위권이 선택한 문제집, 결과로 증명된 실전 대비서</p>
          <ul className={styles.highlights}>
            {highlights.map(([title, description], index) => (
              <li key={title}>
                <span className={styles.highlightMark} aria-hidden="true">{["◎", "▥", "♧"][index]}</span>
                <div><strong>{title}</strong><span>{description}</span></div>
              </li>
            ))}
          </ul>
          <a href="#catalog" className={styles.cta}>
            히든카이스 시리즈 보기 <Icon name="caret-right" size="sm" />
          </a>
        </div>
        <div className={styles.artwork} aria-hidden="true">
          {["front", "middle", "back"].map((position) => (
            <div className={`${styles.book} ${styles[position]}`} key={position}>
              <Image
                src="/images/books/hidden-kice-book-single.webp"
                alt=""
                width={532}
                height={710}
                sizes="(max-width: 767px) 220px, 340px"
                loading="eager"
              />
            </div>
          ))}
          <div className={styles.podium} />
        </div>
      </div>
      <Badge tone="inverse" className={styles.counter} aria-label="배너 5개 중 1번째">1 / 5</Badge>
    </section>
  );
}
