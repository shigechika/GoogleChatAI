/**
 * Responds to a MESSAGE event in Google Chat.
 *
 * @param {Object} event the event object from Google Chat
 */
function onMessage(event) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const apiKey = scriptProperties.getProperty("API_KEY");
  // Key passed via the x-goog-api-key header (Gemini API supports this as
  // an alternative to ?key=), not the URL: this removes the API key from
  // the request URL entirely, so UrlFetchApp's exception message on a
  // failing request can no longer carry it via the failing URL.
  // gemini-3.7-flash: gemini-pro was retired upstream (every request 404s,
  // confirmed against ai.google.dev/gemini-api/docs/models 2026-08) — the
  // newest stable flash model minimizes the chance of another silent
  // retirement breaking the bot.
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent";
  const headers = {
    "Content-type": "application/json",
    "x-goog-api-key": apiKey
  };
  const regex = /^(@\w+\s+){1,}/i;
  const text = event.message.text.replace(regex, '');
  const options = {
    "headers": headers,
    "method": "POST",
    // Handle non-2xx responses explicitly via getResponseCode() below
    // instead of a thrown exception, so a 429/400/500 status is still
    // diagnosable without needing to log the exception object (which,
    // depending on failure mode, could still carry request details).
    "muteHttpExceptions": true,
    "payload": JSON.stringify( { "contents" : [ { "parts" : [ { "text" : text } ] } ] } )
  };
  try {
      const response = UrlFetchApp.fetch(url, options);
      const code = response.getResponseCode();
      if (code < 200 || code >= 300) {
        // The body carries the actual error reason (INVALID_ARGUMENT
        // detail, quota info, ...) and is key-safe to log — the key
        // travels only in the request header, never echoed in Gemini
        // error bodies.
        console.error("Gemini API request failed with status", code,
            "body=", response.getContentText());
        return;
      }
      const json = JSON.parse(response.getContentText());
      console.info("json=", json );
      const message = json["candidates"][0]["content"]["parts"][0]["text"];
      const text = message.replace(/^\n\n/g, "\n").replace(/\*\*/g, "*").trim();
      console.info("text=", text );
      return { "text": text };
  } catch(e) {
    // Reached by network-level failures (DNS, timeout) AND by response-
    // shape surprises on a 200 (e.g. a safety-blocked prompt returns
    // promptFeedback with no candidates, making the [0] access throw).
    // e.name (TypeError vs a fetch error class) distinguishes the two
    // without logging e's message, whose exact contents aren't
    // documented/guaranteed not to echo request details.
    console.error("Gemini API request failed:", e.name);
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

