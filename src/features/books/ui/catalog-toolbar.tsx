"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { TextField } from "@/components/ui/text-field";
import styles from "./catalog.module.css";
import { DEFAULT_CATALOG_PARAMS, MAX_QUERY_LENGTH, normalizeQuery, type CatalogParams, type CatalogChange } from "../model/catalog-params";

type CatalogToolbarProps = {
  params?: CatalogParams;
  search?: string;
  disabled?: boolean;
  onChange?: (change: CatalogChange) => void;
};

export function CatalogToolbar({ params = DEFAULT_CATALOG_PARAMS, search = "", disabled = false, onChange }: CatalogToolbarProps) {
  const form = useRef<HTMLFormElement>(null);
  const [input, setInput] = useState({ search, draftSearch: search, draft: params.query });
  // URL 변경 이후 입력한 초안은 지연된 라우터 렌더링이 덮지 않도록 보존한다.
  if (input.search !== search) setInput({ search, draftSearch: search, draft: input.draftSearch === search ? input.draft : params.query });

  function setDraft(draft: string) {
    setInput({ search, draftSearch: new URLSearchParams(window.location.search).toString(), draft });
  }

  function clearSearch() {
    onChange?.({ type: "search", query: "" });
    setDraft("");
    const field = form.current?.elements.namedItem("q");
    if (field instanceof HTMLInputElement) field.focus();
  }

  return (
    <form ref={form} role="search" aria-label="교재 검색 조건" className={styles.toolbar} onSubmit={(event) => {
      event.preventDefault();
      const query = normalizeQuery(input.draft);
      onChange?.({ type: "search", query });
      setDraft(query);
    }}>
      <TextField
        id="book-search"
        name="q"
        label="교재 검색"
        placeholder="검색"
        value={input.draft}
        disabled={disabled}
        maxLength={MAX_QUERY_LENGTH}
        autoComplete="off"
        enterKeyHint="search"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
        }}
        className={styles.search}
        leading={<IconButton label="검색 실행" type="submit" icon="search" size="sm" disabled={disabled} />}
        trailing={<IconButton label="검색어 초기화" icon="close" size="sm" disabled={disabled} onClick={clearSearch} />}
      />
      <div className={styles.filters} role="group" aria-label="교재 분류">
        {([ ["all", "전체"], ["pass", "패스"], ["single", "단품"] ] as const).map(([kind, label]) => (
          <Button variant="ghost" aria-pressed={params.kind === kind} disabled={disabled} key={kind} onClick={() => onChange?.({ type: "kind", kind })}>
            {label}
          </Button>
        ))}
      </div>
    </form>
  );
}
