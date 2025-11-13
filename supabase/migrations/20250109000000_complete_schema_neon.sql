-- ============================================
-- SCHÉMA COMPLET SHOPLUX - ADAPTÉ POUR NEON
-- ============================================
-- Ce script crée toute la structure de la base de données
-- pour une instance Neon PostgreSQL
-- Date: 2025-01-09
-- ============================================
-- NOTE: Neon utilise les JWT claims au lieu de auth.uid()
-- ============================================

-- ============================================
-- 0. FONCTION HELPER POUR OBTENIR L'ID UTILISATEUR
-- ============================================
-- Cette fonction remplace auth.uid() de Supabase
-- Elle lit l'ID utilisateur depuis les claims JWT

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
DECLARE
  user_id_text TEXT;
BEGIN
  -- Essayer de lire depuis les claims JWT
  BEGIN
    user_id_text := current_setting('request.jwt.claims', true)::json->>'sub';
    IF user_id_text IS NOT NULL THEN
      RETURN user_id_text::UUID;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  -- Fallback: essayer depuis app.current_user_id si défini
  BEGIN
    user_id_text := current_setting('app.current_user_id', true);
    IF user_id_text IS NOT NULL THEN
      RETURN user_id_text::UUID;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 1. SUPPRESSION DES TABLES EXISTANTES (si nécessaire)
-- ============================================
-- Décommentez les lignes suivantes si vous voulez réinitialiser complètement

-- DROP TABLE IF EXISTS ticket_messages CASCADE;
-- DROP TABLE IF EXISTS support_tickets CASCADE;
-- DROP TABLE IF EXISTS abandoned_carts CASCADE;
-- DROP TABLE IF EXISTS product_views CASCADE;
-- DROP TABLE IF EXISTS newsletter_subscribers CASCADE;
-- DROP TABLE IF EXISTS inventory_logs CASCADE;
-- DROP TABLE IF EXISTS product_recommendations CASCADE;
-- DROP TABLE IF EXISTS promotional_banners CASCADE;
-- DROP TABLE IF EXISTS email_templates CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS refunds CASCADE;
-- DROP TABLE IF EXISTS payment_transactions CASCADE;
-- DROP TABLE IF EXISTS shipping_methods CASCADE;
-- DROP TABLE IF EXISTS product_variants CASCADE;
-- DROP TABLE IF EXISTS product_images CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS wishlists CASCADE;
-- DROP TABLE IF EXISTS carts CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS addresses CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS coupons CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 2. CRÉATION DES TABLES
-- ============================================

-- Table Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  image TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  sku TEXT UNIQUE NOT NULL,
  stock INTEGER DEFAULT 0,
  images JSONB DEFAULT '[]'::jsonb,
  category_id UUID REFERENCES categories(id),
  brand TEXT,
  tags TEXT[],
  variants JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('billing', 'shipping')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'France',
  phone TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Table Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Table Carts
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2),
  max_discount DECIMAL(10, 2),
  expires_at TIMESTAMP WITH TIME ZONE,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Product Images
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Shipping Methods
CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  free_shipping_threshold DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  countries TEXT[] DEFAULT ARRAY['FR', 'BE', 'CH', 'LU'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE NOT NULL,
  payment_provider TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_method_details JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  transaction_id UUID REFERENCES payment_transactions(id),
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('requested', 'approved', 'rejected', 'processed')),
  processed_by UUID REFERENCES users(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Table Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('order', 'promotion', 'system', 'review')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Promotional Banners
CREATE TABLE IF NOT EXISTS promotional_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  button_text TEXT,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Product Recommendations
CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  score DECIMAL(5, 2) DEFAULT 0,
  type TEXT CHECK (type IN ('similar', 'frequently_bought', 'alternative')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  change_type TEXT CHECK (change_type IN ('sale', 'restock', 'adjustment', 'return')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Table Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  is_subscribed BOOLEAN DEFAULT TRUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Table Product Views
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Abandoned Carts
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  email TEXT,
  cart_data JSONB NOT NULL,
  total_amount DECIMAL(10, 2),
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  converted_to_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_date ON product_views(viewed_at);

-- ============================================
-- 4. FONCTIONS SQL
-- ============================================

-- Fonction: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Calculer le rating moyen d'un produit
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET 
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE product_id = NEW.product_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Mettre à jour le stock après une commande
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  IF NEW.status = 'processing' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      UPDATE products
      SET stock = stock - (item->>'quantity')::INTEGER
      WHERE id = (item->>'product_id')::UUID;
      
      INSERT INTO inventory_logs (product_id, change_type, quantity_change, quantity_before, quantity_after, reference_id)
      SELECT 
        id,
        'sale',
        -(item->>'quantity')::INTEGER,
        stock + (item->>'quantity')::INTEGER,
        stock,
        NEW.id
      FROM products
      WHERE id = (item->>'product_id')::UUID;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Créer une notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO notification_id;
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Vérifier si l'utilisateur est admin
-- ADAPTÉ POUR NEON: utilise current_user_id() au lieu de auth.uid()
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := current_user_id();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = v_user_id 
    AND users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction RPC: Créer ou mettre à jour un utilisateur Google
CREATE OR REPLACE FUNCTION public.create_or_update_google_user(
  p_user_id UUID,
  p_email TEXT,
  p_first_name TEXT DEFAULT '',
  p_last_name TEXT DEFAULT '',
  p_avatar_url TEXT DEFAULT '',
  p_google_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT,
  loyalty_points INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result RECORD;
BEGIN
  v_user_id := COALESCE(p_user_id, gen_random_uuid());

  INSERT INTO public.users AS u (
    id,
    email,
    first_name,
    last_name,
    avatar_url,
    role,
    loyalty_points,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_email,
    COALESCE(NULLIF(p_first_name, ''), split_part(p_email, '@', 1)),
    COALESCE(NULLIF(p_last_name, ''), ''),
    p_avatar_url,
    'customer',
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT ON CONSTRAINT users_email_key DO UPDATE SET
    avatar_url = COALESCE(NULLIF(p_avatar_url, ''), u.avatar_url),
    first_name = COALESCE(NULLIF(p_first_name, ''), u.first_name),
    last_name = COALESCE(NULLIF(p_last_name, ''), u.last_name),
    updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN QUERY SELECT
    v_result.id,
    v_result.email,
    v_result.first_name,
    v_result.last_name,
    v_result.phone,
    v_result.avatar_url,
    v_result.role,
    v_result.loyalty_points,
    v_result.created_at,
    v_result.updated_at;
END;
$$;

-- Permissions pour la fonction RPC Google
GRANT EXECUTE ON FUNCTION public.create_or_update_google_user TO PUBLIC;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Mise à jour du rating produit
DROP TRIGGER IF EXISTS trg_update_product_rating ON reviews;
CREATE TRIGGER trg_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Trigger: Mise à jour du stock
DROP TRIGGER IF EXISTS trg_update_stock ON orders;
CREATE TRIGGER trg_update_stock
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_order();

-- Fonction: Empêcher les utilisateurs de changer leur propre rôle
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT is_admin() THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Empêcher le changement de rôle
DROP TRIGGER IF EXISTS trg_prevent_role_change ON users;
CREATE TRIGGER trg_prevent_role_change
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_change();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour USERS
-- ADAPTÉ POUR NEON: utilise current_user_id() au lieu de auth.uid()
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_all_admins" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_all_admins" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;

CREATE POLICY "users_select_own" ON users FOR SELECT
TO authenticated USING (current_user_id() = id);

CREATE POLICY "users_select_all_admins" ON users FOR SELECT
TO authenticated USING (is_admin());

CREATE POLICY "users_update_own" ON users FOR UPDATE
TO authenticated
USING (current_user_id() = id)
WITH CHECK (current_user_id() = id);

CREATE POLICY "users_update_all_admins" ON users FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "users_insert_own" ON users FOR INSERT
TO authenticated
WITH CHECK (
  current_user_id() = id 
  AND role = 'customer'
);

-- Politiques RLS pour ORDERS
DROP POLICY IF EXISTS "users_select_own_orders" ON orders;
DROP POLICY IF EXISTS "admins_select_all_orders" ON orders;
DROP POLICY IF EXISTS "users_insert_own_orders" ON orders;
DROP POLICY IF EXISTS "admins_update_orders" ON orders;

CREATE POLICY "users_select_own_orders" ON orders FOR SELECT
TO authenticated USING (user_id = current_user_id());

CREATE POLICY "admins_select_all_orders" ON orders FOR SELECT
TO authenticated USING (is_admin());

CREATE POLICY "users_insert_own_orders" ON orders FOR INSERT
TO authenticated WITH CHECK (user_id = current_user_id());

CREATE POLICY "admins_update_orders" ON orders FOR UPDATE
TO authenticated USING (is_admin());

-- Politiques RLS pour REVIEWS
DROP POLICY IF EXISTS "anyone_read_reviews" ON reviews;
DROP POLICY IF EXISTS "users_insert_own_reviews" ON reviews;
DROP POLICY IF EXISTS "users_update_own_reviews" ON reviews;
DROP POLICY IF EXISTS "users_delete_own_reviews" ON reviews;
DROP POLICY IF EXISTS "admins_delete_reviews" ON reviews;

CREATE POLICY "anyone_read_reviews" ON reviews FOR SELECT
TO anon, authenticated USING (true);

CREATE POLICY "users_insert_own_reviews" ON reviews FOR INSERT
TO authenticated WITH CHECK (user_id = current_user_id());

CREATE POLICY "users_update_own_reviews" ON reviews FOR UPDATE
TO authenticated USING (user_id = current_user_id());

CREATE POLICY "users_delete_own_reviews" ON reviews FOR DELETE
TO authenticated USING (user_id = current_user_id());

CREATE POLICY "admins_delete_reviews" ON reviews FOR DELETE
TO authenticated USING (is_admin());

-- Politiques RLS pour ADDRESSES
DROP POLICY IF EXISTS "users_manage_own_addresses" ON addresses;
DROP POLICY IF EXISTS "admins_view_all_addresses" ON addresses;

CREATE POLICY "users_manage_own_addresses" ON addresses FOR ALL
TO authenticated
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

CREATE POLICY "admins_view_all_addresses" ON addresses FOR SELECT
TO authenticated USING (is_admin());

-- Politiques RLS pour PRODUCTS
DROP POLICY IF EXISTS "anyone_read_products" ON products;
DROP POLICY IF EXISTS "admins_manage_products" ON products;

CREATE POLICY "anyone_read_products" ON products FOR SELECT
TO anon, authenticated
USING (status = 'active' OR is_admin());

CREATE POLICY "admins_manage_products" ON products FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Politiques RLS pour WISHLISTS
DROP POLICY IF EXISTS "users_manage_own_wishlist" ON wishlists;

CREATE POLICY "users_manage_own_wishlist" ON wishlists FOR ALL
TO authenticated
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Politiques RLS pour CARTS
DROP POLICY IF EXISTS "users_manage_own_cart" ON carts;

CREATE POLICY "users_manage_own_cart" ON carts FOR ALL
TO authenticated
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Politiques RLS pour NOTIFICATIONS
DROP POLICY IF EXISTS "users_manage_own_notifications" ON notifications;

CREATE POLICY "users_manage_own_notifications" ON notifications FOR ALL
TO authenticated
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Politiques RLS pour SUPPORT TICKETS
DROP POLICY IF EXISTS "users_read_own_tickets" ON support_tickets;
DROP POLICY IF EXISTS "users_create_tickets" ON support_tickets;

CREATE POLICY "users_read_own_tickets" ON support_tickets FOR SELECT
TO authenticated USING (user_id = current_user_id());

CREATE POLICY "users_create_tickets" ON support_tickets FOR INSERT
TO authenticated WITH CHECK (user_id = current_user_id());

-- Politiques RLS pour TICKET MESSAGES
DROP POLICY IF EXISTS "users_read_own_ticket_messages" ON ticket_messages;

CREATE POLICY "users_read_own_ticket_messages" ON ticket_messages FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE id = ticket_messages.ticket_id 
    AND user_id = current_user_id()
  )
);

-- Politiques RLS publiques
DROP POLICY IF EXISTS "public_read_shipping_methods" ON shipping_methods;
DROP POLICY IF EXISTS "public_read_promotional_banners" ON promotional_banners;

CREATE POLICY "public_read_shipping_methods" ON shipping_methods FOR SELECT
TO anon, authenticated USING (is_active = TRUE);

CREATE POLICY "public_read_promotional_banners" ON promotional_banners FOR SELECT
TO anon, authenticated USING (is_active = TRUE AND NOW() BETWEEN start_date AND end_date);

-- ============================================
-- 7. VUES SQL (Analytics)
-- ============================================

CREATE OR REPLACE VIEW best_sellers AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.price,
  p.images,
  COUNT(DISTINCT o.id) as order_count,
  SUM((item->>'quantity')::INTEGER) as total_sold
FROM products p
JOIN orders o ON TRUE
JOIN LATERAL jsonb_array_elements(o.items) item ON (item->>'product_id')::UUID = p.id
WHERE o.status IN ('processing', 'shipped', 'delivered')
GROUP BY p.id, p.name, p.slug, p.price, p.images
ORDER BY total_sold DESC;

CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
  id,
  name,
  sku,
  stock,
  price,
  CASE 
    WHEN stock = 0 THEN 'out_of_stock'
    WHEN stock <= 5 THEN 'critical'
    WHEN stock <= 10 THEN 'low'
    ELSE 'ok'
  END as stock_status
FROM products
WHERE stock <= 10 AND status = 'active'
ORDER BY stock ASC;

CREATE OR REPLACE VIEW sales_stats_30d AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as order_count,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND status IN ('processing', 'shipped', 'delivered')
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- ============================================
-- FIN DU SCHÉMA
-- ============================================
-- ✅ Toutes les tables créées
-- ✅ Tous les index créés
-- ✅ Toutes les fonctions créées (adaptées pour Neon)
-- ✅ Tous les triggers créés
-- ✅ Toutes les politiques RLS configurées (adaptées pour Neon)
-- ✅ Fonction RPC pour Google OAuth créée
-- ✅ Vues analytics créées
-- ============================================


