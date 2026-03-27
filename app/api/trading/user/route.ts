import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAuthUserId } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req)

    const balance = db
      .prepare(`SELECT * FROM trading_balances WHERE user_id = ?`)
      .get(userId)

    const holdings = db
      .prepare(`SELECT * FROM trading_holdings WHERE user_id = ?`)
      .all(userId)

    const orders = db
      .prepare(`SELECT * FROM trading_orders WHERE user_id = ? ORDER BY created_at DESC`)
      .all(userId)

    const trades = db
      .prepare(`
        SELECT t.*
        FROM trading_trades t
        JOIN trading_orders o
        ON t.buy_order_id = o.id OR t.sell_order_id = o.id
        WHERE o.user_id = ?
      `)
      .all(userId)

    return NextResponse.json({
      balance,
      holdings,
      orders,
      trades,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}