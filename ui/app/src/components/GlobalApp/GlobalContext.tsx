/*
 * Copyright (C) 2007-2021 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useEffect, useMemo } from 'react';
import { useActiveUser, useSpreadState } from '../../utils/hooks';
import { getStoredGlobalAppOpenSidebar, setStoredGlobalAppOpenSidebar } from '../../utils/state';

const GlobalAppContext = React.createContext(void 0);

export const GlobalAppContextProvider = ({ children }) => {
  const user = useActiveUser();
  const [state, setState] = useSpreadState(null, () => ({
    openSidebar: getStoredGlobalAppOpenSidebar(user.username)
      ? getStoredGlobalAppOpenSidebar(user.username) === 'true'
      : true
  }));
  useEffect(() => {
    setStoredGlobalAppOpenSidebar(user.username, state.openSidebar);
  }, [state.openSidebar, user.username]);
  const value = useMemo(() => [state, setState], [state, setState]);
  return <GlobalAppContext.Provider value={value}>{children}</GlobalAppContext.Provider>;
};

export const useGlobalAppState = () => {
  const context = React.useContext(GlobalAppContext);
  if (context === void 0) {
    throw new Error('useGlobalAppContext should be used within GlobalAppProvider');
  }
  return context;
};
