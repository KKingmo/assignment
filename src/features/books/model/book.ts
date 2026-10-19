export type BookKind = "single" | "pass";

export type Book = {
  id: string;
  title: string;
  kind: BookKind;
  coverPath: string;
  listPrice: number;
  salePrice: number | null;
};
