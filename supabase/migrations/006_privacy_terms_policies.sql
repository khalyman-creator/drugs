-- Adds dashboard-editable Privacy Policy and Terms of Service pages.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS privacy_policy_text TEXT NOT NULL DEFAULT '## What we collect
When you place an order or contact us, we collect your name, email, shipping address, and phone number (if provided). Payments are processed by NOWPayments — we never see or store your card details or wallet private keys.

## How we use it
We use your information to process orders, send confirmation and shipping emails, and respond to support requests. We do not sell or rent your information to third parties.

## Cookies
We use essential cookies only, to keep your cart and session working. We do not use third-party advertising or tracking cookies.

## Data retention
We keep order records for as long as needed for accounting, customer support, and legal requirements.

## Your rights
You can request a copy of the information we hold about you, or ask us to delete it, by reaching out via the contact page.

## Changes to this policy
We may update this policy from time to time. Changes take effect as soon as they''re posted here.',
  ADD COLUMN IF NOT EXISTS terms_of_service_text TEXT NOT NULL DEFAULT '## Acceptance of terms
By using this site or placing an order, you agree to these terms.

## Products & pricing
We reserve the right to correct pricing errors, update product availability, and change prices at any time without notice.

## Orders & payment
An order is confirmed once payment is received and verified. Cryptocurrency payments are processed via NOWPayments — once a crypto transaction is sent, it cannot be reversed, so please confirm your order details before paying.

## Shipping & delivery
See our Shipping Policy for delivery timeframes and costs.

## Returns & refunds
See our Refund Policy for eligibility and how to request a return.

## Prohibited use
You may not use this site for any unlawful purpose, or to submit false, fraudulent, or abusive orders.

## Limitation of liability
We are not liable for any indirect, incidental, or consequential damages arising from your use of this site or its products.

## Governing law
These terms are governed by the laws of the United States.

## Contact
Questions about these terms? Reach out via our contact page.';
