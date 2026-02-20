import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useEntries(userId, logbookId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchEntries = useCallback(async () => {
    if (!userId || !logbookId) { setLoading(false); return }

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .eq('logbook_id', logbookId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[useEntries] fetch error:', error.message)
      setError(error.message)
      setLoading(false)
      return
    }

    setEntries(data ?? [])
    setLoading(false)
  }, [userId, logbookId])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const addEntry = async (entryData) => {
    const { data, error } = await supabase
      .from('entries')
      .insert({ user_id: userId, logbook_id: logbookId, ...entryData })
      .select()
      .single()
    if (error) throw error
    setEntries((prev) => [data, ...prev])
    return data
  }

  const deleteEntry = async (id) => {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return { entries, loading, error, addEntry, deleteEntry, refetch: fetchEntries }
}
