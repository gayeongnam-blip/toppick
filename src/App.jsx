import { useState, useMemo, useEffect, useRef } from "react";

// ───────── Supabase ─────────
const SUPA_URL = "https://yxezntdehelwqlifqyud.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZXpudGRlaGVsd3FsaWZxeXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzOTA4NTksImV4cCI6MjA5NTk2Njg1OX0.la4l2WC66ti0fN1cK-_kfmfbJdFWWBTzV4hwVVJH2Ag";

const headers = (extra = {}) => ({
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  ...extra,
});

const db = {
  async get(table, params = "") {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${params}`, { headers: headers() });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async insert(table, rows) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: headers({ Prefer: "return=representation" }),
      body: JSON.stringify(rows),
    });
    if (!r.ok) throw new Error(await r.text());
    const d = await r.json();
    return Array.isArray(d) ? d : [d];
  },
  async update(table, body, match) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${match}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
  },
  async remove(table, match) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${match}`, {
      method: "DELETE",
      headers: headers(),
    });
    if (!r.ok) throw new Error(await r.text());
  },
};

// ───────── 테마 / 공통 ─────────
const T = {
  sky: "#5BB8E8", skyDark: "#3A9FD4", skyLight: "#D6EEF8", bg: "#EEF7FD",
  text: "#2A3A4A", sub: "#6A90AA", line: "#BFD9EC", pink: "#F2A8C0",
  red: "#E85878", green: "#3BAA72",
};
const inputS = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${T.line}`,
  fontSize: 15, boxSizing: "border-box", outline: "none", background: "#F5FAFD", fontFamily: "inherit",
};
const btn = (bg, color = "#fff", extra = {}) => ({
  padding: "10px 14px", borderRadius: 10, border: "none", background: bg, color,
  fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", ...extra,
});
const btnLine = (extra = {}) => ({ ...btn("#fff", T.skyDark), border: `1.5px solid ${T.line}`, ...extra });
const labelS = { fontSize: 12, color: T.sub, marginBottom: 4, fontWeight: 600 };

const totalStock = (p) => (p.options && p.options.length > 0 ? p.options.reduce((s, o) => s + o.stock, 0) : p.stock);
const thresholdOf = (p) => Number(p.min_threshold) || 3;
const statusOf = (total, th) => (total === 0 ? "out" : total <= th ? "low" : "ok");
const won = (n) => "₩" + Number(n || 0).toLocaleString();
const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const stColor = (st) => (st === "out" ? T.red : st === "low" ? "#D9668C" : T.green);
const stBg = (st) => (st === "out" ? "#FDE8EE" : st === "low" ? "#FDE8F0" : "#E6F7EF");

function Modal({ onClose, children, z = 100 }) {
  return (
    <div
      onClick={onClose || undefined}
      style={{ position: "fixed", inset: 0, background: "rgba(42,58,74,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: z }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: 20, width: "100%", maxWidth: 576, boxSizing: "border-box", maxHeight: "90vh", overflowY: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={labelS}>{label}</div>
      {children}
    </div>
  );
}

// ───────── 상품 카드 ─────────
function ProductCard({ p, onDetail, onLog }) {
  const [open, setOpen] = useState(false);
  const total = totalStock(p);
  const st = statusOf(total, thresholdOf(p));
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 12, boxShadow: "0 2px 10px rgba(91,184,232,0.13)", borderLeft: `4px solid ${stColor(st)}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onDetail(p)}>
          <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>{p.name}</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 3, display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
            {p.brand && <span>{p.brand}</span>}
            {p.category && <span style={{ background: T.skyLight, color: T.skyDark, padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>{p.category}</span>}
            {p.location && <span style={{ color: "#E8527A", fontWeight: 600 }}>📍{p.location}</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sky }}>{won(p.price)}</div>
        </div>
        <div style={{ textAlign: "center", minWidth: 74, flexShrink: 0 }}>
          <div style={{ background: stBg(st), color: stColor(st), fontWeight: 700, fontSize: 17, borderRadius: 8, padding: "5px 10px", marginBottom: 2 }}>
            {total}<span style={{ fontSize: 10, fontWeight: 400 }}>{p.unit}</span>
          </div>
          <div style={{ fontSize: 10, color: stColor(st), height: 13, fontWeight: 700 }}>{st === "out" ? "품절" : st === "low" ? "재고부족" : ""}</div>
          <button onClick={() => onLog(p, null)} style={btn(T.sky, "#fff", { padding: "5px 10px", fontSize: 11, width: "100%", borderRadius: 6 })}>입출고</button>
        </div>
      </div>
      {p.options.length > 0 && (
        <>
          <button onClick={() => setOpen(!open)} style={{ marginTop: 8, background: "none", border: "none", color: T.skyDark, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
            옵션 {p.options.length}개 {open ? "▲" : "▼"}
          </button>
          {open && (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 5 }}>
              {p.options.map((o) => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg, borderRadius: 8, padding: "6px 10px" }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{o.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: o.stock === 0 ? T.red : T.text }}>{o.stock}{p.unit}</span>
                  <button onClick={() => onLog(p, o.id)} style={btn(T.sky, "#fff", { padding: "4px 9px", fontSize: 11, borderRadius: 6 })}>입출고</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ───────── 상품 추가/수정 ─────────
function ProductFormModal({ mode, initial, categories, busy, onClose, onSave, onError }) {
  const [f, setF] = useState(() => ({
    name: initial?.name || "",
    brand: initial?.brand || "",
    location: initial?.location || "",
    category: initial?.category || categories[0] || "",
    price: initial ? String(initial.price) : "",
    stock: initial ? String(initial.stock) : "",
    unit: initial?.unit || "개",
    min: initial ? String(thresholdOf(initial)) : "3",
    options: (initial?.options || []).map((o) => ({ key: "o" + o.id, id: o.id, name: o.name, stock: String(o.stock) })),
  }));
  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }));
  const hasOpts = f.options.length > 0;
  const optSum = f.options.reduce((s, o) => s + (parseInt(o.stock) || 0), 0);

  const addOpt = () => set("options", [...f.options, { key: "n" + Date.now() + Math.random(), id: null, name: "", stock: "0" }]);
  const setOpt = (key, k, v) => set("options", f.options.map((o) => (o.key === key ? { ...o, [k]: v } : o)));
  const delOpt = (key) => set("options", f.options.filter((o) => o.key !== key));

  const submit = () => {
    if (!f.name.trim()) return onError("상품명을 입력해주세요");
    if (f.price === "" || isNaN(Number(f.price))) return onError("판매가를 입력해주세요");
    if (f.options.some((o) => !o.name.trim())) return onError("옵션 이름을 입력해주세요");
    onSave({
      id: initial?.id,
      name: f.name.trim(),
      brand: f.brand.trim(),
      location: f.location.trim(),
      category: f.category,
      price: parseInt(f.price) || 0,
      unit: f.unit.trim() || "개",
      min_threshold: parseInt(f.min) || 3,
      stock: hasOpts ? optSum : Math.max(0, parseInt(f.stock) || 0),
      options: f.options.map((o) => ({ id: o.id, name: o.name.trim(), stock: Math.max(0, parseInt(o.stock) || 0) })),
    });
  };

  return (
    <Modal>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>{mode === "add" ? "새 상품 추가" : "상품 수정"}</div>
      <Field label="상품명 *"><input style={inputS} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="상품명 입력" /></Field>
      <Field label="브랜드"><input style={inputS} value={f.brand} onChange={(e) => set("brand", e.target.value)} placeholder="브랜드" /></Field>
      <Field label="위치"><input style={inputS} value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="예: A-1, 선반 2칸" /></Field>
      <Field label="카테고리">
        <select style={inputS} value={f.category} onChange={(e) => set("category", e.target.value)}>
          {categories.length === 0 && <option value="">(카테고리 없음)</option>}
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 2 }}><Field label="판매가 (₩) *"><input style={inputS} type="number" inputMode="numeric" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="가격" /></Field></div>
        <div style={{ flex: 1 }}><Field label="단위"><input style={inputS} value={f.unit} onChange={(e) => set("unit", e.target.value)} /></Field></div>
      </div>
      <Field label="재고부족 알림 기준 (이 수량 이하일 때 알림)">
        <input style={inputS} type="number" inputMode="numeric" value={f.min} onChange={(e) => set("min", e.target.value)} />
      </Field>

      <div style={{ margin: "14px 0 6px", display: "flex", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>옵션 (색상·사이즈 등)</div>
        <button onClick={addOpt} style={btn(T.skyLight, T.skyDark, { padding: "6px 12px", fontSize: 12 })}>+ 옵션 추가</button>
      </div>
      {hasOpts ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          {f.options.map((o) => (
            <div key={o.key} style={{ display: "flex", gap: 6 }}>
              <input style={{ ...inputS, flex: 2 }} value={o.name} onChange={(e) => setOpt(o.key, "name", e.target.value)} placeholder="옵션명" />
              <input style={{ ...inputS, flex: 1 }} type="number" inputMode="numeric" value={o.stock} onChange={(e) => setOpt(o.key, "stock", e.target.value)} placeholder="수량" />
              <button onClick={() => delOpt(o.key)} style={btn("#FDE8EE", T.red, { padding: "0 12px" })}>✕</button>
            </div>
          ))}
          <div style={{ fontSize: 12, color: T.sub }}>총 재고 = 옵션 합계 <b style={{ color: T.skyDark }}>{optSum}{f.unit}</b> (자동 계산)</div>
        </div>
      ) : (
        <Field label="재고 수량 * (옵션이 없을 때)">
          <input style={inputS} type="number" inputMode="numeric" value={f.stock} onChange={(e) => set("stock", e.target.value)} placeholder="수량" />
        </Field>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={onClose} style={btnLine({ flex: 1 })}>취소</button>
        <button disabled={busy} onClick={submit} style={btn(T.sky, "#fff", { flex: 2, opacity: busy ? 0.6 : 1 })}>{busy ? "저장 중..." : mode === "add" ? "추가하기" : "저장하기"}</button>
      </div>
    </Modal>
  );
}

// ───────── 입출고 ─────────
function LogModal({ product, optionId, busy, onClose, onSubmit, onError }) {
  const [type, setType] = useState("입고");
  const [optId, setOptId] = useState(optionId ?? product.options[0]?.id ?? null);
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const hasOpts = product.options.length > 0;
  const curOpt = hasOpts ? product.options.find((o) => o.id === optId) : null;
  const cur = curOpt ? curOpt.stock : product.stock;

  const submit = () => {
    const n = parseInt(qty);
    if (!n || n <= 0) return onError("수량을 입력해주세요");
    if (type === "출고" && cur < n) return onError("재고가 부족합니다");
    onSubmit({ product, optionId: hasOpts ? optId : null, type, qty: n, note: note.trim() });
  };

  return (
    <Modal>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{product.name}</div>
        <div style={{ fontSize: 12, color: T.sub }}>
          {curOpt ? `${curOpt.name} 재고: ` : "현재 재고: "}{cur}{product.unit}
          {hasOpts && ` (전체 ${totalStock(product)}${product.unit})`}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["입고", "출고"].map((t) => (
          <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "2px solid", borderColor: type === t ? (t === "입고" ? T.sky : "#E8527A") : T.line, background: type === t ? (t === "입고" ? T.sky : "#E8527A") : "#fff", color: type === t ? "#fff" : T.sub, fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>{t}</button>
        ))}
      </div>
      {hasOpts && (
        <Field label="옵션 선택">
          <select style={inputS} value={optId ?? ""} onChange={(e) => setOptId(Number(e.target.value))}>
            {product.options.map((o) => <option key={o.id} value={o.id}>{o.name} (재고 {o.stock})</option>)}
          </select>
        </Field>
      )}
      <Field label={`수량 (${product.unit})`}><input style={inputS} type="number" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="수량" autoFocus /></Field>
      <Field label="메모 (선택)"><input style={inputS} value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 주문 #1042" /></Field>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={onClose} style={btnLine({ flex: 1 })}>취소</button>
        <button disabled={busy} onClick={submit} style={btn(T.sky, "#fff", { flex: 2, opacity: busy ? 0.6 : 1 })}>{busy ? "처리 중..." : "확인"}</button>
      </div>
    </Modal>
  );
}

// ───────── 상품 상세 ─────────
function DetailModal({ product, logs, onClose, onEdit, onDelete, onLog }) {
  const total = totalStock(product);
  const st = statusOf(total, thresholdOf(product));
  const mine = logs.filter((l) => l.product_id === product.id).slice(0, 5);
  return (
    <Modal onClose={onClose}>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{product.name}</div>
      <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{product.brand && product.brand + " · "}{product.category}</div>
      {product.location && <div style={{ fontSize: 12, color: "#E8527A", fontWeight: 600, marginBottom: 4 }}>📍 {product.location}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 12px" }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: T.sky }}>{won(product.price)}</span>
        <span style={{ background: stBg(st), color: stColor(st), fontWeight: 700, fontSize: 14, borderRadius: 8, padding: "4px 12px" }}>재고 {total}{product.unit}</span>
        <span style={{ fontSize: 11, color: T.sub }}>알림 기준 {thresholdOf(product)}{product.unit} 이하</span>
      </div>

      {product.options.length > 0 && (
        <div style={{ borderTop: `1.5px solid ${T.skyLight}`, paddingTop: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6 }}>옵션별 재고</div>
          {product.options.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ flex: 1, fontSize: 13 }}>{o.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: o.stock === 0 ? T.red : T.text }}>{o.stock}{product.unit}</span>
              <button onClick={() => onLog(product, o.id)} style={btn(T.sky, "#fff", { padding: "4px 9px", fontSize: 11, borderRadius: 6 })}>입출고</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: `1.5px solid ${T.skyLight}`, paddingTop: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6 }}>최근 입출고</div>
        {mine.length === 0 ? (
          <div style={{ fontSize: 12, color: T.line, textAlign: "center", padding: 8 }}>내역 없음</div>
        ) : (
          mine.map((l) => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
              <span style={{ color: T.sub }}>{l.date}{l.option_name ? ` · ${l.option_name}` : ""}{l.note ? ` · ${l.note}` : ""}</span>
              <span style={{ fontWeight: 700, color: l.type === "입고" ? T.sky : "#E8527A" }}>{l.type === "입고" ? "+" : "-"}{l.qty}{product.unit}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={onClose} style={btnLine({ flex: 1 })}>닫기</button>
        <button onClick={() => onDelete(product)} style={btn("#FDE8EE", T.red, { flex: 1 })}>🗑️ 삭제</button>
        <button onClick={() => onEdit(product)} style={btn(T.skyLight, T.skyDark, { flex: 1 })}>✏️ 수정</button>
        <button onClick={() => onLog(product, null)} style={btn(T.sky, "#fff", { flex: 1.4 })}>입출고</button>
      </div>
    </Modal>
  );
}

// ───────── 카테고리 관리 ─────────
function CategoryModal({ categories, products, busy, onClose, onAdd, onRename, onDelete, onMove }) {
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(null);
  return (
    <Modal onClose={onClose}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>🏷️ 카테고리 관리</div>
      <div style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>추가·수정·순서변경·삭제 (사용 중인 상품이 없어야 삭제 가능)</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input style={{ ...inputS, flex: 1 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="새 카테고리 이름"
          onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) { onAdd(input.trim()); setInput(""); } }} />
        <button disabled={busy} onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(""); } }} style={btn(T.sky)}>+ 추가</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {categories.map((cat, idx) => {
          const used = products.filter((p) => p.category === cat).length;
          const isEdit = editing?.name === cat;
          return (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6, background: T.bg, borderRadius: 10, padding: "8px 10px" }}>
              {isEdit ? (
                <>
                  <input autoFocus style={{ ...inputS, flex: 1, padding: "7px 10px" }} value={editing.value} onChange={(e) => setEditing({ name: cat, value: e.target.value })} />
                  <button onClick={() => { onRename(cat, editing.value.trim()); setEditing(null); }} style={btn(T.sky, "#fff", { padding: "7px 12px" })}>저장</button>
                  <button onClick={() => setEditing(null)} style={btnLine({ padding: "7px 10px" })}>취소</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{cat}</span>
                  <span style={{ fontSize: 11, color: T.sub }}>{used > 0 ? used + "개" : "미사용"}</span>
                  <button onClick={() => onMove(idx, -1)} disabled={idx === 0} style={btnLine({ padding: "5px 8px", opacity: idx === 0 ? 0.4 : 1 })}>▲</button>
                  <button onClick={() => onMove(idx, 1)} disabled={idx === categories.length - 1} style={btnLine({ padding: "5px 8px", opacity: idx === categories.length - 1 ? 0.4 : 1 })}>▼</button>
                  <button onClick={() => setEditing({ name: cat, value: cat })} style={btnLine({ padding: "5px 8px" })}>✏️</button>
                  <button onClick={() => onDelete(cat)} style={btn(used > 0 ? "#E0EDF5" : "#FDE8EE", used > 0 ? "#9ABCCC" : T.red, { padding: "5px 8px" })}>🗑️</button>
                </>
              )}
            </div>
          );
        })}
        {categories.length === 0 && <div style={{ textAlign: "center", color: T.sub, fontSize: 13, padding: 16 }}>카테고리가 없어요. 위에서 추가해주세요.</div>}
      </div>
      <button onClick={onClose} style={btnLine({ width: "100%", marginTop: 14 })}>닫기</button>
    </Modal>
  );
}

// ───────── 저장/백업 ─────────
function BackupModal({ products, categories, logs, busy, onClose, onImport }) {
  const fileRef = useRef();
  const exportJson = () => {
    const data = { app: "zoa-check", exportedAt: new Date().toISOString(), products, categories, logs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `zoa-check-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Modal onClose={onClose}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>💾 저장 / 백업</div>
      <div style={{ fontSize: 12, color: T.sub, marginBottom: 14, lineHeight: 1.6 }}>
        데이터는 Supabase에 자동 저장돼요. 별도 보관용으로 백업 파일을 받아둘 수 있어요.
      </div>
      <div style={{ background: T.bg, borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 14 }}>
        상품 <b>{products.length}</b>개 · 입출고 내역 <b>{logs.length}</b>건 · 카테고리 <b>{categories.length}</b>개
      </div>
      <button onClick={exportJson} style={btn(T.sky, "#fff", { width: "100%", marginBottom: 8, padding: 12 })}>⬇️ 백업 파일 받기</button>
      <button disabled={busy} onClick={() => fileRef.current.click()} style={btnLine({ width: "100%", padding: 12 })}>⬆️ 백업 파일에서 불러오기 (추가)</button>
      <div style={{ fontSize: 11, color: T.sub, margin: "6px 2px 0" }}>※ 불러오기는 현재 데이터를 지우지 않고 파일 내용을 추가해요.</div>
      <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; if (f) onImport(f); }} />
      <button onClick={onClose} style={btnLine({ width: "100%", marginTop: 14 })}>닫기</button>
    </Modal>
  );
}

// ───────── 초기화 확인 ─────────
function ResetModal({ busy, onClose, onConfirm }) {
  const [txt, setTxt] = useState("");
  const ok = txt.trim() === "초기화";
  return (
    <Modal onClose={onClose} z={110}>
      <div style={{ color: T.red, fontWeight: 700, fontSize: 16, marginBottom: 10 }}>⚠️ 물류 재고 전체 초기화</div>
      <div style={{ background: "#FDE8EE", borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
        모든 <b>상품, 옵션, 입출고 내역</b>이 Supabase에서 완전히 삭제되며 복구할 수 없어요.<br />
        (카테고리는 유지돼요)
      </div>
      <div style={labelS}>계속하려면 아래에 <b>초기화</b> 라고 입력하세요</div>
      <input style={inputS} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="초기화" />
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={onClose} style={btnLine({ flex: 1 })}>취소</button>
        <button disabled={!ok || busy} onClick={onConfirm} style={btn(T.red, "#fff", { flex: 1, opacity: ok && !busy ? 1 : 0.4 })}>{busy ? "삭제 중..." : "초기화 실행"}</button>
      </div>
    </Modal>
  );
}

// ───────── 내역 목록 ─────────
function LogsView({ logs, products, type }) {
  const list = logs.filter((l) => l.type === type);
  const color = type === "입고" ? T.sky : "#E8527A";
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 30px", display: "flex", flexDirection: "column", gap: 8 }}>
      {list.length === 0 && <div style={{ textAlign: "center", color: T.sub, padding: 40, fontSize: 14 }}>{type} 내역이 없어요</div>}
      {list.map((l) => {
        const prod = products.find((p) => p.id === l.product_id);
        return (
          <div key={l.id} style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", boxShadow: "0 2px 8px rgba(91,184,232,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: type === "입고" ? "#E6F5FC" : "#FCE8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{type === "입고" ? "⬇️" : "⬆️"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {prod?.name || "삭제된 상품"}{l.option_name ? ` · ${l.option_name}` : ""}
              </div>
              <div style={{ fontSize: 11, color: T.sub }}>{l.date}{l.note ? ` · ${l.note}` : ""}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color, flexShrink: 0 }}>{type === "입고" ? "+" : "-"}{l.qty}{prod?.unit || ""}</div>
          </div>
        );
      })}
    </div>
  );
}

// ───────── 메인 ─────────
export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState("재고현황");
  const [selCat, setSelCat] = useState("전체");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("location");
  const [metricFilter, setMetricFilter] = useState(null);

  const [detailId, setDetailId] = useState(null);
  const [formModal, setFormModal] = useState(null); // {mode, product}
  const [logModal, setLogModal] = useState(null); // {product, optionId}
  const [catModal, setCatModal] = useState(false);
  const [backupModal, setBackupModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [deleteCand, setDeleteCand] = useState(null);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  // 카테고리 순서 (이 기기에 저장)
  const [catOrder, setCatOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem("zc_cat_order")) || []; } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem("zc_cat_order", JSON.stringify(catOrder)); } catch {} }, [catOrder]);
  const orderedCats = useMemo(() => {
    const rank = (c) => { const i = catOrder.indexOf(c); return i < 0 ? 1e9 : i; };
    return [...categories].sort((a, b) => rank(a) - rank(b));
  }, [categories, catOrder]);

  // 데이터 불러오기
  const refresh = async () => {
    const [prods, opts, lgs, cats] = await Promise.all([
      db.get("products", "select=*&order=id.asc"),
      db.get("options", "select=*&order=id.asc"),
      db.get("logs", "select=*&order=id.desc"),
      db.get("categories", "select=*"),
    ]);
    setProducts(prods.map((p) => ({
      ...p,
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      unit: p.unit || "개",
      brand: p.brand || "",
      location: p.location || "",
      category: p.category || "",
      options: opts.filter((o) => o.product_id === p.id).map((o) => ({ ...o, stock: Number(o.stock) || 0 })),
    })));
    setLogs(lgs);
    setCategories(cats.map((c) => c.name));
  };

  useEffect(() => {
    (async () => {
      try { await refresh(); }
      catch (e) { console.error(e); showToast("불러오기 실패: Supabase 설정(SQL)을 확인해주세요", "error"); }
      setLoading(false);
    })();
  }, []);

  const run = async (fn) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); }
    catch (e) { console.error(e); showToast("오류: " + String(e.message || e).slice(0, 90), "error"); }
    setBusy(false);
  };

  // 필터 & 정렬
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => {
        if (selCat !== "전체" && p.category !== selCat) return false;
        const total = totalStock(p);
        const st = statusOf(total, thresholdOf(p));
        if (metricFilter === "OUT" && st !== "out") return false;
        if (metricFilter === "LOW" && st !== "low") return false;
        if (q) {
          const hit = p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q) || p.options.some((o) => o.name.toLowerCase().includes(q));
          if (!hit) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name, "ko");
        return a.location.localeCompare(b.location, "ko", { numeric: true });
      });
  }, [products, selCat, search, sortBy, metricFilter]);

  const counts = useMemo(() => {
    let low = 0, out = 0, value = 0;
    products.forEach((p) => {
      const t = totalStock(p);
      const st = statusOf(t, thresholdOf(p));
      if (st === "out") out++; else if (st === "low") low++;
      value += p.price * t;
    });
    return { low, out, value };
  }, [products]);

  const detailProduct = products.find((p) => p.id === detailId) || null;

  // 상품 저장
  const handleSaveProduct = (d) => run(async () => {
    const base = { name: d.name, brand: d.brand, location: d.location, category: d.category, price: d.price, stock: d.stock, unit: d.unit, min_threshold: d.min_threshold };
    if (!d.id) {
      const [saved] = await db.insert("products", [base]);
      if (d.options.length) await db.insert("options", d.options.map((o) => ({ product_id: saved.id, name: o.name, stock: o.stock })));
      showToast(`'${d.name}' 상품이 추가되었습니다!`);
    } else {
      await db.update("products", base, `id=eq.${d.id}`);
      const old = products.find((p) => p.id === d.id);
      const keep = d.options.filter((o) => o.id).map((o) => o.id);
      for (const o of old.options) if (!keep.includes(o.id)) await db.remove("options", `id=eq.${o.id}`);
      for (const o of d.options) {
        if (o.id) await db.update("options", { name: o.name, stock: o.stock }, `id=eq.${o.id}`);
        else await db.insert("options", [{ product_id: d.id, name: o.name, stock: o.stock }]);
      }
      showToast(`'${d.name}' 상품 정보가 수정되었습니다!`);
    }
    await refresh();
    setFormModal(null);
  });

  // 상품 삭제
  const handleDelete = (p) => run(async () => {
    await db.remove("logs", `product_id=eq.${p.id}`);
    await db.remove("options", `product_id=eq.${p.id}`);
    await db.remove("products", `id=eq.${p.id}`);
    await refresh();
    setDeleteCand(null);
    setDetailId(null);
    showToast(`'${p.name}' 상품이 삭제되었습니다.`);
  });

  // 입출고
  const handleLogSubmit = ({ product, optionId, type, qty, note }) => run(async () => {
    const opt = optionId ? product.options.find((o) => o.id === optionId) : null;
    const cur = opt ? opt.stock : product.stock;
    if (type === "출고" && cur < qty) throw new Error("재고가 부족합니다");
    const next = type === "입고" ? cur + qty : cur - qty;
    if (opt) {
      await db.update("options", { stock: next }, `id=eq.${opt.id}`);
      const total = product.options.reduce((s, o) => s + (o.id === opt.id ? next : o.stock), 0);
      await db.update("products", { stock: total }, `id=eq.${product.id}`);
    } else {
      await db.update("products", { stock: next }, `id=eq.${product.id}`);
    }
    await db.insert("logs", [{ product_id: product.id, type, qty, note, date: today(), option_name: opt ? opt.name : null }]);
    await refresh();
    setLogModal(null);
    showToast(`${type} 완료: ${qty}${product.unit} (${product.name}${opt ? " · " + opt.name : ""})`);
  });

  // 카테고리
  const handleAddCat = (name) => run(async () => {
    if (categories.includes(name)) throw new Error("이미 존재하는 카테고리입니다");
    await db.insert("categories", [{ name }]);
    setCategories((prev) => [...prev, name]);
    showToast(`'${name}' 카테고리가 추가되었습니다.`);
  });
  const handleRenameCat = (oldName, newName) => run(async () => {
    if (!newName) throw new Error("이름을 입력해주세요");
    if (newName === oldName) return;
    if (categories.includes(newName)) throw new Error("이미 존재하는 이름입니다");
    await db.update("categories", { name: newName }, `name=eq.${encodeURIComponent(oldName)}`);
    await db.update("products", { category: newName }, `category=eq.${encodeURIComponent(oldName)}`);
    setCategories((prev) => prev.map((c) => (c === oldName ? newName : c)));
    setProducts((prev) => prev.map((p) => (p.category === oldName ? { ...p, category: newName } : p)));
    setCatOrder((prev) => prev.map((c) => (c === oldName ? newName : c)));
    if (selCat === oldName) setSelCat(newName);
    showToast(`'${oldName}' → '${newName}' 으로 변경되었습니다.`);
  });
  const handleDeleteCat = (name) => run(async () => {
    if (products.some((p) => p.category === name)) throw new Error(`'${name}'을(를) 사용 중인 상품이 있어요`);
    await db.remove("categories", `name=eq.${encodeURIComponent(name)}`);
    setCategories((prev) => prev.filter((c) => c !== name));
    if (selCat === name) setSelCat("전체");
    showToast(`'${name}' 카테고리가 삭제되었습니다.`);
  });
  const handleMoveCat = (idx, dir) => {
    const t = idx + dir;
    if (t < 0 || t >= orderedCats.length) return;
    const arr = [...orderedCats];
    [arr[idx], arr[t]] = [arr[t], arr[idx]];
    setCatOrder(arr);
  };

  // 초기화 / 백업 복원
  const handleReset = () => run(async () => {
    await db.remove("logs", "id=gt.0");
    await db.remove("options", "id=gt.0");
    await db.remove("products", "id=gt.0");
    await refresh();
    setResetModal(false);
    setSelCat("전체"); setMetricFilter(null); setSearch("");
    showToast("물류 재고가 초기화되었습니다.");
  });

  const handleImport = (file) => run(async () => {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.products)) throw new Error("백업 파일 형식이 아니에요");
    for (const c of data.categories || []) {
      if (!categories.includes(c)) await db.insert("categories", [{ name: c }]);
    }
    const idMap = {};
    for (const p of data.products) {
      const [saved] = await db.insert("products", [{
        name: p.name, brand: p.brand || "", location: p.location || "", category: p.category || "",
        price: p.price || 0, stock: p.stock || 0, unit: p.unit || "개", min_threshold: p.min_threshold || 3,
      }]);
      idMap[p.id] = saved.id;
      if (p.options && p.options.length) {
        await db.insert("options", p.options.map((o) => ({ product_id: saved.id, name: o.name, stock: o.stock })));
      }
    }
    const newLogs = (data.logs || []).filter((l) => idMap[l.product_id]).map((l) => ({
      product_id: idMap[l.product_id], type: l.type, qty: l.qty, note: l.note || "", date: l.date, option_name: l.option_name || null,
    }));
    if (newLogs.length) await db.insert("logs", newLogs);
    await refresh();
    setBackupModal(false);
    showToast("백업 데이터를 불러왔어요!");
  });

  const chip = (active) => ({
    flexShrink: 0, padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
    background: active ? T.sky : T.skyLight, color: active ? "#fff" : T.skyDark, whiteSpace: "nowrap", fontFamily: "inherit",
  });

  const metrics = [
    { label: "총 상품", value: products.length + "종", color: T.sky, onClick: null, active: false },
    { label: "재고부족", value: counts.low + "종", color: "#D9668C", onClick: () => setMetricFilter(metricFilter === "LOW" ? null : "LOW"), active: metricFilter === "LOW" },
    { label: "품절", value: counts.out + "종", color: T.red, onClick: () => setMetricFilter(metricFilter === "OUT" ? null : "OUT"), active: metricFilter === "OUT" },
    { label: "총 재고금액", value: won(counts.value), color: T.green, onClick: null, active: false, small: true },
  ];

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", background: T.bg, height: "100dvh", maxWidth: 576, margin: "0 auto", display: "flex", flexDirection: "column", color: T.text, position: "relative", boxShadow: "0 0 24px rgba(0,0,0,0.08)" }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`body{margin:0;background:#EEF7FD} .zc-scroll::-webkit-scrollbar{display:none} .zc-scroll{scrollbar-width:none}`}</style>

      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "#6AC3EF", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, color: "#fff", fontSize: 16, fontWeight: 700 }}>
          Zoa Check 불러오는 중...
        </div>
      )}

      {/* 헤더 */}
      <header style={{ background: "linear-gradient(90deg,#4CAEE2,#5BB8E8,#6AC3EF)", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 19, flex: 1, letterSpacing: -0.3 }}>Zoa Check</div>
        <button onClick={() => setResetModal(true)} style={btn("rgba(255,255,255,0.22)", "#fff", { padding: "6px 10px", fontSize: 12, marginRight: 6 })}>↺ 초기화</button>
        <button onClick={() => setBackupModal(true)} style={btn("rgba(255,255,255,0.22)", "#fff", { padding: "6px 10px", fontSize: 12 })}>💾 저장/백업</button>
      </header>

      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: "12px 16px", flexShrink: 0 }}>
        {metrics.map((m) => (
          <div key={m.label} onClick={m.onClick || undefined} style={{ background: "#fff", borderRadius: 12, padding: "10px 8px", boxShadow: "0 2px 8px rgba(91,184,232,0.1)", cursor: m.onClick ? "pointer" : "default", border: m.active ? `2px solid ${m.color}` : "2px solid transparent" }}>
            <div style={{ fontSize: 10, color: T.sub, marginBottom: 3 }}>{m.label}</div>
            <div style={{ fontSize: m.small ? 11 : 16, fontWeight: 700, color: m.color, wordBreak: "break-all" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px 10px", flexShrink: 0 }}>
        {["재고현황", "입고 내역", "출고 내역"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: tab === t ? T.sky : T.skyLight, color: tab === t ? "#fff" : T.skyDark, fontFamily: "inherit" }}>{t}</button>
        ))}
      </div>

      {/* 재고현황 */}
      {tab === "재고현황" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "0 16px 10px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            <div className="zc-scroll" style={{ display: "flex", gap: 6, overflowX: "auto", alignItems: "center" }}>
              <button onClick={() => setCatModal(true)} title="카테고리 관리" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", border: "none", background: T.sky, color: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>+</button>
              <button onClick={() => setSelCat("전체")} style={chip(selCat === "전체")}>전체 ({products.length})</button>
              {orderedCats.map((c) => {
                const n = products.filter((p) => p.category === c).length;
                return <button key={c} onClick={() => setSelCat(selCat === c ? "전체" : c)} style={chip(selCat === c)}>{c}{n > 0 ? ` (${n})` : ""}</button>;
              })}
            </div>

            {metricFilter && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FDE8F0", border: "1px solid #F2A8C0", borderRadius: 10, padding: "6px 12px", fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: "#B05070" }}>
                  필터 적용 중: {metricFilter === "OUT" ? "품절 상품만" : "재고부족 상품만"}
                </span>
                <button onClick={() => setMetricFilter(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: T.red, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>해제</button>
              </div>
            )}

            <div style={{ position: "relative" }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 상품명, 옵션, 브랜드, 위치 검색" style={{ ...inputS, background: "#fff", fontSize: 14, paddingRight: 32 }} />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: 9, background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 14 }}>✕</button>}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setSortBy("location")} style={btn(sortBy === "location" ? T.skyLight : "#fff", sortBy === "location" ? T.skyDark : "#666", { border: sortBy === "location" ? "none" : "1px solid #ddd", padding: "9px 12px", fontSize: 12 })}>📍 위치순</button>
              <button onClick={() => setSortBy("name")} style={btn(sortBy === "name" ? T.skyLight : "#fff", sortBy === "name" ? T.skyDark : "#666", { border: sortBy === "name" ? "none" : "1px solid #ddd", padding: "9px 12px", fontSize: 12 })}>가나다순</button>
              <button onClick={() => setFormModal({ mode: "add", product: null })} style={btn(T.sky, "#fff", { flex: 1, padding: "9px 12px", fontSize: 13 })}>+ 상품 추가</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
            {!loading && products.length === 0 ? (
              <div style={{ margin: "24px 0", padding: "36px 20px", textAlign: "center", background: "#fff", borderRadius: 16, border: `2px dashed ${T.line}` }}>
                <div style={{ fontSize: 34, marginBottom: 8 }}>📦</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>등록된 상품이 없어요</div>
                <div style={{ fontSize: 12, color: T.sub, margin: "6px 0 14px" }}>첫 번째 상품을 등록하고 관리를 시작하세요!</div>
                <button onClick={() => setFormModal({ mode: "add", product: null })} style={btn(T.sky)}>+ 첫 상품 등록하기</button>
              </div>
            ) : visible.length === 0 && !loading ? (
              <div style={{ textAlign: "center", padding: "50px 0", color: T.sub }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>검색된 상품이 없어요</div>
                <button onClick={() => { setSearch(""); setSelCat("전체"); setMetricFilter(null); }} style={btn(T.skyLight, T.skyDark, { marginTop: 12, fontSize: 12 })}>필터 초기화</button>
              </div>
            ) : (
              visible.map((p) => (
                <ProductCard key={p.id} p={p} onDetail={(x) => setDetailId(x.id)} onLog={(x, optId) => setLogModal({ product: x, optionId: optId })} />
              ))
            )}
          </div>
        </div>
      )}

      {tab === "입고 내역" && <LogsView logs={logs} products={products} type="입고" />}
      {tab === "출고 내역" && <LogsView logs={logs} products={products} type="출고" />}

      {/* 모달들 */}
      {detailProduct && (
        <DetailModal
          product={detailProduct}
          logs={logs}
          onClose={() => setDetailId(null)}
          onEdit={(p) => { setDetailId(null); setFormModal({ mode: "edit", product: p }); }}
          onDelete={(p) => { setDetailId(null); setDeleteCand(p); }}
          onLog={(p, optId) => { setDetailId(null); setLogModal({ product: p, optionId: optId }); }}
        />
      )}
      {formModal && (
        <ProductFormModal
          mode={formModal.mode}
          initial={formModal.product}
          categories={orderedCats}
          busy={busy}
          onClose={() => setFormModal(null)}
          onSave={handleSaveProduct}
          onError={(m) => showToast(m, "error")}
        />
      )}
      {logModal && (
        <LogModal
          product={logModal.product}
          optionId={logModal.optionId}
          busy={busy}
          onClose={() => setLogModal(null)}
          onSubmit={handleLogSubmit}
          onError={(m) => showToast(m, "error")}
        />
      )}
      {catModal && (
        <CategoryModal
          categories={orderedCats}
          products={products}
          busy={busy}
          onClose={() => setCatModal(false)}
          onAdd={handleAddCat}
          onRename={handleRenameCat}
          onDelete={handleDeleteCat}
          onMove={handleMoveCat}
        />
      )}
      {backupModal && (
        <BackupModal products={products} categories={categories} logs={logs} busy={busy} onClose={() => setBackupModal(false)} onImport={handleImport} />
      )}
      {resetModal && <ResetModal busy={busy} onClose={() => setResetModal(false)} onConfirm={handleReset} />}

      {deleteCand && (
        <Modal onClose={() => setDeleteCand(null)} z={110}>
          <div style={{ color: T.red, fontWeight: 700, fontSize: 16, marginBottom: 10 }}>⚠️ 상품 삭제 확인</div>
          <div style={{ fontSize: 14, marginBottom: 6 }}><b>"{deleteCand.name}"</b> 상품을 삭제하시겠습니까?</div>
          <div style={{ fontSize: 12, color: T.red, marginBottom: 14 }}>* 옵션과 입출고 내역도 함께 삭제되며 복구할 수 없어요.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setDeleteCand(null)} style={btnLine({ flex: 1 })}>취소</button>
            <button disabled={busy} onClick={() => handleDelete(deleteCand)} style={btn(T.red, "#fff", { flex: 1, opacity: busy ? 0.6 : 1 })}>{busy ? "삭제 중..." : "삭제하기"}</button>
          </div>
        </Modal>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: toast.type === "error" ? T.red : T.skyDark, color: "#fff", padding: "10px 18px", borderRadius: 20, fontSize: 13, fontWeight: 700, boxShadow: "0 4px 14px rgba(0,0,0,0.2)", maxWidth: "90vw", textAlign: "center" }}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}
