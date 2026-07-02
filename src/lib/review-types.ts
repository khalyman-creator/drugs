export type Review = {
  id: number;
  product_id: number;
  author_name: string;
  rating: number;
  text: string;
  avatar_url: string;
  verified: boolean;
  created_at: string;
};

export type ReviewSummary = {
  average: number;
  count: number;
};
