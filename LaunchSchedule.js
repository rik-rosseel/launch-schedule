/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                       LICENSE                             *
 * This Source Code Form is subject to the terms of the      *
 * Mozilla Public License, v. 2.0.                           *
 * If a copy of the MPL was not distributed with this file,  *
 * You can obtain one at http://mozilla.org/MPL/2.0/.        *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * A script for displaying upcoming rocket launches.         *
 * Made for the Scriptable app on iOS and iPadOS.            *
 * Author: Rik Rosseel                                       *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                       CUSTOMIZABILITY                     *
 *         (Change these variables to your liking).          *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* FONTS */
const primaryFont = new Font("SF Pro", 20)
const secondaryFont = new Font("SF Pro", 15)
const statusFont = Font.blackMonospacedSystemFont(15);

/* COLORS */
// Text Colors.
const primaryTextColor = Color.dynamic(new Color("#000000"), new Color("#ffffff"));
const secondaryTextColor = Color.dynamic(new Color("#666666"), new Color("#999999"));
// Background Color.
const BGColor = Color.dynamic(new Color("#ffffff"), new Color("#1e1e1e"));
// Status Colors.
// (Status | Abbr. | ID)
// Go for launch | Go | 1
const goColor = Color.dynamic(new Color("#4CBB17"), new Color("#22ba48"));
// To Be Determined | TBD | 2
const TBDColor = Color.dynamic(new Color("#ff8500"), new Color("#ff8c00"));
// To Be Confirmed | TBC | 8
const TBCColor = Color.dynamic(new Color("#ffba00"), new Color("#f6be00"));

/* OTHER */
// Use Little Endian (EU) date format or Middle Endian (USA) date format.
const isMEDateFormat = false;
// Use the script on macOS
const isOnMacOS = false;
// Limit how many launches will be queried from the thespacedevs API.
// There is a possibility that 10 is not enough to show launches with the ID's given below in the widget.
const limit = 10;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                  END OF CUSTOMIZABILITY                   *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


/** Little endian date format or Middle endian date format
 * @result Little endian format iff [isMEDateFormat] is equal to false
 * @result Middle endian format iff [isMEDateFormat] is equal to true
 */
const dateFormat = isMEDateFormat ? "HH:mm MM/dd" : "HH:mm dd/MM";
/** Adjust large widget launch count limit based on platform
 * 
 * 
 */
const launchCountLimit = isOnMacOS ? 5 : 6;
// WIDGET SIZES
const sizes = ["Small", "Medium", "Large"];

// Root ListWidget
let widget = new ListWidget();


// Compose API query url.
const url = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?format=json&limit=" + limit;
// Get the data from the API
const data = await getData(url)

// Check if the script runs in the app
if (config.runsInApp) {
  const message = "What is the size of the widget?";
  let size = await generateAlert(message, sizes);
  switch (size) {
    case 0:
      buildSmallWidget(widget);
      widget.presentSmall();
      break;
    case 1:
      buildMediumWidget(widget);
      widget.presentMedium();
      break;
    case 2:
      buildLargeWidget(widget);
      widget.presentLarge();
      break;
    default:
      buildInvalidParamWidget(widget);
      widget.presentSmall();
      break;
  }
  Script.complete();
}
// Or in the widget
else if (config.runsInWidget) {
  let sizeArg = args.widgetParameter.replace(/\s/g, '');
  sizeArg = sizeArg[0].toUpperCase() + sizeArg.substring(1);
  let size = sizes.indexOf(sizeArg);
  if (size == -1) {
    buildInvalidParamWidget(widget);
    widget.presentSmall();
  } else {
    switch (size) {
      case 0:
        buildSmallWidget(widget);
        widget.presentSmall();
        break;
      case 1:
        buildMediumWidget(widget);
        widget.presentMedium();
        break;
      case 2:
        buildLargeWidget(widget);
        widget.presentLarge();
        break;
      default:
        buildInvalidParamWidget(widget);
        widget.presentSmall();
        break;
    }
  }
  Script.complete();
}


/**
 * Build a widget to let the user know they gave an invalid parameter.
 * 
 * @param {ListWidget} widget The widget to add content to.
 */
function buildInvalidParamWidget(widget) {
  widget.backgroundColor = BGColor;
  let title = widget.addText("Invalid size parameter.");
  title.font = primaryFont;
  title.textColor = primaryTextColor;
  let info = widget.addText(
    "The valid sizes are: Small, Medium or Large"
  );
  info.font = secondaryFont;
  info.textColor = secondaryTextColor;
}

/**
 * Build a widget to let the user know that the results couldn't be fetched.
 * 
 * @param {ListWidget} widget The widget to add content to.
 */
 function buildUnableToFetchWidget(widget) {
  title = widget.addText("Unable to fetch upcoming launches.")  
  title.font = primaryFont
  title.textColor = primaryTextColor
  detail = widget.addText(data.detail)  
  detail.font = secondaryFont
  detail.textColor = secondaryTextColor
}

/**
 * Build a widget (small) with information of the first upcoming launch.
 * 
 * @param {ListWidget} widget The widget to add content to.
 */
function buildSmallWidget(widget) {
  widget.backgroundColor = BGColor;
  widget.addSpacer(4);

  // Gaurd clause for data.
  if (!data.results) {
    buildUnableToFetchWidget(widget);
    return;
  }

  var firstLaunchIndex = 0
  // Check for first launch that is to be determined, to be confirmed or is go for launch.
  while (
    firstLaunchIndex < data.results.length 
    && !isValidStatus(data.results[firstLaunchIndex].status.id)
  ) {
    firstLaunchIndex++;
  }
  // Text for the first upcoming luanch.
  const firstLaunchName = widget.addText(data.results[firstLaunchIndex].name);
  firstLaunchName.font = primaryFont;
  firstLaunchName.textColor = primaryTextColor;
  
  widget.addSpacer(4);
  // first launch status stack.
  const statusStack = widget.addStack();
  statusStack.cornerRadius = 10;
  statusStack.setPadding(2, 7, 2, 7);
  statusStack.backgroundColor = getStatusColor(data.results[firstLaunchIndex].status.id);
  
  widget.addSpacer(5);
  
  // First launch status text.
  const firstLaunchStatusText = statusStack.addText(data.results[firstLaunchIndex].status.abbrev);
  firstLaunchStatusText.textColor = BGColor;
  firstLaunchStatusText.font = statusFont;
  
  // First launch time and date.
  const launchTimeText = widget.addText(launchTimeFormatter(data.results[firstLaunchIndex].net));
  launchTimeText.textColor = secondaryTextColor;
  launchTimeText.font = new Font("SF Pro", 15);
  
}

/**
 * Build a widget (medium) with information of the first few upcoming launches.
 * 
 * @param {ListWidget} widget The widget to add content to.
 */
function buildMediumWidget(widget) {
  widget.backgroundColor = BGColor;
  widget.addSpacer(4);
  
  // Guard clause for data.
  if (!data.results) {
    buildUnableToFetchWidget(widget);
    return;
  }
  
  let firstLaunchIndex = 0;
  // Check for first launch that is to be determined, to be confirmed or is go for launch.
  while (
    firstLaunchIndex < data.results.length 
    && !isValidStatus(data.results[firstLaunchIndex].status.id)
  ) {
    firstLaunchIndex++;
  }
  // Text for the first upcoming luanch.
  const firstLaunchName = widget.addText(data.results[firstLaunchIndex].name);
  firstLaunchName.font = primaryFont;
  firstLaunchName.textColor = primaryTextColor;
  
  widget.addSpacer(4);
  
  // Stack for info of first launch (status, time and date).
  const infoStack = widget.addStack();
  infoStack.centerAlignContent();
  
  // first launch status stack.
  const statusStack = infoStack.addStack();
  statusStack.cornerRadius = 10;
  statusStack.setPadding(2, 7, 2, 7);
  statusStack.backgroundColor = getStatusColor(data.results[firstLaunchIndex].status.id);
  
  infoStack.addSpacer(10);
  
  // First launch status text.
  const firstLaunchStatusText = statusStack.addText(data.results[firstLaunchIndex].status.name);
  firstLaunchStatusText.textColor = BGColor;
  firstLaunchStatusText.font = statusFont;
  
  // First launch time and date.
  const launchTimeText = infoStack.addText(launchTimeFormatter(data.results[firstLaunchIndex].net));
  launchTimeText.textColor = secondaryTextColor;
  launchTimeText.font = secondaryFont;
  
  widget.addSpacer(4)
  
  // Remaining upcoming launches.
  let count = 0
  for (let i = firstLaunchIndex + 1; i < data.results.length; i++) {
    if (count == 3) {
      break;
    } else if (!isValidStatus(data.results[i].status.id)) {
    continue;
  }
    const upcomingStack = widget.addStack();
    upcomingStack.centerAlignContent();
    const point = upcomingStack.addText("•");
    point.font = Font.blackMonospacedSystemFont(25);
    point.textColor = getStatusColor(data.results[i].status.id);
    upcomingStack.addSpacer(4);
    const upcomingLaunchName = upcomingStack.addText(data.results[i].name);
    upcomingLaunchName.textColor = primaryTextColor;
    
    // Increment launch count.
    count++;
  }
}

/**
 * Build a widget (large) with information of the first few upcoming launches.
 * @param {ListWidget} widget The widget to add content to.
 */
function buildLargeWidget(widget) {
  widget.backgroundColor = BGColor;
  widget.addSpacer(4);
  
  // Guard clause for data.
  if (!data.results) {
    buildUnableToFetchWidget(widget);
    return;
  }

  let count = 0;
  for (launch of data.results) {
    // Check if the status ID is valid.
    if (!isValidStatus(launch.status.id)) {
      continue;
    }
    // Check if the limit of 6 launches is reached.
    if (count >= launchCountLimit) {
      break;
    }
    // Text for upcoming launch.
    let launchName = widget.addText(launch.name);
    launchName.font = primaryFont;
    launchName.textColor = primaryTextColor;
    
    widget.addSpacer(4);
    
    // Stack fo rinfo of the launch (status, time and date).
    let infoStack = widget.addStack();
    infoStack.layoutHorizontally();

    // Launch status stack.
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
    
    widget.addSpacer(10);
    
    count++;
  }
}


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                       HELPER FUNCTIONS                    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * A function to determine the validity of a status ID.
 * @param {int} statusID The status ID to check.
 * @returns {bool} Returns true iff statusID == 1 || statusID == 2 || statusID == 8
 */
function isValidStatus(statusID) {
  return statusID == 1 || statusID == 2 || statusID == 8;
}

/**
 * A function to get the appropriate color for a given status ID.
 * @param {int} statusID The status ID to get the color for.
 * @returns {Color} Returns goColor iff statusID == 1 || TBDColor iff statusID == 2 || TBCColor iff statusID == 8.
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
 * Get data from url and load it as JSON.
 * @param {String} url The API url query.
 * @returns {Promise<any>} Data from the url.
 */
async function getData(url) {
  const r = new Request(url);
  const data = await r.loadJSON();
  return data;
}

/**
 * Format date into LE or ME date format.
 * 
 * To change the date format from LE to ME change the boolean isMEDateFormat to true
 * at the top of the file in the CUSTOMIZABILITY section.
 * 
 * @param {String} Date The date to format (in ISO format).
 * @returns {String} The launch time formatted according to the specified date format.
 */
function launchTimeFormatter(date) {
  let launchTime = new Date(date);
  const df = new DateFormatter();
  df.dateFormat = dateFormat;
  return df.string(launchTime);
}

/**
 * Generate, present and return the selected option index to the user.
 * 
 * @param {String} message The message to present in the alert.
 * @param {String[]} options The options to present in the alert.
 * @returns {int} The option index selected by the user.
 */
async function generateAlert(message, options) {
  let alert = new Alert();
  alert.message = message;
  for (const option of options) {
    alert.addAction(option);
  }
  
  let responseIndex = await alert.presentAlert();
  return responseIndex;
}
