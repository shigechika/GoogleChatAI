/**
 * Responds to a MESSAGE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onMessage(event) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const apiKey = scriptProperties.getProperty("API_KEY");
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey;
  const headers = {
    "Content-type": "application/json"
  };
  const regex = /^(@\w+\s+){1,}/i;
  const text = event.message.text.replace(regex, '');
  const options = {
    "headers": headers,
    "method": "POST",
    "payload": JSON.stringify( { "contents" : [ { "parts" : [ { "text" : text } ] } ] } )
  };
  try {
      console.info("url=", url);
      console.info("options=", options);
      const response = UrlFetchApp.fetch(url, options);
      const json = JSON.parse(response.getContentText());
      console.info("json=", json );
      const message = json["candidates"][0]["content"]["parts"][0]["text"];
      console.info("message=", message );
      return { "text": message.trim() };
  } catch(e) {
    console.error("error=", e, "options=", options);
  }
}

/**
 * Responds to an ADDED_TO_SPACE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onAddToSpace(event) {
  var message = "";

  if (event.space.singleUserBotDm) {
    message = "Thank you for adding me to a DM, " + event.user.displayName + "!";
  } else {
    message = "Thank you for adding me to " +
        (event.space.displayName ? event.space.displayName : "this chat");
  }

  if (event.message) {
    // Bot added through @mention.
    message = message + " and you said: \"" + event.message.text + "\"";
  }

  return { "text": message };
}

/**
 * Responds to a REMOVED_FROM_SPACE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onRemoveFromSpace(event) {
  console.info("Bot removed from ",
      (event.space.name ? event.space.name : "this chat"));
}

