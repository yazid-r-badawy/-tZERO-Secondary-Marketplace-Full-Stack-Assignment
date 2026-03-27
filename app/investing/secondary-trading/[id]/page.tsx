'use client'

/**
 * ASSET DETAIL PAGE - Secondary Trading
 *
 * Build this page to show asset details and allow order placement.
 * You'll also need to build the trading API routes that this page calls.
 *
 * Available: lib/matchingEngine.ts — order matching engine (matchOrder, upsertHolding)
 * Data: import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
 *   - Each asset has dailyHistory (30 OHLCV candles) and company info
 *   - Order book: templates.orderBook.asks/bids — multiply priceMultiplier × asset.basePrice
 */

import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useState, useRef, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
	TextField,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowBack } from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, getSecondaryTradingSymbol, slugify, getSeededColor } from '@/lib/investmentUtils'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
import api from '@/lib/api'

export default function SecondaryTradingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const theme = useTheme()
  const { user, isAuthenticated } = useAuth()

  const investmentSlug = Array.isArray(params.id) ? params.id[0] : params.id
  const decodedSlug = investmentSlug ? decodeURIComponent(investmentSlug) : ''
  const allAssets = secondaryTradingAssets.investments as any[]
  const asset = allAssets.find((a) => a.id === decodedSlug || slugify(a.title) === decodedSlug)

	
  if (!asset) {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <Header />
        <Container maxWidth="lg" sx={{ pt: '120px', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: '#ffffff' }}>Asset not found</Typography>
          <Button onClick={() => router.push('/investing/secondary-trading')} sx={{ mt: 2, color: theme.palette.primary.main }}>
            Back to Marketplace
          </Button>
        </Container>
      </Box>
    )
  }














  const symbol = getSecondaryTradingSymbol(asset.title, asset.symbol)

  // ===== CHART DATA =====
	const chartData = asset.dailyHistory.map((d: any) => ({
	date: d.date,
	price: d.close,
	}))

	const processedData = chartData.map((d: any, i: number) => {
								const date = new Date(d.date)
								const currMonth = date.getUTCMonth()
								const prevMonth = i > 0 ? new Date(chartData[i - 1].date).getUTCMonth() : currMonth
								return {
									...d,
									day: date.getUTCDate(),
									monthLabel: prevMonth !== currMonth ? date.toLocaleString('default', { year: 'numeric' }) : null,
								}
							})

















	const [zoomStart, setZoomStart] = useState(0)    				 // start index of displayed data
	const [zoomEnd, setZoomEnd] = useState(processedData.length) // end index
	const displayData = processedData.slice(zoomStart, zoomEnd)	 // where to slice the data
	const firstPrice = displayData[0].price
	const lastPrice = displayData[displayData.length - 1].price
	const change = lastPrice - firstPrice
	const percentChange = (change / firstPrice) * 100
	const isPositive = change >= 0
	const color = isPositive ? '#00ff88' : '#ff4d4d'


	const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		e.preventDefault() // prevent page scrolling
		const delta = e.deltaY < 0 ? 1 : -1 // scroll down = zoom in, scroll up = zoom out
		const minDays = 2
		const maxDays = 90

		let newStart = zoomStart
		let newEnd = zoomEnd

		if (delta > 0) {
			// zoom in -> remove 1 day from each end if possible
			if (newEnd - newStart > minDays) {
				newStart += 1
				newEnd -= 1
			}
		} else {
			// zoom out -> add 1 day to each end if possible
			if (newStart > 0) newStart -= 1
			if (newEnd < chartData.length && newEnd < maxDays) newEnd += 1
		}
		setZoomStart(newStart)
		setZoomEnd(newEnd)
	}
	const [isDragging, setIsDragging] = useState(false)
	const [dragStartX, setDragStartX] = useState(0)






	// Create a ref for the chart element
	const chartRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const element = chartRef.current
		if (!element) return

		const killScroll = (event: WheelEvent) => {
			// Cancel default browser scroll
			event.preventDefault()
		}

		// Add a wheel listener that allows preventDefault
		element.addEventListener('wheel', killScroll, { passive: false })

		return () => {
			element.removeEventListener('wheel', killScroll)
		}
	}, [])









































	// inside your component
	useEffect(() => {
		if (!isDragging) return

		const onMove = (e: MouseEvent) => {
			const dx = dragStartX - e.clientX
			const sensitivity = 100
			const shiftDays = Math.round(dx / sensitivity)
			if (shiftDays !== 0) {
				let newStart = Math.min(Math.max(0, zoomStart + shiftDays), chartData.length - (zoomEnd - zoomStart))
				let newEnd = newStart + (zoomEnd - zoomStart)
				setZoomStart(newStart)
				setZoomEnd(newEnd)
				setDragStartX(e.clientX)
			}
		}

		const onUp = () => {
			setIsDragging(false)
		}

		window.addEventListener('mousemove', onMove)
		window.addEventListener('mouseup', onUp)

		return () => {
			window.removeEventListener('mousemove', onMove)
			window.removeEventListener('mouseup', onUp)
		}
	}, [isDragging, dragStartX, zoomStart, zoomEnd, chartData.length])


	useEffect(() => {
		if (!symbol) return

		const fetchOrders = async () => {
			try {
				const res = await api.get(`/trading/orders?symbol=${symbol}`)
				const orders = res.data.orders || []

				const bids = orders
					.filter((o: any) => o.side === 'buy')
					.map((o: any) => ({
						price: o.price,
						size: o.remaining_quantity,
					}))
					.sort((a: any, b: any) => b.price - a.price)

				const asks = orders
					.filter((o: any) => o.side === 'sell')
					.map((o: any) => ({
						price: o.price,
						size: o.remaining_quantity,
					}))
					.sort((a: any, b: any) => a.price - b.price)

				setOrderBook({ bids, asks })
			} catch (err) {
				console.error('Order book fetch failed', err)
			}
		}

		fetchOrders()
	}, [symbol])

	useEffect(() => {
		if (!symbol) return

		const fetchMyData = async () => {
			try {
				const res = await api.get(`/trading/my-orders?symbol=${symbol}`)

				const { orders = [], positions = [] } = res.data

				console.log('MY ORDERS:', orders)
				console.log('POSITIONS:', positions)

				setOrders(orders)
				setPositions(positions)
			} catch (err) {
				console.error('Failed to fetch my orders/positions', err)
			}
		}

		fetchMyData()
	}, [symbol])

const placeOrder = async (side: 'buy' | 'sell') => {
  try {
    const res = await api.post('/trading/orders', {
      symbol,
      side,
      quantity: Number(quantity),
      price: Number(price),
    })

    if (res.data?.error) {
      console.error(res.data.error)
      return
    }

    console.log('ORDER SUCCESS', res.data)

    const ordersRes = await api.get(`/trading/orders?symbol=${symbol}`)
    const { orders = [] } = ordersRes.data

    const bids = orders
      .filter((o: any) => o.side === 'buy')
      .map((o: any) => ({
        price: o.price,
        size: o.remaining_quantity,
      }))
      .sort((a: any, b: any) => b.price - a.price)

    const asks = orders
      .filter((o: any) => o.side === 'sell')
      .map((o: any) => ({
        price: o.price,
        size: o.remaining_quantity,
      }))
      .sort((a: any, b: any) => a.price - b.price)

    setOrderBook({ bids, asks })
		await refreshData()
		
  } catch (err) {
    console.error('Order failed', err)
  }
}
const refreshData = async () => {
  const ordersRes = await api.get(`/trading/orders?symbol=${symbol}`)
  const { orders = [] } = ordersRes.data

  const bids = orders
    .filter((o: any) => o.side === 'buy')
    .map((o: any) => ({
      price: o.price,
      size: o.remaining_quantity,
    }))
    .sort((a: any, b: any) => b.price - a.price)

  const asks = orders
    .filter((o: any) => o.side === 'sell')
    .map((o: any) => ({
      price: o.price,
      size: o.remaining_quantity,
    }))
    .sort((a: any, b: any) => a.price - b.price)

  setOrderBook({ bids, asks })

  const myRes = await api.get(`/trading/my-orders?symbol=${symbol}`)
  setOrders(myRes.data.orders || [])
  setPositions(myRes.data.positions || [])
}





















	// ===== ORDER BOOK =====
	
	type OrderBookEntry = {
		price: number
		size: number
	}
		const [orders, setOrders] = useState<any[]>([])
		const [positions, setPositions] = useState<any[]>([])

    const [orderBook, setOrderBook] = useState<{
			bids: OrderBookEntry[]
			asks: OrderBookEntry[]
		}>({
			bids: [],
			asks: [],
		})
		useEffect(() => {
		}, [orderBook])
	const template = secondaryTradingAssets.templates.orderBook

	

	// ===== ORDER FORM STATE =====
	const [price, setPrice] = useState(asset.currentValue)
	const [quantity, setQuantity] = useState('')

	// ─── Replace this placeholder layout with your implementation ───

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header />

      <Container maxWidth="lg" sx={{ pt: { xs: '100px', sm: '120px' }, pb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/investing/secondary-trading')}
          sx={{ color: '#ffffff', mb: 2, textTransform: 'none' }}
        >
          Back to Marketplace
        </Button>

        {/* Asset Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '12px',
            backgroundColor: getSeededColor(symbol),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>
              {symbol.slice(0, 2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff' }}>
              {asset.title}
            </Typography>
            <Typography sx={{ color: '#888888' }}>
              {symbol} &bull; {asset.category}
            </Typography>
          </Box>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#ffffff', mt: 2 }}>
          {formatCurrency(asset.currentValue)}
        </Typography>
        <Typography sx={{
          color: asset.isPositive ? theme.palette.primary.main : '#ff4d4d',
          fontWeight: 600, mb: 4,
        }}>
          {asset.isPositive ? '+' : ''}{asset.performancePercent.toFixed(2)}%
        </Typography>
					
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 2, mb: 3 }}>
              <Typography sx={{ color: '#fff', mb: 2 }}>Price Chart</Typography>
                <Box 
                    onMouseDown={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                        setDragStartX(e.clientX)
                    }}
                    ref={chartRef}
                    onWheel={(e) => { 
                        e.preventDefault() 
                        e.stopPropagation() 
                        handleWheel(e) // your zoom logic 
                    }}

                    sx={{
                        width: '100%',
                        height: 300,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        touchAction: 'none',
                        overscrollBehavior: 'contain', // extra safety
                    }}
                >
                    <ResponsiveContainer>
                        <LineChart data={displayData}>
                            <XAxis
                                dataKey="date"
                                interval={0}
                                tick={({ x, y, payload, index }) => {
                                    const item = displayData[index]
                                    return (
                                        <g transform={`translate(${x},${Number(y) + 10})`}>
                                            <text textAnchor="middle" fill="#888" fontSize={12}>
                                                {item.day} {/* display just the day */}
                                            </text>
                                            {item.monthLabel && (
                                                <text
                                                    x={0}
                                                    y={-15}
                                                    textAnchor="middle"
                                                    fill="#B0B0B0"
                                                    fontSize={10}
                                                    fontWeight="bold"
                                                >
                                                    {item.monthLabel} {/* display month/year at month change */}
                                                </text>
                                            )}
                                        </g>
                                    )
                                }}
                            />
                            <YAxis/>


                            <Tooltip
                                content={({ payload, label, active }) => {
                                    if (!active || !payload || payload.length === 0) return null

                                    const data = payload[0].payload // the hovered data point
                                    

                                    return (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,                 // adjust vertical position as needed
                                                right: 0,               // pin to right
                                                width: 120,         // fixed width in px
                                            height: 'auto',
                                                backgroundColor: '#222', // background color
                                                color: color,           // text color
                                                padding: '8px 12px',
                                                borderRadius: 8,
                                                pointerEvents: 'none',   // prevents blocking mouse
                                                fontSize: 10,
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            <div>Price: ${data.price.toFixed(2)}</div>
                                            <div>
                                                Change: {isPositive ? '+' : ''}
                                        {percentChange.toFixed(2)}% 
                                            </div>
                                            
                                        </div>
                                    )
                                }}
                            />




                            <Line type="monotone" dataKey="price" stroke={color} strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 2, mb: 3 }}>
              <Typography sx={{ color: '#fff', mb: 2 }}>Order Book</Typography>

							<Grid container spacing={2}>
								<Grid item xs={6}>
									<Typography sx={{ color: '#ff4d4d', mb: 1 }}>Asks</Typography>
									{orderBook.asks.map((a, i) => (
										<Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
											<Typography sx={{ color: '#ff4d4d' }}>{a.price.toFixed(2)}</Typography>
											<Typography sx={{ color: '#aaa' }}>{a.size}</Typography>
										</Box>
									))}
								</Grid>

								<Grid item xs={6}>
									<Typography sx={{ color: '#00ff88', mb: 1 }}>Bids</Typography>
									{orderBook.bids.map((b, i) => (
										<Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
											<Typography sx={{ color: '#00ff88' }}>{b.price.toFixed(2)}</Typography>
											<Typography sx={{ color: '#aaa' }}>{b.size}</Typography>
										</Box>
									))}
								</Grid>
							</Grid>
            </Paper>

            <Paper sx={{ p: 3, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 2 }}>
							<Typography sx={{ color: '#fff', mt: 3 }}>Your Orders</Typography>

							{orders.length === 0 ? (
								<Typography sx={{ color: '#888' }}>No open orders</Typography>
							) : (
								<>
									{/* 🔹 COLUMN HEADERS */}
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											mb: 1,
											borderBottom: '1px solid rgba(255,255,255,0.2)',
											pb: 1,
										}}
									>
										<Typography sx={{ color: '#888', fontSize: 12 }}>Action</Typography>
										<Typography sx={{ color: '#888', fontSize: 12 }}>Price</Typography>
										<Typography sx={{ color: '#888', fontSize: 12 }}>Quantity</Typography>
									</Box>

									{/* 🔹 DATA ROWS */}
										{orders.map((o: any) => (
											<Box
												key={o.order_id}
												sx={{
													display: 'flex',
													justifyContent: 'space-between',
													py: 0.5,
												}}
											>
												<Typography
													sx={{ color: o.side === 'buy' ? '#00ff88' : '#ff4d4d' }}
												>
													{o.side}
												</Typography>

												<Typography sx={{ color: '#fff' }}>
													{Number(o.price).toFixed(2)}
												</Typography>

												<Typography sx={{ color: '#aaa' }}>
													{o.remaining_quantity}
												</Typography>
											</Box>
										))}
									</>
								)}

							<Typography sx={{ color: '#fff', mt: 3 }}>Positions</Typography>

							{positions.length === 0 ? (
								<Typography sx={{ color: '#888' }}>No positions</Typography>
							) : (
								<>
									{/* 🔹 COLUMN HEADERS */}
									<Box
										sx={{
											mb: 1,
											borderBottom: '1px solid rgba(255,255,255,0.2)',
											pb: 1,
											alignItems: 'center',
											display: 'flex',
											justifyContent: 'space-between',
											py: 0.5,
										}}
									>
										<Typography sx={{ color: '#888', fontSize: 12 }}>Ticker</Typography>
										<Typography sx={{ color: '#888', fontSize: 12 }}>Shares</Typography>
										<Typography sx={{ color: '#888', fontSize: 12 }}>Avg Price</Typography>
									</Box>

									{/* 🔹 DATA ROWS */}
									{positions.map((p: any) => (
										<Box
											key={p.symbol}
											sx={{
												alignItems: 'center',
												display: 'flex',
												justifyContent: 'space-between',
												py: 0.5,
											}}
										>
											<Typography sx={{ color: '#fff' }}>{p.symbol}</Typography>
											<Typography sx={{ color: '#aaa' }}>{p.quantity}</Typography>
											<Typography sx={{ color: '#aaa' }}>
												{Number(p.avg_price).toFixed(3)}
											</Typography>
										</Box>
									))}
								</>
							)}
            </Paper>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={4}>
            <Paper sx={{
              p: 3,
              border: '1px dashed rgba(255,255,255,0.15)',
              borderRadius: 2,
              position: { md: 'sticky' },
              top: { md: 100 },
            }}>
              <Typography sx={{ color: '#fff', mb: 2 }}>Place Order</Typography>
							<TextField
								label="Price"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								fullWidth
								sx={{ mb: 2 }}
							/>

							<TextField
								label="Quantity"
								value={quantity}
								onChange={(e) => setQuantity(e.target.value)}
								fullWidth
								sx={{ mb: 2 }}
							/>

							<Button
								fullWidth
								variant="outlined"
								sx={{
									mb: 1,
									borderColor: '#00ff88',
									color: '#000000',
									backgroundColor: '#00FF00',
									'&:hover': {
										borderColor: '#00ff88',
										color: '#3f413e',
										backgroundColor: '#04ee04',
									},
								}}
								onClick={() => placeOrder('buy')}
							>
								Buy
							</Button>

							<Button
								fullWidth
								variant="outlined"
								sx={{
									borderColor: '#ff4d4d',
									color: '#ff4d4d',
									'&:hover': {
										borderColor: '#e60000',
										color: '#ffffff',
										backgroundColor: '#5f0b0b',
									},
								}}
								onClick={() => placeOrder('sell')}
							>
								Sell
							</Button>
						
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
