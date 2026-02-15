import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../features/auth/authApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, User, Mail, Lock, Github, Chrome } from "lucide-react";
import { toast } from "sonner";

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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "../components/ui/card";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),
});

const Register = () => {
    const navigate = useNavigate();
    const [register, { isLoading }] = useRegisterMutation();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values) => {
        try {
            await register(values).unwrap();
            toast.success("Welcome aboard! Account created successfully. Please log in.");
            navigate("/auth/login");
        } catch (err) {
            console.error("Registration failed", err);
            const errorMessage =
                err.data?.message || err.error || "Registration failed. Please try again.";
            toast.error(errorMessage);
        }
    };

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="space-y-2 pb-8 text-center sm:text-left">
                <CardTitle className="text-3xl font-extrabold tracking-tight">Create an account</CardTitle>
                <CardDescription className="text-base">
                    Join AutoSocial today and automate your growth.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <Input
                                                placeholder="John Doe"
                                                className="pl-10 h-11 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <Input
                                                placeholder="name@example.com"
                                                className="pl-10 h-11 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                                <Lock className="h-4 w-4" />
                                            </div>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-10 h-11 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.01] mt-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>
                </Form>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200 dark:border-gray-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-gray-950 px-2 text-gray-500">Or sign up with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-11 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all font-semibold">
                        <Chrome className="mr-2 h-4 w-4" />
                        Google
                    </Button>
                    <Button variant="outline" className="h-11 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all font-semibold">
                        <Github className="mr-2 h-4 w-4" />
                        GitHub
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 text-center pt-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Already have an account?{" "}
                    <Link
                        to="/auth/login"
                        className="text-primary hover:underline font-bold transition-all"
                    >
                        Sign in
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
};

export default Register;
