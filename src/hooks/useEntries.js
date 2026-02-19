import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Manages log entries for the current user.
 * Entries are fetched once on mount and kept in local state,
 * with optimistic updates for add/delete operations.
 */
export function useEntries(userId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEntries = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
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
  }, [userId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  /**
   * Insert a new entry and prepend it to local state.
   * Returns the full inserted row (including generated id + created_at).
   */
  const addEntry = async (entryData) => {
    const { data, error } = await supabase
      .from('entries')
      .insert({ user_id: userId, ...entryData })
      .select()
      .single()

    if (error) throw error

    setEntries((prev) => [data, ...prev])
    return data
  }

  /**
   * Delete an entry and remove it from local state.
   */
  const deleteEntry = async (id) => {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return {
    entries,
    loading,
    error,
    addEntry,
    deleteEntry,
    refetch: fetchEntries,
  }
}
