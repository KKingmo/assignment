import { PromoBanner } from "@/components/home/promo-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Suspense } from "react";
import { BookCatalog } from "@/features/books/ui/book-catalog";
import { BookGridSkeleton } from "@/features/books/ui/book-grid-skeleton";
import { CatalogToolbar } from "@/features/books/ui/catalog-toolbar";
import styles from "@/features/books/ui/catalog.module.css";

export default function StorePage() {
  return (
    <>
      <a className="skip-link" href="#catalog">교재 목록으로 바로가기</a>
      <SiteHeader />
      <main>
        <h1 className="sr-only">교재 스토어</h1>
        <PromoBanner />
        <section id="catalog" className={`container ${styles.catalog}`} aria-label="교재 스토어" tabIndex={-1}>
          <CatalogToolbar />
          <Suspense fallback={<BookGridSkeleton />}>
            <BookCatalog />
          </Suspense>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
