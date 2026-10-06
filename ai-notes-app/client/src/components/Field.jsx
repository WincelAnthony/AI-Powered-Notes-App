export default function Field({ label, id, children, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children ?? <input id={id} {...props} />}
    </div>
  );
}
