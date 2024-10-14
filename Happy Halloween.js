/********************************************************
Copyright (c) 2024 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*********************************************************/

/**
 * Macro Author:              Robert(Bobby) McGonigle Jr
 *                            Technical Marketing Engineering, Leader
 *                            Cisco Systems
 * 
 * ---------------------------------------------------------------------
 * 
 * Consulting Engineer:       Christopher Norman
 *                            Systems Engineer
 *                            Cisco Systems
 * 
 * ---------------------------------------------------------------------
 * 
 * Description:
 *    - Opens a Halloween Themed page on your Device's OSD
 *    - Uses PeopleCount Current Data to confirm people are in the room
 *    - Checks for an active call/presentation to avoid disrupting work
 *    - Has no real use other than acts as sample code and a bit of fun. Happy Halloween!
 * 
 * Last Revised October 2024
 */

import xapi from 'xapi';

const config = {
  WebSource: {
    UseDefaultPage: true,       // Use the default HalloweenPumpkinEyes page. If false, will use the CustomPage defined below
    DefaultPage: {
      ShowText: true,           // Show or hide the Text Banner on the Default Page
      Text: 'Happy Halloween',  // Set Custom Text for the Banner on the Default Page
      FontSize: 75              // Change the Font Size on the Default Page
    },
    CustomPage: {
      Url: ''                   // Use a Custom URL instead of the Default Page. config.WebSource.UseDefaultPage must be set to false
    }
  }
}

let allHallowsEve = false;
let callActive = false;
let callPresentationActive = false;
let presentationActive = false;
let hasPeople = false;

let urlParams = ''

function buildDefaultURLParams() {
  let params = []

  if (!config.WebSource.DefaultPage.ShowText) {
    params.push('showText=false')
  }

  if (config.WebSource.DefaultPage.FontSize != '' && parseInt(config.WebSource.DefaultPage.FontSize) != 75) {
    params.push(`modFontSize=${config.WebSource.DefaultPage.FontSize}`)
  }

  if (config.WebSource.DefaultPage.Text != '' && config.WebSource.DefaultPage.Text.toLowerCase() != 'happy halloween') {
    params.push(`modTextContent=${config.WebSource.DefaultPage.Text}`)
  }

  if (params.length > 0) {
    urlParams = `?${params.join('&')}`
    return
  }
  return
}

async function trickOrTreat() {
  buildDefaultURLParams();
  let url = '';
  if (config.WebSource.UseDefaultPage) {
    url = `https://bobby-mcgonigle.github.io/HolloweenPumpkinEyes/${urlParams}`
  } else {
    url = config.WebSource.CustomPage.Url
  }
  if (!allHallowsEve) {
    if ((!callActive && !presentationActive) && (!callPresentationActive && hasPeople)) {
      allHallowsEve = true;
      if (url == '' || url == undefined) {
        url = `https://bobby-mcgonigle.github.io/HolloweenPumpkinEyes/${urlParams}`;
        console.warn(`Trick! Url undefined, assigning Default URL`);
      }
      console.log(`Treat! Opening Site > [${url}]`);
      await xapi.Command.UserInterface.WebView.Display({ Url: url });
    } else {
      allHallowsEve = false;
      const activePages = await xapi.Status.UserInterface.WebView['*'].get();
      for (let page of activePages) {
        if (page.URL == url && page.Status == 'Visible') {
          console.log(`Trick! Closing Site > [${url}]`);
          await xapi.Command.UserInterface.WebView.Clear();
        }
      }
    }
  }
}

async function StartSubscriptions() {
  console.debug('Starting Subcriptions...');
  function formRoomOSHyperlink(input) {
    const modified = input.replace(/^x/, '');
    const finalString = modified.replace(/_/g, '.');
    const url = `https://roomos.cisco.com/xapi/${finalString}`;
    return { xAPI: input.replace(/_/g, ' '), Url: url };
  };

  const subs = Object.getOwnPropertyNames(Subscribe);
  subs.sort();
  let mySubscriptions = [];
  for (let sub of subs) {
    await Subscribe[sub]();
    mySubscriptions.push(formRoomOSHyperlink(sub));
    Subscribe[sub] = function () {
      console.debug({ Warn: `The [${sub.replaceAll('_', ' ')}] subscription is already active, unable to fire it again` });
    };
  }
  console.warn(`[${mySubscriptions.length}] Subscriptions Set ||`, 'Subscriptions List:');
  mySubscriptions.forEach(element => {
    const formattedLines = JSON.stringify(element, null, 2).split('\n');
    formattedLines.forEach(line => {
      if (line != '}' && line != '{') {
        if (line.includes('http')) {
          console.info(` ↳ ${line.replace(/^\s*/, '')}`);
        } else {
          console.info(line.replace(/^\s*/, ''));
        };
      };
    });
  });
  console.warn(`- - - - - - -`);
};

const Subscribe = {

  xStatus_SystemUnit_State_NumberOfActiveCalls: async function () {
    const callQTY = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get()
    if (callQTY > 0) { callActive = true }

    xapi.Status.SystemUnit.State.NumberOfActiveCalls.on(callCount => {
      if (callCount > 0) {
        callActive = true;
      } else {
        callActive = false;
      }
      trickOrTreat();
    });
  },
  xStatus_RoomAnalytics_PeopleCount_Current: async function () {
    const configEnabled = await xapi.Config.RoomAnalytics.PeopleCountOutOfCall.get();

    if (configEnabled != 'On') {
      console.warn(`Setting xConfig RoomAnalytics PeopleCountOutOfCall to On`)
      await xapi.Config.RoomAnalytics.PeopleCountOutOfCall.set('On');
    }

    const checkIfPeople = await xapi.Status.RoomAnalytics.PeopleCount.Current.get()
    if (checkIfPeople > 0) { hasPeople = true };

    xapi.Status.RoomAnalytics.PeopleCount.Current.on(people => {
      if (people > 0) {
        hasPeople = true
      } else {
        hasPeople = false
      }
      trickOrTreat();
    })
  },
  xEvent_PresentationStarted: function () {
    xapi.Event.PresentationStarted.on(() => {
      callPresentationActive = true;
      trickOrTreat();
    })
  },
  xEvent_PresentationStopped: function () {
    xapi.Event.PresentationStopped.on(() => {
      callPresentationActive = false;
      trickOrTreat();
    })
  },
  xEvent_PresentationPreviewStarted: function () {
    xapi.Event.PresentationPreviewStarted.on(() => {
      presentationActive = true;
      trickOrTreat();
    })
  },
  xEvent_PresentationPreviewStopped: function () {
    xapi.Event.PresentationPreviewStopped.on(() => {
      presentationActive = false;
      trickOrTreat();
    })
  }
};

async function init() {
  console.log(`Macro Initialization Started...`)
  buildDefaultURLParams();
  await StartSubscriptions();
  await trickOrTreat();
  console.log(`Macro Initialization Complete!`)
}

init()