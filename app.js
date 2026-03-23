function ema(values, period) {
  const k = 2 / (period + 1);
  const out = [];
  let prev = values[0] ?? 0;

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    prev = i === 0 ? v : v * k + prev * (1 - k);
    out.push(prev);
  }

  return out;
}

function sma(values, period) {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const slice = values.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function highest(values, period) {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    return Math.max(...values.slice(i - period + 1, i + 1));
  });
}

function atr(highs, lows, closes, period = 14) {
  const tr = highs.map((h, i) => {
    if (i === 0) return h - lows[i];
    return Math.max(
      h - lows[i],
      Math.abs(h - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
  });

  return sma(tr, period);
}

function formatNum(v) {
  if (v == null || Number.isNaN(v)) return "-";
  return Number(v).toFixed(4);
}

function calculateSignal(bars) {
  const closes = bars.map(b => Number(b.close));
  const highs = bars.map(b => Number(b.high));
  const lows = bars.map(b => Number(b.low));
  const volumes = bars.map(b => Number(b.volume));

  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const ema50 = ema(closes, 50);
  const vol20 = sma(volumes, 20);
  const atr14 = atr(highs, lows, closes, 14);
  const hh20 = highest(highs, 20);

  const i = bars.length - 1;
  const lastClose = closes[i];

  const buy =
    ema9[i] > ema21[i] &&
    lastClose > ema50[i] &&
    hh20[i - 1] !== null &&
    lastClose > hh20[i - 1] &&
    vol20[i] !== null &&
    volumes[i] > vol20[i];

  const sell =
    ema9[i] < ema21[i] ||
    lastClose < ema21[i];

  let signal = "BEKLE";
  let reason = "Şartlar tam oluşmadı.";

  if (buy) {
    signal = "AL";
    reason = "EMA9 > EMA21, fiyat EMA50 üstünde, direnç kırılımı ve hacim onayı var.";
  } else if (sell) {
    signal = "SAT";
    reason = "Kısa vadeli yapı zayıfladı, EMA21 altı riskli.";
  }

  const stop = atr14[i] ? lastClose - atr14[i] * 2 : null;
  const target = atr14[i] ? lastClose + atr14[i] * 3 : null;

  return {
    signal,
    reason,
    close: lastClose,
    ema9: ema9[i],
    ema21: ema21[i],
    ema50: ema50[i],
    atr: atr14[i],
    stop,
    target
  };
}

async function refreshData() {
  const symbolInput = document.getElementById("symbol");
  const btn = document.getElementById("refreshBtn");

  const symbol = (symbolInput?.value || "CANTE").trim().toUpperCase();

  try {
    btn.disabled = true;
    btn.textContent = "Alınıyor...";

    const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Veri alınamadı");
    }

    const bars = Array.isArray(data.bars) ? data.bars : [];

    if (bars.length < 20) {
      throw new Error("Yeterli geçmiş veri yok");
    }

    const result = calculateSignal(bars);

    document.getElementById("price").innerText =
      data.price != null ? Number(data.price).toFixed(4) : "-";

    document.getElementById("signal").innerText = result.signal;
    document.getElementById("stop").innerText = formatNum(result.stop);
    document.getElementById("target").innerText = formatNum(result.target);
    document.getElementById("reason").innerText = result.reason;

    const ema9El = document.getElementById("ema9");
    const ema21El = document.getElementById("ema21");
    const ema50El = document.getElementById("ema50");
    const atrEl = document.getElementById("atr");
    const asOfEl = document.getElementById("asOf");

    if (ema9El) ema9El.innerText = formatNum(result.ema9);
    if (ema21El) ema21El.innerText = formatNum(result.ema21);
    if (ema50El) ema50El.innerText = formatNum(result.ema50);
    if (atrEl) atrEl.innerText = formatNum(result.atr);
    if (asOfEl) asOfEl.innerText = data.asOf || "-";
  } catch (err) {
    document.getElementById("reason").innerText = err.message || "Bir hata oluştu";
  } finally {
    btn.disabled = false;
    btn.textContent = "Güncelle";
  }
}

window.onload = refreshData;
