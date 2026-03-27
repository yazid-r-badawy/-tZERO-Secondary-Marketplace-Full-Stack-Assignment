import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAuthUserId } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transactions = db
      .prepare(`
        SELECT 
          t.id,
          t.symbol,
          t.quantity,
          t.price,
          t.created_at,

          t.buy_order_id,
          t.sell_order_id,

          CASE 
            WHEN t.buy_order_id IN (
              SELECT id FROM trading_orders WHERE user_id = ?
            ) THEN 'BUY'
            ELSE 'SELL'
          END AS side

        FROM trading_trades t

        WHERE t.buy_order_id IN (
          SELECT id FROM trading_orders WHERE user_id = ?
        )
        OR t.sell_order_id IN (
          SELECT id FROM trading_orders WHERE user_id = ?
        )

        ORDER BY t.created_at DESC
      `)
      .all(userId, userId, userId)

    return NextResponse.json({ transactions })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}