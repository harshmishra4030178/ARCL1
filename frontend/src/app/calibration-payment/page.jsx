"use client";

import React, { use } from "react";
import CalibrationPaymentView from "../../views/CalibrationPaymentView.jsx";

export default function CalibrationPaymentQueryRoute({ searchParams }) {
  const resolvedSearchParams = use(searchParams);
  const id = resolvedSearchParams?.id || resolvedSearchParams?.serialNo || "";

  return <CalibrationPaymentView recordId={id} />;
}
