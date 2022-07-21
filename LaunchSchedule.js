// LICENSE
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

// A script for displaying upcoming rocket launches.
// Made by Rik Rossel for the Scriptable app on iOS and iPadOS.

// CUSTOMIZABILITY (Change these variables to your liking).
// Use Little Endian (EU) date format or Middle Endian (USA) date format.
const isMEDateFormat = false;

// Limit how many launches will be queried from the thespacedevs API.
// There is a possibility that 10 is not enough to show launches with the ID's given below in the widget.
const limit = 10
// Compose API query url.
const url = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?format=json&limit=" + limit

// FONTS.
const primaryFont = new Font("SF Pro", 20)
const secondaryFont = new Font("SF Pro", 15)
const statusFont = Font.blackMonospacedSystemFont(15);
// COLORS.
// Font Colors.
const primaryTextColor = Color.dynamic(new Color("#000000"), new Color("#FFFFFF"));
const secondaryTextColor = Color.dynamic(new Color("#666666"), new Color("#999999"));
// Status Colors.
// Status | Abbr. | ID
// Go for launch | Go | 1
const goColor = Color.dynamic(new Color("#4CBB17"), new Color("#22ba48"));
// To Be Determined | TBD | 2
const TBDColor = Color.dynamic(new Color("#EF9B00"), new Color("#f6be00"));
// To Be Confirmed | TBC | 8
const TBCColor = Color.dynamic(new Color("#e86826"), new Color("#ff8c00"));
// Background Color.
const BGColor = Color.dynamic(new Color("#e1e1e1"), new Color("#1e1e1e"));
// FORMAT STRINGS.
// Date.
const dateFormat = isMEDateFormat ? "HH:mm MM/dd" : "HH:mm dd/MM";

// Get the data from the API
const data = await getData(url)

// Check if script is ran in app or in widget.
if (config.runsInWidget) {
  let widget = createWidget()
  Script.setWidget(widget);
  Script.complete();
} else { // Runs in app
  let widget = createLargeWidget();
  widget.presentLarge();
  if (config.runsWithSiri) {
    Speech.speak("Here are the next few upcoming launches")
  }
  Script.complete();
}




/** 
 * Function that creates a Widget with a first upcoming launch
 * and several more upcoming launches with less details.
 * 
 * @returns {ListWidget} widget
 */
function createWidget() {  
  // Root widget element.
  const w = new ListWidget()
  w.backgroundColor = BGColor
  w.addSpacer(4)
  
  // Guard clause for data
  if (!data.results) {
    title = w.addText("Unable to fetch upcoming launches.")  
    title.font = primaryFont
    title.textColor = primaryTextColor
    detail = w.addText(data.detail)  
    detail.font = secondaryFont
    detail.textColor = secondaryTextColor
    return w
  }
  
  let firstLaunchIndex = 0
  // Check for first launch that is to be determined, to be confirmed or is go for launch.
  while (firstLaunchIndex < data.results.length && !isValidStatus(data.results[firstLaunchIndex].status.id)) {
    firstLaunchIndex++ 
  }
  // Text for the first upcoming luanch.
  const firstLaunchName = w.addText(data.results[firstLaunchIndex].name)
  firstLaunchName.font = primaryFont
  firstLaunchName.textColor = primaryTextColor
  
  w.addSpacer(4)
  
  // Stack for info of first launch (status, time and date).
  const infoStack = w.addStack()
  infoStack.centerAlignContent()
  
  // first launch status stack.
  const statusStack = infoStack.addStack()
  statusStack.cornerRadius = 10
  statusStack.setPadding(2, 7, 2, 7)
  statusStack.backgroundColor = getStatusColor(data.results[firstLaunchIndex].status.id)
  
  infoStack.addSpacer(10)
  
  // First launch status text.
  const firstLaunchStatusText = statusStack.addText(data.results[firstLaunchIndex].status.name)
  firstLaunchStatusText.textColor = BGColor
  firstLaunchStatusText.font = statusFont
  
  // First launch time and date.
  const launchTimeText = infoStack.addText(launchTimeFormatter(data.results[firstLaunchIndex].net));
  launchTimeText.textColor = Color.lightGray();
  launchTimeText.font = new Font("SF Pro", 15);
  
  w.addSpacer(10);
  
  // Remaining upcoming launches.
  var count = 0
  for (var i = firstLaunchIndex + 1; i < data.results.length; i++) {
    if (count == 3) {
      break;
    } else if (!isValidStatus(data.results[i].status.id)) {
      continue;
    }
    const upcomingStack = w.addStack();
    upcomingStack.centerAlignContent();
    const point = upcomingStack.addText("•");
    point.font = Font.blackMonospacedSystemFont(25); 
    point.textColor = getStatusColor(data.results[i].status.id);
    upcomingStack.addSpacer(4);
    const upcomingLaunchName = upcomingStack.addText(data.results[i].name);
    upcomingLaunchName.textColor = primaryTextColor;
    count++;
  }
  return w;
}

/** 
 * Function that creates a large Widget with several upcoming launches.
 * 
 * @returns {ListWidget} widget
 */
 function createLargeWidget() {
  let w = new ListWidget();
  w.backgroundColor = BGColor;
  let count = 0;
  for (launch of data.results) {
    if (!isValidStatus(launch.status.id) || count >= 5) {
      continue;
    }
    let launchName = w.addText(launch.name);
    launchName.font = primaryFont;
    launchName.textColor = primaryTextColor;
    
    w.addSpacer(4);
    
    let infoStack = w.addStack();
    infoStack.layoutHorizontally();
    let statusStack = infoStack.addStack();
    let statusBGColor = getStatusColor(launch.status.id);
    statusStack.backgroundColor = statusBGColor;
    statusStack.cornerRadius = 10;
    statusStack.setPadding(2, 7, 2, 7);
    let statusText = statusStack.addText(launch.status.name);
    statusText.font = statusFont;
    statusText.textColor = BGColor;
    
    infoStack.addSpacer(10);
    
    let launchTimeText = infoStack.addText(launchTimeFormatter(launch.net));
  launchTimeText.font = secondaryFont;
  launchTimeText.textColor = secondaryTextColor;
    
    w.addSpacer(15);
    
    count++;
  }
  return w;
}


/**
 * Get data from url and load it as JSON.
 * @param {string}          url   The API url query.
 * @returns {Promise<any>}        Data from the url.
 */
async function getData(url) {
  const r = new Request(url);
  const data = await r.loadJSON();
  return data;
}

/**
 * Check if the given status ID is a valid status ID
 * @param {int}             statusID    The integer id for the status.
 * @returns {bool}                      True iff (statusID == 1 || statusID == 2 || statusID == 8).
 */
function isValidStatus(statusID) {
  return statusID == 1 || statusID == 2 || statusID == 8;
}

/**
 * Get the color for the given status ID.
 * @param {int}             statusID    The integer id for the status. 
 * @returns {Color}                     The color for the status.
 */
function getStatusColor(statusID) {
  let statusColor;
  switch (statusID) {
    case 1:
    	statusColor = goColor;
    	break;
    case 2:
    	statusColor = TBDColor;
    	break;
    case 8:
    	statusColor = TBCColor;
    	break;
  }
  return statusColor;
}

/**
 * Format the given date to Little Endian or Middle Endian format.
 * @param {string}          date        The date in ISO format
 * @returns {string}                    The date in Little Endian or Middle Endian format.
 */
function launchTimeFormatter(date) {
  let launchTime = new Date(date);
  const df = new DateFormatter();
  df.dateFormat = dateFormat;
  return df.string(launchTime);
}

