import { useEffect, useState, useCallback } from 'react';
import { helmetService } from '../services/helmetService.js';
import { getErrorMessage } from '../services/api.js';

export function useHelmets({ autoLoad = true } = {}) {
  const [helmets, setHelmets] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await helmetService.list(params);
      setHelmets(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  return { helmets, loading, error, reload: load };
}