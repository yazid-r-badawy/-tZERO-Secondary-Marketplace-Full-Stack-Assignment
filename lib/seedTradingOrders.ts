import crypto from 'crypto'
import db from '@/lib/db'
import { getOrCreateSystemUser } from '@/lib/getOrCreateSystemUser'


export function seedTradingOrdersFromTemplates(asset: any, templates: any) {

	const systemUser = getOrCreateSystemUser() as {
		id: string
		email: string
		first_name: string
		last_name: string
	}
  const userId = systemUser.id
  const basePrice = asset.basePrice

  const insertOrder = db.prepare(`
    INSERT INTO trading_orders (
      id,
      user_id,
      symbol,
      side,
      quantity,
      remaining_quantity,
      price,
      status,
      time_in_force,
      good_til_date,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const now = new Date().toISOString()

  // Seed ASKS (sell orders)
  templates.orderBook.asks.forEach((ask: any) => {
    insertOrder.run(
      crypto.randomUUID(),
      userId,
      asset.symbol,
      'sell',
      ask.size,
      ask.size,
      +(ask.priceMultiplier * basePrice).toFixed(2),
      'New',
      'day',
      null,
      now,
      now
    )
  })

  // Seed BIDS (buy orders)
  templates.orderBook.bids.forEach((bid: any) => {
    insertOrder.run(
      crypto.randomUUID(),
      userId,
      asset.symbol,
      'buy',
      bid.size,
      bid.size,
      +(bid.priceMultiplier * basePrice).toFixed(2),
      'New',
      'day',
      null,
      now,
      now
    )
  })
}