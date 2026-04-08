import React from "react";
import {
  useListPayroll, getListPayrollQueryKey, useCreatePayroll,
  useListEmployees, getListEmployeesQueryKey
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
import { Calendar, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const payrollSchema = z.object({
  employeeId: z.coerce.number().min(1),
  month: z.string().min(1),
  bonus: z.coerce.number().min(0),
  deductions: z.coerce.number().min(0),
});

type PayrollFormValues = z.infer<typeof payrollSchema>;

export default function Payroll() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [monthFilter, setMonthFilter] = React.useState(new Date().toISOString().slice(0, 7));
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const { data: payrollData, isLoading } = useListPayroll(
    { month: monthFilter },
    { query: { queryKey: getListPayrollQueryKey({ month: monthFilter }) } }
  );
  const { data: employees } = useListEmployees({}, { query: { queryKey: getListEmployeesQueryKey({}) } });
  const createMutation = useCreatePayroll();

  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollSchema),
    defaultValues: { employeeId: 0, month: new Date().toISOString().slice(0, 7), bonus: 0, deductions: 0 },
  });

  const selectedEmployee = employees?.find(e => e.id === form.watch("employeeId"));

  const onSubmit = async (data: PayrollFormValues) => {
    try {
      await createMutation.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getListPayrollQueryKey() });
      toast({ title: t('common.success'), description: t('payroll.created') });
      setIsCreateOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ title: t('common.error'), description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-primary">{t('payroll.title')}</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold shadow-sm"><Plus className="mr-2 h-4 w-4" /> {t('payroll.add')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('payroll.create_title')}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="employeeId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('payroll.employee')}</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t('payroll.select_employee')} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {employees?.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {selectedEmployee && (
                  <div className="bg-muted/50 p-3 rounded-xl text-sm flex justify-between border">
                    <span className="text-muted-foreground">{t('payroll.base_salary')}</span>
                    <span className="font-bold text-primary">${selectedEmployee.salary.toLocaleString()}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="month" render={({ field }) => (
                    <FormItem><FormLabel>{t('common.month')}</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="bonus" render={({ field }) => (
                    <FormItem><FormLabel>{t('payroll.bonus')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="deductions" render={({ field }) => (
                    <FormItem><FormLabel>{t('payroll.deductions')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                {selectedEmployee && (
                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">{t('payroll.net_salary')}</span>
                    <span className="text-xl font-bold text-primary">
                      ${(selectedEmployee.salary + Number(form.watch("bonus") || 0) - Number(form.watch("deductions") || 0)).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? t('payroll.processing') : t('payroll.confirm')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm">
        <div className="p-4 border-b flex gap-4 items-center">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-auto" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{t('payroll.employee')}</TableHead>
                <TableHead className="text-right">{t('payroll.basic_salary')}</TableHead>
                <TableHead className="text-right text-emerald-400">{t('payroll.bonus')}</TableHead>
                <TableHead className="text-right text-destructive">{t('payroll.deductions')}</TableHead>
                <TableHead className="text-right font-bold">{t('payroll.net_salary').replace(':', '')}</TableHead>
                <TableHead className="text-center">{t('common.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              )) : payrollData && payrollData.length > 0 ? payrollData.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium text-primary">{p.employeeName}</div>
                    <div className="text-xs text-muted-foreground">{t('payroll.processed')} {new Date(p.createdAt).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell className="text-right">${p.basicSalary.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-emerald-400">
                    {p.bonus > 0 ? `+ $${p.bonus.toLocaleString()}` : t('common.none')}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {p.deductions > 0 ? `- $${p.deductions.toLocaleString()}` : t('common.none')}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">${p.netSalary.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
                      {t('payroll.status.paid')}
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{t('payroll.no_data')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
