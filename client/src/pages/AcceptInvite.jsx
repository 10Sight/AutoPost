import React, { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useVerifyInvitationQuery } from "../features/auth/invitationsApi";
import { useRegisterMutation } from "../features/auth/authApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, User, Mail, Lock, CheckCircle2, ShieldCheck } from "lucide-react";
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
import { Badge } from "../components/ui/badge";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email(),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),
});

const AcceptInvite = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { data: inviteData, isLoading: isVerifying, isError } = useVerifyInvitationQuery(token);
    const [register, { isLoading: isRegistering }] = useRegisterMutation();

    const invite = inviteData?.data;

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    // Pre-fill email from invitation
    useEffect(() => {
        if (invite?.email) {
            form.setValue("email", invite.email);
        }
    }, [invite, form]);

    const onSubmit = async (values) => {
        try {
            await register({ 
                ...values, 
                invitationToken: token 
            }).unwrap();
            
            toast.success(`Success! You've joined ${invite.organization.name}.`);
            navigate("/auth/login");
        } catch (err) {
            console.error("Accept invite failed", err);
            toast.error(err.data?.message || "Failed to join team.");
        }
    };

    if (isVerifying) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Verifying your invitation...</p>
            </div>
        );
    }

    if (isError || !invite) {
        return (
            <Card className="border-none shadow-none bg-transparent text-center">
                <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Invalid Invitation</CardTitle>
                    <CardDescription>
                        This invitation link is invalid, expired, or has already been used.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center">
                    <Button asChild variant="outline">
                        <Link to="/auth/login">Back to Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="space-y-2 pb-6 text-center sm:text-left">
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold px-3">
                        TEAM INVITATION
                    </Badge>
                </div>
                <CardTitle className="text-3xl font-extrabold tracking-tight">Join {invite.organization.name}</CardTitle>
                <CardDescription className="text-base">
                    You've been invited to join as a <span className="font-bold text-primary capitalize">{invite.role}</span>.
                </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-sm font-semibold">Full Name</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <Input
                                                placeholder="John Doe"
                                                className="pl-10 h-11 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
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
                                    <FormLabel className="text-sm font-semibold">Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <Input
                                                disabled
                                                className="pl-10 h-11 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-800 opacity-70 cursor-not-allowed font-medium"
                                                {...field}
                                            />
                                            <div className="absolute inset-y-0 right-3 flex items-center">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            </div>
                                        </div>
                                    </FormControl>
                                    <p className="text-[10px] text-muted-foreground mt-1">This email is locked to your invitation.</p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="space-y-1">
                                    <FormLabel className="text-sm font-semibold">Set Password</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                                <Lock className="h-4 w-4" />
                                            </div>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-10 h-11 bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
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
                            className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-4"
                            disabled={isRegistering}
                        >
                            {isRegistering ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Joining workspace...
                                </>
                            ) : (
                                "Accept & Join"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 text-center pt-2">
                <p className="text-xs text-muted-foreground">
                    By joining, you agree to the organization's policies and terms of service.
                </p>
            </CardFooter>
        </Card>
    );
};

export default AcceptInvite;
