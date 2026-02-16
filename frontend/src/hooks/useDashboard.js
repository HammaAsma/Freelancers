import { useEffect, useState } from "react";
import api from "../api/client";

export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await api.get("/dashboard");
        if (!cancelled) {
          setData(res.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Erreur de chargement du dashboard"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
