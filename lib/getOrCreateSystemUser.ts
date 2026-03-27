import db from '@/lib/db'
import crypto from 'crypto'

export function getOrCreateSystemUser() {
  let user = db.prepare(`
    SELECT * FROM users WHERE email = ?
  `).get('system@trading.local')

  if (!user) {
    const id = crypto.randomUUID()

    db.prepare(`
			INSERT INTO users (id, email, password, first_name, last_name)
			VALUES (?, ?, ?, ?, ?)
		`).run(
				id,
				'system@trading.local',
				'system-password', // 👈 required
				'System',
				'User'
		)

    user = {
      id,
      email: 'system@trading.local',
      first_name: 'System',
      last_name: 'User',
    }
  }

  return user
}