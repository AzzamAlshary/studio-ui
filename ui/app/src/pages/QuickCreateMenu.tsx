/*
 * Copyright (C) 2007-2020 Crafter Software Corporation. All Rights Reserved.
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

import React, { useState } from 'react';
import { QuickCreateMenu } from '../modules/Preview/QuickCreate';
import { useQuickCreateListResource, useSystemVersionResource } from '../utils/hooks';

interface QuickCreateMenuProps {
  anchorEl: HTMLElement;
  onNewContentSelected?(): void;
  onQuickCreateItemSelected?(src: string): void;
  onClose?(): void;
}

export default function QuickCreateMenuApp(props: QuickCreateMenuProps) {

  const { anchorEl, onClose, onQuickCreateItemSelected, onNewContentSelected } = props;
  const [open, setOpen] = useState(true);

  // Wait a few millis for the animation to finish before
  // notifying legacy that the menu is closed to avoid
  // the animation getting cut of by the unmounting
  const onCloseDiffered = () => {
    setTimeout(onClose, 500);
  };

  const closeMenu = () => {
    setOpen(false);
    onCloseDiffered();
  };

  const quickCreateResource = useQuickCreateListResource();

  const versionResource = useSystemVersionResource();

  return (
    <QuickCreateMenu
      open={open}
      resource={{
        version: versionResource,
        quickCreate: quickCreateResource
      }}
      anchorEl={anchorEl}
      onClose={closeMenu}
      onNewContentSelected={() => {
        closeMenu();
        onNewContentSelected();
      }}
      onQuickCreateItemSelected={(src) => {
        closeMenu();
        onQuickCreateItemSelected(src);
      }}
    />
  );
}
