import { LayoutTemplate, Palette, Sparkles, Award, ShieldCheck, Eye, Check } from 'lucide-react';

const ICON_MAP = {
  LayoutTemplate: LayoutTemplate,
  Palette: Palette,
  Sparkles: Sparkles,
  Award: Award,
  ShieldCheck: ShieldCheck,
  Eye: Eye
};

export default function FeatureCard({ feature }) {
  const IconComponent = ICON_MAP[feature.iconName] || Sparkles;

  return (
    <div className="feature-card">
      <div className="feature-top-row">
        <div className="feature-icon-box">
          <IconComponent size={26} />
        </div>
        {feature.badge && <span className="feature-badge">{feature.badge}</span>}
      </div>

      <h3 className="feature-card-title">{feature.title}</h3>
      <p className="feature-card-description">{feature.description}</p>

      {feature.highlight && (
        <div className="feature-card-highlight">
          <Check size={16} />
          <span>{feature.highlight}</span>
        </div>
      )}
    </div>
  );
}
