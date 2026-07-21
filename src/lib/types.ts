export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  section_id: number;
  created_at: string;
};

export type Section = {
  id: number;
  name: string;
  sort_order: number;
};

export type SiteSettings = {
  store_name: string;
  tagline: string;
  products_page_title: string;
  products_page_subtitle: string;
  footer_text: string;
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  hero_image_url: string;
  about_title: string;
  about_text: string;
  contact_email: string;
  contact_phone: string;
  testimonial_1_name: string;
  testimonial_1_text: string;
  testimonial_2_name: string;
  testimonial_2_text: string;
  testimonial_3_name: string;
  testimonial_3_text: string;
  btc_wallet_address: string;
  btc_payment_enabled: boolean;
};

export type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_address: string;
  customer_city: string;
  customer_zip: string;
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
};

export type SectionWithProducts = Section & {
  products: Product[];
};
