import { useEffect, useState } from "react";
import axios from "../api/client";
import { Loader2, User, Lock, Building2 } from "lucide-react";

export default function AccountSettings() {
  const [profile, setProfile] = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    address: "",
    tax_id: "",
    currency: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileMessage, setProfileMessage] = useState(null);
  const [companyMessage, setCompanyMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Charger le profil du user connecté
  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await axios.get("/users/profile");
      const data = res.data.data;

      setProfile(data);

      setProfileForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
      });

      setCompanyForm({
        company_name: data.company_name || "",
        address: data.address || "",
        tax_id: data.tax_id || "",
        currency: data.currency || "",
      });
    } catch (e) {
      console.error("error fetch profile", e);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Enregistrer profil (nom, prénom, email)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);
    try {
      const res = await axios.put("/users/profile", profileForm);
      const updated = res.data.data;

      setProfile(updated);
      setProfileForm({
        first_name: updated.first_name || "",
        last_name: updated.last_name || "",
        email: updated.email || "",
      });

      // synchro éventuelle avec localStorage si tu utilises ça pour le header
      const stored = localStorage.getItem("user");
      if (stored) {
        const prev = JSON.parse(stored);
        localStorage.setItem("user", JSON.stringify({ ...prev, ...updated }));
      }

      setProfileMessage("Profil mis à jour avec succès.");
    } catch (e) {
      console.error("error save profile", e);
      const msg =
        e.response?.data?.message || "Erreur lors de la mise à jour du profil.";
      setProfileMessage(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Enregistrer infos entreprise / tarif
  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setCompanyMessage(null);
    setSavingCompany(true);
    try {
      const res = await axios.put("/users/profile", companyForm);
      const updated = res.data.data;

      setProfile((prev) => ({ ...prev, ...updated }));
      setCompanyForm({
        company_name: updated.company_name || "",
        address: updated.address || "",
        tax_id: updated.tax_id || "",
        currency: updated.currency || "",
      });

      const stored = localStorage.getItem("user");
      if (stored) {
        const prev = JSON.parse(stored);
        localStorage.setItem("user", JSON.stringify({ ...prev, ...updated }));
      }

      setCompanyMessage("Informations mises à jour avec succès.");
    } catch (e) {
      console.error("error save company", e);
      const msg =
        e.response?.data?.message ||
        "Erreur lors de la mise à jour des informations.";
      setCompanyMessage(msg);
    } finally {
      setSavingCompany(false);
    }
  };

  // Changer mot de passe
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await axios.put("/users/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordMessage(
        res.data?.message || "Mot de passe mis à jour avec succès."
      );
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (e) {
      console.error("error change password", e);
      const msg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        "Erreur lors du changement de mot de passe.";
      setPasswordError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingProfile && !profile) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-base-content/60">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Chargement du profil...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h1 className="text-2xl font-semibold">Paramètres du compte</h1>
      </div>

      {/* Card Profil */}
      <div className="rounded-2xl bg-base-200/60 border border-base-300/70 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Profil</h2>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Prénom</label>
              <input
                className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={profileForm.first_name}
                onChange={(e) =>
                  setProfileForm((f) => ({
                    ...f,
                    first_name: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Nom</label>
              <input
                className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={profileForm.last_name}
                onChange={(e) =>
                  setProfileForm((f) => ({
                    ...f,
                    last_name: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </div>

          {profileMessage && (
            <p className="text-[11px] text-base-content/70">{profileMessage}</p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-content hover:brightness-110 disabled:opacity-40"
            >
              {savingProfile && <Loader2 className="h-3 w-3 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      {/* Card Entreprise / Tarif */}
      <div className="rounded-2xl bg-base-200/60 border border-base-300/70 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Entreprise & facturation</h2>
            <p className="text-xs text-base-content/60">
              Informations de société et devise de facturation.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveCompany} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block">
              Nom de l’entreprise
            </label>
            <input
              className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={companyForm.company_name}
              onChange={(e) =>
                setCompanyForm((f) => ({
                  ...f,
                  company_name: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Adresse</label>
            <input
              className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={companyForm.address}
              onChange={(e) =>
                setCompanyForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">
              N° fiscal / TVA
            </label>
            <input
              className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={companyForm.tax_id}
              onChange={(e) =>
                setCompanyForm((f) => ({ ...f, tax_id: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Devise</label>
            <select
              className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={companyForm.currency}
              onChange={(e) =>
                setCompanyForm((f) => ({ ...f, currency: e.target.value }))
              }
            >
              <option value="">Sélectionner une devise</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          {companyMessage && (
            <p className="text-[11px] text-base-content/70">{companyMessage}</p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingCompany}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-content hover:brightness-110 disabled:opacity-40"
            >
              {savingCompany && <Loader2 className="h-3 w-3 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      {/* Card Mot de passe */}
      <div className="rounded-2xl bg-base-200/60 border border-base-300/70 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Sécurité</h2>
            <p className="text-xs text-base-content/60">
              Modifier le mot de passe de votre compte.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block">
              Mot de passe actuel
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({
                  ...f,
                  currentPassword: e.target.value,
                }))
              }
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({
                  ...f,
                  newPassword: e.target.value,
                }))
              }
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({
                  ...f,
                  confirmPassword: e.target.value,
                }))
              }
              required
            />
          </div>

          {passwordError && (
            <p className="text-[11px] text-red-400">{passwordError}</p>
          )}
          {passwordMessage && (
            <p className="text-[11px] text-emerald-400">{passwordMessage}</p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-content hover:brightness-110 disabled:opacity-40"
            >
              {savingPassword && <Loader2 className="h-3 w-3 animate-spin" />}
              Mettre à jour le mot de passe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
