import { NextRequest, NextResponse } from 'next/server'
import { getUserInvestments } from '@/lib/investmentStore'
import { findUserById } from '@/lib/userStore'
import { getAuthUserId } from '@/lib/auth'
import tradingAssets from '@/data/secondaryTradingAssets.json'
import { initializeAssetData } from '@/lib/tradingEngine'
import { seedTradingOrdersFromTemplates } from '@/lib/seedTradingOrders'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
	console.log('INVESTMENTS ROUTE HIT')

  try {
    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to continue.' },
        { status: 401 }
      )
    }

    const user = findUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      )
    }

    // Get user investments
    const investments = tradingAssets.investments
    const enrichedInvestments = investments.map((asset: any) => {
      const template = tradingAssets.templates
			const existing = db.prepare(`
				SELECT COUNT(*) as count FROM trading_orders WHERE symbol = ?
			`).get(asset.symbol) as { count: number }

			if (existing.count === 0) {
				seedTradingOrdersFromTemplates(asset, template)
			}

      return {
        ...asset,
        trading: initializeAssetData(asset, template),
      }
    })
		console.log('Here at least')
    return NextResponse.json({ investments: enrichedInvestments })


  } catch (error: any) {
    console.error('Error fetching investments:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch investments' },
      { status: 500 }
    )
  }
}
