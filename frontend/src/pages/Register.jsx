import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function Register() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!first) return setErrors((p) => ({ ...p, first: "Prénom requis" }));
    if (!last) return setErrors((p) => ({ ...p, last: "Nom requis" }));
    if (!email) return setErrors((p) => ({ ...p, email: "Email requis" }));
    if (!password || password.length < 6)
      return setErrors((p) => ({
        ...p,
        password: "6 caractères minimum",
      }));

    try {
      setIsLoading(true);
      await signup(email, password, first, last);
      navigate("/login", { replace: true });
    } catch (err) {
      setErrors((p) => ({
        ...p,
        form: "Impossible de créer le compte. Réessaie.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-page relative flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="font-display text-2xl font-bold text-base-content">
              Free<span className="text-primary">Lance</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-base-content/60">
            Créez votre compte en quelques clics
          </p>
        </div>

        <div className="rounded-2xl border border-base-300/60 bg-base-100 shadow-xl shadow-base-content/5 p-6 sm:p-8">
          <form className="space-y-5" onSubmit={submit}>
            <h2 className="text-xl font-semibold text-base-content">
              Créer un compte
            </h2>

            {errors.form && (
              <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
                {errors.form}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label py-0">
                  <span className="label-text font-medium">Prénom</span>
                </label>
                <input
                  id="first"
                  type="text"
                  placeholder="Prénom"
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                  className={`input input-bordered w-full rounded-xl h-11 ${
                    errors.first ? "input-error" : ""
                  }`}
                  required
                />
                {errors.first && (
                  <p className="mt-1 text-xs text-error">{errors.first}</p>
                )}
              </div>
              <div className="form-control">
                <label className="label py-0">
                  <span className="label-text font-medium">Nom</span>
                </label>
                <input
                  id="last"
                  type="text"
                  placeholder="Nom"
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                  className={`input input-bordered w-full rounded-xl h-11 ${
                    errors.last ? "input-error" : ""
                  }`}
                  required
                />
                {errors.last && (
                  <p className="mt-1 text-xs text-error">{errors.last}</p>
                )}
              </div>
            </div>

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
                <span className="label-text-alt">6 caractères min.</span>
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
                className="btn btn-primary w-full rounded-xl h-11 font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Création..." : "S'inscrire"}
              </button>
            </div>

            <p className="text-center text-sm text-base-content/70 pt-2">
              Déjà un compte ?{" "}
              <Link to="/login" className="link link-primary font-medium">
                Se connecter
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
