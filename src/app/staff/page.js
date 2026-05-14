"use client";

import ProtectedStaffPage from "../../components/ProtectedStaffPage";
import OriginalStaffPage from "./staff-content";

export default function StaffPage() {
  return (
    <ProtectedStaffPage>
      <OriginalStaffPage />
    </ProtectedStaffPage>
  );
}
