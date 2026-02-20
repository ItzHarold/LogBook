import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useLogbooks(userId) {
  const [logbooks, setLogbooks]           = useState([])
  const [activeLogbookId, setActiveLogbookId] = useState(null)
  const [loading, setLoading]             = useState(true)

  const fetchLogbooks = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('logbooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!error && data?.length) {
      setLogbooks(data)
      // Keep current selection if it still exists, else default to first
      setActiveLogbookId((prev) =>
        prev && data.find((l) => l.id === prev) ? prev : data[0].id
      )
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchLogbooks() }, [fetchLogbooks])

  const addLogbook = async ({ name, organization, default_location }) => {
    const { data, error } = await supabase
      .from('logbooks')
      .insert({ user_id: userId, name, organization, default_location })
      .select()
      .single()
    if (error) throw error
    setLogbooks((prev) => [...prev, data])
    setActiveLogbookId(data.id)
    return data
  }

  const activeLogbook = logbooks.find((l) => l.id === activeLogbookId) ?? null

  return {
    logbooks,
    activeLogbook,
    setActiveLogbookId,
    addLogbook,
    loading,
    refetch: fetchLogbooks,
  }
}
