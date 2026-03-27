import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getAuthUserId } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const userId = await getAuthUserId(req)
    const { id } = params

    const order = db
      .prepare(`SELECT * FROM trading_orders WHERE id = ?`)
      .get(id) as any

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!['New', 'Pending', 'PartiallyFilled'].includes(order.status)) {
      return NextResponse.json({ error: 'Cannot cancel' }, { status: 400 })
    }

    const remainingQty = order.remaining_quantity

    const refundAmount = remainingQty * order.price

    const result = db.prepare(`
      UPDATE trading_orders
      SET status = 'Cancelled'
      WHERE id = ?
    `).run(id)

    if (result.changes === 0) {
        return NextResponse.json({ error: 'Order Cancel failed' }, { status: 460 })
    } else {
        if (order.side === 'buy') {
            const balanceResult = db.prepare(`
            UPDATE trading_balances
            SET cash_balance = cash_balance + ?
            WHERE user_id = ?
            `).run(refundAmount, userId)

            if (balanceResult.changes === 0) {
                throw new Error('Refund failed (balance row missing)')
            }
        }
    }
    console.log("RIGHT HERE")
    

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}