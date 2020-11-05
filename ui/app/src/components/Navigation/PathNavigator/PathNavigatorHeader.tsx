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

import React from 'react';
import { useStyles } from './styles';
import LanguageRounded from '@material-ui/icons/LanguageRounded';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVertRounded';
import AccordionSummary from '@material-ui/core/AccordionSummary';

interface HeaderProps {
  locale: string;
  title: string;
  iconClassName: string;
  style: object;
  onClick?(): void;
  onLanguageMenu?(anchor: Element): void;
  onContextMenu?(anchor: Element): void;
}

// PathNavigatorHeader
export default function PathNavigatorHeader(props: HeaderProps) {
  const classes = useStyles();
  const { title, iconClassName, locale, onLanguageMenu, onContextMenu, onClick, style } = props;
  const currentFlag = (locale: string) => <LanguageRounded />;
  return (
    <AccordionSummary
      onClick={onClick}
      style={style}
      classes={{ root: classes.accordionSummary, content: classes.accordionSummaryContent }}
    >
      <div className={classes.accordionSummaryTitle}>
        {iconClassName && <span className={iconClassName} />}
        <Typography
          variant="body1"
          component="h6"
          className={classes.headerTitle}
          children={title}
        />
      </div>
      <div className={classes.accordionSummaryActions}>
        {onLanguageMenu && (
          <IconButton
            aria-label="language select"
            className={classes.iconButton}
            onClick={(e) => {
              e.stopPropagation();
              onLanguageMenu(e.currentTarget);
            }}
          >
            {currentFlag(locale)}
          </IconButton>
        )}
        {onContextMenu && (
          <IconButton
            aria-label="options"
            className={classes.iconButton}
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e.currentTarget);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        )}
      </div>
    </AccordionSummary>
  );
}
