import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { MEALS, ALL_MEALS, TARGETS, LANE_COLORS, EXERCISES } from './data'

const today = () => new Date().toISOString().split('T')[0]

const s = {
  bg: '#0a0a0a',
  card: '#141414',
  border: '#2a2a2a',
  text: '#f0f0f0',
  muted: '#888',
  green: '#1D9E75',
  blue: '#378ADD',
  amber: '#EF9F27',
  red: '#E24B4A',
}

const MacroBar = ({ label, value, target, color }) => {
  const pct = Math.min(100, Math.round((value / target) * 100))
  const over = value > target
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: s.muted }}>{label}</span>
        <span style={{ color: over ? s.red : s.text, fontWeight: 500 }}>
          {Math.round(value)}g <span style={{ color: s.muted, fontWeight: 400 }}>/ {target}g</span>
        </span>
      </div>
      <div style={{ height: 4, background: '#222', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: over ? s.red : color, borderRadius: 99, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

const CalRing = ({ current, target }) => {
  const pct = Math.min(1, current / target)
  const r = 44, cx = 52, cy = 52, stroke = 8
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  const over = current > target
  return (
    <svg width={104} height={104} viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222" strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={over ? s.red : s.green}
        strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 52 52)"
        style={{ transition: 'stroke-dasharray 0.4s' }} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={500} fill={s.text}>{Math.round(current)}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={11} fill={s.muted}>of {target}</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize={10} fill={s.muted}>cal</text>
    </svg>
  )
}

export default function App() {
  const [tab, setTab] = useState('meals')
  const [logged, setLogged] = useState([])
  const [grocery, setGrocery] = useState([])
  const [completedSets, setCompletedSets] = useState({})
  const [selectedDay, setSelectedDay] = useState(Object.keys(EXERCISES)[0])
  const [location, setLocation] = useState('gym')
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copyMsg, setCopyMsg] = useState(false)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const date = today()
    const [mealRes, grocRes, setsRes] = await Promise.all([
      supabase.from('meal_logs').select('meal_id').eq('logged_date', date),
      supabase.from('grocery_selections').select('meal_id'),
      supabase.from('workout_sets').select('*').eq('logged_date', date),
    ])
    if (mealRes.data) setLogged(mealRes.data.map(r => r.meal_id))
    if (grocRes.data) setGrocery(grocRes.data.map(r => r.meal_id))
    if (setsRes.data) {
      const map = {}
      setsRes.data.forEach(r => { map[`${r.day_name}-${r.exercise_index}-${r.set_index}`] = r.completed })
      setCompletedSets(map)
    }
    setLoading(false)
  }

  const toggleMeal = async (id) => {
    const date = today()
    if (logged.includes(id)) {
      await supabase.from('meal_logs').delete().eq('meal_id', id).eq('logged_date', date)
      setLogged(prev => prev.filter(x => x !== id))
    } else {
      await supabase.from('meal_logs').insert({ meal_id: id, logged_date: date })
      setLogged(prev => [...prev, id])
    }
  }

  const toggleGrocery = async (id) => {
    if (grocery.includes(id)) {
      await supabase.from('grocery_selections').delete().eq('meal_id', id)
      setGrocery(prev => prev.filter(x => x !== id))
    } else {
      await supabase.from('grocery_selections').insert({ meal_id: id })
      setGrocery(prev => [...prev, id])
    }
  }

  const toggleSet = async (day, ei, si) => {
    const key = `${day}-${ei}-${si}`
    const date = today()
    const done = !completedSets[key]
    setCompletedSets(prev => ({ ...prev, [key]: done }))
    if (done) {
      await supabase.from('workout_sets').upsert({
        day_name: day, exercise_index: ei, set_index: si, completed: true, logged_date: date
      }, { onConflict: 'day_name,exercise_index,set_index,logged_date' })
    } else {
      await supabase.from('workout_sets').delete()
        .eq('day_name', day).eq('exercise_index', ei).eq('set_index', si).eq('logged_date', date)
    }
  }

  const resetToday = async () => {
    const date = today()
    await supabase.from('meal_logs').delete().eq('logged_date', date)
    setLogged([])
  }

  const totals = logged.reduce((acc, id) => {
    const m = ALL_MEALS.find(x => x.id === id)
    if (m) { acc.cal += m.cal; acc.protein += m.protein; acc.carbs += m.carbs; acc.fat += m.fat }
    return acc
  }, { cal: 0, protein: 0, carbs: 0, fat: 0 })

  const groceryItems = () => {
    const map = {}
    grocery.forEach(id => {
      const m = ALL_MEALS.find(x => x.id === id)
      if (m) m.ingredients.forEach(ing => {
        const k = ing.item.toLowerCase()
        if (!map[k]) map[k] = { item: ing.item, qtys: [] }
        map[k].qtys.push(ing.qty)
      })
    })
    return Object.values(map)
  }

  const copyGrocery = () => {
    const items = groceryItems()
    if (!items.length) return
    const text = 'Grocery list\n\n' + items.map(i => `- ${i.item} (${i.qtys.join(', ')})`).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopyMsg(true)
      setTimeout(() => setCopyMsg(false), 2000)
    })
  }

  const card = {
    background: s.card, border: `0.5px solid ${s.border}`,
    borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 10
  }

  const btn = (active) => ({
    padding: '8px 16px', borderRadius: 8,
    border: `0.5px solid ${active ? s.green : s.border}`,
    background: active ? '#0a2018' : 'transparent',
    color: active ? s.green : s.muted,
    cursor: 'pointer', fontSize: 13, fontWeight: active ? 500 : 400,
    fontFamily: 'inherit', transition: 'all 0.15s'
  })

  const smBtn = {
    padding: '5px 12px', borderRadius: 8, border: `0.5px solid ${s.border}`,
    background: 'transparent', color: s.muted, cursor: 'pointer',
    fontSize: 12, fontFamily: 'inherit'
  }

  const MealCard = ({ m }) => {
    const lc = LANE_COLORS[m.lane] || LANE_COLORS.Daily
    const isLogged = logged.includes(m.id)
    const isExpanded = expanded === m.id
    return (
      <div style={{ ...card, borderColor: isLogged ? s.green : s.border }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: s.text }}>{m.name}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: lc.bg, color: lc.text }}>{m.lane}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: s.muted, flexWrap: 'wrap' }}>
              <span><b style={{ color: s.text }}>{m.cal}</b> cal</span>
              <span><b style={{ color: s.blue }}>{m.protein}g</b> P</span>
              <span><b style={{ color: s.green }}>{m.carbs}g</b> C</span>
              <span><b style={{ color: s.amber }}>{m.fat}g</b> F</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button style={smBtn} onClick={() => setExpanded(isExpanded ? null : m.id)}>
              {isExpanded ? 'hide' : 'info'}
            </button>
            <button onClick={() => toggleMeal(m.id)} style={{
              ...smBtn,
              background: isLogged ? '#0a2018' : 'transparent',
              color: isLogged ? s.green : s.muted,
              borderColor: isLogged ? s.green : s.border
            }}>
              {isLogged ? 'logged' : 'log'}
            </button>
          </div>
        </div>
        {isExpanded && (
          <div style={{ marginTop: 12, borderTop: `0.5px solid ${s.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: s.muted, marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ingredients</div>
            {m.ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', color: s.text }}>
                <span>{ing.item}</span>
                <span style={{ color: s.muted }}>{ing.qty}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: '10px 12px', background: '#1a1a1a', borderRadius: 8, fontSize: 12, color: s.muted, lineHeight: 1.6 }}>
              <span style={{ color: s.text, fontWeight: 500 }}>Macro insight — </span>{m.micros}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) return (
    <div style={{ padding: '3rem 1.5rem', color: s.muted, fontSize: 14, textAlign: 'center' }}>
      Loading your data...
    </div>
  )

  return (
    <div style={{ padding: '1.5rem 1rem 2rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: s.text, marginBottom: 2 }}>Serg Fitness</div>
        <div style={{ fontSize: 12, color: s.muted }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['meals', 'Meals'], ['grocery', 'Grocery'], ['workout', 'Workout']].map(([t, label]) => (
          <button key={t} style={btn(tab === t)} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {tab === 'meals' && (
        <div>
          <div style={{ ...card, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: s.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Today's macros</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <CalRing current={totals.cal} target={TARGETS.cal} />
              <div style={{ flex: 1 }}>
                <MacroBar label="Protein" value={totals.protein} target={TARGETS.protein} color={s.blue} />
                <MacroBar label="Carbs" value={totals.carbs} target={TARGETS.carbs} color={s.green} />
                <MacroBar label="Fat" value={totals.fat} target={TARGETS.fat} color={s.amber} />
              </div>
            </div>
            {logged.length > 0 && (
              <button style={{ ...smBtn, color: s.red, borderColor: '#2a1010' }} onClick={resetToday}>
                reset today
              </button>
            )}
          </div>

          {[['Breakfast', MEALS.breakfast], ['Midday shake', MEALS.shake], ['Dinner bowls', MEALS.dinner], ['Snack', MEALS.snack]].map(([title, meals]) => (
            <div key={title} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 8 }}>{title}</div>
              {meals.map(m => <MealCard key={m.id} m={m} />)}
            </div>
          ))}
        </div>
      )}

      {tab === 'grocery' && (
        <div>
          <div style={{ fontSize: 13, color: s.muted, marginBottom: 16, lineHeight: 1.6 }}>
            Select meals you want to make. The list builds and compiles automatically.
          </div>

          {[['Breakfast', MEALS.breakfast], ['Shake', MEALS.shake], ['Dinner', MEALS.dinner], ['Snack', MEALS.snack]].map(([title, meals]) => (
            <div key={title} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 8 }}>{title}</div>
              {meals.map(m => {
                const sel = grocery.includes(m.id)
                const lc = LANE_COLORS[m.lane] || LANE_COLORS.Daily
                return (
                  <div key={m.id} onClick={() => toggleGrocery(m.id)} style={{
                    ...card, cursor: 'pointer',
                    borderColor: sel ? s.green : s.border,
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: sel ? 'none' : `0.5px solid ${s.border}`,
                      background: sel ? s.green : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {sel && <svg width={10} height={8} viewBox="0 0 10 8"><polyline points="1,4 4,7 9,1" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, color: s.text }}>{m.name}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: lc.bg, color: lc.text }}>{m.lane}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {grocery.length > 0 && (
            <div style={{ ...card, borderColor: '#2a2a2a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: s.text }}>Your grocery list</div>
                <button style={{ ...smBtn, color: copyMsg ? s.green : s.muted }} onClick={copyGrocery}>
                  {copyMsg ? 'copied!' : 'copy list'}
                </button>
              </div>
              {groceryItems().map((ing, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13, padding: '5px 0',
                  borderBottom: `0.5px solid ${s.border}`, color: s.text
                }}>
                  <span>{ing.item}</span>
                  <span style={{ color: s.muted }}>{ing.qtys.join(', ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'workout' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {Object.keys(EXERCISES).map(d => {
              const short = d.split('—')[0].trim()
              return (
                <button key={d} style={btn(selectedDay === d)} onClick={() => setSelectedDay(d)}>
                  {short}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: s.muted }}>Location:</span>
            {['gym', 'home'].map(loc => (
              <button key={loc} style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                border: `0.5px solid ${location === loc ? s.green : s.border}`,
                background: location === loc ? '#0a2018' : 'transparent',
                color: location === loc ? s.green : s.muted
              }} onClick={() => setLocation(loc)}>{loc}</button>
            ))}
          </div>

          <div style={{ fontSize: 14, fontWeight: 500, color: s.text, marginBottom: 12 }}>{selectedDay}</div>

          <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 12, color: s.muted }}>
            5 min activation — band pull-aparts x15, glute bridges x15, arm circles
          </div>

          {EXERCISES[selectedDay].map((ex, ei) => {
            const showAlt = location === 'home' && !ex.home && ex.alt
            const name = showAlt ? ex.alt : ex.name
            const completedCount = Array.from({ length: ex.sets }).filter((_, si) => completedSets[`${selectedDay}-${ei}-${si}`]).length
            const allDone = completedCount === ex.sets

            return (
              <div key={ei} style={{ ...card, borderColor: allDone ? s.green : s.border }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: s.text, marginBottom: 2 }}>{name}</div>
                    {showAlt && <div style={{ fontSize: 11, color: s.muted, marginBottom: 2 }}>Home alt for: {ex.name}</div>}
                    <div style={{ fontSize: 12, color: s.muted }}>{ex.sets} sets · {ex.reps} reps</div>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 6, flexShrink: 0,
                    background: ex.home ? '#0a2018' : '#1a1010',
                    color: ex.home ? s.green : '#F0997B'
                  }}>
                    {ex.home ? 'home' : 'gym'}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: s.muted, marginBottom: 10, lineHeight: 1.5 }}>{ex.tip}</div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Array.from({ length: ex.sets }).map((_, si) => {
                    const key = `${selectedDay}-${ei}-${si}`
                    const done = completedSets[key]
                    return (
                      <button key={si} onClick={() => toggleSet(selectedDay, ei, si)} style={{
                        width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                        border: done ? 'none' : `0.5px solid ${s.border}`,
                        background: done ? s.green : 'transparent',
                        color: done ? '#fff' : s.muted,
                        fontSize: 13, fontWeight: 500
                      }}>
                        {si + 1}
                      </button>
                    )
                  })}
                  {allDone && (
                    <span style={{ fontSize: 12, color: s.green, alignSelf: 'center', marginLeft: 4 }}>done</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
