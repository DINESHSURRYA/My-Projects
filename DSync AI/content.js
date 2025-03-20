(() => {
    const elements = document.querySelectorAll("p, li, h1, h2, h3");
    let content = "";
  
    elements.forEach(el => {
      if (el.tagName === "LI") {
        content += "• " + el.innerText.trim() + "\n";
      } else {
        content += el.innerText.trim() + "\n\n";
      }
    });
  
    // Limit content size for Gemini API
    const trimmedContent = content.substring(0, 5000);
  
    // Send extracted content to the popup or background
    chrome.runtime.sendMessage({ pageContent: trimmedContent });
  })();
  