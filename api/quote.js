export default async function handler(req, res) {
  const symbol = req.query.symbol || "CANTE";

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.IS?range=1d&interval=1m`;

  const response = await fetch(url);
  const data = await response.json();

  const price =
    data.chart.result[0].indicators.quote[0].close.slice(-1)[0];

  res.status(200).json({
    price
  });
}