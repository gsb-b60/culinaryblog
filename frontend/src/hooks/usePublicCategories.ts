import { useEffect, useState } from 'react'
import { listAllCategories } from '../lib/api'
import type { Category } from '../types/category'

/** Fetch the complete public category catalog, including catalogs larger than one API page. */
export function usePublicCategories() {
  const [revision, setRevision] = useState(0)
  const [response, setResponse] = useState<{ revision: number; data: Category[]; error: boolean } | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    listAllCategories(controller.signal)
      .then(data => { if (active) setResponse({ revision, data, error: false }) })
      .catch(() => { if (active) setResponse({ revision, data: [], error: true }) })
    return () => { active = false; controller.abort() }
  }, [revision])
  const current = response?.revision === revision ? response : null
  return {
    data: current?.data ?? [], loading: current === null, error: current?.error ?? false,
    reload: () => setRevision(value => value + 1),
  }
}
