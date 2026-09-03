import CalibrationServicesClient from "../../views/CalibrationServices.jsx";

export const metadata = {
  title:
    "Instrument Calibration & Maintenance Services | ISO/IEC 17025 Compliant | ARCL Instruments",
  description:
    "Certified multi-point instrument calibration and maintenance services for civil, mechanical, thermal, pressure, and laboratory testing equipment by ARCL Instruments Pvt. Ltd.",
  keywords: [
    "instrument calibration services",
    "laboratory calibration India",
    "NABL traceable calibration",
    "testing machine repair",
    "ARCL Instruments",
  ],
  alternates: {
    canonical: "/calibration-services",
  },
};

export default function CalibrationServicesRoute() {
  return <CalibrationServicesClient />;
}
