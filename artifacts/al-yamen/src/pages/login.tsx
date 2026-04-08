import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TrendingUp, LogIn, User, Lock, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@alyamen.com', password: 'admin123', color: '#06B6D4' },
  { role: 'Manager', email: 'manager@alyamen.com', password: 'manager123', color: '#10B981' },
  { role: 'Cashier', email: 'cashier@alyamen.com', password: 'cashier123', color: '#8B5CF6' },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = React.useState(false);

  const { data: user, isLoading } = useGetMe({ query: { retry: false } });

  React.useEffect(() => {
    if (user && !isLoading) setLocation("/dashboard");
  }, [user, isLoading, setLocation]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync({ data });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ title: t('common.error'), description: error?.message || "Invalid credentials", variant: "destructive" });
    }
  };

  const fillDemo = (account: typeof DEMO_ACCOUNTS[0]) => {
    form.setValue("email", account.email);
    form.setValue("password", account.password);
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen w-full flex" style={{ background: 'hsl(220 20% 7%)' }}>
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'hsl(220 20% 9%)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #06B6D4, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Al-Yamen</div>
              <div className="text-xs text-cyan-400 font-medium">Business Management System</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Manage your business<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #06B6D4, #8B5CF6)' }}>
              with confidence
            </span>
          </h2>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
            All-in-one platform for sales, inventory, HR, and accounting management.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            { icon: '📊', text: 'Real-time sales & inventory tracking' },
            { icon: '👥', text: 'Complete HR & payroll management' },
            { icon: '💳', text: 'Multi-bank account tracking' },
            { icon: '🌐', text: 'Bengali, English & Arabic support' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3">
              <span className="text-lg">{f.icon}</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">Al-Yamen</div>
              <div className="text-xs text-cyan-400">Business Management System</div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('login.title')}</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)' }}>{t('login.subtitle')}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {t('login.email')}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <Input
                        placeholder="admin@alyamen.com"
                        className="pl-10 h-12 rounded-xl text-white border-0"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {t('login.password')}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12 rounded-xl text-white border-0"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all duration-200 disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #06B6D4, #0284c7)', boxShadow: '0 4px 20px rgba(6,182,212,0.3)' }}
              >
                <LogIn className="h-4 w-4" />
                {loginMutation.isPending ? t('login.logging_in') : t('login.submit')}
              </button>
            </form>
          </Form>

          {/* Demo accounts */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{t('login.demo_accounts')}</span>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  onClick={() => fillDemo(account)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all duration-200 hover:brightness-110"
                  style={{ background: `${account.color}12`, border: `1px solid ${account.color}25`, color: account.color }}
                >
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: account.color }}>
                    {account.role[0]}
                  </div>
                  {account.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
