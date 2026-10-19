import { IconButton } from "../ui/icon-button";
import { CartButton } from "@/features/cart/ui/cart-button";
import styles from "./layout.module.css";

const menuItems = ["스토어", "AI OMR WORK", "챌린지", "히든카이스 소개"];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <span className={styles.logo} aria-label="히든카이스">HIDDEN KICE</span>
        <nav className={styles.navigation} aria-label="주 메뉴">
          {menuItems.map((item, index) => (
            <button
              type="button"
              key={item}
              className={styles.menuItem}
              aria-current={index === 0 ? "page" : undefined}
              aria-disabled="true"
            >
              {item}
            </button>
          ))}
        </nav>
        <div className={styles.actions}>
          <CartButton />
          <IconButton icon="bell" label="알림" aria-disabled="true" />
          <IconButton icon="user" label="내 계정" aria-disabled="true" />
        </div>
      </div>
    </header>
  );
}
