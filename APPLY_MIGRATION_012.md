# 🔧 Migration SQL 012 - Correction user_id ambiguous

## ❌ Erreur actuelle

```
POST /rest/v1/tbl_sessions 400 (Bad Request)
Erreur création session: {code: '42702', details: 'It could refer to either a PL/pgSQL variable or a table column.', hint: null, message: 'column reference "user_id" is ambiguous'}
```

## ✅ Solution

**IMPORTANT** : Vous devez appliquer la migration `012_fix_ambiguous_user_id.sql` dans Supabase.

### Étapes

1. **Connectez-vous à Supabase** : https://supabase.com/dashboard
2. **Allez dans SQL Editor** : Cliquez sur "SQL Editor" dans le menu de gauche
3. **Copiez-collez le contenu** de `supabase/migrations/012_fix_ambiguous_user_id.sql`
4. **Exécutez la migration** : Cliquez sur "Run" ou appuyez sur `Ctrl+Enter`

### Contenu de la migration

```sql
-- Fix: Corriger la référence ambiguë user_id dans update_derniere_connexion
-- Cette fonction est déclenchée par un trigger AFTER INSERT sur tbl_sessions

CREATE OR REPLACE FUNCTION public.update_derniere_connexion()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Récupérer explicitement user_id depuis NEW (tbl_sessions)
  v_user_id := NEW.user_id;
  
  -- Mettre à jour derniere_connexion dans tbl_users
  IF NEW.date_debut IS NOT NULL THEN
    UPDATE public.tbl_users
    SET derniere_connexion = NEW.date_debut
    WHERE public.tbl_users.id = v_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Vérification

Après l'exécution, essayez de vous connecter à nouveau. L'erreur `column reference "user_id" is ambiguous` devrait disparaître.

