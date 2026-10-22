"use client";

import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { committedCost } from "@/lib/budget";
import { errorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/money";

export function DepositDialog({
  item,
  currency,
  onOpenChange,
}: {
  item: Doc<"budgetItems"> | null;
  currency: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {item && (
          <DepositForm key={item._id} item={item} currency={currency} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Mounted fresh each time the dialog opens, so its state starts from the item. */
function DepositForm({
  item,
  currency,
  onDone,
}: {
  item: Doc<"budgetItems">;
  currency: string;
  onDone: () => void;
}) {
  const recordPayment = useMutation(api.budget.recordPayment);
  const committed = committedCost(item);
  const [amount, setAmount] = useState(() => String(Math.round(committed * 0.3)));
  const [busy, setBusy] = useState(false);

  const value = Number(amount);
  const invalid = amount.trim() === "" || !Number.isFinite(value) || value < 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Record a deposit</DialogTitle>
        <DialogDescription>
          {item.name} costs {formatMoney(committed, currency)}. Enter the total paid so far.
        </DialogDescription>
      </DialogHeader>
      <form
        noValidate
        className="grid gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (invalid) return;
          setBusy(true);
          try {
            await recordPayment({
              itemId: item._id,
              mode: "deposit",
              amount: value,
            });
            toast.success("Deposit recorded.");
            onDone();
          } catch (error) {
            toast.error(errorMessage(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          id="deposit-amount"
          label="Amount paid"
          error={amount.trim() !== "" && invalid ? "Enter a positive amount." : undefined}
          hint="Suggested: 30% of the cost."
        >
          <MoneyInput
            id="deposit-amount"
            currency={currency}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-describedby="deposit-amount-hint"
          />
        </Field>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || invalid}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            Record deposit
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
