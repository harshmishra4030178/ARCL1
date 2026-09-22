import AdminPaymentVerificationView from "../../../../views/admin/AdminPaymentVerificationView.jsx";

export const metadata = {
  title: "UPI Payment Verification Dashboard | ARCL Admin",
  description:
    "Review pending UPI calibration payments, verify UTR transactions against bank statements, and approve or reject submissions.",
};

export default function AdminCalibrationPaymentsPage() {
  return <AdminPaymentVerificationView />;
}
