/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useUI } from '@/lib/state';
import { useAuth } from '@/hooks/use-auth';

export default function Header() {
  const { toggleSidebar } = useUI();
  const { user, needsAuth, handleLogin, handleLogout } = useAuth();

  return (
    <header>
      <div className="header-left">
        <img src="https://eburon.ai/icon-eburon.svg" alt="Eburon Logo" className="eburon-logo" />
        <div className="header-text-container">
          <h1>Eburon Ai</h1>
        </div>
      </div>
      <div className="header-right">
        {user && (
          <div className="user-profile">
            {user.photoURL && (
              <img src={user.photoURL} alt="Profile" className="profile-img" />
            )}
            <button className="logout-button" onClick={handleLogout} title="Sign Out">
               <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        )}

        <button
          className="settings-button"
          onClick={toggleSidebar}
          aria-label="Settings"
        >
          <span className="icon">tune</span>
        </button>
      </div>
    </header>
  );
}