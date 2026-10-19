"use client";

import Image from "next/image";
import { Icon, type IconName } from "../ui/icon";
import { IconButton } from "../ui/icon-button";
import { useBannerCarousel } from "./use-banner-carousel";
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
        <a href="#catalog" className={styles.cta} data-carousel-cta>
          히든카이스 시리즈 보기 <Icon name="arrow-right" />
        </a>
      </div>
      <div className={styles.artwork}>
        <Image src="/images/banners/banner.webp" alt="" fill sizes="(max-width: 767px) 220vw, (max-width: 1199px) 155vw, 1760px" preload={active} draggable={false} />
      </div>
    </div>
  );
}

export function PromoBanner() {
  const {
    attachViewport, index: activeIndex, count, enabled, playing, swiping,
    setHovered, setFocused, move, trackControlDrag, cancelSwipe, toggle,
  } = useBannerCarousel();

  return (
    <section
      ref={attachViewport}
      className={styles.banner}
      aria-labelledby="promo-title"
      aria-roledescription="캐러셀"
      data-swiping={swiping}
      onPointerMoveCapture={trackControlDrag}
      onTouchCancelCapture={cancelSwipe}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") setHovered(false); }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className={styles.track}>
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className={styles.slide}
            role="group"
            aria-roledescription="슬라이드"
            aria-label={`${count}개 중 ${index + 1}번째`}
            aria-hidden={index !== activeIndex}
            inert={index !== activeIndex}
          >
            <PromoSlide active={index === activeIndex} />
          </div>
        ))}
      </div>
      <div className={styles.controlRow}>
        <div className={styles.controls} role="group" aria-label="배너 조작">
          <IconButton icon="caret-left" label="이전 배너" size="sm" onClick={() => move(-1)} />
          <span className={styles.counter} aria-live={playing ? "off" : "polite"} aria-atomic="true">
            <span className="sr-only">배너 {count}개 중 {activeIndex + 1}번째</span>
            <span aria-hidden="true"><strong>{activeIndex + 1}</strong> / {count}</span>
          </span>
          <IconButton icon="caret-right" label="다음 배너" size="sm" onClick={() => move(1)} />
          <IconButton icon={enabled ? "pause" : "play"} label={enabled ? "배너 자동 재생 정지" : "배너 자동 재생 시작"} size="sm" onClick={toggle} />
        </div>
      </div>
    </section>
  );
}
