import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { MEALS, ALL_MEALS, TARGETS, LANE_COLORS, EXERCISES } from './data'
import { calculateMacros } from './nutrition'

const today = () => new Date().toISOString().split('T')[0]
const WEEK_START = '2026-04-04'
const STARTING_WAIST = 44
const STARTING_WEIGHT = 216.2
const TOTAL_WEEKS = 12

const getCurrentWeek = () => {
  const start = new Date(WEEK_START)
  const now = new Date()
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7))
  return Math.min(Math.max(diff + 1, 1), TOTAL_WEEKS)
}

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

const s = prefersDark ? {
  bg: '#0a0a0a', card: '#141414', border: '#2a2a2a',
  cardAlt: '#1a1a1a', cardAlt2: '#222',
  text: '#f0f0f0', muted: '#888', green: '#1D9E75',
  blue: '#378ADD', amber: '#EF9F27', red: '#E24B4A',
  coral: '#F0997B', purple: '#AFA9EC',
  greenBg: '#0a2018', greenBg2: '#0a1810',
  blueBg: '#0a1428', purpleBg: '#16102a',
  pastWeek: '#444', barTrack: '#222',
  inputBg: '#1a1a1a',
} : {
  bg: '#f5f5f5', card: '#ffffff', border: '#e0e0e0',
  cardAlt: '#f0f0f0', cardAlt2: '#e8e8e8',
  text: '#0a0a0a', muted: '#666', green: '#0F6E56',
  blue: '#185FA5', amber: '#854F0B', red: '#A32D2D',
  coral: '#993C1D', purple: '#3C3489',
  greenBg: '#e1f5ee', greenBg2: '#d0ede4',
  blueBg: '#e6f1fb', purpleBg: '#eeedfe',
  pastWeek: '#bbb', barTrack: '#e0e0e0',
  inputBg: '#f8f8f8',
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
      <div style={{ height: 4, background: s.barTrack, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: over ? s.red : color, borderRadius: 99, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

const CalRing = ({ current, target }) => {
  const r = 44, cx = 52, cy = 52, stroke = 8
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, current / target)
  const dash = pct * circ
  const over = current > target
  return (
    <svg width={104} height={104} viewBox="0 0 104 104">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={s.barTrack} strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={over ? s.red : s.green}
        strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 52 52)"
        style={{ transition: 'stroke-dasharray 0.4s' }} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={500} fill={s.text}>{Math.round(current)}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={11} fill={s.muted}>of {target}</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize={10} fill={s.muted}>cal</text>
    </svg>
  )
}

const MICROS = {
  b1: { fiber: '6g', sodium: '320mg', potassium: '480mg', vitC: '12mg', zinc: '2.1mg', iron: '2.8mg', b12: '1.2mcg', omega3: '0.1g' },
  b2: { fiber: '2g', sodium: '280mg', potassium: '520mg', vitC: '95mg', zinc: '1.8mg', iron: '2.4mg', b12: '1.1mcg', omega3: '0.2g' },
  s1: { fiber: '4g', sodium: '180mg', potassium: '620mg', vitC: '8mg', zinc: '1.2mg', iron: '1.8mg', b12: '0.8mcg', omega3: '1.8g' },
  d1: { fiber: '8g', sodium: '420mg', potassium: '740mg', vitC: '18mg', zinc: '3.2mg', iron: '3.6mg', b12: '0.4mcg', omega3: '0.2g' },
  d2: { fiber: '6g', sodium: '380mg', potassium: '680mg', vitC: '28mg', zinc: '2.8mg', iron: '3.2mg', b12: '0.3mcg', omega3: '0.3g' },
  d3: { fiber: '3g', sodium: '640mg', potassium: '720mg', vitC: '8mg', zinc: '5.8mg', iron: '4.2mg', b12: '2.8mcg', omega3: '0.4g' },
  d4: { fiber: '3g', sodium: '480mg', potassium: '620mg', vitC: '14mg', zinc: '2.4mg', iron: '2.2mg', b12: '0.6mcg', omega3: '0.2g' },
  d5: { fiber: '4g', sodium: '320mg', potassium: '760mg', vitC: '64mg', zinc: '2.6mg', iron: '2.8mg', b12: '0.3mcg', omega3: '0.2g' },
  d6: { fiber: '5g', sodium: '580mg', potassium: '840mg', vitC: '82mg', zinc: '2.2mg', iron: '2.4mg', b12: '0.3mcg', omega3: '0.2g' },
  sn1: { fiber: '3g', sodium: '160mg', potassium: '180mg', vitC: '0mg', zinc: '1.4mg', iron: '1.2mg', b12: '0.4mcg', omega3: '0.1g' },
}

const MICRO_LABELS = [
  { key: 'fiber', label: 'Fiber', goal: '25-35g', good: true },
  { key: 'sodium', label: 'Sodium', goal: '<2300mg', good: false },
  { key: 'potassium', label: 'Potassium', goal: '3500mg+', good: true },
  { key: 'vitC', label: 'Vitamin C', goal: '90mg', good: true },
  { key: 'zinc', label: 'Zinc', goal: '11mg', good: true },
  { key: 'iron', label: 'Iron', goal: '8mg', good: true },
  { key: 'b12', label: 'B12', goal: '2.4mcg', good: true },
  { key: 'omega3', label: 'Omega-3', goal: '1.6g+', good: true },
]

const LANES = ['Mexican', 'Mediterranean', 'Korean', 'Japanese', 'Spanish', 'Chinese', 'Other']
const UNITS = ['oz', 'g', 'cup', 'tbsp', 'tsp', 'ml', 'lb', 'piece']

export default function App() {
  const [tab, setTab] = useState('meals')
  const [logged, setLogged] = useState([])
  const [grocery, setGrocery] = useState([])
  const [completedSets, setCompletedSets] = useState({})
  const [customMeals, setCustomMeals] = useState([])
  const [progressLogs, setProgressLogs] = useState([])
  const [selectedDay, setSelectedDay] = useState(Object.keys(EXERCISES)[0])
  const [location, setLocation] = useState('gym')
  const [expanded, setExpanded] = useState(null)
  const [microView, setMicroView] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copyMsg, setCopyMsg] = useState(false)
  const [showRecipeBuilder, setShowRecipeBuilder] = useState(false)
  const [recipeName, setRecipeName] = useState('')
  const [recipeLane, setRecipeLane] = useState('Mexican')
  const [recipeMicros, setRecipeMicros] = useState('')
  const [recipeIngredients, setRecipeIngredients] = useState([{ name: '', qty: '', unit: 'oz', manualCal: '', manualP: '', manualC: '', manualF: '', found: null }])
  const [savingRecipe, setSavingRecipe] = useState(false)
  const [showProgressForm, setShowProgressForm] = useState(false)
  const [progWeight, setProgWeight] = useState('')
  const [progWaist, setProgWaist] = useState('')
  const [progChest, setProgChest] = useState('')
  const [progArms, setProgArms] = useState('')
  const [progNote, setProgNote] = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const date = today()
    const [mealRes, grocRes, setsRes, customRes, progRes] = await Promise.all([
      supabase.from('meal_logs').select('meal_id').eq('logged_date', date),
      supabase.from('grocery_selections').select('meal_id'),
      supabase.from('workout_sets').select('*').eq('logged_date', date),
      supabase.from('custom_meals').select('*').order('created_at', { ascending: false }),
      supabase.from('progress_logs').select('*').order('log_date', { ascending: false }),
    ])
    if (mealRes.data) setLogged(mealRes.data.map(r => r.meal_id))
    if (grocRes.data) setGrocery(grocRes.data.map(r => r.meal_id))
    if (setsRes.data) {
      const map = {}
      setsRes.data.forEach(r => { map[`${r.day_name}-${r.exercise_index}-${r.set_index}`] = r.completed })
      setCompletedSets(map)
    }
    if (customRes.data) setCustomMeals(customRes.data)
    if (progRes.data) setProgressLogs(progRes.data)
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
    await supabase.from('meal_logs').delete().eq('logged_date', today())
    setLogged([])
  }

  const totals = logged.reduce((acc, id) => {
    const all = [...ALL_MEALS, ...customMeals]
    const m = all.find(x => x.id === id)
    if (m) { acc.cal += m.cal; acc.protein += m.protein; acc.carbs += m.carbs; acc.fat += m.fat }
    return acc
  }, { cal: 0, protein: 0, carbs: 0, fat: 0 })

  const updateIngredient = (i, field, val) => {
    const next = [...recipeIngredients]
    next[i] = { ...next[i], [field]: val }
    if (['name', 'qty', 'unit'].includes(field)) {
      const updated = next[i]
      next[i].found = calculateMacros(updated.name, updated.qty, updated.unit)
    }
    setRecipeIngredients(next)
  }

  const recipeCalcTotals = () => recipeIngredients.reduce((acc, ing) => {
    if (ing.found) {
      acc.cal += ing.found.cal; acc.protein += ing.found.protein
      acc.carbs += ing.found.carbs; acc.fat += ing.found.fat
    } else if (ing.manualCal) {
      acc.cal += parseFloat(ing.manualCal) || 0
      acc.protein += parseFloat(ing.manualP) || 0
      acc.carbs += parseFloat(ing.manualC) || 0
      acc.fat += parseFloat(ing.manualF) || 0
    }
    return acc
  }, { cal: 0, protein: 0, carbs: 0, fat: 0 })

  const saveRecipe = async () => {
    if (!recipeName.trim()) return
    setSavingRecipe(true)
    const t = recipeCalcTotals()
    const ingredients = recipeIngredients.filter(i => i.name).map(i => ({ item: i.name, qty: `${i.qty} ${i.unit}` }))
    const { data } = await supabase.from('custom_meals').insert({
      name: recipeName, lane: recipeLane,
      cal: Math.round(t.cal), protein: Math.round(t.protein),
      carbs: Math.round(t.carbs), fat: Math.round(t.fat),
      ingredients, micros: recipeMicros || 'Custom meal'
    }).select()
    if (data) {
      setCustomMeals(prev => [data[0], ...prev])
      setShowRecipeBuilder(false)
      setRecipeName(''); setRecipeLane('Mexican'); setRecipeMicros('')
      setRecipeIngredients([{ name: '', qty: '', unit: 'oz', manualCal: '', manualP: '', manualC: '', manualF: '', found: null }])
    }
    setSavingRecipe(false)
  }

  const deleteCustomMeal = async (id) => {
    await supabase.from('custom_meals').delete().eq('id', id)
    setCustomMeals(prev => prev.filter(m => m.id !== id))
  }

  const saveProgress = async () => {
    const week = getCurrentWeek()
    const { data } = await supabase.from('progress_logs').insert({
      week_number: week, log_date: today(),
      bodyweight: parseFloat(progWeight) || null,
      waist: parseFloat(progWaist) || null,
      chest: parseFloat(progChest) || null,
      arms: parseFloat(progArms) || null,
      note: progNote || null
    }).select()
    if (data) {
      setProgressLogs(prev => [data[0], ...prev])
      setShowProgressForm(false)
      setProgWeight(''); setProgWaist(''); setProgChest(''); setProgArms(''); setProgNote('')
    }
  }

  const groceryItems = () => {
    const map = {}
    const allForGrocery = [...ALL_MEALS, ...customMeals]
    grocery.forEach(id => {
      const m = allForGrocery.find(x => x.id === id)
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
    navigator.clipboard.writeText(text).then(() => { setCopyMsg(true); setTimeout(() => setCopyMsg(false), 2000) })
  }

  const currentWeek = getCurrentWeek()
  const latestLog = progressLogs[0]
  const weightChange = latestLog?.bodyweight ? (latestLog.bodyweight - STARTING_WEIGHT).toFixed(1) : null
  const waistChange = latestLog?.waist ? (latestLog.waist - STARTING_WAIST).toFixed(1) : null

  const card = { background: s.card, border: `0.5px solid ${s.border}`, borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 10 }
  const tabBtn = (active) => ({
    padding: '8px 14px', borderRadius: 8,
    border: `0.5px solid ${active ? s.green : s.border}`,
    background: active ? s.greenBg : 'transparent',
    color: active ? s.green : s.muted,
    cursor: 'pointer', fontSize: 13, fontWeight: active ? 500 : 400, fontFamily: 'inherit'
  })
  const smBtn = { padding: '5px 12px', borderRadius: 8, border: `0.5px solid ${s.border}`, background: 'transparent', color: s.muted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }
  const inp = { padding: '8px 12px', borderRadius: 8, border: `0.5px solid ${s.border}`, background: s.inputBg, color: s.text, fontSize: 13, fontFamily: 'inherit', width: '100%', outline: 'none' }
  const locBtn = (active) => ({ padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', border: `0.5px solid ${active ? s.green : s.border}`, background: active ? s.greenBg : 'transparent', color: active ? s.green : s.muted })

  const MealCard = ({ m, isCustom }) => {
    const lc = LANE_COLORS[m.lane] || { bg: s.cardAlt, text: s.muted }
    const isLogged = logged.includes(m.id)
    const isExpanded = expanded === m.id
    const isMicro = microView === m.id
    const microData = MICROS[m.id]
    const ingredients = Array.isArray(m.ingredients) ? m.ingredients : (typeof m.ingredients === 'string' ? JSON.parse(m.ingredients) : [])
    return (
      <div style={{ ...card, borderColor: isLogged ? s.green : s.border }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: s.text }}>{m.name}</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: lc.bg, color: lc.text }}>{m.lane}</span>
              {isCustom && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: s.purpleBg, color: s.purple }}>custom</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: s.muted, flexWrap: 'wrap' }}>
              <span><b style={{ color: s.text }}>{m.cal}</b> cal</span>
              <span><b style={{ color: s.blue }}>{m.protein}g</b> P</span>
              <span><b style={{ color: s.green }}>{m.carbs}g</b> C</span>
              <span><b style={{ color: s.amber }}>{m.fat}g</b> F</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap' }}>
            <button style={smBtn} onClick={() => { setExpanded(isExpanded ? null : m.id); setMicroView(null) }}>{isExpanded ? 'hide' : 'info'}</button>
            {microData && <button style={{ ...smBtn, color: isMicro ? s.purple : s.muted, borderColor: isMicro ? s.purple : s.border }} onClick={() => { setMicroView(isMicro ? null : m.id); setExpanded(null) }}>micros</button>}
            <button onClick={() => toggleMeal(m.id)} style={{ ...smBtn, background: isLogged ? s.greenBg : 'transparent', color: isLogged ? s.green : s.muted, borderColor: isLogged ? s.green : s.border }}>{isLogged ? 'logged' : 'log'}</button>
            {isCustom && <button style={{ ...smBtn, color: s.red, borderColor: s.border }} onClick={() => deleteCustomMeal(m.id)}>del</button>}
          </div>
        </div>

        {isExpanded && (
          <div style={{ marginTop: 12, borderTop: `0.5px solid ${s.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: s.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Ingredients</div>
            {ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', color: s.text }}>
                <span>{ing.item}</span><span style={{ color: s.muted }}>{ing.qty}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: '10px 12px', background: s.cardAlt, borderRadius: 8, fontSize: 12, color: s.muted, lineHeight: 1.6 }}>
              <span style={{ color: s.text, fontWeight: 500 }}>Insight — </span>{m.micros}
            </div>
          </div>
        )}

        {isMicro && microData && (
          <div style={{ marginTop: 12, borderTop: `0.5px solid ${s.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: s.purple, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Micronutrients per serving</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {MICRO_LABELS.map(ml => (
                <div key={ml.key} style={{ background: s.cardAlt, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, color: s.muted, marginBottom: 2 }}>{ml.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: ml.good ? s.green : s.amber }}>{microData[ml.key]}</div>
                  <div style={{ fontSize: 10, color: s.muted }}>daily goal: {ml.goal}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) return <div style={{ padding: '3rem 1.5rem', color: s.muted, fontSize: 14, textAlign: 'center' }}>Loading your data...</div>

  return (
    <div style={{ padding: '1.5rem 1rem 3rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: s.text, marginBottom: 2 }}>Serg Fitness</div>
        <div style={{ fontSize: 12, color: s.muted }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Week {currentWeek} of {TOTAL_WEEKS}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['meals', 'Meals'], ['grocery', 'Grocery'], ['workout', 'Workout'], ['recipes', 'Recipes'], ['progress', 'Progress']].map(([t, label]) => (
          <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {tab === 'meals' && (
        <div>
          <div style={{ ...card, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: s.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Today's macros</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <CalRing current={totals.cal} target={TARGETS.cal} />
              <div style={{ flex: 1 }}>
                <MacroBar label="Protein" value={totals.protein} target={TARGETS.protein} color={s.blue} />
                <MacroBar label="Carbs" value={totals.carbs} target={TARGETS.carbs} color={s.green} />
                <MacroBar label="Fat" value={totals.fat} target={TARGETS.fat} color={s.amber} />
              </div>
            </div>
            {logged.length > 0 && <button style={{ ...smBtn, color: s.red }} onClick={resetToday}>reset today</button>}
          </div>
          {[['Breakfast', MEALS.breakfast], ['Midday shake', MEALS.shake], ['Dinner bowls', MEALS.dinner], ['Snack', MEALS.snack]].map(([title, meals]) => (
            <div key={title} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 8 }}>{title}</div>
              {meals.map(m => <MealCard key={m.id} m={m} />)}
            </div>
          ))}
          {customMeals.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 8 }}>Custom meals</div>
              {customMeals.map(m => <MealCard key={m.id} m={m} isCustom />)}
            </div>
          )}
        </div>
      )}

      {tab === 'grocery' && (
        <div>
          <div style={{ fontSize: 13, color: s.muted, marginBottom: 16, lineHeight: 1.6 }}>Select meals to build your list automatically.</div>
          {[['Breakfast', MEALS.breakfast], ['Shake', MEALS.shake], ['Dinner', MEALS.dinner], ['Snack', MEALS.snack], ...(customMeals.length > 0 ? [['Custom', customMeals]] : [])].map(([title, meals]) => (
            <div key={title} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 8 }}>{title}</div>
              {meals.map(m => {
                const sel = grocery.includes(m.id)
                const lc = LANE_COLORS[m.lane] || { bg: s.cardAlt, text: s.muted }
                return (
                  <div key={m.id} onClick={() => toggleGrocery(m.id)} style={{ ...card, cursor: 'pointer', borderColor: sel ? s.green : s.border, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, border: sel ? 'none' : `0.5px solid ${s.border}`, background: sel ? s.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <div style={{ ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: s.text }}>Your grocery list</div>
                <button style={{ ...smBtn, color: copyMsg ? s.green : s.muted }} onClick={copyGrocery}>{copyMsg ? 'copied!' : 'copy list'}</button>
              </div>
              {groceryItems().map((ing, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: `0.5px solid ${s.border}`, color: s.text }}>
                  <span>{ing.item}</span><span style={{ color: s.muted }}>{ing.qtys.join(', ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'workout' && (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {Object.keys(EXERCISES).map(d => (
              <button key={d} style={tabBtn(selectedDay === d)} onClick={() => setSelectedDay(d)}>{d.split('—')[0].trim()}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: s.muted }}>Location:</span>
            {['gym', 'home'].map(loc => (
              <button key={loc} style={locBtn(location === loc)} onClick={() => setLocation(loc)}>{loc}</button>
            ))}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: s.text, marginBottom: 12 }}>{selectedDay}</div>
          <div style={{ background: s.cardAlt, borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 12, color: s.muted }}>
            5 min activation — band pull-aparts x15, glute bridges x15, arm circles
          </div>
          {EXERCISES[selectedDay].map((ex, ei) => {
            const showAlt = location === 'home' && !ex.home && ex.alt
            const name = showAlt ? ex.alt : ex.name
            const allDone = Array.from({ length: ex.sets }).every((_, si) => completedSets[`${selectedDay}-${ei}-${si}`])
            return (
              <div key={ei} style={{ ...card, borderColor: allDone ? s.green : s.border }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: s.text, marginBottom: 2 }}>{name}</div>
                    {showAlt && <div style={{ fontSize: 11, color: s.muted, marginBottom: 2 }}>Home alt: {ex.name}</div>}
                    <div style={{ fontSize: 12, color: s.muted }}>{ex.sets} sets · {ex.reps} reps</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, flexShrink: 0, background: ex.home ? s.greenBg : s.cardAlt, color: ex.home ? s.green : s.coral }}>
                    {ex.home ? 'home' : 'gym'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: s.muted, marginBottom: 10, lineHeight: 1.5 }}>{ex.tip}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Array.from({ length: ex.sets }).map((_, si) => {
                    const done = completedSets[`${selectedDay}-${ei}-${si}`]
                    return (
                      <button key={si} onClick={() => toggleSet(selectedDay, ei, si)} style={{ width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: done ? 'none' : `0.5px solid ${s.border}`, background: done ? s.green : 'transparent', color: done ? '#fff' : s.muted, fontSize: 13, fontWeight: 500 }}>
                        {si + 1}
                      </button>
                    )
                  })}
                  {allDone && <span style={{ fontSize: 12, color: s.green, alignSelf: 'center', marginLeft: 4 }}>done</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'recipes' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: s.muted }}>Build and save custom meals</div>
            <button style={{ ...smBtn, color: s.green, borderColor: s.green }} onClick={() => setShowRecipeBuilder(!showRecipeBuilder)}>
              {showRecipeBuilder ? 'cancel' : '+ new meal'}
            </button>
          </div>

          {showRecipeBuilder && (
            <div style={{ ...card, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: s.text, marginBottom: 14 }}>New custom meal</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: s.muted, marginBottom: 4 }}>Meal name</div>
                <input style={inp} placeholder="e.g. My protein bowl" value={recipeName} onChange={e => setRecipeName(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: s.muted, marginBottom: 6 }}>Cuisine lane</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {LANES.map(l => (
                    <button key={l} style={{ ...smBtn, borderColor: recipeLane === l ? s.green : s.border, color: recipeLane === l ? s.green : s.muted }} onClick={() => setRecipeLane(l)}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 11, color: s.muted, marginBottom: 8 }}>Ingredients</div>
              {recipeIngredients.map((ing, i) => (
                <div key={i} style={{ background: s.cardAlt, borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 32px', gap: 6, marginBottom: 4 }}>
                    <input style={{ ...inp, fontSize: 12 }} placeholder="ingredient" value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} />
                    <input style={{ ...inp, fontSize: 12 }} placeholder="qty" value={ing.qty} onChange={e => updateIngredient(i, 'qty', e.target.value)} />
                    <select style={{ ...inp, fontSize: 12 }} value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <button style={{ ...smBtn, color: s.red, padding: '0', width: 32 }} onClick={() => setRecipeIngredients(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                  </div>
                  {ing.found && <div style={{ fontSize: 11, color: s.green }}>Found: {ing.found.cal} cal · {ing.found.protein}g P · {ing.found.carbs}g C · {ing.found.fat}g F</div>}
                  {ing.name && ing.qty && !ing.found && (
                    <div>
                      <div style={{ fontSize: 11, color: s.amber, marginBottom: 4 }}>Not in database — enter manually:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                        {[['manualCal', 'cal'], ['manualP', 'protein g'], ['manualC', 'carbs g'], ['manualF', 'fat g']].map(([field, ph]) => (
                          <input key={field} style={{ ...inp, fontSize: 11 }} placeholder={ph} value={ing[field]} onChange={e => updateIngredient(i, field, e.target.value)} type="number" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button style={{ ...smBtn, marginBottom: 14, width: '100%', textAlign: 'center' }} onClick={() => setRecipeIngredients(prev => [...prev, { name: '', qty: '', unit: 'oz', manualCal: '', manualP: '', manualC: '', manualF: '', found: null }])}>+ add ingredient</button>
              {recipeIngredients.some(i => i.found || i.manualCal) && (() => {
                const t = recipeCalcTotals()
                return (
                  <div style={{ background: s.cardAlt, borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: s.muted, marginBottom: 4 }}>Estimated totals</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                      <span><b style={{ color: s.text }}>{Math.round(t.cal)}</b> <span style={{ color: s.muted }}>cal</span></span>
                      <span><b style={{ color: s.blue }}>{Math.round(t.protein)}g</b> <span style={{ color: s.muted }}>P</span></span>
                      <span><b style={{ color: s.green }}>{Math.round(t.carbs)}g</b> <span style={{ color: s.muted }}>C</span></span>
                      <span><b style={{ color: s.amber }}>{Math.round(t.fat)}g</b> <span style={{ color: s.muted }}>F</span></span>
                    </div>
                  </div>
                )
              })()}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: s.muted, marginBottom: 4 }}>Macro insight note (optional)</div>
                <input style={inp} placeholder="e.g. High in zinc, good post-workout..." value={recipeMicros} onChange={e => setRecipeMicros(e.target.value)} />
              </div>
              <button style={{ ...smBtn, color: s.green, borderColor: s.green, width: '100%', textAlign: 'center', padding: '10px' }} onClick={saveRecipe} disabled={savingRecipe}>
                {savingRecipe ? 'saving...' : 'save meal'}
              </button>
            </div>
          )}
          {customMeals.length === 0 && !showRecipeBuilder && (
            <div style={{ textAlign: 'center', padding: '2rem', color: s.muted, fontSize: 13 }}>No custom meals yet. Hit "+ new meal" to build one.</div>
          )}
          {customMeals.map(m => <MealCard key={m.id} m={m} isCustom />)}
        </div>
      )}

      {tab === 'progress' && (
        <div>
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: s.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>12-week journey</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {Array.from({ length: TOTAL_WEEKS }).map((_, i) => {
                const w = i + 1
                const hasLog = progressLogs.some(p => p.week_number === w)
                const isCurrent = w === currentWeek
                const isPast = w < currentWeek
                return (
                  <div key={w} style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: isCurrent ? 500 : 400, border: `0.5px solid ${isCurrent ? s.green : hasLog ? s.green : s.border}`, background: hasLog ? s.greenBg : isCurrent ? s.greenBg2 : 'transparent', color: hasLog ? s.green : isCurrent ? s.green : isPast ? s.pastWeek : s.muted }}>
                    {w}
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 12, color: s.muted }}>Week {currentWeek} of {TOTAL_WEEKS} · {TOTAL_WEEKS - currentWeek} weeks remaining</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Starting weight', val: `${STARTING_WEIGHT} lb` },
              { label: 'Current weight', val: latestLog?.bodyweight ? `${latestLog.bodyweight} lb` : 'not logged' },
              { label: 'Starting waist', val: `${STARTING_WAIST}"` },
              { label: 'Current waist', val: latestLog?.waist ? `${latestLog.waist}"` : 'not logged' },
              ...(weightChange ? [{ label: 'Weight change', val: `${weightChange > 0 ? '+' : ''}${weightChange} lb`, color: parseFloat(weightChange) < 0 ? s.green : s.amber }] : []),
              ...(waistChange ? [{ label: 'Waist change', val: `${waistChange > 0 ? '+' : ''}${waistChange}"`, color: parseFloat(waistChange) < 0 ? s.green : s.amber }] : []),
            ].map((stat, i) => (
              <div key={i} style={{ background: s.cardAlt, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: s.muted, marginBottom: 2 }}>{stat.label}</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: stat.color || s.text }}>{stat.val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: s.text }}>Weekly check-in</div>
            <button style={{ ...smBtn, color: s.green, borderColor: s.green }} onClick={() => setShowProgressForm(!showProgressForm)}>
              {showProgressForm ? 'cancel' : `+ log week ${currentWeek}`}
            </button>
          </div>

          {showProgressForm && (
            <div style={{ ...card, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: s.muted, marginBottom: 12 }}>Week {currentWeek} check-in</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[[progWeight, setProgWeight, 'Bodyweight (lb)', '216.2'], [progWaist, setProgWaist, 'Waist (in)', '44'], [progChest, setProgChest, 'Chest (in)', 'optional'], [progArms, setProgArms, 'Arms (in)', 'optional']].map(([val, setter, label, ph], i) => (
                  <div key={i}>
                    <div style={{ fontSize: 11, color: s.muted, marginBottom: 4 }}>{label}</div>
                    <input style={inp} type="number" placeholder={ph} value={val} onChange={e => setter(e.target.value)} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: s.muted, marginBottom: 4 }}>Note</div>
                <input style={inp} placeholder="How are you feeling, what changed..." value={progNote} onChange={e => setProgNote(e.target.value)} />
              </div>
              <button style={{ ...smBtn, color: s.green, borderColor: s.green, width: '100%', textAlign: 'center', padding: '10px' }} onClick={saveProgress}>save check-in</button>
            </div>
          )}

          {progressLogs.map((log, i) => (
            <div key={i} style={{ ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: s.text }}>Week {log.week_number}</span>
                <span style={{ fontSize: 11, color: s.muted }}>{new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, flexWrap: 'wrap' }}>
                {log.bodyweight && <span><b style={{ color: s.text }}>{log.bodyweight}</b> <span style={{ color: s.muted }}>lb</span></span>}
                {log.waist && <span><b style={{ color: s.blue }}>{log.waist}"</b> <span style={{ color: s.muted }}>waist</span></span>}
                {log.chest && <span><b style={{ color: s.green }}>{log.chest}"</b> <span style={{ color: s.muted }}>chest</span></span>}
                {log.arms && <span><b style={{ color: s.amber }}>{log.arms}"</b> <span style={{ color: s.muted }}>arms</span></span>}
              </div>
              {log.note && <div style={{ fontSize: 12, color: s.muted, marginTop: 6, fontStyle: 'italic' }}>{log.note}</div>}
            </div>
          ))}

          {currentWeek >= 10 && (
            <div style={{ ...card, borderColor: s.purple, background: s.purpleBg, marginTop: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: s.purple, marginBottom: 4 }}>Phase 2 territory</div>
              <div style={{ fontSize: 12, color: s.muted, lineHeight: 1.6 }}>You are in week {currentWeek}. Time to evaluate and plan your next phase.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
