export function PanelHeader({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <div className="panelHeader">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
