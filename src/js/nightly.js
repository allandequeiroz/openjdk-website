// set variables for HTML elements
var tableHead = document.getElementById("table-head");
var tableContainer = document.getElementById("nightly-list");
var nightlyList = document.getElementById("nightly-table");
var searchError = document.getElementById("search-error");

// When nightly page loads, run:
/* eslint-disable no-unused-vars */
function onNightlyLoad() {
  /* eslint-enable no-unused-vars */

  populateNightly(); // run the function to populate the table on the Nightly page.

}


// NIGHTLY PAGE FUNCTIONS

function populateNightly() {
  // call the XmlHttpRequest function in global.js, passing in 'nightly' as the repo, and a long function as the callback.
  loadReleasesJSON("nightly", "nightly", function(response) {
    function checkIfProduction(x) { // used by the array filter method below.
      return x.prerelease === false && x.assets[0];
    }

    // Step 1: create a JSON from the XmlHttpRequest response
    // Step 2: filter out all releases from this JSON that are marked as 'pre-release' in GitHub.
    var releasesJson = JSON.parse(response).filter(checkIfProduction);

    // if there are releases...
    if (typeof releasesJson[0] !== 'undefined') {
      buildNightlyHTML(releasesJson);
    } else { // if there are no releases...
      // report an error
      errorContainer.innerHTML = "<p>Error... no releases have been found!</p>";
      loading.innerHTML = ""; // remove the loading dots
    }

    setSearchLogic();

  });
}

function buildNightlyHTML(releasesJson) {
  loading.innerHTML = ""; // remove the loading dots

  // for each release...
  var tableRowCounter = 0;

  tableHead.innerHTML = ("<tr id='table-header'><th>Release</th><th>Platform</th><th>Downloads</th><th>Release details</th></tr>");

  releasesJson.forEach(function(eachRelease) {

    // create an array of the details for each binary that is attached to a release
    var assetArray = [];
    eachRelease.assets.forEach(function(each) {
      assetArray.push(each);
    });

    // build rows with the array of binaries...
    assetArray.forEach(function(eachAsset) {  // for each file attached to this release...

      var nameOfFile = (eachAsset.name);
      var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the file uppercase
      var thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.

      // firstly, check if the platform name is recognised...
      if(thisPlatform) {

        // secondly, check if the file has the expected file extension for that platform...
        // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)
        var thisFileExtension = getFileExt(thisPlatform); // get the file extension associated with this platform
        if(uppercaseFilename.indexOf((thisFileExtension.toUpperCase())) >= 0) {

          // get the current content of the nightly list div
          var currentNightlyContent = nightlyList.innerHTML;

          // add an empty, hidden HTML template entry to the current nightly list, with the tableRowCounter suffixed to every ID
          // to change the HTML of the nightly table rows/cells, you must change this template.
          var newNightlyContent = currentNightlyContent += ("<tr class='nightly-container hide' id='"+tableRowCounter+"'> <td class='nightly-header'> <div><strong><a href='' id='nightly-release"+tableRowCounter+"' class='dark-link' target='_blank'></a></strong></div> <div class='divider'> | </div> <div id='nightly-date"+tableRowCounter+"'></div> </td> <td id='platform-block"+tableRowCounter+"' class='nightly-platform-block'></td> <td id='downloads-block"+tableRowCounter+"' class='nightly-downloads-block'><div id='nightly-dl-content"+tableRowCounter+"'><a class='dark-link' href='' id='nightly-dl"+tableRowCounter+"'></a> <div class='divider'> | </div> <a href='' class='dark-link' id='nightly-checksum"+tableRowCounter+"'>Checksum</a> </div></td> <td class='nightly-details'> <!--<div><strong><a href='' class='dark-link' id='nightly-changelog"+tableRowCounter+"'>Changelog</a></strong></div> <div class='divider'> | </div>--> <div><strong>Timestamp: </strong><span id='nightly-timestamp"+tableRowCounter+"'></span></div> <!--<div class='divider'> | </div> <div><strong>Build number: </strong><span id='nightly-buildnumber"+tableRowCounter+"'></span></div>--> <!--<div class='divider'> | </div> <div><strong>Commit: </strong><a href='' class='dark-link' id='nightly-commitref"+tableRowCounter+"'></a></div>--> </td> </tr>");

          // update the HTML container element with this new, blank, template row (hidden at this stage)
          nightlyList.innerHTML = newNightlyContent;

          // set variables for HTML elements.
          var dlButton = document.getElementById("nightly-dl"+tableRowCounter);
          //var dlContent = document.getElementById("nightly-dl-content"+tableRowCounter);

          // populate this new row with the release information
          var publishedAt = (eachRelease.published_at);
          document.getElementById("nightly-release"+tableRowCounter).innerHTML = (eachRelease.name).slice(0, 12); // the release name, minus the timestamp
          document.getElementById("nightly-release"+tableRowCounter).href = ("https://github.com/AdoptOpenJDK/openjdk-nightly/releases/tag/" + eachRelease.name) // the link to that release on GitHub
          document.getElementById("nightly-date"+tableRowCounter).innerHTML = moment(publishedAt).format('Do MMMM YYYY'); // the timestamp converted into a readable date
          //document.getElementById("nightly-changelog"+tableRowCounter).href = eachRelease.name; // TODO: WAITING FOR THE LINKS TO BE AVAILABLE. the link to the release changelog
          document.getElementById("nightly-timestamp"+tableRowCounter).innerHTML = (eachRelease.name).slice(13, 25); // the timestamp section of the build name
          //document.getElementById("nightly-buildnumber"+tableRowCounter).innerHTML = eachRelease.id; // TODO: currently this is the release ID
          //document.getElementById("nightly-commitref"+tableRowCounter).innerHTML = eachRelease.name; // TODO: WAITING FOR THE INFO TO BE AVAILABLE.
          //document.getElementById("nightly-commitref"+tableRowCounter).href = eachRelease.name; // TODO: WAITING FOR THE LINKS TO BE AVAILABLE.

          // get the official name, e.g. Linux x86-64, and display it in this new row
          var officialName = getOfficialName(thisPlatform);
          document.getElementById("platform-block"+tableRowCounter).innerHTML = officialName;

          // set the download section for this new row
          dlButton.innerHTML = (thisFileExtension + " (" + (Math.floor((eachAsset.size)/1024/1024)) + " MB)"); // display the file type and the file size
          document.getElementById("nightly-checksum"+tableRowCounter).href = (eachAsset.browser_download_url).replace(thisFileExtension, ".sha256.txt"); // set the checksum link (relies on the checksum having the same name as the binary, but .sha256.txt extension)
          var link = (eachAsset.browser_download_url);
          dlButton.href = link; // set the download link

          // show the new row, with animated fade-in
          var trElement = document.getElementById(tableRowCounter);
          trElement.className = trElement.className.replace( /(?:^|\s)hide(?!\S)/g , ' animated fadeIn ' );

          tableRowCounter++;
        }
      }
    });
  });

  // if the table has a scroll bar, show text describing how to horizontally scroll
  var scrollText = document.getElementById('scroll-text');
  var tableDisplayWidth = document.getElementById('nightly-list').clientWidth;
  var tableScrollWidth = document.getElementById('nightly-list').scrollWidth;
  if (tableDisplayWidth != tableScrollWidth) {
    scrollText.className = scrollText.className.replace( /(?:^|\s)hide(?!\S)/g , '' );
  }
}

function setSearchLogic() {
  // logic for the realtime search box...
  /* eslint-disable */
  var $rows = $('#nightly-table tr');
  $('#search').keyup(function() {
    var val = '^(?=.*' + $.trim($(this).val()).split(/\s+/).join(')(?=.*') + ').*$',
        reg = RegExp(val, 'i'),
        text;

    $rows.show().filter(function() {
        text = $(this).text().replace(/\s+/g, ' ');
        return !reg.test(text);
    }).hide();

    if(document.getElementById('table-parent').offsetHeight < 45) {
      tableContainer.style.visibility = "hidden";
      searchError.className = "";
    } else {
      tableContainer.style.visibility = "";
      searchError.className = "hide";
    }
  });
  /* eslint-enable */
}
