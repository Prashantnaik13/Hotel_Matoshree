// Decimal-safe billing calculation using integer paise
// All money in DB is DECIMAL(10,2). We calculate via paise to avoid floating errors.
// Rounding policy: half-up to 2 decimals (INR smallest is 0.01, but we support round-off to nearest rupee)

export function toPaise(amount) {
  return Math.round(Number(amount) * 100);
}
export function toRupees(paise) {
  return Number((paise / 100).toFixed(2));
}

export function calculateBill({ items, discount = 0, discountType = 'fixed', taxRate = 5, serviceChargeRate = 0, isInclusive = false, roundOffEnabled = true }) {
  // items: [{ unitPrice, quantity, taxRateOverride? }]
  let subtotalPaise = 0;
  for (const it of items) {
    const unitPaise = toPaise(it.unitPrice);
    subtotalPaise += unitPaise * Number(it.quantity);
  }

  // discount
  let discountPaise = 0;
  if (discountType === 'percent') {
    discountPaise = Math.round(subtotalPaise * (Number(discount) / 100));
  } else {
    discountPaise = toPaise(discount);
  }
  if (discountPaise > subtotalPaise) discountPaise = subtotalPaise;

  const taxableBasePaise = subtotalPaise - discountPaise;

  // tax
  let taxPaise = 0;
  let taxableAmountPaise = taxableBasePaise;
  let taxBreakup = { cgst: 0, sgst: 0, igst: 0, total: 0 };

  if (isInclusive) {
    // tax inclusive: taxable = base * 100/(100+rate)
    // tax = base - taxable
    const divisor = 100 + Number(taxRate);
    const taxable = Math.round(taxableBasePaise * 100 / divisor);
    taxPaise = taxableBasePaise - taxable;
    taxableAmountPaise = taxable;
    // split intra-state equally
    const half = Math.round(taxPaise / 2);
    taxBreakup = { cgst: toRupees(half), sgst: toRupees(taxPaise - half), igst: 0, total: toRupees(taxPaise) };
  } else {
    taxPaise = Math.round(taxableBasePaise * (Number(taxRate) / 100));
    const half = Math.round(taxPaise / 2);
    taxBreakup = { cgst: toRupees(half), sgst: toRupees(taxPaise - half), igst: 0, total: toRupees(taxPaise) };
  }

  // service charge on taxable amount (configurable before or after tax: we apply on taxable base)
  let servicePaise = 0;
  if (serviceChargeRate > 0) {
    servicePaise = Math.round(taxableAmountPaise * (Number(serviceChargeRate) / 100));
  }

  const beforeRoundPaise = taxableAmountPaise + taxPaise + servicePaise;
  const beforeRound = toRupees(beforeRoundPaise);

  let roundOff = 0;
  let grandTotal = beforeRound;
  if (roundOffEnabled) {
    const rounded = Math.round(beforeRound);
    roundOff = Number((rounded - beforeRound).toFixed(2));
    grandTotal = rounded;
  }

  return {
    subtotal: toRupees(subtotalPaise),
    discountAmount: toRupees(discountPaise),
    taxableAmount: toRupees(taxableAmountPaise),
    taxAmount: toRupees(taxPaise),
    taxBreakup,
    cgst: taxBreakup.cgst,
    sgst: taxBreakup.sgst,
    igst: taxBreakup.igst,
    serviceCharge: toRupees(servicePaise),
    roundOff,
    grandTotal,
    beforeRound
  };
}

export function validateBillIntegrity(bill, recalculated) {
  // ensure stored matches recalc within 0.01
  return Math.abs(bill.grandTotal - recalculated.grandTotal) < 0.01;
}
