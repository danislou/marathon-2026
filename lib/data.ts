export const PHASES = [
  { id: 1, name: 'Base Building', color: '#4ade80', weeks: 8, startKm: 35, endKm: 55, months: 'Mar–May' },
  { id: 2, name: 'Aerobic Dev.', color: '#60a5fa', weeks: 8, startKm: 55, endKm: 70, months: 'May–Jul' },
  { id: 3, name: 'Marathon Pace', color: '#fbbf24', weeks: 8, startKm: 65, endKm: 80, months: 'Jul–Sep' },
  { id: 4, name: 'Peak Training', color: '#f87171', weeks: 8, startKm: 70, endKm: 85, months: 'Sep–Nov' },
  { id: 5, name: 'Taper & Race', color: '#a78bfa', weeks: 8, startKm: 25, endKm: 55, months: 'Nov–Dec' },
]

export type DayTemplate = { day: string; type: string; desc: string }

export const DAY_TEMPLATES: Record<number, DayTemplate[]> = {
  1: [
    { day: 'Mon', type: 'rest', desc: 'Rest or light cross-training — yoga, swimming, or a gentle walk.' },
    { day: 'Tue', type: 'easy', desc: "Easy run 8 km at comfortable conversation pace. If you can't hold a sentence, slow down." },
    { day: 'Wed', type: 'speed', desc: 'Strides session — 5 km easy then 6 × 100m strides with full recovery between each.' },
    { day: 'Thu', type: 'easy', desc: 'Easy run 7 km + 20 min core strength work (planks, glute bridges, dead bugs).' },
    { day: 'Fri', type: 'rest', desc: 'Rest. Prioritise sleep — this is when your body adapts.' },
    { day: 'Sat', type: 'tempo', desc: 'Tempo run: 3 km warm-up + 4 km at comfortably hard effort + 3 km cool-down.' },
    { day: 'Sun', type: 'long', desc: 'Long run 13 km at easy effort. No GPS pressure — just time on feet.' },
  ],
  2: [
    { day: 'Mon', type: 'rest', desc: 'Rest or yoga/stretching session.' },
    { day: 'Tue', type: 'easy', desc: 'Easy run 10 km. Build your aerobic base — keep the effort genuinely easy.' },
    { day: 'Wed', type: 'speed', desc: 'Track intervals: 6 × 800m at 10K pace with 90 sec jog recovery.' },
    { day: 'Thu', type: 'easy', desc: 'Recovery run 8 km — very slow, flush the legs from yesterday.' },
    { day: 'Fri', type: 'easy', desc: 'Easy run 8 km + strength training (single-leg squats, calf raises).' },
    { day: 'Sat', type: 'tempo', desc: 'Tempo 10 km: 2 km warm-up + 6 km at lactate threshold + 2 km cool-down.' },
    { day: 'Sun', type: 'long', desc: 'Long run 17 km. Focus on even pacing and good form in the final 4 km.' },
  ],
  3: [
    { day: 'Mon', type: 'rest', desc: 'Full rest — protect recovery after the long run.' },
    { day: 'Tue', type: 'easy', desc: 'Easy run 14 km — aerobic base maintenance.' },
    { day: 'Wed', type: 'speed', desc: 'Marathon pace intervals: 3 × 5 km at goal marathon pace, 3 min jog between each.' },
    { day: 'Thu', type: 'easy', desc: 'Recovery run 8 km very easy + mobility work and hip flexor stretches.' },
    { day: 'Fri', type: 'tempo', desc: 'Tempo 12 km: 2 warm-up + 8 km at lactate threshold + 2 cool-down.' },
    { day: 'Sat', type: 'easy', desc: 'Easy 6 km shakeout + strength training.' },
    { day: 'Sun', type: 'long', desc: 'Long run 25 km — run final 8 km at marathon pace (progression run).' },
  ],
  4: [
    { day: 'Mon', type: 'rest', desc: 'Full rest. No "just a short one" — the rest is the training.' },
    { day: 'Tue', type: 'easy', desc: "Easy run 16 km. Keep it truly easy — you'll need the legs for Sunday." },
    { day: 'Wed', type: 'speed', desc: '2 × 10 km at marathon goal pace with 5 min rest.' },
    { day: 'Thu', type: 'easy', desc: 'Recovery run 8 km + foam rolling every major muscle group.' },
    { day: 'Fri', type: 'tempo', desc: 'Tempo 13 km: 2 warm-up + 9 km threshold + 2 cool-down.' },
    { day: 'Sat', type: 'easy', desc: 'Easy 8 km + strength training.' },
    { day: 'Sun', type: 'long', desc: 'Long run 32 km — your longest run of the entire plan. Fuel every 45 min.' },
  ],
  5: [
    { day: 'Mon', type: 'rest', desc: 'Full rest. Trust the taper — resist the urge to do more.' },
    { day: 'Tue', type: 'easy', desc: 'Easy run 10 km — enjoy the reduced load, legs should feel springy.' },
    { day: 'Wed', type: 'speed', desc: "Short sharpener: 4 × 1 km at 10K pace. Stay sharp, don't fatigue." },
    { day: 'Thu', type: 'easy', desc: 'Easy run 8 km + light stretching.' },
    { day: 'Fri', type: 'rest', desc: 'Rest or a very light 20 min jog to stay loose.' },
    { day: 'Sat', type: 'tempo', desc: 'Tune-up 8 km: 2 easy + 4 km at marathon pace + 2 easy.' },
    { day: 'Sun', type: 'long', desc: 'Long run 18 km — relaxed, confident. The hay is in the barn.' },
  ],
}

export type Week = {
  num: number
  phase: number
  km: number
  isRecovery: boolean
  isPeak: boolean
  template: DayTemplate[]
}

export const weeks: Week[] = []
let wNum = 0
PHASES.forEach((p, pi) => {
  for (let w = 0; w < p.weeks; w++) {
    wNum++
    const isRecovery = (w + 1) % 4 === 0
    const isPeak = pi === 3 && w === 6
    const t = p.weeks > 1 ? w / (p.weeks - 1) : 0
    let km = Math.round(p.startKm + t * (p.endKm - p.startKm))
    if (isRecovery) km = Math.round(km * 0.78)
    weeks.push({ num: wNum, phase: p.id, km, isRecovery, isPeak, template: DAY_TEMPLATES[p.id] })
  }
})

// Today detection — plan starts Monday March 2, 2026
export function getTodayInfo() {
  const START_DATE = new Date('2026-03-02T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysSinceStart = Math.floor((today.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24))
  const totalPlanDays = 40 * 7
  const isTodayInPlan = daysSinceStart >= 0 && daysSinceStart < totalPlanDays
  return {
    isTodayInPlan,
    currentWeekNum: isTodayInPlan ? Math.min(40, Math.floor(daysSinceStart / 7) + 1) : 1,
    currentDayIdx: isTodayInPlan ? daysSinceStart % 7 : -1,
  }
}
