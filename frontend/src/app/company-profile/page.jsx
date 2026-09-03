import { redirect } from "next/navigation";

export const metadata = {
  title: "Company Profile & ISO Credentials (PDF) | ARCL Instruments",
  description:
    "Official ARCL Instruments Pvt. Ltd. company profile, ISO 9001:2015 credentials, manufacturing capabilities, and testing equipment portfolio.",
};

export default function CompanyProfileRoute() {
  redirect("/arclcompany.pdf");
}
