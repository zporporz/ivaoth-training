"use client";

import ProtectedStaffPage from "../../components/ProtectedStaffPage";
import StaffNoticeBadgeLayer from "../../components/StaffNoticeBadgeLayer";
import OriginalStaffPage from "./staff-content";

export default function StaffPage() {
  return (
    <ProtectedStaffPage>
      <OriginalStaffPage />
      <StaffNoticeBadgeLayer />
    </ProtectedStaffPage>
  );
}
