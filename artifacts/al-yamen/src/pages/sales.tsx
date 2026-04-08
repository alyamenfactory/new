import React from "react";
import {
  useListSalesOrders,
  getListSalesOrdersQueryKey,
  useCreateSalesOrder,
  useDeleteSalesOrder
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
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const salesOrderSchema = z.object({
  customerName: z.string().min(2),
  items: z.array(z.object({
    productId: z.coerce.number().min(1),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(0),
  })).min(1),
  discount: z.coerce.number().min(0),
  paidAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

type SalesOrderFormValues = z.infer<typeof salesOrderSchema>;

export default function Sales() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const { data: orders, isLoading } = useListSalesOrders(
    { search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined },
    { query: { queryKey: getListSalesOrdersQueryKey({ search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined }) } }
  );

  const createMutation = useCreateSalesOrder();
  const deleteMutation = useDeleteSalesOrder();

  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: { customerName: "", items: [{ productId: 1, quantity: 1, unitPrice: 0 }], discount: 0, paidAmount: 0, notes: "" },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const onSubmit = async (data: SalesOrderFormValues) => {
    try {
      await createMutation.mutateAsync({ data });
      queryClient.invalidateQueries({ queryKey: getListSalesOrdersQueryKey() });
      toast({ title: t('common.success'), description: t('sales.created') });
      setIsCreateOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ title: t('common.error'), description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('sales.delete_confirm'))) {
      try {
        await deleteMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListSalesOrdersQueryKey() });
        toast({ title: t('common.deleted'), description: t('sales.deleted') });
      } catch (e: any) {
        toast({ title: t('common.error'), description: e.message, variant: "destructive" });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge className="bg-emerald-500">{t('sales.status.delivered')}</Badge>;
      case 'confirmed': return <Badge className="bg-blue-500">{t('sales.status.confirmed')}</Badge>;
      case 'pending': return <Badge variant="outline" className="text-amber-500 border-amber-500">{t('sales.status.pending')}</Badge>;
      case 'cancelled': return <Badge variant="destructive">{t('sales.status.cancelled')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-primary">{t('sales.title')}</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold shadow-sm"><Plus className="mr-2 h-4 w-4" /> {t('sales.add')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t('sales.create_title')}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="customerName" render={({ field }) => (
                  <FormItem><FormLabel>{t('sales.customer_name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{t('common.items')}</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: 1, quantity: 1, unitPrice: 0 })}>
                      <Plus className="h-4 w-4 mr-2" /> {t('sales.add_item')}
                    </Button>
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2">
                      <FormField control={form.control} name={`items.${index}.productId`} render={({ field }) => (
                        <FormItem className="flex-1"><FormLabel className={index !== 0 ? "sr-only" : ""}>{t('sales.product_id')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                        <FormItem className="w-24"><FormLabel className={index !== 0 ? "sr-only" : ""}>{t('common.qty')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                        <FormItem className="w-32"><FormLabel className={index !== 0 ? "sr-only" : ""}>{t('common.unit_price')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mb-0.5 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="discount" render={({ field }) => (
                    <FormItem><FormLabel>{t('sales.discount')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="paidAmount" render={({ field }) => (
                    <FormItem><FormLabel>{t('sales.paid_amount')}</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>{t('common.notes')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? t('sales.creating') : t('sales.complete')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-lg shadow-sm">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('sales.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('sales.all_statuses')}</SelectItem>
              <SelectItem value="pending">{t('sales.status.pending')}</SelectItem>
              <SelectItem value="confirmed">{t('sales.status.confirmed')}</SelectItem>
              <SelectItem value="delivered">{t('sales.status.delivered')}</SelectItem>
              <SelectItem value="cancelled">{t('sales.status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{t('sales.order_number')}</TableHead>
                <TableHead>{t('sales.customer')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.total')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              )) : orders && orders.length > 0 ? orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell>{o.customerName || t('common.none')}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(o.status)}</TableCell>
                  <TableCell className="text-right font-semibold">${o.totalAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(o.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{t('sales.no_data')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
