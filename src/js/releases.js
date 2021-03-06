// When releases page loads, run:
/* eslint-disable no-unused-vars */
function onLatestLoad() {
  /* eslint-enable no-unused-vars */
    populateLatest(); // populate the Latest page
}

// LATEST PAGE FUNCTIONS

function populateLatest() {

  // call the XmlHttpRequest function in global.js, passing in 'releases' as the repo, and a long function as the callback.
  loadReleasesJSON("releases", "latest_release", function(response) {
    var releasesJson = JSON.parse(response);

    if (typeof releasesJson !== 'undefined') { // if there are releases...
      buildLatestHTML(releasesJson);
    }
    else {
      // report an error
      errorContainer.innerHTML = "<p>Error... no releases have been found!</p>";
      loading.innerHTML = ""; // remove the loading dots
    }
  });
}

function buildLatestHTML(releasesJson) {
  // populate the page with the release's information
  var publishedAt = (releasesJson.published_at);
  document.getElementById("latest-build-name").innerHTML = releasesJson.name;
  document.getElementById("latest-build-name").href = ("https://github.com/AdoptOpenJDK/openjdk-releases/releases/tag/" + releasesJson.name);
  document.getElementById("latest-date").innerHTML = moment(publishedAt).format('Do MMMM YYYY');
  //document.getElementById("latest-changelog").href = releasesJson.name;
  document.getElementById("latest-timestamp").innerHTML = (publishedAt.slice(0, 4) + publishedAt.slice(8, 10) + publishedAt.slice(5, 7) + publishedAt.slice(11, 13) + publishedAt.slice(14, 16));
  //document.getElementById("latest-buildnumber").innerHTML = releasesJson.id;
  //document.getElementById("latest-commitref").innerHTML = releasesJson.name;
  //document.getElementById("latest-commitref").href = releasesJson.name;

  // create an array of the details for each asset that is attached to a release
  var assetArray = [];
  releasesJson.assets.forEach(function(each) {
    assetArray.push(each);
  });

  // for each asset attached to this release, check if it's a valid binary, then add a download block for it...
  assetArray.forEach(function(eachAsset) {
    var nameOfFile = (eachAsset.name);
    var uppercaseFilename = nameOfFile.toUpperCase(); // make the name of the asset uppercase
    var thisPlatform = getSearchableName(uppercaseFilename); // get the searchableName, e.g. MAC or X64_LINUX.

    // firstly, check if the platform name is recognised...
    if(thisPlatform) {

      // secondly, check if the file has the expected file extension for that platform...
      // (this filters out all non-binary attachments, e.g. SHA checksums - these contain the platform name, but are not binaries)
      var thisFileExtension = getFileExt(thisPlatform); // get the file extension associated with this platform
      if(uppercaseFilename.indexOf((thisFileExtension.toUpperCase())) >= 0) {

        // set values ready to be injected into the HTML
        var thisLogo = getLogo(thisPlatform);
        var thisOfficialName = getOfficialName(thisPlatform);
        var thisBinaryLink = (eachAsset.browser_download_url);
        var thisBinarySize = Math.floor((eachAsset.size)/1024/1024);
        var thisChecksumLink = (eachAsset.browser_download_url).replace(thisFileExtension, ".sha256.txt");
        var thisRequirements = getRequirements(thisPlatform);

        // get the current content of the latest downloads container div
        var latestContainer = document.getElementById("latest-downloads-container");
        var currentLatestContent = latestContainer.innerHTML;

        // prepare a fully-populated HTML block for this platform
        var newLatestContent = currentLatestContent += ("<div id='latest-"+ thisPlatform +"' class='latest-block'><div class='latest-platform'><img src='"+ thisLogo +"'><div>"+ thisOfficialName +"</div></div><a href='"+ thisBinaryLink +"' class='latest-download-button a-button' id='linux-dl-button'><div>Download <div class='small-dl-text'>"+ thisFileExtension +" - "+ thisBinarySize +" MB</div></div></a><div class='latest-details'><p><a href='"+ thisChecksumLink +"' class='dark-link' id='latest-checksum-"+ thisPlatform +"' target='_blank'>Checksum</a></p><p><strong>Requirements:</strong><br>"+ thisRequirements +"</p></ul></div></div>");

        // update the latest downloads container with this new platform block
        latestContainer.innerHTML = newLatestContent;
      }
    }
  });

  loading.innerHTML = ""; // remove the loading dots

  const latestContainer = document.getElementById("latest-container");
  latestContainer.className = latestContainer.className.replace( /(?:^|\s)invisible(?!\S)/g , ' animated fadeIn ' ); // make this section visible (invisible by default), with animated fade-in
}
