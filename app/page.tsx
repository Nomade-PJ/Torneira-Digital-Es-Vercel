import { redirect } from "next/navigation"

// Página inicial que redireciona diretamente para login
export default function HomePage() {
  // Redirecionamento server-side para evitar loops
  redirect("/login")
}
