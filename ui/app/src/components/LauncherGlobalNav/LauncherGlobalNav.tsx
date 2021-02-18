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

import LauncherTile from '../LauncherTile';
import { getSimplifiedVersion } from '../../utils/string';
import React from 'react';
import { useEnv, useGlobalNavigation, useSystemVersion } from '../../utils/hooks';
import TranslationOrText from '../../models/TranslationOrText';
import { useIntl } from 'react-intl';
import { getLauncherSectionLink, LauncherSectionUI } from '../LauncherSection';
import { messages } from '../LauncherSection/utils';
import { closeLauncher } from '../../state/actions/dialogs';
import { useDispatch } from 'react-redux';
import ApiResponseErrorState from '../ApiResponseErrorState';
import { globalMenuMessages } from '../../utils/i18n-legacy';
import Skeleton from '@material-ui/lab/Skeleton';

export interface LauncherGlobalNavProps {
  title: TranslationOrText;
}

function LauncherGlobalNav(props: LauncherGlobalNavProps) {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { authoringBase } = useEnv();
  const version = useSystemVersion();
  const onMenuClose = () => dispatch(closeLauncher());
  const { items, error } = useGlobalNavigation();
  if (!error && !items) {
    const style = { margin: 5, width: 120, height: 100, display: 'inline-flex' };
    return (
      <>
        <Skeleton style={style} />
        <Skeleton style={style} />
        <Skeleton style={style} />
        <Skeleton style={style} />
      </>
    );
  } else if (error) {
    return <ApiResponseErrorState error={error.response ?? error} />;
  }
  return (
    <LauncherSectionUI title={props.title}>
      {items.map((item) => (
        <LauncherTile
          key={item.id}
          title={formatMessage(globalMenuMessages[item.id])}
          icon={{ baseClass: `fa ${item.icon}` }}
          link={getLauncherSectionLink(item.id, authoringBase)}
          onClick={onMenuClose}
        />
      ))}
      <LauncherTile
        title={formatMessage(messages.docs)}
        icon={{ id: 'craftercms.icons.Docs' }}
        link={`https://docs.craftercms.org/en/${getSimplifiedVersion(version)}/index.html`}
        target="_blank"
        onClick={onMenuClose}
      />
      <LauncherTile
        title={formatMessage(globalMenuMessages['home.settings'])}
        icon={{ id: '@material-ui/icons/SettingsRounded' }}
        link={getLauncherSectionLink('settings', authoringBase)}
        onClick={onMenuClose}
      />
      <LauncherTile
        icon={{ id: 'craftercms.icons.CrafterIcon' }}
        link={getLauncherSectionLink('about', authoringBase)}
        title={formatMessage(globalMenuMessages['home.about-us'])}
        onClick={onMenuClose}
      />
    </LauncherSectionUI>
  );
}

export default LauncherGlobalNav;
