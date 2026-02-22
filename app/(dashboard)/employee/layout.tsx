import { EmployeeBottomNav } from "@/components/employee/bottom-nav";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="max-w-md mx-auto pb-20 md:pb-0">
        {children}
      </div>
      <EmployeeBottomNav />
    </>
  );
}
