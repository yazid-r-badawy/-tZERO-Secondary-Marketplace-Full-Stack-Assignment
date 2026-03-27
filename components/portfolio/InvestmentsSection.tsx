'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton } from '@mui/material'
import { ExpandMore, ExpandLess } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import InvestmentLookupIllustration from './InvestmentLookupIllustration'
import InvestmentCard from './InvestmentCard'
import styles from './InvestmentsSection.module.css'

interface Investment {
  id: string
  asset_id: string
  asset_type: string
  asset_title: string
  amount: number
  currency: string
  payment_method_type: string
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  created_at: string
}




interface InvestmentsSectionProps {
  positionsExpanded?: boolean
  onTogglePositions?: () => void
}

export default function InvestmentsSection({
  positionsExpanded = false,
  onTogglePositions,
}: InvestmentsSectionProps) {
	const [positions, setPositions] = useState<any[]>([])
  const router = useRouter()
  const theme = useTheme()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
	const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    fetchInvestments()
		fetchOrders()
  }, [])

  const fetchInvestments = async () => {
    try {
      const response = await fetch('/api/investments')
      if (response.ok) {
        const data = await response.json()
        setInvestments(data.investments || [])
      }
    } catch (error) {
      console.error('Error fetching investments:', error)
    } finally {
      setLoading(false)
    }
  }

	
	const fetchOrders = async () => {
		
			try {
				const res = await fetch('/api/trading/user')
				if (res.ok) {
					const data = await res.json()
					setOrders(data.orders || [])
					setPositions(data.holdings || [])
			}
		} catch (err) {
			console.error('Error fetching orders:', err)
		}
	}

  // Group investments by asset type (marketplace / secondary trading only)
  const secondaryTradingInvestments = investments.filter(
    (inv) => inv.asset_type === 'SECONDARY_TRADING'
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getPaymentMethodLabel = (type: string) => {
    switch (type) {
      case 'TZERO_BALANCE':
        return 'tZERO Balance'
      case 'ACH':
        return 'Bank Account'
      case 'CREDIT_CARD':
        return 'Credit Card'
      default:
        return type
    }
  }


	const pendingOrders = orders.filter(
			(order) => order.status === 'Pending' || order.status === 'PartiallyFilled'
		)
	const hasPositions = + pendingOrders.length + positions.length> 0
  if (loading) {
		
    return (
      <Box className={styles.investmentsSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          MY POSITIONS
        </Typography>
        <Paper className={styles.investmentsCard}>
          <Typography variant="body2" sx={{ color: '#888888', textAlign: 'center', py: 4 }}>
            Loading investments...
          </Typography>
        </Paper>
      </Box>
    )
  }

  if (!hasPositions) {
    return (
      <Box className={styles.investmentsSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          MY POSITIONS
        </Typography>
        <Paper className={styles.investmentsCard}>
          <Box className={styles.illustrationContainer}>
            <InvestmentLookupIllustration />
          </Box>
          <Typography variant="h6" className={styles.investmentsTitle}>
            Let&apos;s find your first investment!
          </Typography>
          <Button
            variant="contained"
            className={styles.exploreButton}
            onClick={() => router.push('/investing/secondary-trading')}
          >
            Explore Opportunities
          </Button>
        </Paper>
      </Box>
    )
  }

  return (
    <Box className={styles.investmentsSection}>
      {/* My Positions Section - Collapsible */}
      {hasPositions && (
        <Paper className={styles.collapsibleSection}>
          <Box 
            className={styles.sectionHeader}
            onClick={() => onTogglePositions?.()}
            sx={{ cursor: onTogglePositions ? 'pointer' : 'default' }}
          >
            <Typography variant="h6" className={styles.categoryTitle}>
              My Positions
            </Typography>
							<IconButton
								size="small"
								sx={{ color: '#ffffff' }}
								onClick={(e) => {
									e.stopPropagation()
									onTogglePositions?.()
								}}
							>
              {positionsExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          {positionsExpanded && (
            <Box className={styles.tableContainer}>
              {/* Secondary Trading Positions */}
							{positions.length > 0 && (
								<Box sx={{ mb: 3 }}>
									<Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 600, mb: 2 }}>
										Positions (Owned Shares)
									</Typography>

									{positions.map((pos) => (
										<Box
											key={pos.symbol}
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												py: 1,
												borderBottom: '1px solid rgba(255,255,255,0.1)',
											}}
										>
											<Box>
												<Typography variant="body2">
													{pos.symbol}
												</Typography>

												<Typography variant="body2" sx={{ color: '#888' }}>
													Shares: {pos.shares}
												</Typography>
											</Box>

											<Typography variant="body2" sx={{ color: '#888' }}>
												Avg: ${Number(pos.avg_cost).toFixed(2)}
											</Typography>
										</Box>
									))}
								</Box>
							)}



							{pendingOrders.length > 0 && (
								<Box sx={{ mb: 3 }}>
									<Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 600, mb: 2 }}>
										Pending Orders
									</Typography>

									
									{pendingOrders.map((order) => (
										<Box
											key={order.id}
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												py: 1,
												borderBottom: '1px solid rgba(255,255,255,0.1)',
											}}
										>
											{/* LEFT SIDE (info) */}
											<Box>
												<Typography variant="body2">
													{order.symbol} — {order.side?.toUpperCase()}
												</Typography>

												<Typography variant="body2" sx={{ color: '#888' }}>
													Qty: {order.remaining_quantity} / {order.quantity}
												</Typography>

												<Typography variant="body2" sx={{ color: '#888' }}>
													Price: ${order.price}
												</Typography>
											</Box>

											{/* RIGHT SIDE (button actions) */}
											<Box>
												

												<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}> 
													<Button
														sx={{
															backgroundColor: '#333333',
															color: '#fff',
															borderColor: 'rgba(255,255,255,0.15)',
															'&:hover': {
																backgroundColor: '#222222',
																borderColor: '#e60000',
																color: '#fff',
															},
														}}
														size="small"
														variant="outlined"

														onClick={async () => {
															await fetch(`/api/trading/orders/${order.id}`, {
																method: 'DELETE',
															})
															window.location.reload()
														}}
													>
														Cancel
													</Button>
													
												</Box>
												

												<Typography variant="body2" sx = {{fontSize: '8px'}}>
													Order ID: {order.id}
												</Typography>
											</Box>
										</Box>
									))}
								</Box>
							)}
              {secondaryTradingInvestments.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 600, mb: 2 }}>
                    Marketplace
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Asset</TableCell>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Amount</TableCell>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Payment Method</TableCell>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Date</TableCell>
                          <TableCell sx={{ color: '#888888', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.1)' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {secondaryTradingInvestments.map((investment) => (
                          <TableRow key={investment.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' } }}>
                            <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)' }}>{investment.asset_title}</TableCell>
                            <TableCell sx={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)' }}>{formatCurrency(investment.amount)}</TableCell>
                            <TableCell sx={{ color: '#888888', borderColor: 'rgba(255, 255, 255, 0.1)' }}>{getPaymentMethodLabel(investment.payment_method_type)}</TableCell>
                            <TableCell sx={{ color: '#888888', borderColor: 'rgba(255, 255, 255, 0.1)' }}>{formatDate(investment.created_at)}</TableCell>
                            <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                              <Chip
                                label={investment.payment_status}
                                size="small"
                                sx={{
                                  backgroundColor: investment.payment_status === 'COMPLETED' 
                                    ? 'rgba(0, 255, 136, 0.2)' 
                                    : investment.payment_status === 'PENDING'
                                    ? 'rgba(255, 193, 7, 0.2)'
                                    : 'rgba(255, 77, 77, 0.2)',
                                  color: investment.payment_status === 'COMPLETED'
                                    ? theme.palette.primary.main
                                    : investment.payment_status === 'PENDING'
                                    ? '#ffc107'
                                    : '#ff4d4d',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  height: 24,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}

    </Box>
  )
}
