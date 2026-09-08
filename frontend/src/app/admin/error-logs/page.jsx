import ErrorLogsPage from "../../../views/admin/ErrorLogsPage.jsx";

export const metadata = {
  title: "System Health & Error Monitoring | ARCL Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminErrorLogsRoute() {
  return <ErrorLogsPage />;
}
