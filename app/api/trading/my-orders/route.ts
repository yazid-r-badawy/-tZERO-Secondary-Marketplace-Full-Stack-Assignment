import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAuthUserId } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })
    }

    const orders = db
      .prepare(`
        SELECT 
          id AS order_id,
          side,
          price,
          remaining_quantity,
          status
        FROM trading_orders
        WHERE user_id = ?
        AND symbol = ?
        AND status IN ('New', 'Pending', 'PartiallyFilled')
      `)
      .all(userId, symbol)

    const positions = db
			.prepare(`
				SELECT symbol, shares AS quantity, ROUND(avg_cost, 3) AS avg_price
				FROM trading_holdings
				WHERE user_id = ?
			`)
			.all(userId)

    return NextResponse.json({ orders, positions })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch user orders' },
      { status: 500 }
    )
  }
}