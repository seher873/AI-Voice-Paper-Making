"use client";

import FeeMainPage from "./fee/FeeMainPage";

interface Props {
  onHome: () => void;
}

export default function FeeManagement({ onHome }: Props) {
  return (
    <div className="space-y-1">
      <FeeMainPage onHome={onHome} />
    </div>
  );
}
