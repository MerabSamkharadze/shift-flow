import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { getEmployeeSwapsData } from "@/lib/cache";
import {
  SwapsClient,
  type MySwapRow,
  type IncomingSwapRow,
  type PublicSwapRow,
  type MyClaimRow,
} from "@/components/employee/swaps-client";

export default async function EmployeeSwapsPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "employee") redirect(`/${profile.role}`);

  const { mySwaps, incoming, publicBoard, myClaims } =
    await getEmployeeSwapsData(profile.id);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold">Swap Requests</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Pick up open shifts or manage your swap requests.
        </p>
      </div>

      <SwapsClient
        mySwaps={mySwaps as MySwapRow[]}
        incoming={incoming as IncomingSwapRow[]}
        publicBoard={publicBoard as PublicSwapRow[]}
        myClaims={myClaims as MyClaimRow[]}
      />
    </div>
  );
}
