import { redirect } from 'next/navigation'

// The portal root forwards to the secure provider login.
export default function Home() {
  redirect('/provider/login')
}
