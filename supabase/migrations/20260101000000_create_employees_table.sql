-- Table pour les employés/équipe
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'cashier',
  pin TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_employees_shop_id ON employees(shop_id);
CREATE INDEX IF NOT EXISTS idx_employees_pin ON employees(pin);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at_trigger
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_employees_updated_at();

-- RLS (Row Level Security)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policy: Les admins/gérants peuvent voir leurs employés
CREATE POLICY "Admins can view their employees" ON employees
  FOR SELECT USING (
    shop_id IN (
      SELECT id FROM shops WHERE id = auth.uid() OR owner_id = auth.uid()
    )
  );

-- Policy: Les admins/gérants peuvent créer des employés
CREATE POLICY "Admins can create employees" ON employees
  FOR INSERT WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE id = auth.uid() OR owner_id = auth.uid()
    )
  );

-- Policy: Les admins/gérants peuvent modifier des employés
CREATE POLICY "Admins can update employees" ON employees
  FOR UPDATE USING (
    shop_id IN (
      SELECT id FROM shops WHERE id = auth.uid() OR owner_id = auth.uid()
    )
  );

-- Policy: Les admins/gérants peuvent supprimer des employés
CREATE POLICY "Admins can delete employees" ON employees
  FOR DELETE USING (
    shop_id IN (
      SELECT id FROM shops WHERE id = auth.uid() OR owner_id = auth.uid()
    )
  );

-- Policy: Les employés peuvent voir leur propre profil
CREATE POLICY "Employees can view themselves" ON employees
  FOR SELECT USING (true);