export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3 text-center">
      <p className="text-sm font-medium text-destructive">Access denied</p>
      <h1 className="text-2xl font-semibold">You do not have permission to view this page.</h1>
      <p className="text-sm text-muted-foreground">
        Contact an administrator if you believe this is an error.
      </p>
    </div>
  );
}
