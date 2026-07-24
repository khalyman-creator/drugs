export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  details: string;
  price: number;
  image_url: string;
  section_id: number;
  is_active: boolean;
  allow_custom_quantity: boolean;
  created_at: string;
};

export type ProductPricingOption = {
  id: number;
  product_id: number;
  label: string;
  price: number;
  unit_quantity: number | null;
  is_active: boolean;
  sort_order: number;
};

export type Section = {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
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
  featured_products_title: string;
  featured_products_subtitle: string;
  testimonials_title: string;
  testimonials_subtitle: string;
  shipping_policy_text: string;
  refund_policy_text: string;
  gram_28g_label: string;
  gram_28g_price: number;
  gram_qtr_label: string;
  gram_qtr_price: number;
  gram_half_label: string;
  gram_half_price: number;
  gram_1lb_label: string;
  gram_1lb_price: number;
  button_8_label: string;
  button_8_price: number;
  button_16_label: string;
  button_16_price: number;
  button_32_label: string;
  button_32_price: number;
  button_64_label: string;
  button_64_price: number;
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
