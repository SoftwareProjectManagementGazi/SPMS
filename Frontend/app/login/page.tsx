"use client"

import { useState, useEffect } from "react" // useEffect eklendi
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LayoutDashboard, Loader2, ArrowRight } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/services/auth-service"
import { useAuth } from "@/context/auth-context" // EKLENDİ: useAuth import edildi
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const { toast } = useToast()
    const { login } = useAuth() // EKLENDİ: Context'ten login fonksiyonu alındı

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })
   
    useEffect(() => {
        if (authService.isAuthenticated()) {
            router.replace("/projects")
        }
    }, [router])
    

    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true)

        try {
            // ÖNCE: Sadece token alınıp kaydediliyordu, context güncellenmiyordu.
            // const response = await authService.login(data)
            // authService.setToken(response.access_token)
            
            // ŞİMDİ: Token'ı alıp context'teki login fonksiyonuna veriyoruz.
            const response = await authService.login(data)
            await login(response.access_token) // Context state'ini günceller ve yönlendirir
            
            toast({
                title: "Login successful",
                description: "Redirecting to dashboard...",
            })
            
            // router.push("/projects") // Context içindeki login zaten yönlendirme yapıyor, burayı kaldırabilir veya tutabilirsiniz.
        } catch (error: any) {
            console.error("Login failed:", error)
            toast({
                variant: "destructive",
                title: "Login failed",
                description: error.response?.data?.detail || "Please check your credentials and try again.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // ... (Geri kalan return kısmı aynı kalacak)
    return (
        // ... Mevcut JSX kodlarınız ...
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* ... */}
             <div className="relative flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-background">
                {/* ... */}
                 <div className="mx-auto w-full max-w-[400px] space-y-8">
                    {/* ... */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* ... Form alanları aynı ... */}
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="name@example.com"
                                                type="email"
                                                autoCapitalize="none"
                                                autoComplete="email"
                                                autoCorrect="off"
                                                disabled={isLoading}
                                                className="bg-background h-11"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {/* Password Field */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                         {/* ... aynı ... */}
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    placeholder="••••••••"
                                                    type={showPassword ? "text" : "password"}
                                                    disabled={isLoading}
                                                    className="pr-10 bg-background h-11"
                                                    {...field}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" disabled={isLoading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Sign In
                            </Button>
                        </form>
                    </Form>
                 </div>
             </div>
        </div>
    )
}