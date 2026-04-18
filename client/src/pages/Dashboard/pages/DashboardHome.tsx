import Analysis2 from "./Analysis";
import OrganizationOverview from "./OrganizationOverview";
import { userAuth } from "../../../context/Auth";

export default function DashboardHome() {
  const { role, organization } = userAuth()!;

  if ((role === "ORG_OWNER" || role === "EMPLOYEE") && organization) {
    return <OrganizationOverview />;
  }

  return <Analysis2 />;
}
