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
-- Cette fonction est déclenchée lors de l'insertion ou mise à jour dans tbl_users

CREATE OR REPLACE FUNCTION public.update_derniere_connexion()
RETURNS TRIGGER AS $$
BEGIN
  -- Qualification explicite de user_id pour éviter l'ambiguïté
  IF OLD IS NULL THEN
    -- INSERT: on utilise NEW.id pour obtenir le user_id
    UPDATE public.tbl_users
    SET derniere_connexion = CURRENT_TIMESTAMP
    WHERE public.tbl_users.id = NEW.id;
  ELSE
    -- UPDATE: on utilise OLD.id (ou NEW.id, les deux sont identiques)
    UPDATE public.tbl_users
    SET derniere_connexion = CURRENT_TIMESTAMP
    WHERE public.tbl_users.id = OLD.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Vérification

Après l'exécution, essayez de vous connecter à nouveau. L'erreur `column reference "user_id" is ambiguous` devrait disparaître.

