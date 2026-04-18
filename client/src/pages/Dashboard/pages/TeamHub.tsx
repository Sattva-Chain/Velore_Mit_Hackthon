import ManageEmploy from "./MangeEmploy";
import OrganizationTeam from "./OrganizationTeam";
import { userAuth } from "../../../context/Auth";

export default function TeamHub() {
  const { role, isLegacyCompanySession } = userAuth()!;

  if (isLegacyCompanySession) {
    return <ManageEmploy />;
  }

  if (role === "ORG_OWNER") {
    return <OrganizationTeam />;
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-6 text-sm text-zinc-400">
      Team management is available only to organization owners.
    </div>
  );
}
