export type IsoDate = string;

export interface DateTreeMonth {
  month: number;
  days: IsoDate[];
}

export interface DateTreeYear {
  year: number;
  months: DateTreeMonth[];
}

export interface DateTreeResponse {
  years: DateTreeYear[];
}

export interface ArticleListItem {
  id: number | null;
  title: string;
  link: string;
  publishedDate: IsoDate;
  sourceName: string;
}

export interface ArticleListResponse {
  date: string;
  totalCount: number;
  uniqueCount: number;
  offset: number;
  size: number;
  hasNext: boolean;
  items: ArticleListItem[];
  nextCursor: string | null;
}

export interface ArticleDetail {
  id: number;
  title: string;
  link: string;
  summary: string | null;
  sentiment: string | null;
}
