function ema(arr, n) {
  const k = 2 / (n + 1);
  let ema = arr[0];
  return arr.map((v, i) => {
    ema = i === 0 ? v : v * k + ema * (1 - k);
    return ema;
  });
}

function calculate(price) {
  const fake = Array(60).fill(price).map((v, i) => v + (Math.random()-0.5)*0.05);

  const ema9 = ema(fake, 9);
  const ema21 = ema(fake, 21);

  let signal = "BEKLE";
  let reason = "Şart yok";

  if (ema9.at(-1) > ema21.at(-1)) {
    signal = "AL";
    reason = "Trend yukarı";
  } else {
    signal = "SAT";
    reason = "Trend zayıf";
  }

  return {
    signal,
    stop: price * 0.96,
    target: price * 1.08,
    reason
  };
}

async function refreshData() {
  const symbol = document.getElementById("symbol").value;

  const res = await fetch(`/api/quote?symbol=${symbol}`);
  const data = await res.json();

  const price = data.price;

  const r = calculate(price);

  document.getElementById("price").innerText = price.toFixed(2);
  document.getElementById("signal").innerText = r.signal;
  document.getElementById("stop").innerText = r.stop.toFixed(2);
  document.getElementById("target").innerText = r.target.toFixed(2);
  document.getElementById("reason").innerText = r.reason;
}

window.onload = refreshData;