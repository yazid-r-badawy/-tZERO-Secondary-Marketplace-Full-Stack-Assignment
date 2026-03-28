import { NextResponse } from 'next/server'
import crypto from 'crypto'
import db from '@/lib/db'
import { matchOrder } from '@/lib/matchingEngine'
import { getAuthUserId } from '@/lib/auth'
import { NextRequest } from 'next/server'


export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { symbol, side, quantity, price } = await req.json()

    // --- Validation ---
    if (!symbol || !side || !quantity || !price) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 402 })
    }

    if (quantity <= 0 || price <= 0) {
      return NextResponse.json({ error: 'Invalid quantity/price' }, { status: 403 })
    }

    if (!['buy', 'sell'].includes(side)) {
      return NextResponse.json({ error: 'Invalid side' }, { status: 404 })
    }

    // --- Get balance ---
    const balanceRow = db
      .prepare(`SELECT cash_balance FROM trading_balances WHERE user_id = ?`)
      .get(userId) as { cash_balance: number }

    const balance = balanceRow?.cash_balance || 0

    // --- Get holdings ---
    const holdingRow = db
      .prepare(`SELECT shares FROM trading_holdings WHERE user_id = ? AND symbol = ?`)
      .get(userId, symbol) as { shares: number }

    const shares = holdingRow?.shares || 0

    // --- Checks ---
    if (side === 'buy') {
      const cost = quantity * price
      if (balance < cost) {
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 405 })
      }
      // Reserve cash immediately
      db.prepare(`
        UPDATE trading_balances
        SET cash_balance = cash_balance - ?
        WHERE user_id = ?
      `).run(cost, userId)
    }






    if (side === 'sell') {
      if (shares < quantity) {
        return NextResponse.json({ error: 'Not enough shares' }, { status: 406 })
      }
    }



    // --- Place + match order ---
    const orderId = crypto.randomUUID()

    const result = matchOrder(
      orderId,
      userId,
      symbol,
      side,
      quantity,
      price,
      'day'
    )

    if (side === 'buy') {
        const filledQty = quantity - result.remaining

        // Get actual trades for this order
        const trades = db.prepare(`
            SELECT quantity, price
            FROM trading_trades
            WHERE buy_order_id = ? OR sell_order_id = ?
        `).all(orderId, orderId) as Array<{ quantity: number; price: number }>

        let actualSpent = 0

        for (const trade of trades) {
            actualSpent += trade.quantity * trade.price
        }

        const reserved = quantity * price
        const refund = reserved - actualSpent

        if (trades.length > 0 && refund > 0) {
            db.prepare(`
            UPDATE trading_balances
            SET cash_balance = cash_balance + ?
            WHERE user_id = ?
            `).run(refund, userId)
        }
    }



    // --- Handle cash AFTER trades ---
    if (side === 'sell') {
      const filledQty = quantity - result.remaining
      const trades = db.prepare(`
        SELECT quantity, price
        FROM trading_trades
        WHERE sell_order_id = ?
        `).all(orderId) as Array<{ quantity: number; price: number }>

        let proceeds = 0

        for (const trade of trades) {
            proceeds += trade.quantity * trade.price
        }

      db.prepare(`
        UPDATE trading_balances
        SET cash_balance = cash_balance + ?
        WHERE user_id = ?
      `).run(proceeds, userId)
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Failed to place order' },
      { status: 500 }
    )
  }
	
}




export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })
    }

    const orders = db
      .prepare(`
        SELECT side, price, remaining_quantity
        FROM trading_orders
        WHERE symbol = ?
        AND status IN ('New', 'Pending', 'PartiallyFilled')
      `)
      .all(symbol) as Array<{
        side: string
        price: number
        remaining_quantity: number
      }>

    return NextResponse.json({ orders })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch orders' },
      { status: 700 }
    )
  }
}