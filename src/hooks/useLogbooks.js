import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function slugify(label) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}

export function useLogbooks(userId) {
  const [logbooks, setLogbooks]             = useState([])
  const [fields, setFields]                 = useState({})   // { logbook_id: [field, ...] }
  const [activeLogbookId, setActiveLogbookId] = useState(null)
  const [loading, setLoading]               = useState(true)

  const fetchAll = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    const [{ data: lbs }, { data: flds }] = await Promise.all([
      supabase.from('logbooks').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('logbook_fields').select('*').order('position', { ascending: true }),
    ])

    if (lbs?.length) {
      setLogbooks(lbs)
      setActiveLogbookId((prev) =>
        prev && lbs.find((l) => l.id === prev) ? prev : lbs[0].id
      )
    }

    if (flds) {
      const byLogbook = {}
      flds.forEach((f) => {
        if (!byLogbook[f.logbook_id]) byLogbook[f.logbook_id] = []
        byLogbook[f.logbook_id].push(f)
      })
      setFields(byLogbook)
    }

    setLoading(false)
  }, [userId])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Create logbook + its fields in one transaction
  const addLogbook = async ({ name, organization, default_location, fields: fieldDefs = [] }) => {
    const { data: lb, error: lbErr } = await supabase
      .from('logbooks')
      .insert({ user_id: userId, name, organization, default_location })
      .select()
      .single()
    if (lbErr) throw lbErr

    let savedFields = []
    if (fieldDefs.length) {
      const rows = fieldDefs.map((f, i) => ({
        logbook_id: lb.id,
        label:      f.label,
        field_key:  slugify(f.label) || `field_${i}`,
        type:       f.type,
        required:   f.required ?? false,
        options:    f.options ?? null,
        position:   i,
      }))
      const { data: fData, error: fErr } = await supabase
        .from('logbook_fields')
        .insert(rows)
        .select()
      if (fErr) throw fErr
      savedFields = fData ?? []
    }

    setLogbooks((prev) => [...prev, lb])
    setFields((prev) => ({ ...prev, [lb.id]: savedFields }))
    setActiveLogbookId(lb.id)
    return { ...lb, fields: savedFields }
  }

  const deleteLogbook = async (id) => {
    const { error } = await supabase.from('logbooks').delete().eq('id', id)
    if (error) throw error
    setLogbooks((prev) => {
      const remaining = prev.filter((l) => l.id !== id)
      if (activeLogbookId === id && remaining.length) {
        setActiveLogbookId(remaining[0].id)
      }
      return remaining
    })
    setFields((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const activeLogbook = logbooks.find((l) => l.id === activeLogbookId) ?? null
  const activeFields  = activeLogbook ? (fields[activeLogbook.id] ?? []) : []

  return {
    logbooks,
    activeLogbook,
    activeFields,
    setActiveLogbookId,
    addLogbook,
    deleteLogbook,
    loading,
    refetch: fetchAll,
  }
}
