import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, Github, Chrome, Facebook, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { useLoginMutation } from "../features/auth/authApi";
import { setCredentials } from "../features/auth/authSlice";
import { Button } from "../components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(1, {
        message: "Password is required.",
    }),
});

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [showPassword, setShowPassword] = useState(false);
    const from = location.state?.from?.pathname || "/dashboard";

    const [login, { isLoading }] = useLoginMutation();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values) => {
        try {
            const userData = await login(values).unwrap();
            dispatch(setCredentials({
                user: userData.data.user,
                token: userData.data.accessToken
            }));
            toast.success("Welcome back! Logged in successfully.");
            navigate(from, { replace: true });
        } catch (err) {
            console.error("Login failed", err);
            const errorMessage =
                err.data?.message || err.error || "Invalid email or password";
            toast.error(errorMessage);
        }
    };

    return (
        <div className="space-y-7">
            <div className="space-y-1.5 text-left">
                <h2 className="text-[32px] font-bold tracking-tight text-[#1e293b] dark:text-white leading-tight">
                    Welcome back 👋
                </h2>
                <p className="text-[15px] font-medium text-slate-400 dark:text-slate-500">
                    Sign in to your AutoPost account
                </p>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-3 gap-3.5">
                <Button variant="outline" className="h-[54px] border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold rounded-xl gap-2.5 shadow-sm group">
                    <Chrome className="h-5 w-5 text-[#DB4437]" />
                    <span className="text-[13px] text-slate-600 dark:text-slate-300">Google</span>
                </Button>
                <Button variant="outline" className="h-[54px] border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold rounded-xl gap-2.5 shadow-sm group">
                    <Facebook className="h-5 w-5 text-[#1877F2]" />
                    <span className="text-[13px] text-slate-600 dark:text-slate-300">Facebook</span>
                </Button>
                <Button variant="outline" className="h-[54px] border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold rounded-xl gap-2.5 shadow-sm group">
                    <Github className="h-5 w-5 text-slate-900 dark:text-white" />
                    <span className="text-[13px] text-slate-600 dark:text-slate-300">GitHub</span>
                </Button>
            </div>

            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-950 px-4 text-slate-400 font-medium tracking-wider">
                        or continue with email
                    </span>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Email address</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <Input
                                            placeholder="admin123"
                                            className="pl-11 h-12 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl font-medium"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage className="text-[11px]" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Password</FormLabel>
                                    <Link to="#" className="text-[12px] font-bold text-blue-600 hover:text-blue-500 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <FormControl>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="pl-11 pr-11 h-12 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl font-medium"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-[11px]" />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center space-x-2.5 pt-1">
                        <Checkbox id="remember" className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-[18px] w-[18px]" />
                        <label htmlFor="remember" className="text-[13px] font-bold text-slate-400 dark:text-slate-500 select-none cursor-pointer">
                            Remember me
                        </label>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-[54px] text-base font-bold shadow-lg shadow-blue-500/20 transition-all rounded-xl bg-[#5a67f2] hover:bg-[#4c59e6] text-white gap-2.5 mt-3"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Sign in
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>
            </Form>

            <div className="text-center pt-3">
                <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">
                    Don&apos;t have an account?{" "}
                    <Link
                        to="/auth/register"
                        className="text-blue-600 hover:text-blue-500 transition-colors"
                    >
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
