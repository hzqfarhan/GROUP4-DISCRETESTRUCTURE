"use client";
import { Search } from "lucide-react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

interface RouteFinderButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function RouteFinderButton({
  onClick,
  loading,
  disabled,
}: RouteFinderButtonProps) {
  return (
    <PrimaryButton onClick={onClick} loading={loading} disabled={disabled}>
      <Search className="h-4 w-4" strokeWidth={2.4} />
      Find My Route
    </PrimaryButton>
  );
}
