import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      setIsLoading(true);
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setErrors({ form: "Email ou mot de passe invalide" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-page relative flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Titre */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="font-display text-2xl font-bold text-base-content">
              Free<span className="text-primary">Lance</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-base-content/60">
            Connectez-vous à votre espace
          </p>
        </div>

        <div className="rounded-2xl border border-base-300/60 bg-base-100 shadow-xl shadow-base-content/5 p-6 sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold text-base-content">
              Connexion
            </h2>

            {errors.form && (
              <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
                {errors.form}
              </div>
            )}

            <div className="form-control">
              <label className="label" htmlFor="email">
                <span className="label-text font-medium">Email</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input input-bordered w-full rounded-xl h-11 ${
                  errors.email ? "input-error" : ""
                }`}
                required
              />
              {errors.email && (
                <p className="mt-1 text-xs text-error">{errors.email}</p>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="password">
                <span className="label-text font-medium">Mot de passe</span>
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input input-bordered w-full rounded-xl h-11 ${
                  errors.password ? "input-error" : ""
                }`}
                required
              />
              {errors.password && (
                <p className="mt-1 text-xs text-error">{errors.password}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full rounded-xl h-11 font-medium"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </button>
            </div>

            <p className="text-center text-sm text-base-content/70 pt-2">
              Pas encore de compte ?{" "}
              <Link to="/register" className="link link-primary font-medium">
                Créer un compte
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
