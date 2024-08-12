const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;

//* API Configuration
const API_KEY = "AIzaSyCYvLQLf5w8Zi_tRfJfkqrWWelRccvnrxU";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalStorageData = () => {
  const savedChats = localStorage.getItem("savedChats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";

  //* Apply the stored theme
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  //* Hide the Header onc chat start
  document.body.classList.toggle("hide-header", savedChats);

  //* Restore Chat List
  chatList.innerHTML = savedChats || "";
  chatList.scrollTo(0, chatList.scrollHeight); //* Scroll to the Bottom
};
loadLocalStorageData();

//* Create a new message element and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

//* Show the typing effect for the incoming message
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split("  ");
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    //* Append each word to the text element with a space
    textElement.innerText +=
      (currentWordIndex === 0 ? "  " : "  ") + words[currentWordIndex++];

    incomingMessageDiv.querySelector(".icon").classList.add("hidden");

    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false; //* Stop generating response
      incomingMessageDiv.querySelector(".icon").classList.remove("hidden");
      localStorage.setItem("savedChats", chatList); //* Saved chat to localStorage
    }
    chatList.scrollTo(0, chatList.scrollHeight); //* Scroll to the Bottom
  }, 75);
};

//* Fetch response from the api based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text"); //* Get text Element
  //* Send a POST request to the APIs with the user message
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const apiResponse = data?.candidates[0].content.parts[0].text.replace(
      /\*\*(.*?)\*\*/g,
      "$1"
    );
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    textElement.innerText = apiResponse;
  } catch (err) {
    isResponseGenerating = false;
    textElement.innerHTML = err.message;
    textElement.classList.add("error");
  } finally {
    //* Remove loading animation
    incomingMessageDiv.classList.remove("loading");
  }
};

//* Show loading animation while waiting the API response
const showLoadingAnimation = () => {
  const html = `<div class="message-content">
            <img src="./images/geminiImage.svg" alt="Gemini Image" class="avatar">
            <p class="text"></p>
            <div class="loading-indicator">
              <div class="loading-bar"></div>
              <div class="loading-bar"></div>
              <div class="loading-bar"></div>
            </div>
        </div>
          <span onclick="copyMessage(this)" class="icon material-symbols-outlined">content_copy</span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);

  chatList.scrollTo(0, chatList.scrollHeight); //* Scroll to the Botto
  generateAPIResponse(incomingMessageDiv);
};

//* Copy message to clipboard
const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done"; //* Show tick icon
  setTimeout(() => (copyIcon.innerText = "content_copy"), 1000);
};

const handleOutgoingChat = () => {
  userMessage =
    typingForm.querySelector(".typing-input").value.trim() || userMessage; //! Trim() method => Remove whiteSpaces in the string value.
  if (!userMessage || isResponseGenerating) return; //* Exit if there is no message

  isResponseGenerating = true;

  const html = `<div class="message-content" ">
            <img src="./images/avatar.png" alt="userImage" class="avatar">
            <p class="text"></p>
        </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatList.appendChild(outgoingMessageDiv);

  typingForm.reset(); //! reset() method => Clear input field.
  chatList.scrollTo(0, chatList.scrollHeight); //* Scroll to the Bottom
  document.body.classList.add("hide-header"); //* Hide the Header onc chat start
  setTimeout(showLoadingAnimation, 500); //* Show loading animation after a delay
};

//* Set user message and handle outgoing chat with a suggestion is clicked
suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

//* Toggle theme setting
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "dark_mode" : "light_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure to delete Chats?")) {
    //! window.confirm(): instructs the browser to display a dialog with an optional message.
    localStorage.removeItem("savedChats");
    loadLocalStorageData();
  }
});

//* Prevent default form submission and outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();

  handleOutgoingChat();
});
