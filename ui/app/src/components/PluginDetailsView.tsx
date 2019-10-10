/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useState } from "react";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Typography from "@material-ui/core/Typography";
import SwipeableViews from 'react-swipeable-views';
// @ts-ignore
import { autoPlay } from 'react-swipeable-views-utils';
import MobileStepper from "./MobileStepper";
import { defineMessages, useIntl } from "react-intl";
import { Blueprint } from "../models/Blueprint";
import Button from "@material-ui/core/Button";
import Fab from "@material-ui/core/Fab";
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Grid from "@material-ui/core/Grid";
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

const useStyles = makeStyles((theme: Theme) => ({
  detailsView: {
    height: '100%',
    background: '#FFFFFF',
    overflow: 'auto'
  },
  topBar: {
    display: 'flex',
    padding: '20px',
    alignItems: 'center'
  },
  carouselImg: {
    width: '100%',
    height: '340px',
    objectFit: 'cover'
  },
  detailsContainer: {
    position: 'relative',
    padding: '20px'
  },
  dots: {
    position: 'absolute',
    background: 'none',
    left: '50%',
    transform: 'translate(-50%)',
    top: '-40px',
    zIndex: 999,
    cursor: 'pointer',
    '& .MuiMobileStepper-dot': {
      padding: '6px',
      margin: '2px',
      '&:hover': {
        background: 'gray'
      }
    }
  },
  useBtn: {
    marginLeft: 'auto',
    maxHeight: '36px'
  },
  circleBtn: {
    color: '#4F4F4F',
    backgroundColor: '#FFFFFF',
    marginRight: '30px',
    '&:hover': {
      backgroundColor: '#FFFFFF',
    },
  },
  section: {
    marginBottom: '5px'
  },
  sectionChips: {
    display: 'flex',
    padding: 0,
    alignitems: 'center',
    marginTop: '10px'
  },
  bold: {
    fontWeight: 'bold'
  },
  video: {
    width: '100%',
    height: '300px',
    outline: 'none',
    background: '#ebebf1'
  },
  chip: {
    fontSize: '12px',
    color: 'gray',
    marginRight: theme.spacing(1),
    backgroundColor: '#f5f5f5',
    padding: '5px',
    borderRadius: '5px',
    '& label': {
      display: 'block',
      marginBottom: 0,
      fontWeight: 400,
    },
    '& span': {
      color: '#2F2707'
    }
  },
  link: {
    color: theme.palette.text.secondary,
    '& svg': {
      verticalAlign: 'sub',
      fontSize: '1.1rem'
    }
  },
}));

const messages = defineMessages({
    use: {
      id: 'common.use',
      defaultMessage: 'Use'
    },
  version: {
    id: 'common.version',
    defaultMessage: 'Version'
  },
  developer: {
    id: 'common.developer',
    defaultMessage: 'Developer'
  },
  website: {
    id: 'common.website',
    defaultMessage: 'Website'
  },
  license: {
    id: 'common.license',
    defaultMessage: 'License'
  },
  craftercms: {
    id: 'common.craftercms',
    defaultMessage: 'Crafter CMS'
  },
  searchEngine: {
    id: 'common.searchEngine',
    defaultMessage: 'Search Engine'
  }
});

interface PluginDetailsView {
  onCloseDetails(event: any): any,
  onBlueprintSelected(blueprint: Blueprint, view: number): any,
  blueprint: Blueprint,
  interval: number
}

const AutoPlaySwipeableViews = autoPlay(SwipeableViews);

export default function PluginDetailsView(props: PluginDetailsView) {
  const classes = useStyles({});
  const [index, setIndex] = useState(0);
  const [play, setPlay] = useState(false);
  const {blueprint, interval, onBlueprintSelected, onCloseDetails} = props;
  const {media, name, description, version, license, crafterCmsVersions, developer, website, searchEngine} = blueprint;
  const fullVersion = version ? `${version.major}.${version.minor}.${version.patch}` : null;
  const crafterCMS = crafterCmsVersions ? `${crafterCmsVersions[0].major}.${crafterCmsVersions[0].minor}.${crafterCmsVersions[0].patch}` : null;

  const {formatMessage} = useIntl();

  function handleChangeIndex(value: number) {
    setIndex(value);
  }

  function onDotClick(e: any, step: number) {
    e.stopPropagation();
    setIndex(step);
  }

  function handlePlay() {
    setPlay(true);
  }

  function handleEnded() {
    setPlay(false);
  }

  function renderMedias(){
    let videos:any = media.videos? {...media.videos, type: 'video'} : [];
    videos = videos.lenght? videos.map((obj:any)=> ({ ...obj, type: 'video' })) : [];
    const merged = [...videos, ...media.screenshots];
    return merged.map((item, index) => {
      if(item.type !== 'video') {
        return (
          <div key={index}>
            <img className={classes.carouselImg} src={item.url} alt={item.description}/>
          </div>
        )
      }else {
        return (
          <video key={index} controls className={classes.video} autoPlay={play} onPlaying={handlePlay} onEnded={handleEnded}>
            <source src={item.url} type="video/mp4"/>
            Your browser does not support the video tag.
          </video>
        )
      }
    })
  }

  let steps = blueprint.media.screenshots? blueprint.media.screenshots.length : 0;
  steps += blueprint.media.videos? blueprint.media.videos.length : 0;

  return (
    <div className={classes.detailsView}>
      <div className={classes.topBar}>
        <Fab aria-label="back" className={classes.circleBtn} onClick={onCloseDetails}>
          <ArrowBackIcon/>
        </Fab>
        <Typography variant="h5" component="h1">
          {name}
        </Typography>
        <Button variant="contained" color="primary" className={classes.useBtn} onClick={() => onBlueprintSelected(blueprint, 1)}>
          {formatMessage(messages.use)}
        </Button>
      </div>
      <AutoPlaySwipeableViews
        index={index}
        autoplay={!play}
        interval={interval}
        onChangeIndex={handleChangeIndex}
        enableMouseEvents
        slideStyle={{ height: '350px'}}
      >
        {renderMedias()}
      </AutoPlaySwipeableViews>
      <div className={classes.detailsContainer}>
        {steps > 1 &&
        <MobileStepper variant="dots" steps={steps} onDotClick={onDotClick} className={classes.dots} position={'static'}
                       activeStep={index}/>}
        <Grid container spacing={3}>
          <Grid item xs={8}>
            <Typography variant="body1">
            {description}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <div className={classes.section}>
              {
                developer &&
                <Typography variant="subtitle2">
                  {formatMessage(messages.developer)}
                </Typography>
              }
              {
                developer.company &&
                <Typography variant="subtitle2" color={'textSecondary'}>
                    {developer.company.name}
                </Typography>
              }
              {
                developer.people &&
                <Typography variant="subtitle2" color={'textSecondary'}>
                  {developer.people.name}
                </Typography>
              }
            </div>
            <div className={classes.section}>
              {
                website &&
                <Typography variant="subtitle2">
                  {formatMessage(messages.website)}
                </Typography>
              }
              {
                website.name &&
                <Typography variant="subtitle2" component="p">
                    <a className={classes.link} href={website.url} target={'blank'}>{website.name} <OpenInNewIcon/></a>
                </Typography>
              }
            </div>
              {
                searchEngine &&
                  <div className={classes.section}>
                  <Typography variant="subtitle2">
                    {formatMessage(messages.searchEngine)}
                  </Typography>
                  <Typography variant="subtitle2" color={'textSecondary'}>
                    {searchEngine}
                  </Typography>
                </div>
              }
            <div className={classes.sectionChips}>
              <div className={classes.chip}>
                <label>{formatMessage(messages.version)}</label>
                <span>{fullVersion}</span>
              </div>
              <div className={classes.chip}>
                <label>{formatMessage(messages.license)}</label>
                <span>{license.name}</span>
              </div>
              <div className={classes.chip}>
                <label>{formatMessage(messages.craftercms)}</label>
                <span>{crafterCMS}</span>
              </div>
            </div>
          </Grid>
        </Grid>
      </div>
    </div>
  )
}
