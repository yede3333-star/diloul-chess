/**
 * The floating main button above the bottom bar; its label changes per page (SPEC §4.3).
 * In this step it has no action yet: each phase wires its own.
 */
export function PrimaryAction({ label }: { label: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(12px,env(safe-area-inset-bottom))+88px)] z-20 flex justify-center px-4 lg:bottom-8 lg:ps-56">
      <button type="button" className="btn btn-primary btn-lg pointer-events-auto min-w-[62%] sm:min-w-72">
        {label}
      </button>
    </div>
  );
}
