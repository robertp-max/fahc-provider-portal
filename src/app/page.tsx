import { redirect } from 'next/navigation'

// Login is not required — the portal root opens straight to the dashboard.
export default function Home() {
  redirect('/provider/dashboard')
}
