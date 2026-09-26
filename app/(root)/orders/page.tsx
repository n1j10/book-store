import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import SectionTitle from "@/components/global/SectionTitle";
import { fetchUserOrders, payOrderAction } from "@/utils/actions/global";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";
import FormContainer from "@/components/form/FormContainer";
import { SubmitButton } from "@/components/form/Buttons";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2 } from "lucide-react";

async function OrdersPage() {
  const orders = await fetchUserOrders();

  return (
    <>
      <SectionTitle text="Your Orders" />
      <Table>
        <TableCaption>Total Orders : {orders.length}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Order Total</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const { id, products, orderTotal, createdAt, product, isPaid } =
              order;
            return (
              <TableRow key={id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{products}</TableCell>
                <TableCell>{formatCurrency(orderTotal)}</TableCell>
                <TableCell>{formatDate(createdAt)}</TableCell>
                <TableCell>{formatTime(createdAt)}</TableCell>
                <TableCell>
                  {isPaid ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-600 dark:text-amber-400 gap-1"
                    >
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!isPaid && (
                    <FormContainer action={payOrderAction}>
                      <input type="hidden" name="orderId" value={id} />
                      <SubmitButton
                        text="Pay with QiCard"
                        size="sm"
                        className="mt-0 bg-primary hover:bg-primary/90 text-xs"
                      />
                    </FormContainer>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
export default OrdersPage;
