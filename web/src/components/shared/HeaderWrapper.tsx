// src/components/shared/HeaderWrapper.tsx
// ✅ Header now uses useSession() directly, no need to pass user prop
import Header from './Header'

export default function HeaderWrapper() {
  return <Header />
}