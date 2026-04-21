import { redirect } from "next/navigation"

// Root route redirects to the default workspace page. The authenticated shell
// lives under the Next.js route group (shell)/* so the URL stays at /dashboard.
export default function Home() {
  redirect("/dashboard")
}
