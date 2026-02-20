import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Manages the user's profile (onboarding answers + Pro status).
 * `profile` is null until onboarding is complete — App.jsx uses this
 * to decide whether to show the onboarding flow.
 */
export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // PGRST116 = "no rows found", expected before onboarding
    if (error && error.code !== 'PGRST116') {
      console.error('[useProfile] fetch error:', error.message)
    }

    setProfile(data ?? null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  /**
   * Create or update the profile row.
   * Used by Onboarding on final step submit.
   */
  const saveProfile = async (profileData) => {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profileData })
      .select()
      .single()

    if (error) throw error

    setProfile(data)
    return data
  }

  /**
   * Re-fetch the profile from Supabase.
   * Called after a successful Stripe payment to pick up is_pro = true.
   */
  const refreshProfile = useCallback(() => fetchProfile(), [fetchProfile])

  return { profile, loading, saveProfile, refreshProfile }
}
