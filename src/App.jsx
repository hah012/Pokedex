import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API = "https://pokeapi.co/api/v2";

const TYPE_COLORS = {
  normal:"#9BA4B5",fire:"#FF6B35",water:"#4FC3F7",grass:"#66BB6A",
  electric:"#FFD54F",ice:"#80DEEA",fighting:"#EF5350",poison:"#AB47BC",
  ground:"#FFCA28",flying:"#90CAF9",psychic:"#F06292",bug:"#AED581",
  rock:"#BCAAA4",ghost:"#7E57C2",dragon:"#5C6BC0",dark:"#78909C",
  steel:"#B0BEC5",fairy:"#F48FB1",
};
const TYPE_LIGHT_TEXT = new Set([
  "electric","ice","ground","normal","steel","rock","bug","flying","fairy","grass"
]);

const STAT_META = [
  { k:"hp",             l:"HP",  c:"#FF6B6B" },
  { k:"attack",         l:"ATK", c:"#FFA94D" },
  { k:"defense",        l:"DEF", c:"#74C0FC" },
  { k:"special-attack", l:"SpA", c:"#DA77F2" },
  { k:"special-defense",l:"SpD", c:"#63E6BE" },
  { k:"speed",          l:"SPD", c:"#FFE066" },
];

const GENS = [
  { label:"All",    limit:10000, offset:0   },
  { label:"Gen I",  limit:151,   offset:0   },
  { label:"Gen II", limit:100,   offset:151 },
  { label:"Gen III",limit:135,   offset:251 },
  { label:"Gen IV", limit:107,   offset:386 },
  { label:"Gen V",  limit:156,   offset:493 },
  { label:"Gen VI", limit:72,    offset:649 },
  { label:"Gen VII",limit:88,    offset:721 },
  { label:"Gen VIII",limit:96,   offset:809 },
  { label:"Gen IX", limit:120,   offset:905 },
];
const ALL_TYPES = Object.keys(TYPE_COLORS);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const pad   = n => String(n).padStart(4, "0");
const cap   = s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");
const tc    = t => TYPE_COLORS[t] || "#888";
const txtTc = t => TYPE_LIGHT_TEXT.has(t) ? "#111" : "#fff";

const spriteHQ = id =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const spriteLQ = id =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// ─── API CACHE ───────────────────────────────────────────────────────────────
const cache = {};
async function apiFetch(url) {
  if (cache[url]) return cache[url];
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  cache[url] = await r.json();
  return cache[url];
}

// ─── useBreakpoint ───────────────────────────────────────────────────────────
function useBreakpoint() {
  const get = () => {
    const w = window.innerWidth;
    if (w < 480)  return "xs";   // phone portrait
    if (w < 768)  return "sm";   // phone landscape / small tablet
    if (w < 1024) return "md";   // tablet
    if (w < 1280) return "lg";   // small desktop
    return "xl";                 // large desktop
  };
  const [bp, setBp] = useState(get);
  useEffect(() => {
    const h = () => setBp(get());
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return bp;
}

// ─── BADGE ───────────────────────────────────────────────────────────────────
function Badge({ type, sm }) {
  return (
    <span style={{
      background: tc(type), color: txtTc(type),
      padding: sm ? "2px 7px" : "3px 11px",
      borderRadius: 20,
      fontSize: sm ? 9 : 11,
      fontWeight: 800, textTransform: "uppercase",
      letterSpacing: .8, display: "inline-block", lineHeight: 1.6, flexShrink: 0,
    }}>{type}</span>
  );
}

// ─── CARD ────────────────────────────────────────────────────────────────────
function Card({ pk, onClick, compact }) {
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const accent = tc(pk.types[0]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "linear-gradient(160deg,#1c1c3a,#181835)" : "linear-gradient(160deg,#13132a,#111128)",
        border: `1.5px solid ${hov ? accent + "66" : "rgba(255,255,255,0.06)"}`,
        borderRadius: compact ? 14 : 18,
        padding: compact ? "12px 9px 10px" : "16px 12px 14px",
        cursor: "pointer",
        transition: "all .2s cubic-bezier(.4,0,.2,1)",
        transform: hov ? "translateY(-4px) scale(1.015)" : "none",
        boxShadow: hov ? `0 14px 36px ${accent}28,0 4px 14px rgba(0,0,0,0.5)` : "0 2px 8px rgba(0,0,0,0.4)",
        display: "flex", flexDirection: "column", alignItems: "center",
        position: "relative", overflow: "hidden", userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: compact ? 40 : 52, height: compact ? 40 : 52,
        borderRadius: `0 ${compact?14:18}px 0 100%`,
        background: `${accent}18`,
      }} />
      <span style={{ alignSelf: "flex-start", fontSize: 9, fontWeight: 700, color: "#3a3a6a", marginBottom: 2 }}>
        #{pad(pk.id)}
      </span>
      <div style={{
        width: compact ? 68 : 82, height: compact ? 68 : 82,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: compact ? 7 : 9,
        filter: hov ? `drop-shadow(0 5px 14px ${accent}66)` : "drop-shadow(0 3px 8px rgba(0,0,0,0.55))",
        transition: "filter .25s",
      }}>
        <img
          src={imgErr ? spriteLQ(pk.id) : spriteHQ(pk.id)}
          onError={() => setImgErr(true)}
          alt={pk.name}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          loading="lazy"
        />
      </div>
      <div style={{
        fontSize: compact ? 11 : 12, fontWeight: 800, color: "#dde",
        textTransform: "capitalize", marginBottom: compact ? 5 : 7,
        textAlign: "center", lineHeight: 1.2,
      }}>
        {pk.name.replace(/-/g, " ")}
      </div>
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
        {pk.types.map(t => <Badge key={t} type={t} sm />)}
      </div>
    </div>
  );
}

// ─── EVOLUTION CHAIN ─────────────────────────────────────────────────────────
function EvoChain({ chain }) {
  const nodes = [];
  const walk = (node, depth = 0) => {
    nodes.push({ name: node.species.name, depth });
    node.evolves_to.forEach(n => walk(n, depth + 1));
  };
  walk(chain);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
      {nodes.map((n, i) => (
        <div key={n.name + i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {i > 0 && nodes[i - 1].depth < n.depth && (
            <span style={{ color: "#444", fontSize: 18 }}>→</span>
          )}
          <div style={{ textAlign: "center" }}>
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n.name}.png`}
              onError={e => { e.target.src = spriteLQ(n.name); }}
              alt={n.name}
              style={{ width: 60, height: 60, objectFit: "contain", display: "block", margin: "0 auto" }}
            />
            <div style={{ fontSize: 10, color: "#aaa", textTransform: "capitalize", marginTop: 3 }}>
              {n.name.replace(/-/g, " ")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── LOADER ──────────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "36px 0", color: "#444", fontSize: 12 }}>
      <div style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#7070aa", animation: "spin .8s linear infinite" }} />
      Loading…
    </div>
  );
}

// ─── INFO ROW ────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#ccc", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{String(value)}</span>
    </div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({ pk, onClose, bp }) {
  const [detail, setDetail]   = useState(null);
  const [species, setSpecies] = useState(null);
  const [evoChain, setEvo]    = useState(null);
  const [tab, setTab]         = useState("stats");
  const [imgErr, setImgErr]   = useState(false);
  const accent = tc(pk.types[0]);
  const isMobile = bp === "xs" || bp === "sm";

  useEffect(() => {
    setDetail(null); setSpecies(null); setEvo(null); setTab("stats"); setImgErr(false);
    apiFetch(`${API}/pokemon/${pk.id}`).then(setDetail).catch(() => {});
    apiFetch(`${API}/pokemon-species/${pk.id}`)
      .then(async sp => {
        setSpecies(sp);
        const evo = await apiFetch(sp.evolution_chain.url);
        setEvo(evo.chain);
      }).catch(() => {});
  }, [pk.id]);

  const flavor = useMemo(() => {
    if (!species) return "";
    const e = species.flavor_text_entries.find(x => x.language.name === "en");
    return e ? e.flavor_text.replace(/\f|\n|\r/g, " ") : "";
  }, [species]);

  const totalStats = useMemo(() => detail ? detail.stats.reduce((s, x) => s + x.base_stat, 0) : 0, [detail]);

  const moves = useMemo(() => {
    if (!detail) return [];
    return detail.moves
      .filter(m => m.version_group_details.some(v => v.move_learn_method.name === "level-up"))
      .sort((a, b) => {
        const la = Math.min(...a.version_group_details.map(v => v.level_learned_at || 99));
        const lb = Math.min(...b.version_group_details.map(v => v.level_learned_at || 99));
        return la - lb;
      })
      .slice(0, 20);
  }, [detail]);

  const TABS = ["stats", "about", "moves", "evolution"];

  // On mobile: full-screen bottom sheet style
  const modalStyle = isMobile ? {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "#12122a", borderRadius: "22px 22px 0 0",
    maxHeight: "92vh", overflow: "hidden",
    display: "flex", flexDirection: "column",
    boxShadow: `0 -4px 40px rgba(0,0,0,0.8), 0 0 0 1px ${accent}33`,
    animation: "slideUp .3s cubic-bezier(.4,0,.2,1)",
  } : {
    background: "#12122a", borderRadius: 24,
    width: "100%", maxWidth: 500,
    maxHeight: "90vh", overflow: "hidden",
    display: "flex", flexDirection: "column",
    boxShadow: `0 0 0 1.5px ${accent}44, 0 40px 100px rgba(0,0,0,0.9)`,
    animation: "popIn .28s cubic-bezier(.34,1.56,.64,1)",
    position: "relative",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: isMobile ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(8px)",
        padding: isMobile ? 0 : 16,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={modalStyle}>
        {/* Mobile drag handle */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
          </div>
        )}

        {/* Hero */}
        <div style={{
          background: `radial-gradient(ellipse at 70% 30%,${accent}40 0%,transparent 65%),linear-gradient(155deg,#0e1632,#12122a)`,
          padding: isMobile ? "16px 20px 0" : "24px 24px 0",
          display: "flex", alignItems: "flex-end",
          gap: isMobile ? 12 : 16,
          position: "relative", overflow: "hidden", flexShrink: 0,
        }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 160, height: 160, borderRadius: "50%", background: `${accent}12`, border: `1px solid ${accent}22` }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${accent}44,transparent)` }} />

          <img
            src={imgErr ? spriteLQ(pk.id) : spriteHQ(pk.id)}
            onError={() => setImgErr(true)}
            alt={pk.name}
            style={{
              width: isMobile ? 100 : 130, height: isMobile ? 100 : 130,
              objectFit: "contain", flexShrink: 0,
              filter: `drop-shadow(0 8px 20px ${accent}66)`,
            }}
          />
          <div style={{ paddingBottom: isMobile ? 14 : 20, flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>
              #{pad(pk.id)}
            </div>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, color: "#fff", textTransform: "capitalize", lineHeight: 1, marginBottom: 5 }}>
              {pk.name.replace(/-/g, " ")}
            </div>
            {species && (
              <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>
                {species.genera.find(g => g.language.name === "en")?.genus}
              </div>
            )}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {pk.types.map(t => <Badge key={t} type={t} />)}
            </div>
          </div>

          {/* Close button inside hero on desktop */}
          {!isMobile && (
            <button onClick={onClose} style={{
              position: "absolute", top: 14, right: 14,
              background: "rgba(255,255,255,0.08)", border: "none",
              width: 30, height: 30, borderRadius: "50%",
              color: "#aaa", cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)", flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, border: "none", background: "none",
              color: tab === t ? accent : "#555",
              padding: isMobile ? "11px 0" : "12px 0",
              fontSize: isMobile ? 10 : 11, fontWeight: 800,
              cursor: "pointer", textTransform: "uppercase", letterSpacing: .8,
              borderBottom: tab === t ? `2px solid ${accent}` : "2px solid transparent",
              transition: "all .15s",
            }}>{t}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          overflowY: "auto", flex: 1,
          padding: isMobile ? "16px 18px 32px" : "20px 24px 24px",
          scrollbarWidth: "thin", scrollbarColor: "#1e1e3a transparent",
        }}>
          {/* STATS */}
          {tab === "stats" && (
            <div>
              {detail ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
                    {[
                      { l: "Height", v: `${(detail.height / 10).toFixed(1)}m` },
                      { l: "Weight", v: `${(detail.weight / 10).toFixed(1)}kg` },
                      { l: "Base XP", v: detail.base_experience || "—" },
                      { l: "BST", v: totalStats },
                    ].map(m => (
                      <div key={m.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 4px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: "#fff" }}>{m.v}</div>
                        <div style={{ fontSize: 9, color: "#555", marginTop: 2, textTransform: "uppercase", letterSpacing: .4 }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                  {STAT_META.map(({ k, l, c }) => {
                    const s = detail.stats.find(x => x.stat.name === k);
                    const val = s?.base_stat || 0;
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ width: 30, fontSize: 9, fontWeight: 800, color: "#555", textTransform: "uppercase" }}>{l}</span>
                        <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${Math.round((val / 255) * 100)}%`, height: "100%", background: c, borderRadius: 4, transition: "width .7s cubic-bezier(.4,0,.2,1)" }} />
                        </div>
                        <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: "#bbb", textAlign: "right" }}>{val}</span>
                      </div>
                    );
                  })}
                </>
              ) : <Loader />}
            </div>
          )}

          {/* ABOUT */}
          {tab === "about" && (
            <div>
              {species && detail ? (
                <>
                  {flavor && (
                    <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.8, fontStyle: "italic", marginBottom: 20, background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: 12, borderLeft: `3px solid ${accent}` }}>
                      "{flavor}"
                    </p>
                  )}
                  <InfoRow label="Generation" value={cap(species.generation.name)} />
                  <InfoRow label="Habitat" value={species.habitat ? cap(species.habitat.name) : "Unknown"} />
                  <InfoRow label="Growth Rate" value={cap(species.growth_rate.name)} />
                  <InfoRow label="Capture Rate" value={`${species.capture_rate} / 255`} />
                  <InfoRow label="Base Happiness" value={species.base_happiness} />
                  <InfoRow label="Egg Groups" value={species.egg_groups.map(g => cap(g.name)).join(", ")} />
                  <InfoRow label="Abilities" value={detail.abilities.map(a => cap(a.ability.name) + (a.is_hidden ? " ✦" : "")).join(", ")} />
                  <InfoRow label="Legendary" value={species.is_legendary ? "Yes ⭐" : "No"} />
                  <InfoRow label="Mythical" value={species.is_mythical ? "Yes ✨" : "No"} />
                </>
              ) : <Loader />}
            </div>
          )}

          {/* MOVES */}
          {tab === "moves" && (
            <div>
              {detail ? (
                <>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 12, fontWeight: 600 }}>Level-up moves (first 20)</div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 6 }}>
                    {moves.map(m => {
                      const lvl = Math.min(...m.version_group_details.map(v => v.level_learned_at || 0));
                      return (
                        <div key={m.move.name} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 12, color: "#ccc", textTransform: "capitalize", fontWeight: 600 }}>
                            {m.move.name.replace(/-/g, " ")}
                          </span>
                          <span style={{ fontSize: 9, color: accent, fontWeight: 800, background: `${accent}22`, padding: "2px 7px", borderRadius: 8, flexShrink: 0 }}>
                            {lvl === 0 ? "—" : `Lv${lvl}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : <Loader />}
            </div>
          )}

          {/* EVOLUTION */}
          {tab === "evolution" && (
            <div>
              {evoChain ? (
                <>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 16, fontWeight: 600 }}>Evolution Chain</div>
                  <EvoChain chain={evoChain} />
                </>
              ) : <Loader />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const bp = useBreakpoint();
  const isMobile  = bp === "xs" || bp === "sm";
  const isTablet  = bp === "md";
  const isDesktop = bp === "lg" || bp === "xl";

  const [allList,     setAllList]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [genIdx,      setGenIdx]      = useState(1);
  const [query,       setQuery]       = useState("");
  const [typeFilter,  setTypeFilter]  = useState("all");
  const [sortBy,      setSortBy]      = useState("id");
  const [page,        setPage]        = useState(1);
  const [selected,    setSelected]    = useState(null);
  const [fetchErr,    setFetchErr]    = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const abortRef = useRef(null);
  const PER_PAGE = isMobile ? 20 : 30;

  // ── load generation ──
  const loadGen = useCallback(async (idx) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setAllList([]); setFetchErr("");
    const gen = GENS[idx];
    try {
      const data = await apiFetch(`${API}/pokemon?limit=${gen.limit}&offset=${gen.offset}`);
      const names = data.results.map(r => r.name);
      for (let i = 0; i < names.length; i += 30) {
        if (ctrl.signal.aborted) return;
        const batch = names.slice(i, i + 30);
        const pks = await Promise.all(
          batch.map(name =>
            apiFetch(`${API}/pokemon/${name}`)
              .then(d => ({ id: d.id, name: d.name, types: d.types.map(t => t.type.name) }))
              .catch(() => null)
          )
        );
        if (!ctrl.signal.aborted) setAllList(prev => [...prev, ...pks.filter(Boolean)]);
      }
    } catch {
      if (!ctrl.signal.aborted) setFetchErr("Failed to load. Check your connection.");
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => { loadGen(genIdx); }, [genIdx, loadGen]);

  // ── filter + sort ──
  const filtered = useMemo(() => {
    let r = [...allList];
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      r = r.filter(p => p.name.includes(q) || String(p.id).includes(q));
    }
    if (typeFilter !== "all") r = r.filter(p => p.types.includes(typeFilter));
    if (sortBy === "id")   r.sort((a, b) => a.id - b.id);
    if (sortBy === "name") r.sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [allList, query, typeFilter, sortBy]);

  useEffect(() => setPage(1), [query, typeFilter, sortBy, genIdx]);

  const visible = filtered.slice(0, page * PER_PAGE);
  const hasMore = visible.length < filtered.length;

  // ── grid columns based on breakpoint ──
  const gridCols = {
    xs: "repeat(2, 1fr)",
    sm: "repeat(3, 1fr)",
    md: "repeat(4, 1fr)",
    lg: "repeat(5, 1fr)",
    xl: "repeat(8, 1fr)",
  }[bp];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a1a", color: "#fff", fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html{-webkit-text-size-adjust:100%;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#1e1e40;border-radius:4px;}
        input,button,select{font-family:inherit;-webkit-appearance:none;}
        input:focus,button:focus{outline:none;}
        @keyframes popIn{from{transform:scale(.88) translateY(16px);opacity:0}to{transform:none;opacity:1}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}
        .cin{animation:fadeUp .28s cubic-bezier(.4,0,.2,1) both;}
        button:active{opacity:.8;}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: "linear-gradient(180deg,#0e0e28 0%,transparent 100%)",
        padding: isMobile ? "28px 16px 20px" : "44px 24px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 9, letterSpacing: 5, color: "#E3350D", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
          ◆ Interactive Pokédex ◆
        </div>

        <h1 style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: isMobile ? 64 : "clamp(64px,10vw,100px)",
          letterSpacing: 3, lineHeight: .9, marginBottom: 8,
          background: "linear-gradient(135deg,#fff 35%,#5a5a9a)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>POKÉDEX</h1>

        <p style={{ color: "#3a3a6a", fontSize: 11, marginBottom: isMobile ? 20 : 28 }}>
          {loading
            ? `Loading ${allList.length} Pokémon…`
            : `${filtered.length} / ${allList.length} Pokémon · ${GENS[genIdx].label}`}
        </p>

        {/* Search row */}
        <div style={{
          maxWidth: 540, margin: "0 auto",
          display: "flex", gap: 8, alignItems: "center",
          marginBottom: isMobile ? 14 : 18,
          padding: isMobile ? "0 4px" : 0,
        }}>
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, display: "flex", alignItems: "center",
            padding: "0 14px", gap: 8,
          }}>
            <span style={{ color: "#3a3a6a", fontSize: 16 }}>🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search name or #…"
              style={{
                flex: 1, border: "none", background: "transparent",
                color: "#fff", fontSize: isMobile ? 14 : 15,
                padding: isMobile ? "11px 0" : "13px 0", fontWeight: 600,
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 15, padding: 0 }}>✕</button>
            )}
          </div>

          {/* Filter toggle on mobile */}
          {isMobile && (
            <button
              onClick={() => setShowFilters(f => !f)}
              style={{
                background: showFilters ? "#5a5aaa" : "rgba(255,255,255,0.06)",
                border: `1px solid ${showFilters ? "#5a5aaa" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 12, padding: "11px 14px",
                color: "#fff", fontSize: 14, cursor: "pointer",
                flexShrink: 0,
              }}
            >⚙</button>
          )}
        </div>

        {/* Gen buttons – scrollable on mobile */}
        <div style={{
          display: "flex", gap: 5, justifyContent: isMobile ? "flex-start" : "center",
          flexWrap: isMobile ? "nowrap" : "wrap",
          overflowX: isMobile ? "auto" : "visible",
          scrollbarWidth: "none",
          padding: isMobile ? "0 4px 4px" : 0,
          marginBottom: isMobile ? 10 : 14,
        }}>
          {GENS.map((g, i) => (
            <button key={g.label} onClick={() => setGenIdx(i)} style={{
              background: genIdx === i ? "#E3350D" : "rgba(255,255,255,0.05)",
              border: `1px solid ${genIdx === i ? "#E3350D" : "rgba(255,255,255,0.08)"}`,
              color: genIdx === i ? "#fff" : "#555",
              padding: "5px 12px", borderRadius: 16,
              fontSize: isMobile ? 10 : 11, fontWeight: 700,
              cursor: "pointer", transition: "all .15s",
              whiteSpace: "nowrap", flexShrink: 0,
            }}>{g.label}</button>
          ))}
        </div>

        {/* Sort – always visible */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span style={{ fontSize: 9, color: "#3a3a6a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Sort:</span>
          {[["id", "# ID"], ["name", "A–Z"]].map(([v, l]) => (
            <button key={v} onClick={() => setSortBy(v)} style={{
              background: sortBy === v ? "#5a5aaa" : "rgba(255,255,255,0.05)",
              border: `1px solid ${sortBy === v ? "#5a5aaa" : "rgba(255,255,255,0.08)"}`,
              color: sortBy === v ? "#fff" : "#555",
              padding: "4px 12px", borderRadius: 14,
              fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .15s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── TYPE FILTERS ── collapsible on mobile, always visible on tablet+ ── */}
      {(!isMobile || showFilters) && (
        <div style={{
          display: "flex", gap: 5,
          padding: isMobile ? "12px 16px" : "10px 18px",
          overflowX: "auto", scrollbarWidth: "none",
          background: "rgba(0,0,0,0.35)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          flexWrap: isMobile ? "wrap" : "nowrap",
        }}>
          <button onClick={() => setTypeFilter("all")} style={{
            background: typeFilter === "all" ? "#fff" : "rgba(255,255,255,0.06)",
            color: typeFilter === "all" ? "#0a0a1a" : "#555",
            border: "1px solid rgba(255,255,255,0.09)",
            padding: "5px 14px", borderRadius: 16,
            fontSize: 9, fontWeight: 800, cursor: "pointer",
            whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 1,
          }}>All</button>
          {ALL_TYPES.map(t => {
            const active = typeFilter === t;
            return (
              <button key={t} onClick={() => setTypeFilter(active ? "all" : t)} style={{
                background: active ? tc(t) : "rgba(255,255,255,0.05)",
                color: active ? txtTc(t) : "#555",
                border: `1px solid ${active ? tc(t) : "rgba(255,255,255,0.08)"}`,
                padding: "5px 12px", borderRadius: 16,
                fontSize: 9, fontWeight: 800, cursor: "pointer",
                whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: 1,
                boxShadow: active ? `0 0 8px ${tc(t)}44` : "none",
                transition: "all .15s",
              }}>{t}</button>
            );
          })}
        </div>
      )}

      {/* ── GRID ── */}
      <div style={{
minHeight: "100vh",
  width: "100vw",
  background: "#050519",
}}>
  <div style={{
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    padding: isMobile ? "16px 12px" : isTablet ? "20px 16px" : "28px 24px",
  }}></div>
        {fetchErr && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#E3350D", fontSize: 14, fontWeight: 600 }}>
            {fetchErr}
          </div>
        )}

        {!fetchErr && filtered.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😵</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#333" }}>No Pokémon found</div>
            <div style={{ color: "#2a2a4a", marginTop: 6, fontSize: 13 }}>Try a different search or filter</div>
          </div>
        )}

        {/* Skeleton loading */}
        {loading && allList.length === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: isMobile ? 10 : 12 }}>
            {Array.from({ length: isMobile ? 8 : 18 }).map((_, i) => (
              <div key={i} style={{
                background: "#13132a", borderRadius: 18,
                height: isMobile ? 160 : 190,
                animation: `pulse 1.4s ease-in-out ${i * 0.05}s infinite`,
              }} />
            ))}
          </div>
        )}

        {visible.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: isMobile ? 10 : 12 }}>
              {visible.map((pk, i) => (
                <div key={pk.id} className="cin" style={{ animationDelay: `${(i % PER_PAGE) * 0.018}s` }}>
                  <Card pk={pk} onClick={() => setSelected(pk)} compact={isMobile} />
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 28 }}>
              {hasMore && !loading && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    background: "linear-gradient(135deg,#E3350D,#FF6035)",
                    border: "none", borderRadius: 12,
                    padding: isMobile ? "12px 28px" : "13px 36px",
                    color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
                    letterSpacing: 1, textTransform: "uppercase",
                    boxShadow: "0 4px 18px rgba(227,53,13,0.35)",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  Load More · {filtered.length - visible.length} left
                </button>
              )}
              {loading && allList.length > 0 && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#3a3a6a", fontSize: 12, fontWeight: 600 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#5a5aaa", animation: "spin .8s linear infinite" }} />
                  Loading more Pokémon…
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MODAL ── */}
      {selected && <Modal pk={selected} onClose={() => setSelected(null)} bp={bp} />}
    </div>
  );
}
