import { Link, NavLink } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  return (
    <nav role="navigation" aria-label="Main">
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
            <li>
              <NavLink to="/">Feed</NavLink>
            </li>
            <li>
              <NavLink to="/map">Map</NavLink>
            </li>
            <li>
              <NavLink to="/chats">Chats</NavLink>
            </li>
            <li>
              <NavLink to="/profile">Profile</NavLink>
            </li>
            <li>
              <button type="button" onClick={onLogout} aria-label="Sign out">
                Sign out
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login">Login</NavLink>
            </li>
            <li>
              <NavLink to="/register">Create account</NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
