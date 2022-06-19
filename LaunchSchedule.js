
// This Source Code Form is subject to the terms of the Mozilla Public
//  License, v. 2.0. If a copy of the MPL was not distributed with this
//  file, You can obtain one at http://mozilla.org/MPL/2.0/.

// Script for displaying upcoming rocket launches in the Scriptable widgets app for iOS.

// Limit how many launches will be queried from the thespacedevs API.
// There is a possibility that 10 is not enough to show launches with the ID's given below in the widget.
const limit = 10
// Compose API query url.
const url = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?format=json&limit=" + limit

// Status | Abbrev. | ID | Color
// Go for launch | Go | 1 | new Color("#22ba48")
// To Be Determined | TBD | 2 | new Color("#8B8000")
// To Be Confirmed | TBC | 8 | new Color("#ff8c00")

// Get the data from the API
const data = await getData()
// Create the widget with the received data
const widget = createWidget(data);

// Check if script is ran in app or in widget.
if (config.runsInWidget) {
  Script.setWidget(widget);
  Script.complete();
} else { // Runs in app
  widget.presentMedium()
  Script.complete()
}
  
function createWidget() {
  // Fonts.
  const primaryFont = new Font("SF Pro", 20)
  const secondaryFont = new Font("SF Pro", 15)
  // Font Colors.
  const primaryTextColor = new Color("#ffffff")
  const secondaryTextColor = new Color("#999999")
  // Status Colors.
  const goColor = new Color("#22ba48")
  const TBDColor = new Color("#ff8c00")
  const TBCColor = new Color("#fdd835")
  // Background Color.
  const BGColor = new Color('#1e1e1e')
  
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
  
  var firstLaunchIndex = 0
  // Check for first launch that is to be determined, to be confirmed or is go for launch.
  while (firstLaunchIndex < data.results.length && data.results[firstLaunchIndex].status.id != 1 && data.results[firstLaunchIndex].status.id != 2 && data.results[firstLaunchIndex].status.id != 8) {
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
  var statusBGColor
  switch (data.results[firstLaunchIndex].status.id) {
    case 1:
    	statusBGColor = goColor;
    	break;
    case 2:
    	statusBGColor = TBDColor;
    	break;
    case 8:
    	statusBGColor = TBCColor;
    	break;
  }
  statusStack.backgroundColor = statusBGColor
  
  infoStack.addSpacer(10)
  
  // First launch status text.
  const firstLaunchStatusText = statusStack.addText(data.results[firstLaunchIndex].status.name)
  firstLaunchStatusText.textColor = BGColor
  firstLaunchStatusText.font = Font.blackMonospacedSystemFont(15)
  
  // First launch time and date.
  const launchTime = new Date(data.results[firstLaunchIndex].net)  
  const df = new DateFormatter()
  df.dateFormat = "HH:mm dd/MM"
  const launchTimeText = infoStack.addText(df.string(launchTime))
  launchTimeText.textColor = Color.lightGray()
  launchTimeText.font = new Font("SF Pro", 15)
  
  w.addSpacer(10)
  
  // Remaining upcoming launches.
  var count = 0
  for (var i = firstLaunchIndex + 1; i < data.results.length; i++) {
    if (count == 3) {
      break
    } else if (data.results[i].status.id != 1 && data.results[i].status.id != 2 && data.results[i].status.id != 8) {
    continue
  }
    const upcomingStack = w.addStack()
    upcomingStack.centerAlignContent()
    const point = upcomingStack.addText("•")
    point.font = Font.blackMonospacedSystemFont(25)
    var statusColor
    switch (data.results[i].status.id) {
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
    point.textColor = statusColor
    upcomingStack.addSpacer(4)
    const upcomingLaunchName = upcomingStack.addText(data.results[i].name)
    upcomingLaunchName.textColor = primaryTextColor
    count++
  }
  return w
}

// Function for requesting and loading data from the API.
async function getData() {
  const r = new Request(url)
  const data = await r.loadJSON()
  return data
}
