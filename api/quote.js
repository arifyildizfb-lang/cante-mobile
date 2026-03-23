export default async function handler(req, res) {
  try {
    const symbol = (req.query.symbol || "CANTE").toUpperCase();
    const yahooSymbol = `${symbol}.IS`;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=5d&interval=1h`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: "Veri bulunamadı" });
    }

    const quote = result?.indicators?.quote?.[0];
    const timestamps = result?.timestamp || [];

    if (!quote || !timestamps.length) {
      return res.status(404).json({ error: "Mum verisi bulunamadı" });
    }

    const bars = timestamps
      .map((ts, i) => ({
        time: ts,
        open: quote.open?.[i] ?? null,
        high: quote.high?.[i] ?? null,
        low: quote.low?.[i] ?? null,
        close: quote.close?.[i] ?? null,
        volume: quote.volume?.[i] ?? null
      }))
      .filter(
        b =>
          b.open != null &&
          b.high != null &&
          b.low != null &&
          b.close != null &&
          b.volume != null
      );

    if (!bars.length) {
      return res.status(404).json({ error: "Geçerli bar verisi yok" });
    }

    const lastBar = bars[bars.length - 1];

    return res.status(200).json({
      symbol,
      price: lastBar.close,
      asOf: new Date(lastBar.time * 1000).toLocaleString("tr-TR", {
        timeZone: "Europe/Istanbul"
      }),
      bars
    });
  } catch (err) {
    return res.status(500).json({
      error: "Sunucu hatası",
      detail: err.message
    });
  }
}
