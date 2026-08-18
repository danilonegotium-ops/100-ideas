export interface Widget {
  id: string;
  owner_id: string;
  question: string;
  created_at: string;
}

export interface WidgetResponse {
  id: string;
  widget_id: string;
  answer: boolean;
  page_url: string | null;
  created_at: string;
}
