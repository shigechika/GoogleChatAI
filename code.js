/**
 * Responds to a MESSAGE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onMessage(event) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const openaiApiKey = scriptProperties.getProperty('OPENAI_API_KEY');
  const url = 'https://api.openai.com/v1/completions';
  const headers = {
    'Authorization': 'Bearer ' + openaiApiKey,
    'Content-type': 'application/json'
  };
  const options = {
    'muteHttpExceptions' : true,
    'headers': headers, 
    'method': 'POST',
    'payload': JSON.stringify({
      'prompt': event.message.text,
      "model": "text-davinci-003",
      "temperature": 0.7,
      "max_tokens": 256,
      "top_p": 1,
      "frequency_penalty": 0,
      "presence_penalty": 0 })
  };
  try {
      const response = UrlFetchApp.fetch(url, options);
      const json=JSON.parse(response.getContentText());
      const message = json["choices"][0]["text"];
      console.info("message=", message );
      return { "text": message.trim() };
  } catch(e) {
    console.error('error=', e, "\njson=", json);
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

