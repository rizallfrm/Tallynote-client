export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card flex flex-col items-center py-12 text-center">
      {Icon && (
        <span className="mb-3 rounded-2xl bg-primary-100 p-3 text-primary-700"><Icon size={24} /></span>
      )}
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}