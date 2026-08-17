#!/usr/bin/env node
// Yahoo Finance에서 현재가/환율/기간별 종가를 받아 assets/data/market-snapshot.json을 갱신한다.
// 릴리스 빌드 전에 실행: node scripts/update-market-snapshot.js
const fs = require('fs');
const path = require('path');

const HEADERS = {
  // UA 없는 요청은 Yahoo가 429로 차단한다
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
};

// lib/calculator.ts의 getPeriodConfig와 동일한 매핑
const PERIODS = {
  '1M': { range: '1mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1wk' },
  '1Y': { range: '1y', interval: '1mo' },
  '5Y': { range: '5y', interval: '3mo' },
};

async function fetchChart(symbol, interval, range) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${symbol} ${range}: HTTP ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`${symbol} ${range}: no chart result`);
  return result;
}

async function main() {
  const quote = await fetchChart('TSLA', '1d', '1d');
  const price = quote.meta?.regularMarketPrice;
  if (!price) throw new Error('TSLA price missing');

  // 지원 언어권에서 흔한 통화들의 오프라인 fallback 환율 (USD -> 통화)
  const SNAPSHOT_CURRENCIES = ['KRW', 'JPY', 'EUR', 'CNY', 'TWD', 'HKD', 'MXN'];
  const usdRates = {};
  for (const currency of SNAPSHOT_CURRENCIES) {
    try {
      const fx = await fetchChart(`${currency}=X`, '1d', '1d');
      const rate = fx.meta?.regularMarketPrice;
      if (rate) usdRates[currency] = rate;
    } catch (e) {
      console.warn(`${currency}=X 조회 실패, 스냅샷에서 제외: ${e.message}`);
    }
  }

  const history = {};
  for (const [period, { range, interval }] of Object.entries(PERIODS)) {
    const result = await fetchChart('TSLA', interval, range);
    history[period] = {
      timestamps: result.timestamp ?? [],
      closes: result.indicators?.quote?.[0]?.close ?? [],
    };
    console.log(`${period}: ${history[period].timestamps.length} points`);
  }

  const snapshot = {
    updatedAt: new Date().toISOString().split('T')[0],
    price,
    usdRates,
    history,
  };

  const outPath = path.join(__dirname, '..', 'assets', 'data', 'market-snapshot.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(snapshot));
  console.log(
    `saved ${outPath} (price=${price}, rates=${Object.keys(usdRates).join(',')}, ${snapshot.updatedAt})`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
