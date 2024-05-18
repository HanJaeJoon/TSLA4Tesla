export const getStock = (stock) => {
  return fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${stock}`);
}