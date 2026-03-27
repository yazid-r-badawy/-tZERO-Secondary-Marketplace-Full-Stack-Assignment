// we need to intialize the order book

export function initializeAssetData(asset: any, templates: any) {
  const basePrice = asset.basePrice;

  // Order Book
  const orderBook = {
    asks: templates.orderBook.asks.map((a: any) => ({
      price: +(a.priceMultiplier * basePrice).toFixed(2),
      size: a.size,
    })),
    bids: templates.orderBook.bids.map((b: any) => ({
      price: +(b.priceMultiplier * basePrice).toFixed(2),
      size: b.size,
    })),
  };

  // Market History
  const marketHistory = templates.marketHistory.map((trade: any) => ({
    price: +(trade.priceMultiplier * basePrice).toFixed(2),
    time: trade.time,
    qty: trade.qty,
  }));

  return {
    orderBook,
    marketHistory,
    orders: {
      open: [],
      recent: [],
    },
    positions: [],
  };
}