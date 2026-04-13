"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Lead {
  id: number;
  name: string;
  phone: string;
  site: string | null;
  rating: number;
  reviews: number;
  category: string;
  city: string;
  opportunity: "no-site" | "low-reviews" | "low-rating" | "hot";
}

// ─── Mock Data Generator ──────────────────────────────────────────────────────

const firstNames = ["Carlos", "Ana", "João", "Maria", "Pedro", "Fernanda", "Lucas", "Juliana"];
const bizTypes: Record<string, string[]> = {
  restaurante: ["Sabor & Arte", "Cantina do Chef", "Bistrô Central", "Praça da Comida", "Tempero Vivo", "Mesa & Fogo"],
  academia: ["FitZone", "Power Gym", "Corpo em Forma", "Ultra Fit", "Iron Club", "Shape Studio"],
  dentista: ["Clínica Oral", "Sorriso Perfeito", "OdontoVita", "DentoCare", "Sorrir Mais", "DentoClínica"],
  advocacia: ["Escritório Silva", "Advog & Cia", "JustiçaFirme", "Lex Partners", "LegalPro", "Defesa Total"],
  "loja de roupa": ["ModaStore", "Estilo Único", "Fashion Hub", "ClosetPro", "Grife Local", "TrendShop"],
  default: ["Negócio & Mais", "Empresa Local", "ServPro", "BizCenter", "AtivaBiz", "TopServiços"],
};

function generateMockLeads(type: string, city: string): Lead[] {
  const names = bizTypes[type.toLowerCase()] ?? bizTypes.default;
  return names.map((base, i) => {
    const rating = parseFloat((Math.random() * 3 + 2).toFixed(1));
    const reviews = Math.floor(Math.random() * 120);
    const hasSite = Math.random() > 0.45;
    let opportunity: Lead["opportunity"] = "hot";
    if (!hasSite) opportunity = "no-site";
    else if (reviews < 20) opportunity = "low-reviews";
    else if (rating < 3.5) opportunity = "low-rating";

    return {
      id: i + 1,
      name: `${base} ${city.split(" ")[0]}`,
      phone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      site: hasSite ? `www.${base.toLowerCase().replace(/[^a-z]/g, "")}.com.br` : null,
      rating,
      reviews,
      category: type,
      city,
      opportunity,
    };
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPIRY_DAYS = 30;
const STRIPE_BUY_BUTTON_ID = "buy_btn_1TLZulEgFc7jcVAdC721lIlp";
const STRIPE_PK = "pk_live_51R5tz7EgFc7jcVAdduWd7Mm1HJDV9BWdL1MIn7vEa3TOWgE3Mue7J9530UAQqgKbiekzotbyU0JsjYIrFIdafl2Y00FwdlVzlU";

const opportunityConfig = {
  "no-site": { label: "Sem site", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: "⚡" },
  "low-reviews": { label: "Poucas avaliações", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "📉" },
  "low-rating": { label: "Avaliação baixa", color: "#f97316", bg: "rgba(249,115,22,0.12)", icon: "⭐" },
  hot: { label: "Oportunidade quente", color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: "🔥" },
};

// ─── Particle Background ──────────────────────────────────────────────────────

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const dots = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99,102,241,0.5)";
        ctx.fill();
      });
      dots.forEach((a, i) => {
        dots.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99,102,241,${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function Stars({ value }: { value: number }) {
  return (
    <span style={{ letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= Math.round(value) ? "#f59e0b" : "#374151", fontSize: 13 }}>
          ★
        </span>
      ))}
    </span>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, index }: { lead: Lead; index: number }) {
  const opp = opportunityConfig[lead.opportunity];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -3, scale: 1.01 }}
      style={{
        background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: "20px 24px",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${opp.color}, transparent)`,
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#f9fafb" }}>{lead.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>{lead.category} · {lead.city}</p>
        </div>
        <span
          style={{
            background: opp.bg,
            color: opp.color,
            border: `1px solid ${opp.color}33`,
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {opp.icon} {opp.label}
        </span>
      </div>

      {/* Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 13 }}>
        <div>
          <span style={{ color: "#4b5563" }}>Telefone </span>
          <span style={{ color: "#d1d5db", fontFamily: "monospace" }}>{lead.phone}</span>
        </div>
        <div>
          <span style={{ color: "#4b5563" }}>Site </span>
          {lead.site ? (
            <span style={{ color: "#6366f1" }}>{lead.site}</span>
          ) : (
            <span style={{ color: "#ef4444", fontWeight: 600 }}>Sem site ⚡</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Stars value={lead.rating} />
          <span style={{ color: "#9ca3af" }}>{lead.rating}</span>
        </div>
        <div>
          <span style={{ color: "#4b5563" }}>Avaliações </span>
          <span style={{ color: lead.reviews < 20 ? "#f59e0b" : "#d1d5db" }}>{lead.reviews}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Internal App ─────────────────────────────────────────────────────────────

function InternalApp({ onLogout }: { onLogout: () => void }) {
  const [bizType, setBizType] = useState("");
  const [city, setCity] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const handleSearch = async () => {
    if (!bizType.trim() || !city.trim()) return;
    setLoading(true);
    setSearched(false);
    await new Promise((r) => setTimeout(r, 1800));
    setLeads(generateMockLeads(bizType, city));
    setSearched(true);
    setLoading(false);
  };

  const filtered = filter === "all" ? leads : leads.filter((l) => l.opportunity === filter);

  const counts = {
    all: leads.length,
    "no-site": leads.filter((l) => l.opportunity === "no-site").length,
    "low-reviews": leads.filter((l) => l.opportunity === "low-reviews").length,
    "low-rating": leads.filter((l) => l.opportunity === "low-rating").length,
    hot: leads.filter((l) => l.opportunity === "hot").length,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030712",
        fontFamily: "'Geist', 'Inter', sans-serif",
        color: "#f9fafb",
      }}
    >
      {/* Top Nav */}
      <nav
        style={{
          borderBottom: "1px solid #111827",
          padding: "0 32px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#030712",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🎯
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px" }}>LeadFinder</span>
          <span
            style={{
              background: "rgba(99,102,241,0.15)",
              color: "#818cf8",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            PRO
          </span>
        </div>
        <button
          onClick={onLogout}
          style={{
            background: "transparent",
            border: "1px solid #1f2937",
            color: "#6b7280",
            borderRadius: 8,
            padding: "6px 16px",
            cursor: "pointer",
            fontSize: 13,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "#ef4444";
            (e.target as HTMLButtonElement).style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "#1f2937";
            (e.target as HTMLButtonElement).style.color = "#6b7280";
          }}
        >
          Sair
        </button>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-1px" }}>
            Encontrar Leads 🔍
          </h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 15 }}>
            Busque empresas locais e identifique oportunidades de venda imediatas.
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "#0f172a",
            border: "1px solid #1f2937",
            borderRadius: 20,
            padding: 28,
            marginBottom: 32,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Tipo de Negócio
              </label>
              <input
                value={bizType}
                onChange={(e) => setBizType(e.target.value)}
                placeholder="Ex: restaurante, academia..."
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                style={{
                  width: "100%",
                  background: "#1a2332",
                  border: "1px solid #1f2937",
                  borderRadius: 12,
                  padding: "12px 16px",
                  color: "#f9fafb",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#1f2937")}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Cidade
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: São Paulo, Rio de Janeiro..."
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                style={{
                  width: "100%",
                  background: "#1a2332",
                  border: "1px solid #1f2937",
                  borderRadius: 12,
                  padding: "12px 16px",
                  color: "#f9fafb",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#1f2937")}
              />
            </div>
            <motion.button
              onClick={handleSearch}
              disabled={loading || !bizType.trim() || !city.trim()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                borderRadius: 12,
                padding: "13px 28px",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: loading || !bizType.trim() || !city.trim() ? "not-allowed" : "pointer",
                opacity: loading || !bizType.trim() || !city.trim() ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Buscando..." : "🔍 Buscar"}
            </motion.button>
          </div>
        </motion.div>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: "center", padding: "60px 0" }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "3px solid #1f2937",
                  borderTopColor: "#6366f1",
                  margin: "0 auto 20px",
                }}
              />
              <p style={{ color: "#6b7280", fontSize: 15 }}>Varrendo o mapa por leads...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {searched && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Summary */}
              <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                {(["all", "no-site", "low-reviews", "low-rating", "hot"] as const).map((k) => {
                  const label =
                    k === "all"
                      ? "Todos"
                      : opportunityConfig[k as keyof typeof opportunityConfig].label;
                  const active = filter === k;
                  return (
                    <motion.button
                      key={k}
                      onClick={() => setFilter(k)}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        background: active ? "rgba(99,102,241,0.2)" : "#0f172a",
                        border: `1px solid ${active ? "#6366f1" : "#1f2937"}`,
                        borderRadius: 10,
                        padding: "7px 16px",
                        color: active ? "#818cf8" : "#6b7280",
                        fontSize: 13,
                        fontWeight: active ? 700 : 400,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {label}{" "}
                      <span
                        style={{
                          background: active ? "#6366f1" : "#1f2937",
                          color: active ? "#fff" : "#9ca3af",
                          borderRadius: 20,
                          padding: "1px 7px",
                          fontSize: 11,
                          marginLeft: 4,
                        }}
                      >
                        {counts[k]}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 16 }}>
                {filtered.map((lead, i) => (
                  <LeadCard key={lead.id} lead={lead} index={i} />
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#4b5563" }}>
                  Nenhum lead nessa categoria.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({ onAccessGranted }: { onAccessGranted: () => void }) {
  const stripeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/buy-button.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const benefits = [
    { icon: "⚡", title: "Leads Instantâneos", desc: "Encontre dezenas de empresas com oportunidades em segundos." },
    { icon: "🎯", title: "Alta Conversão", desc: "Filtramos empresas sem site, sem avaliações ou com nota baixa." },
    { icon: "📊", title: "Dados Qualificados", desc: "Nome, telefone, site e avaliação de cada prospect." },
    { icon: "🔁", title: "Renovação Mensal", desc: "Acesso por 30 dias com novos leads todos os dias." },
  ];

  const testimonials = [
    { name: "Rodrigo M.", role: "Agência Digital", text: "Fechei 4 clientes na primeira semana. Nunca foi tão fácil." },
    { name: "Ana Paula", role: "Freelancer Web", text: "Substituí completamente o meu processo de prospecção manual." },
    { name: "Felipe S.", role: "Dev Freelancer", text: "Vale mais do que o preço. ROI garantido em dias." },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030712",
        fontFamily: "'Geist', 'Inter', sans-serif",
        color: "#f9fafb",
        overflowX: "hidden",
      }}
    >
      {/* ── HERO ── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <ParticleField />

        {/* Glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px", maxWidth: 860, margin: "0 auto" }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 99, padding: "6px 18px", fontSize: 13, color: "#818cf8", marginBottom: 28 }}
          >
            <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ repeat: Infinity, duration: 2 }}>🚀</motion.span>
            <span>Mais de 500 clientes conquistados essa semana</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              margin: "0 0 20px",
              fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-2px",
            }}
          >
            Encontre clientes{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #6366f1, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              TODOS os dias
            </span>
            <br />
            automaticamente
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              margin: "0 0 40px",
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              color: "#9ca3af",
              maxWidth: 580,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.65,
            }}
          >
            Descubra empresas locais <strong style={{ color: "#d1d5db" }}>sem site, sem avaliações e prontas para comprar</strong> seus serviços. Pare de perder tempo e comece a fechar contratos.
          </motion.p>

          {/* Stripe Buy Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
          >
            <motion.div
              ref={stripeContainerRef}
              animate={{
                boxShadow: [
                  "0 0 0px 0px rgba(99,102,241,0)",
                  "0 0 24px 8px rgba(99,102,241,0.35)",
                  "0 0 0px 0px rgba(99,102,241,0)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: 20,
                padding: "28px 40px",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* @ts-ignore */}
              <stripe-buy-button
                buy-button-id={STRIPE_BUY_BUTTON_ID}
                publishable-key={STRIPE_PK}
              />
            </motion.div>
            <p style={{ color: "#4b5563", fontSize: 12, margin: 0 }}>
              🔒 Pagamento 100% seguro · Acesso imediato · Cancele quando quiser
            </p>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 48, flexWrap: "wrap" }}
          >
            {[
              { value: "2.400+", label: "Leads gerados" },
              { value: "94%", label: "Satisfação" },
              { value: "30 dias", label: "Acesso completo" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#818cf8" }}>{s.value}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#4b5563" }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", color: "#374151", fontSize: 20 }}
        >
          ↓
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "100px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 60 }}
        >
          <h2 style={{ margin: 0, fontSize: "clamp(1.6rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-1px" }}>
            Por que o LeadFinder funciona?
          </h2>
          <p style={{ margin: "12px 0 0", color: "#6b7280", fontSize: 16 }}>
            Focamos nos leads com maior propensão de compra imediata.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              style={{
                background: "#0f172a",
                border: "1px solid #1f2937",
                borderRadius: 18,
                padding: 28,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 14 }}>{b.icon}</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700 }}>{b.title}</h3>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "80px 24px", background: "#050a14" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", margin: "0 0 48px", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.5px" }}
          >
            O que dizem nossos usuários
          </motion.h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: "#0f172a",
                  border: "1px solid #1f2937",
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <div style={{ color: "#f59e0b", marginBottom: 10, fontSize: 14 }}>★★★★★</div>
                <p style={{ margin: "0 0 16px", color: "#d1d5db", fontSize: 14, lineHeight: 1.7, fontStyle: "italic" }}>
                  "{t.text}"
                </p>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{t.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#4b5563" }}>{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "100px 24px", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: 640,
            margin: "0 auto",
            background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 24,
            padding: "60px 40px",
          }}
        >
          <h2 style={{ margin: "0 0 16px", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 900, letterSpacing: "-1px" }}>
            Comece hoje. Feche amanhã.
          </h2>
          <p style={{ margin: "0 0 36px", color: "#6b7280", fontSize: 15 }}>
            Cada minuto sem o LeadFinder é um cliente indo para o seu concorrente.
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {/* @ts-ignore */}
            <stripe-buy-button
              buy-button-id={STRIPE_BUY_BUTTON_ID}
              publishable-key={STRIPE_PK}
            />
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #111827", padding: "32px 24px", textAlign: "center", color: "#374151", fontSize: 13 }}>
        © {new Date().getFullYear()} LeadFinder · Todos os direitos reservados
      </footer>
    </div>
  );
}

// ─── Expired Screen ───────────────────────────────────────────────────────────

function ExpiredScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#030712",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Geist', 'Inter', sans-serif",
        padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: "#0f172a",
          border: "1px solid #374151",
          borderRadius: 24,
          padding: "60px 48px",
          textAlign: "center",
          maxWidth: 440,
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 20 }}>⏳</div>
        <h1 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 800, color: "#f9fafb" }}>
          Seu acesso expirou
        </h1>
        <p style={{ margin: "0 0 32px", color: "#6b7280", fontSize: 15, lineHeight: 1.6 }}>
          Seu plano de 30 dias chegou ao fim. Renove agora para continuar gerando leads todos os dias.
        </p>
        {/* @ts-ignore */}
        <stripe-buy-button
          buy-button-id={STRIPE_BUY_BUTTON_ID}
          publishable-key={STRIPE_PK}
        />
      </motion.div>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function Home() {
  const [status, setStatus] = useState<"loading" | "landing" | "app" | "expired">("loading");

  useEffect(() => {
    // Load Stripe script
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/buy-button.js";
    script.async = true;
    document.body.appendChild(script);

    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get("success") === "true";

    if (isSuccess) {
      const expiry = Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem("paid_user", "true");
      localStorage.setItem("expiry_date", String(expiry));
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    const isPaid = localStorage.getItem("paid_user") === "true";
    const expiryRaw = localStorage.getItem("expiry_date");
    const expiryTs = expiryRaw ? parseInt(expiryRaw, 10) : 0;

    if (isPaid) {
      if (Date.now() < expiryTs) {
        setStatus("app");
      } else {
        localStorage.removeItem("paid_user");
        localStorage.removeItem("expiry_date");
        setStatus("expired");
      }
    } else {
      setStatus("landing");
    }

    return () => {
      // Cleanup script only if still in DOM
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("paid_user");
    localStorage.removeItem("expiry_date");
    setStatus("landing");
  };

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#030712",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid #1f2937",
            borderTopColor: "#6366f1",
          }}
        />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {status === "landing" && (
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LandingPage onAccessGranted={() => setStatus("app")} />
        </motion.div>
      )}
      {status === "app" && (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <InternalApp onLogout={handleLogout} />
        </motion.div>
      )}
      {status === "expired" && (
        <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ExpiredScreen />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
