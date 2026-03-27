import { NextRequest, NextResponse } from 'next/server'
import { findUserById } from '@/lib/userStore'
import { getCashBalance } from '@/lib/paymentStore'
import { getAuthUserId } from '@/lib/auth'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      )
    }
    console.log("BALANCE ROUTE USER:", userId)

    const user = findUserById(userId)
    if (!user) {
    console.log("BALANCE ROUTE USER: ERROR")
      return NextResponse.json(
        
        { error: 'User not found.' },
        { status: 404 }
      )
    }

    const balanceRow = db
        .prepare(`SELECT cash_balance FROM trading_balances WHERE user_id = ?`)
        .get(userId) as { cash_balance: number } | undefined

    const balance = balanceRow?.cash_balance ?? 0

console.log("WE ARE IN BANKING/BALANCE", balance)
    return NextResponse.json({ balance })
  } catch (error: any) {
    console.error('Error fetching cash balance:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch cash balance' },
      { status: 500 }
    )
  }
}
