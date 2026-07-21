-- Ajout du type de boutique pour la classification automatique
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS shop_type TEXT DEFAULT 'general';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS shop_keywords TEXT[] DEFAULT '{}';

-- Amélioration des catégories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false;

-- Index pour la recherche full-text sur les produits
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('french', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(sku, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_categories_shop ON public.categories(shop_id);

-- Fonction de classification automatique d'un produit
CREATE OR REPLACE FUNCTION public.auto_classify_product(p_product_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_product RECORD;
  v_shop RECORD;
  v_category_id UUID;
  v_keyword TEXT;
  v_match_count INT;
  v_best_category_id UUID;
  v_best_match_count INT := 0;
  v_divers_category_id UUID;
BEGIN
  -- Récupérer le produit
  SELECT * INTO v_product FROM public.products WHERE id = p_product_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Récupérer la boutique
  SELECT * INTO v_shop FROM public.shops WHERE id = v_product.shop_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Récupérer l'identifiant de la catégorie Divers si elle existe
  SELECT id INTO v_divers_category_id
  FROM public.categories
  WHERE shop_id = v_product.shop_id
    AND name = 'Divers'
  LIMIT 1;

  -- Parcourir toutes les catégories de la boutique
  FOR v_category_id IN SELECT id FROM public.categories WHERE shop_id = v_product.shop_id LOOP
    v_match_count := 0;

    -- Compter les mots-clés de la catégorie qui apparaissent dans le produit
    FOR v_keyword IN SELECT unnest(keywords) FROM public.categories WHERE id = v_category_id LOOP
      IF v_product.name ILIKE '%' || v_keyword || '%' THEN
        v_match_count := v_match_count + 1;
      END IF;
      IF v_product.description IS NOT NULL AND v_product.description ILIKE '%' || v_keyword || '%' THEN
        v_match_count := v_match_count + 1;
      END IF;
      IF v_product.brand IS NOT NULL AND v_product.brand ILIKE '%' || v_keyword || '%' THEN
        v_match_count := v_match_count + 1;
      END IF;
    END LOOP;

    -- Si cette catégorie a plus de correspondances, c'est la meilleure
    IF v_match_count > v_best_match_count THEN
      v_best_match_count := v_match_count;
      v_best_category_id := v_category_id;
    END IF;
  END LOOP;

  -- Si on a trouvé une catégorie avec au moins une correspondance, assigner
  IF v_best_match_count > 0 THEN
    UPDATE public.products SET category_id = v_best_category_id WHERE id = p_product_id;
    RETURN v_best_category_id;
  END IF;

  -- Sinon, placer le produit dans Divers si cette catégorie existe
  IF v_divers_category_id IS NOT NULL THEN
    UPDATE public.products SET category_id = v_divers_category_id WHERE id = p_product_id;
    RETURN v_divers_category_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Fonction pour classifier tous les produits non classés d'une boutique
CREATE OR REPLACE FUNCTION public.auto_classify_shop_products(p_shop_id UUID)
RETURNS TABLE(product_id UUID, category_id UUID, category_name TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_product RECORD;
  v_cat_id UUID;
BEGIN
  FOR v_product IN SELECT id FROM public.products p WHERE p.shop_id = p_shop_id AND p.category_id IS NULL LOOP
    v_cat_id := public.auto_classify_product(v_product.id);
    IF v_cat_id IS NOT NULL THEN
      product_id := v_product.id;
      category_id := v_cat_id;
      SELECT c.name INTO category_name FROM public.categories c WHERE c.id = v_cat_id;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- Fonction pour générer les catégories par défaut selon le type de boutique
CREATE OR REPLACE FUNCTION public.generate_default_categories(p_shop_id UUID)
RETURNS SETOF public.categories LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_shop_type TEXT;
  v_cat RECORD;
BEGIN
  SELECT shop_type INTO v_shop_type FROM public.shops WHERE id = p_shop_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Catégories générales (pour tous les types)
  INSERT INTO public.categories (shop_id, name, description, keywords, sort_order, is_auto_generated)
  VALUES
    (p_shop_id, 'Divers', 'Produits divers non classés', ARRAY['divers', 'autre', 'various', 'other'], 999, true)
  ON CONFLICT DO NOTHING;

  -- Catégories par type de boutique
  CASE v_shop_type
    WHEN 'epicerie' THEN
      INSERT INTO public.categories (shop_id, name, description, keywords, sort_order, is_auto_generated) VALUES
        (p_shop_id, 'Boissons', 'Boissons gazeuses, jus, eaux', ARRAY['boisson', 'jus', 'soda', 'eau', 'coca', 'fanta', 'sprite', 'bière', 'energy drink'], 1, true),
        (p_shop_id, 'Produits laitiers', 'Lait, yaourt, fromage, beurre', ARRAY['lait', 'yaourt', 'fromage', 'beurre', 'crème', 'laitier'], 2, true),
        (p_shop_id, 'Céréales et farines', 'Riz, maïs, mil, farine', ARRAY['riz', 'maïs', 'mil', 'farine', 'céréale', 'semoule', 'pâte'], 3, true),
        (p_shop_id, 'Huiles et condiments', 'Huiles, épices, sauces', ARRAY['huile', 'épice', 'sauce', 'condiment', 'sel', 'sucre', 'vinaigre', 'mayonnaise'], 4, true),
        (p_shop_id, 'Conserves et produits secs', 'Conserves, biscuits, snacks', ARRAY['conserve', 'biscuit', 'snack', 'chips', 'bonbon', 'chocolat', 'gâteau'], 5, true),
        (p_shop_id, 'Fruits et légumes', 'Frais et secs', ARRAY['fruit', 'légume', 'banane', 'tomate', 'oignon', 'pomme', 'mangue', 'orange'], 6, true),
        (p_shop_id, 'Hygiène et entretien', 'Savon, détergent, produits ménagers', ARRAY['savon', 'détergent', 'ménager', 'shampoing', 'dentifrice', 'lessive', 'eau de javel'], 7, true)
      ON CONFLICT DO NOTHING;

    WHEN 'vetements' THEN
      INSERT INTO public.categories (shop_id, name, description, keywords, sort_order, is_auto_generated) VALUES
        (p_shop_id, 'Hauts', 'T-shirts, chemises, blouses, vestes', ARRAY['t-shirt', 'chemise', 'blouse', 'veste', 'pull', 'haut', 'chemisier', 'top', 'débardeur'], 1, true),
        (p_shop_id, 'Bas', 'Pantalons, jeans, shorts, jupes', ARRAY['pantalon', 'jean', 'short', 'jupe', 'bermuda', 'legging', 'pant'], 2, true),
        (p_shop_id, 'Robes et ensembles', 'Robes, combinaisons, tailleurs', ARRAY['robe', 'combinaison', 'tailleur', 'ensemble'], 3, true),
        (p_shop_id, 'Sous-vêtements', 'Sous-vêtements, lingerie, chaussettes', ARRAY['sous-vêtement', 'lingerie', 'chaussette', 'slip', 'boxer', 'soutien-gorge', 'caleçon'], 4, true),
        (p_shop_id, 'Chaussures', 'Tous types de chaussures', ARRAY['chaussure', 'basket', 'sandale', 'talon', 'botte', 'mocassin', 'escarpin'], 5, true),
        (p_shop_id, 'Accessoires', 'Ceintures, sacs, bijoux, écharpes', ARRAY['ceinture', 'sac', 'bijou', 'écharpe', 'foulard', 'chapeau', 'lunette', 'montre'], 6, true),
        (p_shop_id, 'Tissus et pagne', 'Tissus au mètre, pagnes, wax', ARRAY['tissu', 'pagne', 'wax', 'bazin', 'tiss', 'mètre'], 7, true)
      ON CONFLICT DO NOTHING;

    WHEN 'quincaillerie' THEN
      INSERT INTO public.categories (shop_id, name, description, keywords, sort_order, is_auto_generated) VALUES
        (p_shop_id, 'Outillage', 'Marteaux, tournevis, clés, perceuses', ARRAY['marteau', 'tournevis', 'clé', 'perceuse', 'outil', 'pince', 'scie'], 1, true),
        (p_shop_id, 'Matériaux de construction', 'Ciment, fer, briques, peinture', ARRAY['ciment', 'fer', 'brique', 'peinture', 'carreau', 'plâtre', 'sable'], 2, true),
        (p_shop_id, 'Plomberie', 'Tuyaux, robinets, raccords', ARRAY['tuyau', 'robinet', 'raccord', 'plomberie', 'joint', 'siphon'], 3, true),
        (p_shop_id, 'Électricité', 'Câbles, ampoules, interrupteurs', ARRAY['câble', 'ampoule', 'interrupteur', 'électricité', 'prise', 'fil'], 4, true),
        (p_shop_id, 'Peinture et finition', 'Peintures, pinceaux, rouleaux', ARRAY['peinture', 'pinceau', 'rouleau', 'vernis', 'diluant'], 5, true),
        (p_shop_id, 'Sécurité et protection', 'Gants, casques, masques', ARRAY['gant', 'casque', 'masque', 'sécurité', 'protection', 'lunette de protection'], 6, true)
      ON CONFLICT DO NOTHING;

    WHEN 'pharmacie' THEN
      INSERT INTO public.categories (shop_id, name, description, keywords, sort_order, is_auto_generated) VALUES
        (p_shop_id, 'Médicaments', 'Médicaments et produits pharmaceutiques', ARRAY['médicament', 'comprimé', 'sirop', 'gélule', 'pommade', 'antibiotique'], 1, true),
         (p_shop_id, 'Soins et hygiène', 'Produits de soin et d''hygiène', ARRAY['savon', 'shampoing', 'dentifrice', 'crème', 'soin', 'déodorant'], 2, true),
        (p_shop_id, 'Bébé et maternité', 'Couches, lait maternel, biberons', ARRAY['couche', 'biberon', 'lait maternel', 'bébé', 'tétine'], 3, true),
        (p_shop_id, 'Matériel médical', 'Matériel et accessoires médicaux', ARRAY['thermomètre', 'tensiomètre', 'masque', 'gant', 'pansement', 'bande'], 4, true),
        (p_shop_id, 'Compléments et vitamines', 'Vitamines, compléments alimentaires', ARRAY['vitamine', 'complément', 'oméga', 'fer', 'calcium'], 5, true)
      ON CONFLICT DO NOTHING;

    WHEN 'restaurant' THEN
      INSERT INTO public.categories (shop_id, name, description, keywords, sort_order, is_auto_generated) VALUES
        (p_shop_id, 'Plats principaux', 'Plats cuisinés et préparations', ARRAY['plat', 'riz', 'poulet', 'viande', 'poisson', 'sauce', 'ragoût'], 1, true),
        (p_shop_id, 'Entrées et accompagnements', 'Entrées, salades, accompagnements', ARRAY['entrée', 'salade', 'accompagnement', 'frite', 'légume'], 2, true),
        (p_shop_id, 'Desserts et pâtisseries', 'Desserts, gâteaux, pâtisseries', ARRAY['dessert', 'gâteau', 'pâtisserie', 'tarte', 'crème'], 3, true),
        (p_shop_id, 'Boissons', 'Boissons chaudes et froides', ARRAY['boisson', 'jus', 'soda', 'café', 'thé', 'eau'], 4, true),
        (p_shop_id, 'Petit-déjeuner', 'Petit-déjeuner et brunch', ARRAY['petit-déjeuner', 'brunch', 'pain', 'beurre', 'confiture'], 5, true)
      ON CONFLICT DO NOTHING;

    WHEN 'cosmetique' THEN
      INSERT INTO public.categories (shop_id, name, description, keywords, sort_order, is_auto_generated) VALUES
        (p_shop_id, 'Soin visage', 'Crèmes, sérums, nettoyants visage', ARRAY['crème visage', 'sérum', 'nettoyant', 'masque visage', 'contour'], 1, true),
        (p_shop_id, 'Maquillage', 'Fond de teint, rouge à lèvres, fards', ARRAY['maquillage', 'fond de teint', 'rouge à lèvres', 'fard', 'mascara', 'eye-liner'], 2, true),
        (p_shop_id, 'Soin corps', 'Crèmes corps, huiles, gommages', ARRAY['crème corps', 'huile corps', 'gommage', 'lait corps'], 3, true),
        (p_shop_id, 'Cheveux', 'Shampoings, soins, défrisage', ARRAY['shampoing', 'cheveux', 'défrisage', 'soin cheveux', 'après-shampoing'], 4, true),
        (p_shop_id, 'Parfums', 'Parfums et eaux de toilette', ARRAY['parfum', 'eau de toilette', 'déodorant'], 5, true)
      ON CONFLICT DO NOTHING;

    WHEN 'electronique' THEN
      INSERT INTO public.categories (shop_id, name, description, keywords, sort_order, is_auto_generated) VALUES
        (p_shop_id, 'Téléphones et tablettes', 'Smartphones, tablettes, accessoires', ARRAY['téléphone', 'smartphone', 'tablette', 'iphone', 'samsung', 'huawei'], 1, true),
        (p_shop_id, 'Ordinateurs', 'PC, laptops, accessoires informatiques', ARRAY['ordinateur', 'pc', 'laptop', 'portable', 'clavier', 'souris'], 2, true),
        (p_shop_id, 'Audio et vidéo', 'Casques, enceintes, écouteurs', ARRAY['casque', 'enceinte', 'écouteur', 'audio', 'son'], 3, true),
        (p_shop_id, 'Accessoires', 'Câbles, chargeurs, coques, protections', ARRAY['câble', 'chargeur', 'coque', 'protection', 'adaptateur'], 4, true),
        (p_shop_id, 'Gadgets', 'Montres connectées, objets connectés', ARRAY['montre connectée', 'gadget', 'connecté', 'smart'], 5, true)
      ON CONFLICT DO NOTHING;

    ELSE -- general / default
      INSERT INTO public.categories (shop_id, name, description, keywords, sort_order, is_auto_generated) VALUES
        (p_shop_id, 'Alimentation', 'Produits alimentaires', ARRAY['aliment', 'nourriture', 'manger', 'riz', 'pain', 'lait', 'huile', 'sucre', 'sel', 'farine', 'pâtes', 'biscuit', 'chocolat', 'café', 'thé', 'jus', 'boisson', 'eau', 'soda', 'bière', 'vin', 'liqueur', 'épice', 'sauce', 'conserve', 'fruit', 'légume', 'viande', 'poisson', 'poulet', 'œuf', 'beurre', 'fromage', 'yaourt', 'crème'], 1, true),
        (p_shop_id, 'Vêtements et accessoires', 'Vêtements, chaussures, accessoires', ARRAY['vêtement', 'habit', 't-shirt', 'chemise', 'pantalon', 'robe', 'jupe', 'short', 'veste', 'manteau', 'pull', 'chaussure', 'basket', 'sandale', 'sac', 'ceinture', 'chapeau', 'écharpe', 'bijou', 'montre', 'lunette'], 2, true),
        (p_shop_id, 'Hygiène et beauté', 'Produits d''hygiène et de beauté', ARRAY['savon', 'shampoing', 'dentifrice', 'crème', 'parfum', 'déodorant', 'maquillage', 'rouge à lèvres', 'fond de teint', 'vernis', 'soin', 'lotion', 'gel douche', 'après-rasage'], 3, true),
        (p_shop_id, 'Maison et entretien', 'Produits ménagers et d''entretien', ARRAY['ménager', 'nettoyant', 'détergent', 'lessive', 'eau de javel', 'éponge', 'sac poubelle', 'balai', 'serpillière'], 4, true),
        (p_shop_id, 'Électronique', 'Appareils électroniques et accessoires', ARRAY['téléphone', 'smartphone', 'chargeur', 'câble', 'casque', 'écouteur', 'enceinte', 'ordinateur', 'tablette', 'appareil'], 5, true),
        (p_shop_id, 'Papeterie et fournitures', 'Fournitures de bureau et d''école', ARRAY['cahier', 'stylo', 'crayon', 'papier', 'gomme', 'règle', 'classeur', 'enveloppe'], 6, true)
      ON CONFLICT DO NOTHING;
  END CASE;
END;
$$;

-- Trigger : classification automatique à l'insertion d'un produit
CREATE OR REPLACE FUNCTION public.trigger_auto_classify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.category_id IS NULL THEN
    PERFORM public.auto_classify_product(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_auto_classify_product'
      AND tgrelid = 'public.products'::regclass
  ) THEN
    CREATE TRIGGER trg_auto_classify_product
      AFTER INSERT ON public.products
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_auto_classify();
  END IF;
END;
$$;