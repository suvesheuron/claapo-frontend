function RoleSelect() {
  const roles = [
    { label: 'Company', description: 'Hire crew and manage projects' },
    { label: 'Freelancer', description: 'Get hired for production work' },
    { label: 'Vendor', description: 'List equipment and services' },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 mb-4 sm:mb-6 text-center break-words">
          Select your role
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-2xl justify-center items-stretch sm:items-center min-w-0">
          {roles.map((role) => (
            <button
              key={role.label}
              type="button"
              className="rounded-lg border-2 border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-4 hover:border-neutral-900 hover:bg-neutral-50 transition text-left min-h-[44px] sm:min-h-0 flex flex-col items-center sm:items-start justify-center gap-1 flex-1 sm:flex-initial min-w-0"
            >
              <span className="font-semibold text-neutral-900 text-sm sm:text-base">{role.label}</span>
              <span className="text-xs sm:text-sm text-neutral-600 hidden sm:block">{role.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoleSelect;
