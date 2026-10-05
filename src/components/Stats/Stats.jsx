import { Layout, Sliders, CheckCircle2, Zap } from 'lucide-react';
import { statsData } from '../../data/statsData';
import './Stats.css';

const ICON_MAP = {
  Layout: Layout,
  Sliders: Sliders,
  CheckCircle2: CheckCircle2,
  Zap: Zap
};

export default function Stats() {
  return (
    <section className="stats-section" aria-label="Trust and Statistics">
      <div className="container">
        <div className="stats-grid">
          {statsData.map((stat, idx) => {
            const IconComponent = ICON_MAP[stat.iconName] || Layout;
            return (
              <div className="stat-card" key={idx}>
                <div className="stat-icon-wrapper">
                  <IconComponent size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-subtext">{stat.subtext}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
