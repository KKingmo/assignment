import styles from "./layout.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <ul className={styles.footerMenu} aria-label="회사 및 이용 안내">
          <li>회사소개</li>
          <li>이용약관</li>
          <li>개인정보처리방침</li>
        </ul>
        <p>
          <span>(주)히든카이스</span><span>대표: 안영호</span>
          <span>사업자등록번호: 735-87-02522 (사업자정보확인)</span>
        </p>
        <p>
          <span>주소: 경기도 고양시 일산서구 일현로 97-11, 56F</span>
          <span>통신판매업신고: 제 2024-고양일산서-1209</span>
          <span>이메일: Hidden_kice@naver.com</span>
        </p>
        <p className={styles.copyright}>Copyright © 2026 히든카이스. All rights reserved.</p>
      </div>
    </footer>
  );
}
