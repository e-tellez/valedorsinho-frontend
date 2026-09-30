import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <form action="/api/auth/sign-out" method="post">
      <button
        type="submit"
        className="btn-secondary !h-9 !px-3 inline-flex items-center justify-center gap-2"
        aria-label="Exit and close session"
      >
        <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Exit</span>
      </button>
    </form>
  );
}
