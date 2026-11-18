import { describe, it, expect } from "vitest";

describe("Financial Transactions & Invoice Settlement Logic (Unit Tests)", () => {
  interface MockInvoice {
    id: string;
    invoiceNo: string;
    finalAmount: number;
    paymentStatus: "Pending" | "Partially Paid" | "Paid";
    payments: Array<{ amount: number; method: string }>;
  }

  function processPayment(
    invoice: MockInvoice,
    amount: number,
    method: string
  ): {
    success: boolean;
    error?: string;
    updatedInvoice?: MockInvoice;
    remainingBalance?: number;
  } {
    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return { success: false, error: "Valid positive payment amount is required" };
    }

    if (!method || method.trim() === "") {
      return { success: false, error: "Valid payment method is required" };
    }

    const totalPaidAlready = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = Math.round((invoice.finalAmount - totalPaidAlready) * 100) / 100;

    if (remainingBalance <= 0) {
      return { success: false, error: "Invoice is already fully paid" };
    }

    if (paymentAmount > remainingBalance + 0.001) {
      return {
        success: false,
        error: `Payment amount (₹${paymentAmount.toFixed(2)}) exceeds outstanding balance (₹${remainingBalance.toFixed(2)})`,
      };
    }

    const newTotalPaid = Math.round((totalPaidAlready + paymentAmount) * 100) / 100;
    const newStatus =
      newTotalPaid >= invoice.finalAmount - 0.001 ? "Paid" : "Partially Paid";

    const updatedInvoice: MockInvoice = {
      ...invoice,
      paymentStatus: newStatus,
      payments: [...invoice.payments, { amount: paymentAmount, method: method.trim() }],
    };

    return {
      success: true,
      updatedInvoice,
      remainingBalance: Math.max(0, Math.round((invoice.finalAmount - newTotalPaid) * 100) / 100),
    };
  }

  it("processes a valid partial payment and updates status to 'Partially Paid'", () => {
    const invoice: MockInvoice = {
      id: "inv-1",
      invoiceNo: "INV-2026-001",
      finalAmount: 10000,
      paymentStatus: "Pending",
      payments: [],
    };

    const result = processPayment(invoice, 4000, "UPI");
    expect(result.success).toBe(true);
    expect(result.updatedInvoice?.paymentStatus).toBe("Partially Paid");
    expect(result.remainingBalance).toBe(6000);
    expect(result.updatedInvoice?.payments).toHaveLength(1);
  });

  it("processes full payment and updates status to 'Paid' with 0 balance", () => {
    const invoice: MockInvoice = {
      id: "inv-2",
      invoiceNo: "INV-2026-002",
      finalAmount: 5000,
      paymentStatus: "Pending",
      payments: [],
    };

    const result = processPayment(invoice, 5000, "Card");
    expect(result.success).toBe(true);
    expect(result.updatedInvoice?.paymentStatus).toBe("Paid");
    expect(result.remainingBalance).toBe(0);
  });

  it("rejects non-positive payment amounts", () => {
    const invoice: MockInvoice = {
      id: "inv-3",
      invoiceNo: "INV-2026-003",
      finalAmount: 5000,
      paymentStatus: "Pending",
      payments: [],
    };

    expect(processPayment(invoice, 0, "Cash").success).toBe(false);
    expect(processPayment(invoice, -500, "Cash").success).toBe(false);
    expect(processPayment(invoice, NaN, "Cash").success).toBe(false);
  });

  it("strictly rejects overpayments exceeding the outstanding balance", () => {
    const invoice: MockInvoice = {
      id: "inv-4",
      invoiceNo: "INV-2026-004",
      finalAmount: 3000,
      paymentStatus: "Partially Paid",
      payments: [{ amount: 2000, method: "Cash" }],
    };

    // Remaining balance is 1000. Attempting to pay 1500 must fail.
    const result = processPayment(invoice, 1500, "Card");
    expect(result.success).toBe(false);
    expect(result.error).toContain("exceeds outstanding balance");
  });

  it("rejects payments on an already fully settled invoice", () => {
    const invoice: MockInvoice = {
      id: "inv-5",
      invoiceNo: "INV-2026-005",
      finalAmount: 8000,
      paymentStatus: "Paid",
      payments: [{ amount: 8000, method: "Insurance" }],
    };

    const result = processPayment(invoice, 100, "Cash");
    expect(result.success).toBe(false);
    expect(result.error).toContain("already fully paid");
  });

  it("correctly settles invoice over multiple sequential installments", () => {
    let invoice: MockInvoice = {
      id: "inv-6",
      invoiceNo: "INV-2026-006",
      finalAmount: 10000,
      paymentStatus: "Pending",
      payments: [],
    };

    // Installment 1: 3000
    const step1 = processPayment(invoice, 3000, "Cash");
    expect(step1.success).toBe(true);
    invoice = step1.updatedInvoice!;
    expect(invoice.paymentStatus).toBe("Partially Paid");
    expect(step1.remainingBalance).toBe(7000);

    // Installment 2: 4500
    const step2 = processPayment(invoice, 4500, "UPI");
    expect(step2.success).toBe(true);
    invoice = step2.updatedInvoice!;
    expect(invoice.paymentStatus).toBe("Partially Paid");
    expect(step2.remainingBalance).toBe(2500);

    // Final Installment: 2500
    const step3 = processPayment(invoice, 2500, "Bank Transfer");
    expect(step3.success).toBe(true);
    invoice = step3.updatedInvoice!;
    expect(invoice.paymentStatus).toBe("Paid");
    expect(step3.remainingBalance).toBe(0);
  });
});
