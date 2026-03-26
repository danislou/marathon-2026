'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { weeks, PHASES, getTodayInfo } from '@/lib/data'
import { Agentation } from 'agentation'

type DayData = { done: boolean; km: string; mins: string; note: string }
type Store = Record<string, DayData>

const STORE_KEY = 'marathon_tracker_v1'
const TYPE_LABELS: Record<string, string> = {
  easy: 'Easy', tempo: 'Tempo', long: 'Long run', speed: 'Speed', rest: 'Rest',
}

function loadStore(): Store {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || {} } catch { return {} }
}
function saveStore(s: Store) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)) } catch {}
}
function emptyDay(): DayData { return { done: false, km: '', mins: '', note: '' } }
function calcPace(km: string, mins: string): string | null {
  const k = parseFloat(km), m = parseFloat(mins)
  if (!k || !m || k <= 0) return null
  const t = m / k
  return `${Math.floor(t)}:${String(Math.round((t - Math.floor(t)) * 60)).padStart(2, '0')} /km`
}

export default function Page() {
  const [activePhase, setActivePhase] = useState(1)
  const [activeWeek, setActiveWeek] = useState(1)
  const [store, setStore] = useState<Store>({})
  const [mounted, setMounted] = useState(false)
  const todayCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { currentWeekNum, isTodayInPlan } = getTodayInfo()
    setStore(loadStore())
    setActiveWeek(currentWeekNum)
    setActivePhase(weeks.find(w => w.num === currentWeekNum)?.phase ?? 1)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const timer = setTimeout(() => {
      todayCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
    return () => clearTimeout(timer)
  }, [activeWeek, mounted])

  const getDay = useCallback((weekNum: number, dayIdx: number): DayData =>
    store[`w${weekNum}_d${dayIdx}`] || emptyDay(), [store])

  const updateDay = useCallback((weekNum: number, dayIdx: number, data: DayData) => {
    setStore(prev => {
      const next = { ...prev, [`w${weekNum}_d${dayIdx}`]: data }
      saveStore(next)
      return next
    })
  }, [])

  const { isTodayInPlan, currentWeekNum, currentDayIdx } = getTodayInfo()

  // Global stats
  let totalKm = 0, totalRuns = 0, weeksCompleted = 0
  weeks.forEach(w => {
    let doneCount = 0
    w.template.forEach((d, i) => {
      const day = getDay(w.num, i)
      if (day.done) { doneCount++; totalRuns++; totalKm += parseFloat(day.km) || 0 }
    })
    const nonRest = w.template.filter(d => d.type !== 'rest').length
    if (doneCount >= nonRest && nonRest > 0) weeksCompleted++
  })
  const totalDays = weeks.reduce((s, w) => s + w.template.filter(d => d.type !== 'rest').length, 0)
  const overallPct = totalRuns > 0 ? Math.round((totalRuns / totalDays) * 100) : 0

  // Current week
  const currentWeekData = weeks.find(x => x.num === activeWeek)
  const currentPhaseData = currentWeekData ? PHASES[currentWeekData.phase - 1] : null
  const isThisWeek = activeWeek === currentWeekNum && isTodayInPlan
  const visibleWeeks = activePhase > 0 ? weeks.filter(w => w.phase === activePhase) : weeks

  let doneKm = 0, doneRuns = 0
  currentWeekData?.template.forEach((_, i) => {
    const day = getDay(activeWeek, i)
    if (day.done) { doneRuns++; doneKm += parseFloat(day.km) || 0 }
  })
  const nonRest = currentWeekData?.template.filter(d => d.type !== 'rest').length ?? 0
  const weekPct = nonRest > 0 ? Math.round((doneRuns / nonRest) * 100) : 0

  function selectWeek(num: number) {
    setActiveWeek(num)
    const found = weeks.find(x => x.num === num)
    if (found) setActivePhase(found.phase)
  }

  function onPhaseSelect(val: string) {
    const phaseId = parseInt(val)
    setActivePhase(phaseId)
    if (phaseId > 0) {
      const first = weeks.find(w => w.phase === phaseId)
      if (first) setActiveWeek(first.num)
    }
  }

  if (!mounted) return null

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <div>
            <h1>Danis' <span>Marathon</span><br />Training Plan</h1>
            <div className="header-meta">March 2026 → December 2026 · 5 days/week</div>
          </div>
          <div className="header-stats">
            <div className="stat-pill">
              <div className="val">{weeksCompleted}</div>
              <div className="lbl">Weeks done</div>
            </div>
            <div className="stat-pill">
              <div className="val">{Math.round(totalKm)}</div>
              <div className="lbl">km logged</div>
            </div>
            <div className="stat-pill">
              <div className="val">{totalRuns}</div>
              <div className="lbl">Runs completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-wrap">
        <div className="progress-label">
          <span>Overall progress</span>
          <span>{overallPct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* Nav selects */}
      <div className="nav-selects">
        <button className="btn-today" onClick={() => isTodayInPlan && selectWeek(currentWeekNum)}>
          ↗ Today
        </button>
        <div className="nav-select-wrap">
          <select className="nav-select" value={activePhase} onChange={e => onPhaseSelect(e.target.value)}>
            <option value={0}>All phases</option>
            {PHASES.map(p => (
              <option key={p.id} value={p.id}>{p.name} · {p.months}</option>
            ))}
          </select>
        </div>
        <div className="nav-select-wrap">
          <select className="nav-select" value={activeWeek} onChange={e => selectWeek(parseInt(e.target.value))}>
            {visibleWeeks.map(w => (
              <option key={w.num} value={w.num}>
                {w.isRecovery ? `W${w.num} · Recovery · ${w.km} km`
                  : w.isPeak ? `W${w.num} · Peak · ${w.km} km`
                  : `Week ${w.num} · ${w.km} km`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main */}
      <div className="main">
        <div className="content">
          {currentWeekData && currentPhaseData ? (
            <>
              <div className="week-header">
                <div>
                  <div className="week-title">
                    Week {activeWeek}{' '}
                    <small style={{ color: currentPhaseData.color }}>{currentPhaseData.name}</small>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {currentWeekData.isRecovery && (
                    <span className="week-badge recovery-badge">Recovery week</span>
                  )}
                  {currentWeekData.isPeak && (
                    <span className="week-badge peak-badge">Peak week</span>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {currentWeekData.km} km planned
                  </span>
                </div>
              </div>

              <div className="week-summary">
                <div className="sum-item">
                  <div className="sum-val">{Math.round(doneKm)}</div>
                  <div className="sum-lbl">km logged</div>
                </div>
                <div className="sum-item">
                  <div className="sum-val">{doneRuns}/{nonRest}</div>
                  <div className="sum-lbl">runs done</div>
                </div>
                <div className="sum-bar-wrap">
                  <div className="sum-bar-label">
                    <span>Week progress</span>
                    <span>{weekPct}%</span>
                  </div>
                  <div className="sum-bar-track">
                    <div className="sum-bar-fill" style={{ width: `${weekPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="days-grid">
                {currentWeekData.template.map((d, i) => {
                  const day = getDay(activeWeek, i)
                  const isRest = d.type === 'rest'
                  const isToday = isThisWeek && i === currentDayIdx
                  const pace = calcPace(day.km, day.mins)

                  return (
                    <div
                      key={i}
                      ref={isToday ? todayCardRef : null}
                      className={[
                        'day-card',
                        day.done ? 'done-card' : '',
                        isRest ? 'rest-card' : '',
                        isToday ? 'today-card' : '',
                      ].join(' ')}
                    >
                      <div className="day-top">
                        <span className="day-name">{d.day}</span>
                        <span className={`day-tag tag-${d.type}`}>{TYPE_LABELS[d.type]}</span>
                        {isToday && <span className="today-badge">Today</span>}
                        <span className="day-desc">{d.desc}</span>
                      </div>

                      {isRest ? (
                        <div className="day-actions">
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                            Rest — no logging needed
                          </span>
                        </div>
                      ) : day.done ? (
                        // Done state — structured labels + values
                        <div className="day-actions">
                          <div className="log-area">
                            <div className="log-field-group">
                              <div className="log-field-label">Distance</div>
                              <div className="pace-display">{day.km || '—'} km</div>
                            </div>
                            <div className="log-field-group">
                              <div className="log-field-label">Duration</div>
                              <div className="pace-display">{day.mins || '—'} min</div>
                            </div>
                            <div className="log-field-group">
                              <div className="log-field-label">Pace</div>
                              <div className="pace-display">{pace || '—'}</div>
                            </div>
                            <div className="log-field-group">
                              <div className="log-field-label">Feel</div>
                              <div className="pace-display">{day.note || '—'}</div>
                            </div>
                          </div>
                          <button
                            className="btn-done active"
                            onClick={() => updateDay(activeWeek, i, { ...day, done: false })}
                          >
                            ✓ Done
                          </button>
                        </div>
                      ) : (
                        // Input state
                        <div className="day-actions">
                          <div className="log-area">
                            <div className="log-field-group">
                              <div className="log-field-label">Distance</div>
                              <input
                                className="log-input"
                                type="number"
                                placeholder="km"
                                value={day.km}
                                min={0}
                                step={0.1}
                                onChange={e => updateDay(activeWeek, i, { ...day, km: e.target.value })}
                              />
                            </div>
                            <div className="log-field-group">
                              <div className="log-field-label">Duration</div>
                              <input
                                className="log-input"
                                type="number"
                                placeholder="min"
                                value={day.mins}
                                min={0}
                                step={1}
                                onChange={e => updateDay(activeWeek, i, { ...day, mins: e.target.value })}
                              />
                            </div>
                            <div className="log-field-group">
                              <div className="log-field-label">Feel</div>
                              <div className="nav-select-wrap" style={{ flex: 'none' }}>
                                <select
                                  className="nav-select"
                                  style={{ fontSize: 11, padding: '5px 28px 5px 10px' }}
                                  value={day.note}
                                  onChange={e => updateDay(activeWeek, i, { ...day, note: e.target.value })}
                                >
                                  <option value="">Select…</option>
                                  {['Easy', 'Good', 'Hard', 'Great', 'Tired', 'Rough'].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                          <button
                            className="btn-done"
                            onClick={() => updateDay(activeWeek, i, { ...day, done: true })}
                          >
                            Mark done
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="big">42.2</div>
              <div>Select a week to get started</div>
            </div>
          )}
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && <Agentation endpoint="http://localhost:4747" />}
    </>
  )
}
