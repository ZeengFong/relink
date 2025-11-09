import { Link, NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Feed' },
  { to: '/map', label: 'Map' },
  { to: '/chats', label: 'Chats' },
  { to: '/profile', label: 'Profile' },
];

export default function Navbar({ user, onLogout }) {
  const linkClass = ({ isActive }) => (isActive ? '' : 'secondary');

  return (
    <nav role="navigation" aria-label="Primary">
      <ul>
        <li>
          <Link className="nav-brand" to="/">
            reLink
          </Link>
        </li>
      </ul>
      <ul>
        {user ? (
          <>
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className={linkClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button type="button" onClick={onLogout} aria-label="Sign out">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
            </li>
            <li>
              <NavLink to="/register" className={linkClass}>
                Create account
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
