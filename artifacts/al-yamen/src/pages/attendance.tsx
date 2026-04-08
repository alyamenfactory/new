import React from "react";
import {
  useListAttendance, getListAttendanceQueryKey,
  useCreateAttendance, useListEmployees, getListEmployeesQueryKey
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
import { Plus, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const attendanceSchema = z.object({
  employeeId: z.coerce.number().min(1),
  date: z.string().min(1),
  status: z.enum(["present", "absent", "late", "half_day"]),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

export default function Attendance() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [monthFilter, setMonthFilter] = React.useState(new Date().toISOString().slice(0, 7));
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const { data: attendanceData, isLoading } = useListAttendance(
    { month: monthFilter },
    { query: { queryKey: getListAttendanceQueryKey({ month: monthFilter }) } }
  );
  const { data: employees } = useListEmployees({}, { query: { queryKey: getListEmployeesQueryKey({}) } });
  const createMutation = useCreateAttendance();

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { employeeId: 0, date: new Date().toISOString().split('T')[0], status: "present", checkIn: "", checkOut: "" },
  });

  const onSubmit = async (data: AttendanceFormValues) => {
    try {
      await createMutation.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey() });
      toast({ title: t('common.success'), description: t('attendance.created') });
      setIsCreateOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ title: t('common.error'), description: e.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{t('attendance.status.present')}</Badge>;
      case 'absent': return <Badge className="bg-destructive/20 text-destructive border-destructive/30">{t('attendance.status.absent')}</Badge>;
      case 'late': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{t('attendance.status.late')}</Badge>;
      case 'half_day': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{t('attendance.status.half_day')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-primary">{t('attendance.title')}</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold shadow-sm"><Plus className="mr-2 h-4 w-4" /> {t('attendance.add')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('attendance.create_title')}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="employeeId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('attendance.employee')}</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder={t('attendance.select_employee')} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {employees?.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>{t('common.date')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.status')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('attendance.select_status')} /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="present">{t('attendance.status.present')}</SelectItem>
                          <SelectItem value="absent">{t('attendance.status.absent')}</SelectItem>
                          <SelectItem value="late">{t('attendance.status.late')}</SelectItem>
                          <SelectItem value="half_day">{t('attendance.status.half_day')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="checkIn" render={({ field }) => (
                    <FormItem><FormLabel>{t('attendance.check_in')}</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="checkOut" render={({ field }) => (
                    <FormItem><FormLabel>{t('attendance.check_out')}</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? t('attendance.saving') : t('attendance.save')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm">
        <div className="p-4 border-b flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-auto" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{t('attendance.employee')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('attendance.check_in')}</TableHead>
                <TableHead>{t('attendance.check_out')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              )) : attendanceData && attendanceData.length > 0 ? attendanceData.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-primary">{a.employeeName}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(a.date).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(a.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{a.checkIn || t('common.none')}</TableCell>
                  <TableCell className="text-muted-foreground">{a.checkOut || t('common.none')}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">{t('attendance.no_data')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
