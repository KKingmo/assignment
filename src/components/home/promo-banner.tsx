"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { Icon, type IconName } from "../ui/icon";
import { IconButton } from "../ui/icon-button";
import { SLIDE_DURATION_MS, useBannerCarousel } from "./use-banner-carousel";
import styles from "./promo-banner.module.css";

const highlights: { icon: IconName; title: string; description: string }[] = [
  { icon: "crosshair", title: "실전 적중", description: "출제 경향을 꿰뚫는 문제" },
  { icon: "chart-bar", title: "난이도별 구성", description: "단계별로 완성하는 실력" },
  { icon: "trophy", title: "검증된 결과", description: "합격생이 증명한 선택" },
];

function PromoSlide({ active }: { active: boolean }) {
  return (
    <div className={`container ${styles.inner}`}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>HIDDEN KICE <span aria-hidden="true">—</span></p>
        <h2 id={active ? "promo-title" : undefined}>히든카이스</h2>
        <p className={styles.headline}>모두가 푸는 건<br className={styles.tabletBreak} /> 이유가 있습니다</p>
        <p className={styles.description}>상위권이 선택한 문제집, 결과로 증명된 실전 대비서</p>
        <ul className={styles.highlights}>
          {highlights.map(({ icon, title, description }) => (
            <li key={title}>
              <span className={styles.highlightMark}><Icon name={icon} /></span>
              <div><strong>{title}</strong><span>{description}</span></div>
            </li>
          ))}
        </ul>
        <a href="#catalog" className={styles.cta}>
          히든카이스 시리즈 보기 <Icon name="arrow-right" />
        </a>
      </div>
      <div className={styles.artwork}>
        <Image src="/images/banners/banner.webp" alt="" fill sizes="(max-width: 767px) 220vw, (max-width: 1199px) 155vw, 1760px" preload={active} />
      </div>
    </div>
  );
}

export function PromoBanner() {
  const carousel = useBannerCarousel();

  return (
    <section
      className={styles.banner}
      aria-labelledby="promo-title"
      aria-roledescription="캐러셀"
      style={{ "--slide-direction": carousel.direction, "--slide-duration": `${SLIDE_DURATION_MS}ms` } as CSSProperties}
      onMouseEnter={() => carousel.setHovered(true)}
      onMouseLeave={() => carousel.setHovered(false)}
      onFocusCapture={() => carousel.setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) carousel.setFocused(false);
      }}
    >
      <div className={styles.viewport}>
        {carousel.moving ? (
          <div key={`outgoing-${carousel.previous}`} className={`${styles.slide} ${styles.outgoing}`} aria-hidden="true" inert>
            <PromoSlide active={false} />
          </div>
        ) : null}
        <div
          key={`active-${carousel.index}`}
          className={`${styles.slide} ${carousel.moving ? styles.incoming : ""}`}
          role="group"
          aria-roledescription="슬라이드"
          aria-label={`${carousel.count}개 중 ${carousel.index + 1}번째`}
          onAnimationEnd={(event) => { if (event.target === event.currentTarget) carousel.finish(); }}
        >
          <PromoSlide active />
        </div>
      </div>
      <div className={`container ${styles.controlRow}`}>
        <div className={styles.controls} role="group" aria-label="배너 조작">
          <IconButton icon="caret-left" label="이전 배너" size="sm" aria-disabled={carousel.moving} onClick={() => carousel.move(-1)} />
          <span className={styles.counter} aria-live={carousel.playing ? "off" : "polite"} aria-atomic="true">
            <span className="sr-only">배너 {carousel.count}개 중 {carousel.index + 1}번째</span>
            <span aria-hidden="true"><strong>{carousel.index + 1}</strong> / {carousel.count}</span>
          </span>
          <IconButton icon="caret-right" label="다음 배너" size="sm" aria-disabled={carousel.moving} onClick={() => carousel.move(1)} />
          <IconButton icon={carousel.enabled ? "pause" : "play"} label={carousel.enabled ? "배너 자동 재생 정지" : "배너 자동 재생 시작"} size="sm" onClick={carousel.toggle} />
        </div>
      </div>
    </section>
  );
}
