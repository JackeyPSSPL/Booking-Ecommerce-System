import { Link } from 'react-router-dom';

const DESTINATIONS = [
  'Ahmedabad', 'Manali', 'Goa', 'Mumbai', 'Jaipur',
  'Shimla', 'Udaipur', 'Ooty', 'Rishikesh', 'Nainital',
];

const LINKS = [
  {
    heading: 'Support',
    items: [
      { label: 'My Trips',          to: '/trips' },
      { label: 'Help Centre',       to: '/' },
      { label: 'Cancellations',     to: '/' },
      { label: 'Safety Resources',  to: '/' },
    ],
  },
  {
    heading: 'Discover',
    items: [
      { label: 'Travel Blog',       to: '/' },
      { label: 'Destinations',      to: '/' },
      { label: 'Seasonal Deals',    to: '/' },
      { label: 'Holiday Ideas',     to: '/' },
    ],
  },
  {
    heading: 'Partners',
    items: [
      { label: 'List your property', to: '/register' },
      { label: 'Partner Dashboard',  to: '/partner/dashboard' },
      { label: 'Partner Help',       to: '/' },
      { label: 'Become an Affiliate',to: '/' },
    ],
  },
  {
    heading: 'About',
    items: [
      { label: 'About StayBook',    to: '/' },
      { label: 'Careers',           to: '/' },
      { label: 'Press Centre',      to: '/' },
      { label: 'Sustainability',    to: '/' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      {/* Popular destinations */}
      <div className="max-w-7xl mx-auto px-4 py-10 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-800 mb-4">Popular with travellers from India</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {DESTINATIONS.map(dest => (
            <button
              key={dest}
              onClick={() => {
                window.location.href = `/?destination=${encodeURIComponent(dest)}`;
              }}
              className="text-sm text-[#003580] hover:underline py-1"
            >
              {dest} hotels
            </button>
          ))}
        </div>
      </div>

      {/* Link columns */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 border-b border-gray-100">
        {LINKS.map(col => (
          <div key={col.heading}>
            <h3 className="text-sm font-bold text-gray-800 mb-3">{col.heading}</h3>
            <ul className="space-y-2">
              {col.items.map(item => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-gray-500 hover:text-[#003580] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>🇮🇳</span>
          <span>INR</span>
        </div>
        <p className="text-xs text-gray-400 text-center">
          © 2026 StayBook™ · All rights reserved · India's favourite hotel booking platform
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <Link to="/" className="hover:text-gray-600">Privacy</Link>
          <Link to="/" className="hover:text-gray-600">Terms</Link>
          <Link to="/" className="hover:text-gray-600">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
