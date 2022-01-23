import * as document from "document";
import { clock } from "clock";
import * as userActivity from "user-activity";
import { display } from "display";
import { preferences } from "user-settings";
import { HeartRateSensor } from "heart-rate";
import * as battery from "./battery";
import * as heartMonitor from "./hrm";
import * as util from "../common/utils";
import { locale } from "user-settings";
import { me } from "appbit";

console.log (preferences.clockDisplay);

// Set up all necessary variables
let clockTextH   = document.getElementById("clockTextH");
let clockTextM   = document.getElementById("clockTextM");
let clockTextS   = document.getElementById("clockTextS");
let amCircle   = document.getElementById("amCircle");
let pmCircle   = document.getElementById("pmCircle");
let stepProg1   = document.getElementById("stepProg1");
let stepProg2   = document.getElementById("stepProg2");

clock.granularity = "seconds";
let date         = document.getElementById("date");
let Batt         = document.getElementById("Batt");
let Data         = document.getElementById("Data");
let AOD          = document.getElementById("AOD");

let dataTypes     = [ "steps", "distance", "calories",
                      "elevationGain", "activeZoneMinutes" ];
let dataProgress  = [];
let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let whiteCounter = -1;

var bgImage = document.getElementById("bgImage");
bgImage.href = "bgBlack.jpg";

clockTextH.onclick = (e) => {
  if (display.aodActive == false)
  {
    console.log("hour clicked");
    flipDisplay();
  }
}

if ( display.aodAvailable) {
  if ( display.aodEnabled) {
    console.log(me.permissions.granted("access_aod"));
    display.aodAllowed = true;
  }
}

clockTextM.onclick = (e) => {
  if (display.aodActive == false)
  {
    console.log("minute clicked");
    console.log("aodAvailable: " + display.aodAvailable);
    console.log("aodActive: " + display.aodActive);
    console.log("aodAllowed: " + display.aodAllowed);
    console.log("aodEnabled: " + display.aodEnabled);   
  }
}

display.addEventListener("change", () => {
  console.log("aodActive: " + display.aodActive);
   if (display.aodActive) {
       console.log ("Always on Enabled")
       bgImage.href = "bgBlack.jpg";
       clockTextH.style.fill = "white";
       clockTextM.style.fill = "white";
       whiteCounter = -1;
       Batt.style.display = "none";
       Data.style.display = "none";
       AOD.style.display = "inline";
       clock.granularity = 'minutes';
       date.style.fill = "white";
       display.brightnessOverride = "dim";
   } else {
       console.log ("Always on Disabled")
       Batt.style.display = "inline";
       Data.style.display = "inline";
       clock.granularity = "seconds";
       display.brightnessOverride = "normal";
       date.style.fill = "yellow";
       AOD.style.display = "none";
   }
});

function flipDisplay() {
  if (bgImage.href === "bgBlack.jpg") {
      bgImage.href = "bgWhite.jpg";
      clockTextH.style.fill = "black";
      clockTextM.style.fill = "black";
      whiteCounter = 10;
  } else {
      bgImage.href = "bgBlack.jpg";
      clockTextH.style.fill = "white";
      clockTextM.style.fill = "white";
      whiteCounter = -1;
  }  
}

let getCurrentDataProgress = function(dataType) {
  let dataContainer = document.getElementById(dataType);
  return {
    dataType: dataType,
    dataContainer: dataContainer,
    arcBack: dataContainer.getElementById("arcBack"),
    arcFront: dataContainer.getElementById("arcFront"),
    dataCount: dataContainer.getElementById("dataCount"),
    dataIcon: dataContainer.getElementById("dataIcon"),
  }
}

for(var i=0; i < dataTypes.length; i++) {
  var currentData = dataTypes[i];
  dataProgress.push(getCurrentDataProgress(currentData));
}

// Refresh data, all other logic is in separate files
function refreshData(type) {
  let currentType = "steps";
  if (type) {
    if (type.dataType) {
      currentType = type.dataType;
    }
  }
  let currentDataProg = currentDataProg = userActivity.today.adjusted[currentType];
  if (currentDataProg) {
    if (currentDataProg.total) {
       currentDataProg = currentDataProg.total;
    }
  }
  let currentDataGoal = currentDataGoal = userActivity.goals[currentType];
  if (currentDataGoal) {
    if (currentDataGoal.total) {
       currentDataGoal = currentDataGoal.total;
    }
  }
  if ((currentType==="elevationGain") && (currentDataGoal == undefined)) {
      type.dataIcon.href = "icons/floorsBlank.png";
      type.arcBack.style.fill = "black";
      currentDataProg = "";
  }
  
  if (currentDataGoal == undefined) {
    currentDataGoal = 1;
  }
  
  let currentDataArc = (currentDataProg / currentDataGoal) * 360;
  //console.log (currentType + ":" + currentDataProg + ":" + currentDataGoal);
  if(currentType!="steps") {
    if (currentDataArc >= 360) {
      currentDataArc = 360;
      type.arcFront.style.fill = "lightgreen";
      type.arcFront.arcWidth = 5;
    }
    else {
      if(currentType==="distance") {
        type.arcFront.style.fill = "green";  
      }
      if(currentType==="calories") {
        type.arcFront.style.fill = "orange";
      }
      if(currentType==="elevationGain") {
        type.arcFront.style.fill = "red";
      }
      if(currentType==="activeZoneMinutes") {
        type.arcFront.style.fill = "yellow";   
      }
    }
    type.arcFront.sweepAngle = currentDataArc;
  }
  
  if(currentType==="distance") {
    currentDataProg = (currentDataProg * 0.000621371192).toFixed(1);
  }
  if(currentType==="calories") {
    if (currentDataProg >= 1000) {
      currentDataProg = (currentDataProg / 1000).toFixed(1);
      currentDataProg = `${currentDataProg}K`;
    }
  }
  if(currentType==="activeZoneMinutes") {
    if (currentDataProg < 99) {
      type.dataCount.class = "smallFont";
      type.dataCount.y = 242;
    } else {
      type.dataCount.class = "smallestFont";
      type.dataCount.y = 239;
    }
  }
  if(currentType==="steps") {
    if (currentDataProg >= currentDataGoal) {
      if (currentDataProg >= (currentDataGoal * 2)) {
        stepProg1.width = 276;
        stepProg2.width = 276;
        stepProg1.style.fill = "lightgreen";
        stepProg2.style.fill = "lightgreen";
        type.dataCount.style.fill = "lightgreen";
      } else {
        let currentDataProg1 = currentDataProg;
        if (userActivity.goals[currentType] != undefined) {
          currentDataProg1 = currentDataProg1 - userActivity.goals[currentType];
        }
        
        stepProg1.width = 276;
        stepProg2.width = (currentDataProg1 / currentDataGoal) * 276;
        stepProg1.style.fill = "lightgreen";
        stepProg2.style.fill = "lightblue";
        type.dataCount.style.fill = "lightgreen";   
      }
    } else {
      stepProg1.width = (currentDataProg / currentDataGoal) * 276;
      stepProg1.style.fill = "lightblue";
      stepProg2.width = (currentDataProg / currentDataGoal) * 276;
      stepProg2.style.fill = "lightblue";
      type.dataCount.style.fill = "lightblue";
    }
  }
  type.dataCount.text = currentDataProg;
}

function refreshAllData() {
  for(var i=0; i<dataTypes.length; i++) {
    refreshData(dataProgress[i]);
  }
}

clock.ontick = evt => {
  let today = evt.date;
  let hours = today.getHours();
  let mins  = util.zeroPad(today.getMinutes());
  let secs  = util.zeroPad(today.getSeconds()); 
  if (whiteCounter >= 0) {
      whiteCounter = whiteCounter -1;
      //console.log (whiteCounter);
  }
  if (whiteCounter == 0)
  {
      bgImage.href = "bgBlack.jpg";
      clockTextH.style.fill = "white";
      clockTextM.style.fill = "white";
  }
  if (preferences.clockDisplay == "12h") {
    if (hours < 12) {
      amCircle.style.fill = 'yellow';
      pmCircle.style.fill = 'black';
    } else {
      amCircle.style.fill = 'black';
      pmCircle.style.fill = 'orangered';
    }
    if (hours > 12) {hours -= 12;}
    if (hours == 0) {hours = 12;}
  } else {
      amCircle.style.fill = 'black';
      pmCircle.style.fill = 'black';    
  } 
  
  clockTextH.text = `${hours}`;
  clockTextM.text = `${mins}`;
  clockTextS.text = `${secs}`;
  let day      = today.getDate();
  let dow      = days[today.getDay()];
  date.text = dow + '   ' + day;  

  if (display.aodActive == false) {
    refreshAllData();
  }
  battery.setLevel();  
}

heartMonitor.initialize();
