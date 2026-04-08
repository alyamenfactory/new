import React from "react";
import {
  useListTransactions, getListTransactionsQueryKey,
  useCreateTransaction, useDeleteTransaction,
  useGetAccountingBalance, getGetAccountingBalanceQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, Trash2, TrendingUp, TrendingDown, Wallet, Building2, CircleDollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const BANK_ACCOUNTS = [
  { name: "Dutch-Bangla Bank", branch: "Dhanmondi", type: "current", balance: 285000 },
  { name: "BRAC Bank", branch: "Gulshan", type: "savings", balance: 145000 },
  { name: "Islami Bank", branch: "Motijheel", type: "current", balance: 98000 },
  { name: "Cash in Hand", branch: "Cash in Hand", type: "cash", balance: 42500 },
];

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(2),
  description: z.string().min(2),
  amount: z.coerce.number().min(0.01),
  date: z.string().min(1),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

function formatK(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

export default function Accounting() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"income" | "expense" | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const { data: transactions, isLoading } = useListTransactions(
    { search: search || undefined, type: typeFilter !== "all" ? typeFilter : undefined },
    { query: { queryKey: getListTransactionsQueryKey({ search: search || undefined, type: typeFilter !== "all" ? typeFilter : undefined }) } }
  );
  const { data: balance, isLoading: isBalanceLoading } = useGetAccountingBalance({
    query: { queryKey: getGetAccountingBalanceQueryKey() }
  });

  const createMutation = useCreateTransaction();
  const deleteMutation = useDeleteTransaction();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { type: "income", category: "", description: "", amount: 0, date: new Date().toISOString().split('T')[0] },
  });

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      await createMutation.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAccountingBalanceQueryKey() });
      toast({ title: t('common.success'), description: t('accounting.created') });
      setIsCreateOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ title: t('common.error'), description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('accounting.delete_confirm'))) {
      try {
        await deleteMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAccountingBalanceQueryKey() });
        toast({ title: t('common.deleted'), description: t('accounting.deleted') });
      } catch (e: any) {
        toast({ title: t('common.error'), description: e.message, variant: "destructive" });
      }
    }
  };

  const totalBankBalance = BANK_ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const badgeStyle: Record<string, { bg: string; text: string }> = {
    current: { bg: 'rgba(6,182,212,0.15)', text: '#06B6D4' },
    savings: { bg: 'rgba(16,185,129,0.15)', text: '#10B981' },
    cash: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-primary">{t('accounting.title')}</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold shadow-sm"><Plus className="mr-2 h-4 w-4" /> {t('accounting.add')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('accounting.create_title')}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.type')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="income">{t('accounting.type.income')}</SelectItem>
                          <SelectItem value="expense">{t('accounting.type.expense')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>{t('common.date')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>{t('common.amount')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>{t('common.category')}</FormLabel><FormControl><Input placeholder="e.g. Salary, Rent..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>{t('common.description')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? t('accounting.saving') : t('accounting.save')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: t('accounting.net_balance'), icon: Wallet, value: balance?.netBalance, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' },
          { title: t('accounting.total_income'), icon: TrendingUp, value: balance?.totalIncome, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { title: t('accounting.total_expenses'), icon: TrendingDown, value: balance?.totalExpenses, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl p-5 border" style={{ background: card.bg, borderColor: `${card.color}25` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: card.color }}>{card.title}</span>
              <card.icon className="h-4 w-4" style={{ color: card.color }} />
            </div>
            {isBalanceLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold text-white">${(card.value || 0).toLocaleString()}</div>
            )}
          </div>
        ))}
      </div>

      {/* Bank Accounts */}
      <div className="rounded-2xl border p-5" style={{ background: 'hsl(220 18% 11%)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Bank Accounts</h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Total: ${totalBankBalance.toLocaleString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BANK_ACCOUNTS.map((acc) => {
            const pct = Math.round((acc.balance / totalBankBalance) * 100);
            const style = badgeStyle[acc.type] || { bg: 'rgba(255,255,255,0.1)', text: 'white' };
            return (
              <div key={acc.name} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{acc.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{acc.branch}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                    style={{ background: style.bg, color: style.text }}>
                    {acc.type}
                  </span>
                </div>
                <p className="text-lg font-bold text-cyan-400 mb-2">${acc.balance.toLocaleString()}</p>
                <div className="h-1 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card border rounded-2xl shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('accounting.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('accounting.all_transactions')}</SelectItem>
              <SelectItem value="income">{t('accounting.income_only')}</SelectItem>
              <SelectItem value="expense">{t('accounting.expenses_only')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('common.description')}</TableHead>
                <TableHead>{t('common.category')}</TableHead>
                <TableHead>{t('common.type')}</TableHead>
                <TableHead className="text-right">{t('common.amount')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              )) : transactions && transactions.length > 0 ? transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell>{tx.category}</TableCell>
                  <TableCell>
                    {tx.type === 'income'
                      ? <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{t('accounting.type.income')}</Badge>
                      : <Badge className="bg-destructive/20 text-destructive border-destructive/30">{t('accounting.type.expense')}</Badge>}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-destructive'}`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{t('accounting.no_data')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
