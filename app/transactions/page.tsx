'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface Transaction {
  id: string
  symbol: string
  quantity: number
  price: number
  created_at: string
  side: 'BUY' | 'SELL'
}

export default function TransactionsPage() {
  const theme = useTheme()
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions')
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    )
  }

  if (!isAuthenticated) return null

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />

      <Box sx={{ pt: '80px', px: 3, flex: 1, overflowY: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Trade History
        </Typography>

        <Paper sx={{ mt: 2 }}>
          <List>
            {transactions.length === 0 && (
              <Typography sx={{ p: 2 }}>
                No transactions found.
              </Typography>
            )}

            {transactions.map((tx) => (
              <ListItem key={tx.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tx.symbol} • {tx.quantity} shares

                      <Chip
                        label={tx.side}
                        size="small"
                        sx={{
                          backgroundColor:
                            tx.side === 'BUY'
                              ? 'rgba(0, 255, 136, 0.2)'
                              : 'rgba(255, 77, 77, 0.2)',
                          color:
                            tx.side === 'BUY'
                              ? '#00ff88'
                              : '#ff4d4d',
                          fontSize: '11px',
                          fontWeight: 600,
                          height: 22,
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      ${tx.price} •{' '}
                      {new Date(tx.created_at).toLocaleString()}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  )
}