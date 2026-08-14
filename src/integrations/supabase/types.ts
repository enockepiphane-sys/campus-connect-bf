export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins_pre_autorises: {
        Row: {
          created_at: string
          date_naissance: string
          email: string
          etablissement_id: string
          id: string
          inscrit: boolean
          nom_complet: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_naissance: string
          email: string
          etablissement_id: string
          id?: string
          inscrit?: boolean
          nom_complet: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_naissance?: string
          email?: string
          etablissement_id?: string
          id?: string
          inscrit?: boolean
          nom_complet?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_pre_autorises_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admins_pre_autorises_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements_public"
            referencedColumns: ["id"]
          },
        ]
      }
      annonces: {
        Row: {
          comments_enabled: boolean
          contenu: string
          created_at: string
          created_by: string | null
          id: string
          is_urgent: boolean
          max_comments: number
          niveau_id: string
          titre: string
          updated_at: string
        }
        Insert: {
          comments_enabled?: boolean
          contenu: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_urgent?: boolean
          max_comments?: number
          niveau_id: string
          titre: string
          updated_at?: string
        }
        Update: {
          comments_enabled?: boolean
          contenu?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_urgent?: boolean
          max_comments?: number
          niveau_id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "annonces_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaux"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_comments: {
        Row: {
          announcement_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_comments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "annonces"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_likes: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_likes_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "annonces"
            referencedColumns: ["id"]
          },
        ]
      }
      cours_emploi_temps: {
        Row: {
          bloc: string
          created_at: string
          heure_debut: string
          heure_fin: string
          id: string
          jour_semaine: number
          matiere: string
          niveau_id: string
          professeur: string | null
          salle: string | null
          updated_at: string
        }
        Insert: {
          bloc: string
          created_at?: string
          heure_debut: string
          heure_fin: string
          id?: string
          jour_semaine: number
          matiere: string
          niveau_id: string
          professeur?: string | null
          salle?: string | null
          updated_at?: string
        }
        Update: {
          bloc?: string
          created_at?: string
          heure_debut?: string
          heure_fin?: string
          id?: string
          jour_semaine?: number
          matiere?: string
          niveau_id?: string
          professeur?: string | null
          salle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cours_emploi_temps_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaux"
            referencedColumns: ["id"]
          },
        ]
      }
      demandes_partenariat: {
        Row: {
          created_at: string
          email_contact: string
          id: string
          message: string | null
          nom_contact: string
          nom_etablissement: string
          statut: string
          telephone_contact: string | null
        }
        Insert: {
          created_at?: string
          email_contact: string
          id?: string
          message?: string | null
          nom_contact: string
          nom_etablissement: string
          statut?: string
          telephone_contact?: string | null
        }
        Update: {
          created_at?: string
          email_contact?: string
          id?: string
          message?: string | null
          nom_contact?: string
          nom_etablissement?: string
          statut?: string
          telephone_contact?: string | null
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      etablissements: {
        Row: {
          adresse: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          nom: string
          statut: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          nom: string
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          nom?: string
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      etudiants_pre_inscrits: {
        Row: {
          created_at: string
          date_naissance: string
          deleted_at: string | null
          email: string
          etablissement_id: string
          filiere_id: string
          id: string
          inscrit: boolean
          matricule: string | null
          niveau_id: string
          nom_complet: string
          telephone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_naissance: string
          deleted_at?: string | null
          email: string
          etablissement_id: string
          filiere_id: string
          id?: string
          inscrit?: boolean
          matricule?: string | null
          niveau_id: string
          nom_complet: string
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_naissance?: string
          deleted_at?: string | null
          email?: string
          etablissement_id?: string
          filiere_id?: string
          id?: string
          inscrit?: boolean
          matricule?: string | null
          niveau_id?: string
          nom_complet?: string
          telephone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etudiants_pre_inscrits_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etudiants_pre_inscrits_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etudiants_pre_inscrits_filiere_id_fkey"
            columns: ["filiere_id"]
            isOneToOne: false
            referencedRelation: "filieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etudiants_pre_inscrits_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaux"
            referencedColumns: ["id"]
          },
        ]
      }
      etablissements_champs_config: {
        Row: {
          etablissement_id: string
          matricule_actif: boolean
          matricule_obligatoire: boolean
          telephone_actif: boolean
          telephone_obligatoire: boolean
          updated_at: string
        }
        Insert: {
          etablissement_id: string
          matricule_actif?: boolean
          matricule_obligatoire?: boolean
          telephone_actif?: boolean
          telephone_obligatoire?: boolean
          updated_at?: string
        }
        Update: {
          etablissement_id?: string
          matricule_actif?: boolean
          matricule_obligatoire?: boolean
          telephone_actif?: boolean
          telephone_obligatoire?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "etablissements_champs_config_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: true
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etablissements_champs_config_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: true
            referencedRelation: "etablissements_public"
            referencedColumns: ["id"]
          },
        ]
      }
      etablissements_champs_personnalises: {
        Row: {
          created_at: string
          deleted_at: string | null
          etablissement_id: string
          id: string
          nom_champ: string
          obligatoire: boolean
          options: Json | null
          ordre: number
          type_champ: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          etablissement_id: string
          id?: string
          nom_champ: string
          obligatoire?: boolean
          options?: Json | null
          ordre?: number
          type_champ: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          etablissement_id?: string
          id?: string
          nom_champ?: string
          obligatoire?: boolean
          options?: Json | null
          ordre?: number
          type_champ?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "etablissements_champs_personnalises_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etablissements_champs_personnalises_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements_public"
            referencedColumns: ["id"]
          },
        ]
      }
      etudiants_valeurs_personnalisees: {
        Row: {
          champ_id: string
          created_at: string
          etudiant_id: string
          id: string
          updated_at: string
          valeur: string
        }
        Insert: {
          champ_id: string
          created_at?: string
          etudiant_id: string
          id?: string
          updated_at?: string
          valeur: string
        }
        Update: {
          champ_id?: string
          created_at?: string
          etudiant_id?: string
          id?: string
          updated_at?: string
          valeur?: string
        }
        Relationships: [
          {
            foreignKeyName: "etudiants_valeurs_personnalisees_champ_id_fkey"
            columns: ["champ_id"]
            isOneToOne: false
            referencedRelation: "etablissements_champs_personnalises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etudiants_valeurs_personnalisees_etudiant_id_fkey"
            columns: ["etudiant_id"]
            isOneToOne: false
            referencedRelation: "etudiants_pre_inscrits"
            referencedColumns: ["id"]
          },
        ]
      }
      evenements: {
        Row: {
          affiche_url: string | null
          created_at: string
          date_evenement: string
          description: string | null
          id: string
          lieu: string | null
          niveau_id: string
          titre: string
          updated_at: string
        }
        Insert: {
          affiche_url?: string | null
          created_at?: string
          date_evenement: string
          description?: string | null
          id?: string
          lieu?: string | null
          niveau_id: string
          titre: string
          updated_at?: string
        }
        Update: {
          affiche_url?: string | null
          created_at?: string
          date_evenement?: string
          description?: string | null
          id?: string
          lieu?: string | null
          niveau_id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evenements_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaux"
            referencedColumns: ["id"]
          },
        ]
      }
      filieres: {
        Row: {
          created_at: string
          etablissement_id: string
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          etablissement_id: string
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          etablissement_id?: string
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "filieres_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filieres_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements_public"
            referencedColumns: ["id"]
          },
        ]
      }
      matieres: {
        Row: {
          coefficient: number
          created_at: string
          credits: number
          id: string
          niveau_id: string
          nom: string
          updated_at: string
        }
        Insert: {
          coefficient?: number
          created_at?: string
          credits?: number
          id?: string
          niveau_id: string
          nom: string
          updated_at?: string
        }
        Update: {
          coefficient?: number
          created_at?: string
          credits?: number
          id?: string
          niveau_id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matieres_niveau_id_fkey"
            columns: ["niveau_id"]
            isOneToOne: false
            referencedRelation: "niveaux"
            referencedColumns: ["id"]
          },
        ]
      }
      niveaux: {
        Row: {
          created_at: string
          filiere_id: string
          id: string
          nom: string
          ordre: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          filiere_id: string
          id?: string
          nom: string
          ordre?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          filiere_id?: string
          id?: string
          nom?: string
          ordre?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "niveaux_filiere_id_fkey"
            columns: ["filiere_id"]
            isOneToOne: false
            referencedRelation: "filieres"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          commentaire: string | null
          created_at: string
          etudiant_user_id: string
          id: string
          matiere_id: string
          type_evaluation: string
          updated_at: string
          valeur: number
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          etudiant_user_id: string
          id?: string
          matiere_id: string
          type_evaluation?: string
          updated_at?: string
          valeur: number
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          etudiant_user_id?: string
          id?: string
          matiere_id?: string
          type_evaluation?: string
          updated_at?: string
          valeur?: number
        }
        Relationships: [
          {
            foreignKeyName: "notes_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          date_naissance: string | null
          email: string
          id: string
          inscrit: boolean
          nom_complet: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_naissance?: string | null
          email: string
          id?: string
          inscrit?: boolean
          nom_complet?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_naissance?: string | null
          email?: string
          id?: string
          inscrit?: boolean
          nom_complet?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          etablissement_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          etablissement_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          etablissement_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_etablissement_id_fkey"
            columns: ["etablissement_id"]
            isOneToOne: false
            referencedRelation: "etablissements_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      etablissements_public: {
        Row: {
          id: string | null
          nom: string | null
          statut: string | null
        }
        Insert: {
          id?: string | null
          nom?: string | null
          statut?: string | null
        }
        Update: {
          id?: string | null
          nom?: string | null
          statut?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      etablissement_of_admin: { Args: { _user_id: string }; Returns: string }
      etablissement_of_niveau: { Args: { _niveau_id: string }; Returns: string }
      enregistrer_audit: {
        Args: {
          _action: string
          _ancienne_valeur: Json | null
          _description: string
          _etablissement_id: string | null
          _nouvelle_valeur: Json | null
          _record_id: string | null
          _table_name: string
        }
        Returns: string
      }
      get_announcement_comments: {
        Args: { p_announcement_id: string }
        Returns: {
          author_name: string | null
          content: string
          created_at: string
          id: string
          user_id: string
        }[]
      }
      finaliser_inscription_admin: {
        Args: { _pre_autorisation_id: string }
        Returns: undefined
      }
      finaliser_inscription_etudiant: {
        Args: { _pre_inscription_id: string }
        Returns: undefined
      }
      finaliser_inscription_super_admin: {
        Args: { _super_admin_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_of_etablissement: {
        Args: { _etab_id: string; _user_id: string }
        Returns: boolean
      }
      is_etudiant_of_niveau: {
        Args: { _niveau_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      niveau_of_etudiant: { Args: { _user_id: string }; Returns: string }
      verifier_admin_pre_autorise: {
        Args: {
          _date_naissance: string
          _email: string
          _etablissement_id: string
          _nom_complet: string
        }
        Returns: {
          deja_inscrit: boolean
          pre_autorisation_id: string
        }[]
      }
      verifier_etudiant_pre_inscrit: {
        Args: {
          _date_naissance: string
          _email: string
          _etablissement_id: string
          _filiere_id: string
          _niveau_id: string
          _nom_complet: string
        }
        Returns: {
          deja_inscrit: boolean
          pre_inscription_id: string
        }[]
      }
      verifier_super_admin_pre_autorise: {
        Args: { _date_naissance: string; _email: string; _nom_complet: string }
        Returns: {
          deja_inscrit: boolean
          super_admin_id: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "etudiant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "etudiant"],
    },
  },
} as const
