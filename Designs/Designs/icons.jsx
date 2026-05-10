// Lightweight icon set as inline-SVG React components
// Stroke-based, 16x16 viewBox, currentColor

const Icon = ({ d, size = 16, fill = false, stroke = 1.6, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 16 16"
       fill={fill ? "currentColor" : "none"}
       stroke="currentColor" strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const I = {
  Box:        (p) => <Icon {...p} d="M2 5l6-3 6 3v6l-6 3-6-3V5zM2 5l6 3 6-3M8 8v6" />,
  Inbox:      (p) => <Icon {...p} d="M2 8l2-5h8l2 5v5H2V8zM2 8h4l1 2h2l1-2h4" />,
  Users:      (p) => <Icon {...p} d="M5.5 8a2 2 0 100-4 2 2 0 000 4zM2 14c0-2 1.5-3.5 3.5-3.5S9 12 9 14M11 8.5a1.8 1.8 0 100-3.5 1.8 1.8 0 000 3.5zM10 14c0-1.7 1-3 3-3s3 1.3 3 3" />,
  Chart:      (p) => <Icon {...p} d="M2 13h12M4 11V7M7 11V4M10 11V8M13 11V6" />,
  Alert:      (p) => <Icon {...p} d="M8 2L1.5 13.5h13L8 2zM8 6.5v3M8 11.5v.01" />,
  Sparkle:    (p) => <Icon {...p} d="M8 1.5l1.6 4.4 4.4 1.6-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6L8 1.5zM13 11.5l.6 1.4L15 13.5l-1.4.6L13 15.5l-.6-1.4L11 13.5l1.4-.6L13 11.5z" />,
  Logs:       (p) => <Icon {...p} d="M3 2.5h10v11H3v-11zM5.5 5h5M5.5 8h5M5.5 11h3" />,
  Search:     (p) => <Icon {...p} d="M7 12.5a5 5 0 100-10 5 5 0 000 10zM11 11l3 3" />,
  Bell:       (p) => <Icon {...p} d="M4 12h8c-1-.7-1-2-1-4 0-2.5-1.3-4-3-4S5 5.5 5 8c0 2 0 3.3-1 4zM7 14h2" />,
  Settings:   (p) => <Icon {...p} d="M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM8 1v1.5M8 13.5V15M2.8 4.8l1.1 1.1M12.1 10.1l1.1 1.1M1 8h1.5M13.5 8H15M2.8 11.2l1.1-1.1M12.1 5.9l1.1-1.1" />,
  Plus:       (p) => <Icon {...p} d="M8 3v10M3 8h10" />,
  Arrow:      (p) => <Icon {...p} d="M3 8h10M9 4l4 4-4 4" />,
  ArrowDown:  (p) => <Icon {...p} d="M8 3v10M4 9l4 4 4-4" />,
  ArrowUp:    (p) => <Icon {...p} d="M8 13V3M4 7l4-4 4 4" />,
  Check:      (p) => <Icon {...p} d="M3 8.5l3 3 7-7" />,
  Clock:      (p) => <Icon {...p} d="M8 14.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM8 4.5V8l2.5 1.5" />,
  Filter:     (p) => <Icon {...p} d="M2 3h12l-4.5 6V14L6.5 12V9L2 3z" />,
  Download:   (p) => <Icon {...p} d="M8 2v8M4 7l4 4 4-4M2 13.5h12" />,
  More:       (p) => <Icon {...p} d="M3.5 8h.01M8 8h.01M12.5 8h.01" />,
  Lock:       (p) => <Icon {...p} d="M4 7.5V5a4 4 0 018 0v2.5M3 7.5h10v6H3z" />,
  Mail:       (p) => <Icon {...p} d="M2 4h12v8H2V4zM2 4l6 4 6-4" />,
  Eye:        (p) => <Icon {...p} d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 10a2 2 0 100-4 2 2 0 000 4z" />,
  Truck:      (p) => <Icon {...p} d="M1.5 4h8v7h-8V4zM9.5 7h3l2 2v2h-5V7zM4 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
  Leaf:       (p) => <Icon {...p} d="M2 14C2 8 7 3 14 3c0 7-5 12-11 12-1 0-1-1-1-1zM3 13l6-6" />,
  Heart:      (p) => <Icon {...p} d="M8 13.5S2 10 2 6.2A2.7 2.7 0 014.7 3.5C6 3.5 7.2 4.4 8 5.7c.8-1.3 2-2.2 3.3-2.2A2.7 2.7 0 0114 6.2C14 10 8 13.5 8 13.5z" />,
  Calendar:   (p) => <Icon {...p} d="M2 4h12v10H2V4zM2 7h12M5 2v3M11 2v3" />,
  RefreshCw:  (p) => <Icon {...p} d="M2 8a6 6 0 0110-4.5L13.5 5M14 8a6 6 0 01-10 4.5L2.5 11M13.5 2.5V5h-2.5M2.5 13.5V11H5" />,
  X:          (p) => <Icon {...p} d="M3 3l10 10M13 3L3 13" />,
};

window.I = I;
window.Icon = Icon;
