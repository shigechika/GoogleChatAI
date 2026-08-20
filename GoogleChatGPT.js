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
  const regex = /^(@\w+\s+){1,}/i;
  const content = event.message.text.replace(regex, '');
  const options = {
    "headers": headers,
    "method": "POST",
    // Handle non-2xx responses explicitly via getResponseCode() below
    // instead of a thrown exception, for the same reason as
    // GoogleChatGemini.js: diagnosable status codes without needing to
    // log the raw exception object.
    "muteHttpExceptions": true,
    "payload": JSON.stringify( { "messages": [ { "role" : "user", "content" : content } ] } )
  };
  try {
      console.info("url=", url);
      const response = UrlFetchApp.fetch(url, options);
      const code = response.getResponseCode();
      if (code < 200 || code >= 300) {
        console.error("Azure OpenAI API request failed with status", code);
        return;
      }
      const json = JSON.parse(response.getContentText());
      console.info("json=", json );
      const message = json["choices"][0]["message"]["content"];
      console.info("message=", message );
      return { "text": message.trim() };
  } catch(e) {
    // muteHttpExceptions covers HTTP-level failures (handled above via
    // getResponseCode()); this catch is now only for network-level
    // failures (DNS, timeout, connection refused). Kept generic rather
    // than logging e directly, since the exact contents of a network
    // exception's message aren't documented/guaranteed not to echo
    // request details (e.g. the api-key header).
    console.error("Azure OpenAI API request failed (network error)");
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

