import { PromoBanner } from "@/components/home/promo-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Suspense } from "react";
import { BookCatalog } from "@/features/books/ui/book-catalog";
import { BookGridSkeleton } from "@/features/books/ui/book-grid-skeleton";
import { CatalogToolbar } from "@/features/books/ui/catalog-toolbar";
import { parseCatalogParams } from "@/features/books/model/catalog-params";
import { getCatalogMetadata } from "@/features/books/model/catalog-seo";
import { getSiteSeo } from "@/lib/seo/site";
import styles from "@/features/books/ui/catalog.module.css";

export async function generateMetadata({ searchParams }: PageProps<"/">) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (value !== undefined) search.set(key, Array.isArray(value) ? value[0] : value);
  }
  return getCatalogMetadata(parseCatalogParams(search), getSiteSeo());
}

export default async function StorePage({ searchParams }: PageProps<"/">) {
  // URL 메타데이터가 준비된 문서를 반환하며 상품은 브라우저에서만 조회한다.
  await searchParams;
  return (
    <>
      <a className="skip-link" href="#catalog">교재 목록으로 바로가기</a>
      <SiteHeader />
      <main>
        <h1 className="sr-only">교재 스토어</h1>
        <PromoBanner />
        <section id="catalog" className={`container ${styles.catalog}`} aria-label="교재 스토어" tabIndex={-1}>
          <Suspense fallback={<><CatalogToolbar disabled /><BookGridSkeleton /></>}>
            <BookCatalog site={getSiteSeo()} />
          </Suspense>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
