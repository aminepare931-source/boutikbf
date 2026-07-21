
-- Enum rôles
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','manager','accountant','cashier','stock_keeper','purchaser','sales','marketing','employee','delivery');

-- Profils utilisateurs
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Boutiques (tenants)
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'XOF',
  country TEXT DEFAULT 'BF',
  address TEXT,
  phone TEXT,
  email TEXT,
  plan TEXT NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shops TO authenticated;
GRANT ALL ON public.shops TO service_role;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Membres boutique avec rôle
CREATE TABLE public.shop_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_members TO authenticated;
GRANT ALL ON public.shop_members TO service_role;
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;

-- Fonction security definer : appartenance
CREATE OR REPLACE FUNCTION public.is_shop_member(_shop_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = _shop_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.has_shop_role(_shop_id UUID, _user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shop_members WHERE shop_id = _shop_id AND user_id = _user_id AND role = _role);
$$;

-- Policies shops & members
CREATE POLICY "shops members read" ON public.shops FOR SELECT TO authenticated USING (public.is_shop_member(id, auth.uid()) OR owner_id = auth.uid());
CREATE POLICY "shops owner insert" ON public.shops FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "shops owner update" ON public.shops FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "shops owner delete" ON public.shops FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "members read" ON public.shop_members FOR SELECT TO authenticated USING (public.is_shop_member(shop_id, auth.uid()));
CREATE POLICY "members owner manage" ON public.shop_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));

-- Auto profil & membership à la création user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
  RETURN new;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Catégories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat member all" ON public.categories FOR ALL TO authenticated USING (public.is_shop_member(shop_id, auth.uid())) WITH CHECK (public.is_shop_member(shop_id, auth.uid()));

-- Produits
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  brand TEXT,
  image_url TEXT,
  cost_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  promo_price NUMERIC(14,2),
  tax_rate NUMERIC(5,2) DEFAULT 0,
  stock NUMERIC(14,3) NOT NULL DEFAULT 0,
  stock_min NUMERIC(14,3) DEFAULT 0,
  unit TEXT DEFAULT 'unité',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod member all" ON public.products FOR ALL TO authenticated USING (public.is_shop_member(shop_id, auth.uid())) WITH CHECK (public.is_shop_member(shop_id, auth.uid()));
CREATE INDEX idx_products_shop ON public.products(shop_id);

-- Clients
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  credit_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cust member all" ON public.customers FOR ALL TO authenticated USING (public.is_shop_member(shop_id, auth.uid())) WITH CHECK (public.is_shop_member(shop_id, auth.uid()));

-- Fournisseurs
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sup member all" ON public.suppliers FOR ALL TO authenticated USING (public.is_shop_member(shop_id, auth.uid())) WITH CHECK (public.is_shop_member(shop_id, auth.uid()));

-- Ventes
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference TEXT,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale member all" ON public.sales FOR ALL TO authenticated USING (public.is_shop_member(shop_id, auth.uid())) WITH CHECK (public.is_shop_member(shop_id, auth.uid()));
CREATE INDEX idx_sales_shop_date ON public.sales(shop_id, created_at DESC);

-- Lignes de vente
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL,
  unit_price NUMERIC(14,2) NOT NULL,
  total NUMERIC(14,2) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sitem member all" ON public.sale_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.is_shop_member(s.shop_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.is_shop_member(s.shop_id, auth.uid())));

-- Mouvements de stock
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity NUMERIC(14,3) NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm member all" ON public.stock_movements FOR ALL TO authenticated USING (public.is_shop_member(shop_id, auth.uid())) WITH CHECK (public.is_shop_member(shop_id, auth.uid()));
