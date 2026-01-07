"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, LayoutDashboard, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        // Simulate network request
        setTimeout(() => {
            setIsLoading(false)
        }, 3000)
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Hero/Visuals */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-10 text-white relative overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[100px]" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px]" />
                    <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-violet-500/10 blur-[80px]" />
                </div>

                <div className="relative z-10 flex items-center gap-2 text-xl font-bold tracking-tight">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                        <LayoutDashboard className="h-6 w-6" />
                    </div>
                    SPMS
                </div>

                <div className="relative z-10 max-w-md">
                    <blockquote className="space-y-4">
                        <p className="text-2xl font-medium leading-normal">
                            "Efficiency is doing things right; effectiveness is doing the right things. SPMS helps you do both."
                        </p>
                        <footer className="text-sm text-zinc-400 font-medium">
                            Software Project Management System
                        </footer>
                    </blockquote>
                </div>

                <div className="relative z-10 text-sm text-zinc-500">
                    © 2024 SPMS. All rights reserved.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="relative flex items-center justify-center p-8 sm:p-12 lg:p-20 bg-background">
                <div className="absolute top-8 right-8">
                    <Link href="/signup" className="group flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        Create an account
                        <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="mx-auto w-full max-w-[400px] space-y-8">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Sign in to your SPMS account to continue
                        </p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={isLoading}
                                    className="bg-background h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm font-medium text-primary hover:underline underline-offset-4"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        placeholder="••••••••"
                                        type={showPassword ? "text" : "password"}
                                        disabled={isLoading}
                                        className="pr-10 bg-background h-11"
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
                                        <span className="sr-only">
                                            {showPassword ? "Hide password" : "Show password"}
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Button disabled={isLoading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            {isLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Sign In
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" type="button" disabled={isLoading} className="w-full h-11 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>
                        )}
                        Google
                    </Button>
                </div>
            </div>
        </div>
    )
}
