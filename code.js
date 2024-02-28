/**
 * Responds to a MESSAGE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onMessage(event) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const azureOpenaiEndpoint = scriptProperties.getProperty("AZURE_OPENAI_ENDPOINT");
  const azureOpenaiKey = scriptProperties.getProperty("AZURE_OPENAI_KEY");
  const azureApiVersion = scriptProperties.getProperty("AZURE_API_VERSION");
  const azureDeploymentName = scriptProperties.getProperty("AZURE_DEPLOYMENT_NAME");
  const url = azureOpenaiEndpoint + "/openai/deployments/" + azureDeploymentName + "/chat/completions?api-version=" + azureApiVersion;
  const headers = {
    "api-key": azureOpenaiKey,
    "Content-type": "application/json"
  };
  const regex = /^@\w+\s+/i;
  const content = event.message.text.replace(regex, '');
  const options = {
    "headers": headers,
    "method": "POST",
    "payload": JSON.stringify( { "messages": [ { "role" : "user", "content" : content } ] } )
  };
  try {
      console.info("url=", url);
      console.info("options=", options);
      const response = UrlFetchApp.fetch(url, options);
      const json = JSON.parse(response.getContentText());
      console.info("json=", json );
      const message = json["choices"][0]["message"]["content"];
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

