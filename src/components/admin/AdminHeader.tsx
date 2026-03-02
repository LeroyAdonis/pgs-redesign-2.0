/**
 * Admin dashboard header
 *
 * Displays the admin area title, breadcrumb context, and user info.
 * Uses a dark theme consistent with the admin layout.
 */

interface AdminHeaderProps {
  /** Admin user display name */
  userName: string;
  /** Admin user email */
  userEmail: string;
  /** Admin user avatar URL */
  userImage?: string;
  className?: string;
}

function AdminHeader({
  userName,
  userEmail,
  userImage,
  className,
}: AdminHeaderProps) {
  /** Get initials from user name for avatar fallback */
  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <header
      className={`sticky top-0 z-[100] flex h-14 items-center justify-between border-b border-slate-700/50 bg-slate-900/95 px-4 backdrop-blur-sm md:px-6 ${className ?? ""}`}
      data-testid="admin-header"
    >
      {/* Left side: spacer for mobile hamburger + title */}
      <div className="flex items-center gap-3">
        {/* Spacer for mobile hamburger button (40px + 16px left) */}
        <div className="h-10 w-10 md:hidden" aria-hidden="true" />
        <h1 className="text-sm font-semibold text-slate-100">
          Admin Dashboard
        </h1>
      </div>

      {/* Right side: user info */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        <span className="hidden rounded-md bg-purple-500/15 px-2 py-0.5 text-[0.6875rem] font-medium text-purple-300 sm:inline-flex">
          Admin
        </span>

        {/* User info */}
        <div className="flex items-center gap-2">
          {/* Avatar */}
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="h-8 w-8 rounded-full border border-slate-700"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300">
              {getInitials(userName)}
            </div>
          )}
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-medium text-slate-200">
              {userName}
            </span>
            <span className="text-[0.6875rem] text-slate-500">{userEmail}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export { AdminHeader };
export type { AdminHeaderProps };
