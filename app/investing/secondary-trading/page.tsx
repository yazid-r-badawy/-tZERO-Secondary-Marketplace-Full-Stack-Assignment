'use client'

/**
 * SECONDARY MARKETPLACE - Asset Listing Page
 *
 * Build this page to display available trading assets with filtering and search.
 * Navigate to /investing/secondary-trading/[id] on asset click.
 *
 * Data: GET /api/trading/assets → { assets: [...], total: 5 }
 * Or: import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
 * Utils: import { formatCurrency, slugify } from '@/lib/investmentUtils'
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
	TextField,
	Button,
	Menu,
	MenuItem,
	Checkbox,
	ListItemText,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/contexts/AuthContext'
import secondaryTradingAssets from '@/data/secondaryTradingAssets.json'
import { formatCurrency, getSecondaryTradingSymbol, getSeededColor } from '@/lib/investmentUtils'

type Asset = {
  id: string
  title: string
  category: string
  basePrice: number
  previousValue: number
  currentValue: number
  performancePercent: number
  isPositive: boolean
  volume: string
  companyDescription: string
  symbol?: string
}



const allAssets = secondaryTradingAssets.investments as any[]




export default function SecondaryTradingPage() {
	
  const router = useRouter()
  const theme = useTheme()
  const { user, isAuthenticated } = useAuth()
  const allAssets = secondaryTradingAssets.investments as Asset[]

	// Filter state
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategories, setSelectedCategories] = useState<string[]>([])
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

	const categories = useMemo(() => {
		const unique = Array.from(new Set(allAssets.map((a) => a.category)))
		return unique.sort()
	}, [allAssets])


	const filteredAssets = useMemo(() => {
		return allAssets.filter((asset) => {
			const matchesName = asset.title.toLowerCase().includes(searchTerm.toLowerCase())
			const matchesCategory =
				selectedCategories.length === 0 || selectedCategories.includes(asset.category)
			return matchesName && matchesCategory
		})
	}, [allAssets, searchTerm, selectedCategories])
  // ─── Replace this placeholder layout with your implementation ───






























  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header />

      <Container maxWidth="lg" sx={{ pt: { xs: '100px', sm: '120px' }, pb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', mb: 1 }}>
          Secondary Marketplace
        </Typography>
        <Typography sx={{ color: '#888888', mb: 4 }}>
          Browse and trade digital securities on the secondary market.
        </Typography>

        {/* Search & Filters */}
        <Paper sx={{
          p: 2, mb: 3,
          border: '1px dashed rgba(255,255,255,0.15)',
          borderRadius: 2,
        }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
						<TextField
							fullWidth
							placeholder="Search by name..."
							variant="outlined"
							size="small"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							sx={{ flex: 1, backgroundColor: '#000', borderRadius: 1 }}
						/>

						<Button
							variant="outlined"
							size="small"
							onClick={(e) => setAnchorEl(e.currentTarget)}
							sx={{  
								backgroundColor: selectedCategories.length > 0 ? '#00ff88' : '#333333',
    						color: selectedCategories.length > 0 ? '#000' : '#FFF',
								borderColor: 'rgba(255,255,255,0.15)',
								'&:hover': {
									borderColor: '#00ff88',  // hover outline stays green
									backgroundColor: '#222222', // darker center
									color: '#FFF',

								},
								textTransform: 'none' }}
						>
							Filter Categories ({selectedCategories.length})
						</Button>

						<Menu
							anchorEl={anchorEl}
							open={Boolean(anchorEl)}
							onClose={() => setAnchorEl(null)}
						>
							<MenuItem onClick={() => setSelectedCategories([...categories])}>Select All</MenuItem>
							<MenuItem onClick={() => setSelectedCategories([])}>Deselect All</MenuItem>
							{categories.map((category) => (
								<MenuItem key={category} onClick={() => {
									setSelectedCategories(prev =>
										prev.includes(category)
											? prev.filter(c => c !== category)
											: [...prev, category]
									)
								}}
								sx={{
									py:0,
								}}
								
								>
									<Checkbox checked={selectedCategories.includes(category)} />
									<ListItemText primary={category} />
								</MenuItem>
							))}
						</Menu>
					</Box>
        </Paper>

        {/* Asset Cards */}
        <Grid container spacing={2}>
          {filteredAssets.map((asset) => {
            const symbol = getSecondaryTradingSymbol(asset.title, asset.symbol)
            return (
              <Grid item xs={12} sm={6} md={4} key={asset.id}>
                <Paper
                  onClick={() => router.push(`/investing/secondary-trading/${asset.id}`)}
                  sx={{
                    p: 2.5,
                    border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'rgba(0, 255, 136, 0.3)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '8px',
                      backgroundColor: getSeededColor(symbol),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '13px' }}>
                        {symbol.slice(0, 2)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: '14px' }}>
                        {asset.title}
                      </Typography>
                      <Typography sx={{ color: '#888', fontSize: '12px' }}>
                        {symbol}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography sx={{ color: '#ffffff', fontWeight: 700, fontSize: '18px' }}>
                      {formatCurrency(asset.currentValue)}
                    </Typography>
                    <Typography sx={{
                      color: asset.isPositive ? theme.palette.primary.main : '#ff4d4d',
                      fontWeight: 600, fontSize: '13px',
                    }}>
                      {asset.isPositive ? '+' : ''}{asset.performancePercent.toFixed(2)}%
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            )
          })}
        </Grid>









        
      </Container>
    </Box>
  )
}
