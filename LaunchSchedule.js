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
// Limit how many launches will be queried from the thespacedevs API.
// There is a possibility that 10 is not enough to show launches with the ID's given below in the widget.
const limit = 10;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                  END OF CUSTOMIZABILITY                   *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */


/** Little endian date format or Middle endian date format.
 * @result Little endian format iff [isMEDateFormat] is equal to false.
 * @result Middle endian format iff [isMEDateFormat] is equal to true.
 */
const dateFormat = isMEDateFormat ? "HH:mm MM/dd" : "HH:mm dd/MM";
// Widget sizes.
const sizes = ["small", "medium", "large", "extraLarge"];
const widgetSpacing = {"small": 3, "medium": 3, "large": 7, "extraLarge": 7}

// Root ListWidget.
let widget = new ListWidget();


// Compose API query url.
const url = "https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?format=json&limit=" + limit;
// Get the data from the API.
const data = await getData(url)

let index;
let widgetSize;
// Check if the script runs in the app.
if (config.runsInApp) {
  const message = "What is the size of the widget?";
  index = await generateAlert(message, sizes);
  widgetSize = sizes[index];
}
// Or in the widget.
else if (config.runsInWidget) {
  widgetSize = config.widgetFamily;
}
// Select the size of the widget
switch (widgetSize) {
  case "small":
    buildSmallWidget(widget);
    widget.presentSmall();
    break;
  case "medium":
    buildMediumWidget(widget);
    widget.presentMedium();
    break;
  case "large":
    buildLargeWidget(widget);
    widget.presentLarge();
    break;
  case "extraLarge":
    buildExtraLargeWidget(widget);
    widget.presentLarge();
    break;
  default:
    buildInvalidParamWidget(widget);
    widget.presentSmall();
    break;
}
Script.complete();


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
    "The valid sizes are: Small, Medium, Large or Extra Large"
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
 * Basic widget configuration
 * 
 * Common configuration for all widget sizes
 * @param {ListWidget} widget The widget to configure.
 * @param {int} spacing The spacing for elements in the widget.
 */
function defaultWidgetConfiguration(widget, spacing) {
  widget.backgroundColor = BGColor;
  widget.useDefaultPadding();
  widget.spacing = spacing;
}

/**
 * Build a widget (small) with information of the first upcoming launch.
 * 
 * @param {ListWidget} widget The widget to add content to.
 */
function buildSmallWidget(widget) {
  defaultWidgetConfiguration(widget, widgetSpacing["small"]);

  // Gaurd clause for data.
  if (!data.results) {
    buildUnableToFetchWidget(widget);
    return;
  }

  let launches = data.results.filter((launch) => isValidStatus(launch.status.id));
  if (launches.length > 0) {
    let firstLaunch = launches[0];
    // Text for the first upcoming luanch.
    const firstLaunchName = widget.addText(firstLaunch.name);
    firstLaunchName.font = primaryFont;
    firstLaunchName.textColor = primaryTextColor;

    // first launch status stack.
    const statusStack = widget.addStack();
    statusStack.cornerRadius = 10;
    statusStack.setPadding(2, 7, 2, 7);
    statusStack.backgroundColor = getStatusColor(firstLaunch.status.id);

    // First launch status text.
    const firstLaunchStatusText = statusStack.addText(firstLaunch.status.abbrev);
    firstLaunchStatusText.textColor = BGColor;
    firstLaunchStatusText.font = statusFont;

    // First launch time and date.
    const launchDateText = widget.addText(launchDateFormatter(firstLaunch.net));
    launchDateText.textColor = secondaryTextColor;
    launchDateText.font = new Font("SF Pro", 15);
  }
}

/**
 * Build a widget (medium) with information of the first few upcoming launches.
 * 
 * @param {ListWidget} widget The widget to add content to.
 */
function buildMediumWidget(widget) {
  defaultWidgetConfiguration(widget, widgetSpacing["medium"]);
  // Guard clause for data.
  if (!data.results) {
    buildUnableToFetchWidget(widget);
    return;
  }
  
  // Filter invalid launches.
  let launches = data.results.filter((launch) => isValidStatus(launch.status.id));

  // Add launch info for first launch.
  addLaunchInfo(widget.addStack(), launches.shift());
  // Add compact launch info for remaining launches.
  let count = 0;
  for (launch of launches) {
    // Check if the max. of 3 launches is reached.
    if (count == 3) {
      break;
    }
    addCompactLaunchInfo(widget.addStack(), launch);
    // Increment launch count.
    count++;
  }
}

/**
 * Build a widget (large) with information of the first few upcoming launches.
 * @param {ListWidget} widget The widget to add content to.
 */
function buildLargeWidget(widget) {
  defaultWidgetConfiguration(widget, widgetSpacing["large"]);
  
  // Guard clause for data.
  if (!data.results) {
    buildUnableToFetchWidget(widget);
    return;
  }

  // Filter invalid launches.
  let launches = data.results.filter((launch) => isValidStatus(launch.status.id));

  let count = 0;
  for (launch of launches) {
    // Check if the limit of 5 or 6 launches is reached.
    if (count >= 6) {
      break;
    }
    addLaunchInfo(widget.addStack(), launch);
    count++;
  }
}


/**
 * Build a widget (large) with information of the first few upcoming launches.
 * @param {ListWidget} widget The widget to add content to.
 */
function buildExtraLargeWidget(widget) {
  defaultWidgetConfiguration(widget, widgetSpacing["extraLarge"]);
  
  // Guard clause for data.
  if (!data.results) {
    buildUnableToFetchWidget(widget);
    return;
  }

  // Filter invalid launches.
  let launches = data.results.filter((launch) => isValidStatus(launch.status.id));

  let count = 0;
  for (launch of launches) {
    // Check if the limit of 5 or 6 launches is reached.
    if (count >= launchCountLimit) {
      break;
    }
    addLaunchInfo(widget.addStack(), launch);
    count++;
  }
}


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                       HELPER FUNCTIONS                    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * A function to determine the validity of a status ID.
 * @param {int} statusID The status ID to check.
 * @returns {bool} Returns true if and only if statusID == 1 || statusID == 2 || statusID == 8
 */
function isValidStatus(statusID) {
  return statusID == 1 || statusID == 2 || statusID == 8;
}

/**
 * A function that builds a compact version of the launch info and adds it to the given widget.
 * @param {WidgetStack} launchStack The stack to add the compact launch info to.
 * @param {Object} launch The launch object to be added.
 */
function addCompactLaunchInfo(launchStack, launch) {
  // Launch Stack.
  launchStack.centerAlignContent();
  launchStack.spacing = 4;

  // Status dot for launch
  const point = launchStack.addText("•");
  point.font = Font.blackMonospacedSystemFont(25);
  point.textColor = getStatusColor(launch.status.id);

  // Name of launch.
  const launchName = launchStack.addText(launch.name);
  launchName.textColor = primaryTextColor;
}

/**
 * A function that builds the launch info and adds it to the given widget.
 * @param {WidgetStack} launchStack The stack to add the launch info to.
 * @param {Object} launch The launch object to be added.
 */
function addLaunchInfo(launchStack, launch) {
  // Launch stack.
  launchStack.layoutVertically();
  launchStack.spacing = 4;

  // Name of launch.
  const launchName = launchStack.addText(launch.name);
  launchName.font = primaryFont;
  launchName.textColor = primaryTextColor;
  
  // Stack for info of the launch (status, time and date).
  const infoStack = launchStack.addStack();
  infoStack.spacing = 10;

  // Stack for launch status.
  const statusStack = infoStack.addStack();
  const statusBGColor = getStatusColor(launch.status.id);
  statusStack.backgroundColor = statusBGColor;
  statusStack.cornerRadius = 10;
  statusStack.setPadding(2, 7, 2, 7);
  // Name of launch status.
  const statusText = statusStack.addText(launch.status.name);
  statusText.font = statusFont;
  statusText.textColor = BGColor;
  // Date of launch.
  const launchDateText = infoStack.addText(launchDateFormatter(launch.net));
  launchDateText.font = secondaryFont;
  launchDateText.textColor = secondaryTextColor;
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
function launchDateFormatter(date) {
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
