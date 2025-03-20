const GEMINI_API_KEY = 'AIzaSyC4HeMAR9weVdFdz2GMp8Z3mCbefwgtyHA';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

let generatedSummary = "";

document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => document.body.innerText.substring(0, 5000)
    }, (results) => {
      if (chrome.runtime.lastError || !results || !results[0]) {
        document.getElementById("summary").innerText = "Failed to extract content.";
      } else {
        const pageText = results[0].result;
        summarizeWithGemini(pageText);
      }
    });
  });

  document.getElementById("save-txt-btn").onclick = () => downloadFile('summary.txt', document.getElementById("summary").innerText);
  document.getElementById("save-doc-btn").onclick = () => saveAsWord(document.getElementById("summary").innerText);
  document.getElementById("copy-btn").onclick = copySummary;
  document.getElementById("share-btn").onclick = shareSummary;
  document.getElementById("sendChat").onclick = chatWithGemini;
  document.getElementById("exportChat").onclick = exportChat;
  document.getElementById("clearChat").onclick = clearChat;
});

function summarizeWithGemini(text) {
  fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Summarize this:\n${text}` }] }]
    })
  })
  .then(response => response.json())
  .then(data => {
    generatedSummary = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Summary generation failed.";
    document.getElementById("summary").innerText = generatedSummary;
  })
  .catch(() => document.getElementById("summary").innerText = "Failed to summarize.");
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename });
}

function saveAsWord(content) {
  const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
                 "xmlns:w='urn:schemas-microsoft-com:office:word' " +
                 "xmlns='http://www.w3.org/TR/REC-html40'>" +
                 "<head><meta charset='utf-8'></head><body>";
  const footer = "</body></html>";
  const sourceHTML = header + content.replace(/\n/g, '<br>') + footer;
  const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename: 'summary.doc' });
}

function copySummary() {
  const text = document.getElementById("summary").innerText;
  navigator.clipboard.writeText(text).then(() => alert("Copied!"));
}

function shareSummary() {
  const text = document.getElementById("summary").innerText;
  if (navigator.share) {
    navigator.share({ title: "Web Summary", text });
  } else {
    alert("Sharing not supported!");
  }
}

function chatWithGemini() {
  const userInput = document.getElementById("chatInput").value.trim();
  if (!userInput) return alert("Type something!");

  appendChat("You", userInput);
  const contextText = `Based on this summary:\n${generatedSummary}\nAnswer the question:\n${userInput}`;

  fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: contextText }] }]
    })
  })
  .then(response => response.json())
  .then(data => {
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    appendChat("Gemini", reply);
  })
  .catch(() => appendChat("Gemini", "Failed to get response."));
}

function appendChat(sender, message) {
  const chatOutput = document.getElementById("chatOutput");
  const chatItem = document.createElement("li");
  chatItem.innerHTML = `<b>${sender}:</b> ${message}`;
  chatOutput.appendChild(chatItem);
}

function exportChat() {
  const chatItems = document.querySelectorAll("#chatOutput li");
  if (chatItems.length === 0) return alert("No chat to export!");

  let chatText = "Chat Conversation:\n\n";
  chatItems.forEach((item, index) => {
    chatText += `${index + 1}. ${item.innerText}\n`;
  });

  const blob = new Blob([chatText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename: 'chat_conversation.txt' });
}

function clearChat() {
  const chatOutput = document.getElementById("chatOutput");
  if (chatOutput.children.length === 0) return alert("Chat is already empty!");
  if (confirm("Are you sure you want to delete the chat?")) {
    chatOutput.innerHTML = '';
  }
}
