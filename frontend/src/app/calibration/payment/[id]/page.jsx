import CalibrationPaymentView from "../../../../views/CalibrationPaymentView.jsx";

export const metadata = {
  title: "Secure Calibration Payment Gateway | ARCL Instruments",
  description:
    "Make ₹0-cost UPI payment for your ARCL instrument calibration request, view dynamic QR code, and submit UTR for manual admin verification.",
};

export default async function CalibrationPaymentPageRoute({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  return <CalibrationPaymentView recordId={id} />;
}
