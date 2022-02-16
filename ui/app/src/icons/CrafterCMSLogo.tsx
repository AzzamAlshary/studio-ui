/*
 * Copyright (C) 2007-2022 Crafter Software Corporation. All Rights Reserved.
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
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';

interface CrafterCMSLogoProps {
  className?: string;
  width?: number | 'auto';
}

let UND;

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      // aspect ratio = 4.1062801932
      width: (props: CrafterCMSLogoProps) => props.width ?? 200,
      height: (props: CrafterCMSLogoProps) =>
        props.width !== UND ? (props.width === 'auto' ? 'auto' : props.width / 4.1062801932) : 48.7,
      fill: 'currentColor',
      display: 'inline-block',
      transition: 'fill 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
      flexShrink: 0,
      userSelect: 'none'
    },
    crafter: {
      fill: theme.palette.mode === 'dark' ? '#fff' : '#000'
    },
    redStuff: {
      fill: '#f00'
    }
  })
);

export default function CrafterCMSLogo(props: CrafterCMSLogoProps) {
  const classes = useStyles(props);
  const themeClass = classes.crafter;
  return (
    <svg className={clsx(classes.root, props.className)} viewBox="0 0 850 207" aria-hidden="true" focusable="false">
      <path
        className={classes.redStuff}
        d="M658,66c10.5,0,18.1,3.6,25.2,9.7c0.8,0.8,0.9,2.1,0.1,2.9l-2.8,2.8c-0.8,1-1.7,0.9-2.7-0.1
          c-5.4-4.7-12.8-7.8-19.9-7.8c-16.4,0-29,13.8-29,30c0,16,12.6,29.9,29,29.9c9.1,0,14.4-3.6,19.9-7.8c1-0.8,1.9-0.7,2.5-0.3
          l3.1,2.8c0.8,0.6,0.6,2.1-0.1,2.8c-7.1,6.9-16,10.1-25.3,10.1c-20.8,0-37.6-16.6-37.6-37.4S637.2,66,658,66z"
      />
      <path
        className={classes.redStuff}
        d="M717.7,67.5c0.2-0.8,1-1.5,1.9-1.5h1.7c0.7,0,1.6,0.5,1.8,1.1l20.6,57.4c0.2,0,0.3,0,0.5,0
          l20.3-57.4c0.2-0.6,1-1.1,1.8-1.1h1.7c0.8,0,1.7,0.6,1.9,1.5l13.4,70c0.3,1.5-0.3,2.5-1.9,2.5h-4.2c-0.8,0-1.7-0.7-1.9-1.5
          L766,84.9c-0.1,0-0.3,0-0.4,0l-19.2,55c-0.2,0.6-1.1,1.1-1.8,1.1h-1.9c-0.6,0-1.6-0.5-1.8-1.1l-19.4-55c-0.1,0-0.3,0-0.4,0
          l-9.1,53.6c-0.1,0.7-1,1.5-1.9,1.5h-4.2c-1.6,0-2.2-1-1.9-2.5L717.7,67.5z"
      />
      <path
        className={classes.redStuff}
        d="M804.8,129c0.5-0.6,1-1.4,1.6-2c1-1.4,2.2-2.2,3.6-0.9c0.7,0.6,8.3,7.9,17.6,7.9
          c8.4,0,13.9-5.3,13.9-11.5c0-7.2-6.2-11.5-18.2-16.4c-11.5-5-18.3-9.7-18.3-21.5c0-7.1,5.6-18.5,22.2-18.5
          c10.2,0,17.8,5.3,17.8,5.3c0.6,0.3,1.9,1.6,0.6,3.5c-0.4,0.6-0.8,1.4-1.3,2c-0.9,1.5-2,1.9-3.6,0.9C840,77.4,833.4,73,827,73
          c-11,0-14.4,7.1-14.4,11.5c0,7,5.3,11,14.1,14.7c14.1,5.7,23.1,11,23.1,23.1c0,10.8-10.3,18.7-22.5,18.7c-12.3,0-20.6-7.2-22-8.4
          C804.6,131.8,803.5,131,804.8,129z"
      />
      <path
        className={themeClass}
        d="M109.6,141c9.7,0,18.5-3.5,25.3-10.1c0.4-0.4,0.4-1.2,0.1-1.5l-8.3-8.9c-0.1-0.2-0.4-0.3-0.7-0.3
			     c-0.3,0-0.6,0.1-0.8,0.2c-3.9,3.4-9.5,5.4-14.9,5.4c-12.3,0-22-10-22-22.7c0-12.9,9.6-23,21.9-23c5.5,0,11,2.1,15.1,5.7
			     c0.4,0.4,1,0.4,1.3,0l8.3-8.6c0.2-0.2,0.4-0.5,0.4-0.8c0-0.3-0.1-0.6-0.4-0.8c-7.4-6.7-15.1-9.7-25.2-9.7
			     C88.9,66,72,82.9,72,103.6C72,124.2,88.9,141,109.6,141z"
      />
      <path
        className={themeClass}
        d="M213.3,139.9c0.5,0,0.8-0.2,1-0.5c0.2-0.3,0.2-0.8,0-1.2l-15.2-28.1l1-0.4c9.4-3.8,15.2-11.7,15.2-20.6
           c0-12.2-10-22.1-22.3-22.1h-31.9c-0.7,0-1.1,0.6-1.1,1.1v70.7c0,0.5,0.4,1.1,1.1,1.1h12.7c0.5,0,1.1-0.5,1.1-1.1v-28.2h8.9
       		 l14.5,28.8c0.1,0.1,0.4,0.4,0.8,0.4H213.3z M191.6,99h-16.8V80.4h16.8c5,0,9.1,4.1,9.1,9.1C200.7,94.6,196.5,99,191.6,99z"
      />
      <path
        className={themeClass}
        d="M301.4,139.9c0.4,0,0.8-0.1,0.9-0.4c0.2-0.3,0.2-0.6,0-1l-33.4-71.9c-0.2-0.3-0.6-0.6-0.9-0.6h-1.1
 	 		     c-0.3,0-0.8,0.3-0.9,0.6l-33.4,71.9c-0.2,0.4-0.2,0.7,0,1c0.2,0.3,0.5,0.4,0.9,0.4h11.7c1.8,0,2.6-1.1,3-2l4.1-9.1h30.3l4.1,9
  			   c0.9,1.8,1.4,2.1,2.9,2.1H301.4z M257.9,116.2l8.9-19.6h1.2l0.4,0.6l8.8,19H257.9z"
      />
      <path
        className={themeClass}
        d="M369,80.8c0.7,0,1.1-0.5,1.1-1.1V68.1c0-0.5-0.4-1.1-1.1-1.1h-44.2c-0.7,0-1.1,0.5-1.1,1.1v70.7
			c0,0.5,0.4,1.1,1.1,1.1h12.6c0.5,0,1.1-0.5,1.1-1.1v-26.9h25.3c0.5,0,1.1-0.5,1.1-1.1V99.2c0-0.5-0.5-1.1-1.1-1.1h-25.3V80.8H369z"
      />
      <path
        className={themeClass}
        d="M444.1,79.8V68.1c0-0.5-0.4-1.1-1.1-1.1h-47.4c-0.7,0-1.1,0.5-1.1,1.1v11.6c0,0.5,0.4,1.1,1.1,1.1h16.2
			     v58c0,0.5,0.5,1.1,1.1,1.1h12.8c0.5,0,1.1-0.5,1.1-1.1v-58h16.3C443.7,80.8,444.1,80.3,444.1,79.8z"
      />
      <path
        className={themeClass}
        d="M516.6,139.9c0.7,0,1.1-0.6,1.1-1.1v-11.6c0-0.5-0.4-1.1-1.1-1.1H486v-16.4h25.3c0.5,0,1.1-0.4,1.1-1.1
         V97.1c0-0.5-0.5-1.1-1.1-1.1H486V80.8h30.6c0.7,0,1.1-0.5,1.1-1.1V68.1c0-0.5-0.4-1.1-1.1-1.1h-44.2c-0.7,0-1.1,0.5-1.1,1.1v70.7
         c0,0.5,0.4,1.1,1.1,1.1H516.6z"
      />
      <path
        className={themeClass}
        d="M597.9,139.9c0.5,0,0.8-0.2,1-0.5c0.2-0.3,0.2-0.8,0-1.2l-15.2-28.1l1-0.4c9.4-3.8,15.2-11.7,15.2-20.6
           c0-12.2-10-22.1-22.3-22.1h-31.9c-0.7,0-1.1,0.6-1.1,1.1v70.7c0,0.5,0.4,1.1,1.1,1.1h12.7c0.5,0,1.1-0.5,1.1-1.1v-28.2h8.9
           l14.5,28.8c0.1,0.1,0.4,0.4,0.8,0.4H597.9z M576.2,99h-16.8V80.4h16.8c5,0,9.1,4.1,9.1,9.1C585.3,94.6,581,99,576.2,99z"
      />
      <path
        className={classes.redStuff}
        d="M144.3,144c-0.3-0.4-1.5-0.5-2.1,0c-9.5,8.2-23.1,13-36.3,13c-29.5,0-52.7-23.4-53.5-53.6
           c0.8-30.2,24-53.6,53.5-53.6c13.3,0,26.9,4.9,36.3,13c0.6,0.5,1.8,0.4,2.1,0l20-21.3c0.4-0.4,0.4-1.7-0.2-2.3
           c-6.7-6.5-14.5-11.8-22.9-15.8l-2.2-0.7l0.4-18.2C133.7,2.6,128,1,122.1,0l-8.7,15.7l-2.1-0.2c-5.7-0.5-9.7-0.5-15.4,0l-2.1,0.2
           L85.1,0c-5.8,1-11.6,2.6-17.2,4.6l0.3,17.9l-1.9,0.9c-4.5,2.1-9,4.7-13.3,7.7l-1.7,1.2l-15.4-9.2c-4.6,3.8-8.8,8.1-12.6,12.6
           l9.2,15.4l-1.2,1.7c-1.7,2.4-3.3,5-5.1,8.3l-1.4,2.7c-0.4,0.8-0.8,1.5-1.2,2.3l-0.9,1.9L4.8,67.8c-2,5.6-3.6,11.4-4.6,17.2
           l15.7,8.7l-0.2,2.1c-0.3,2.9-0.4,5.3-0.4,7.7h0c0,0,0,0,0,0l0,0h0c0,2.4,0.1,4.8,0.4,7.7l0.2,2.1L0.2,122c1,5.8,2.6,11.6,4.6,17.2
           l17.9-0.3l0.9,1.9c0.4,0.8,0.8,1.5,1.2,2.3l1.4,2.7c1.8,3.3,3.4,5.9,5.1,8.3l1.2,1.7l-9.2,15.4c3.8,4.5,8.1,8.8,12.6,12.6l15.4-9.2
           l1.7,1.2c4.3,3,8.8,5.6,13.3,7.7l1.9,0.9l-0.3,17.9c5.6,2,11.4,3.6,17.2,4.6l8.7-15.7l2.1,0.2c5.7,0.5,9.7,0.5,15.4,0l2.1-0.2
           l8.7,15.7c5.8-1,11.6-2.6,17.2-4.6l-0.4-18.2l2.2-0.7c8.4-3.9,16.2-9.3,22.9-15.8c0.6-0.6,0.6-1.9,0.2-2.3L144.3,144z"
      />
    </svg>
  );
}
