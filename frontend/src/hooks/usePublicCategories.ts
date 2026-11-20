import { useEffect, useState } from 'react'
import { listAllCategories } from '../lib/api'
import type { Category } from '../types/category'

/** Fetch the complete public category catalog, including catalogs larger than one API page. */
export function usePublicCategories() {
  const [revision, setRevision] = useState(0)
  const [response, setResponse] = useState<{ revision: number; data: Category[]; error: boolean } | null>(null)
  useEffect(() => {
    let active = true

    // This hook is used by the public landing page. Do not abort the request
    // during effect cleanup: React StrictMode intentionally mounts effects,
    // cleans them up, and mounts them again in development. Aborting there
    // makes Firefox report the first perfectly valid GET as NS_BINDING_ABORTED
    // even though the API is healthy. The active flag still prevents a late
    // response from updating an unmounted page.
    listAllCategories()
      .then(data => { if (active) setResponse({ revision, data, error: false }) })
      .catch(() => { if (active) setResponse({ revision, data: [], error: true }) })
    return () => { active = false }
  }, [revision])
  const current = response?.revision === revision ? response : null
  return {
    data: current?.data ?? [], loading: current === null, error: current?.error ?? false,
    reload: () => setRevision(value => value + 1),
  }
}
